from sqlalchemy.orm import Session

from app.models.concern_survey import ConcernSurvey, SurveyStatusEnum
from app.models.patient import Patient
from app.models.patient_concern import ConcernLevelEnum, PatientConcerns
from app.models.user import _now
from app.services.sms_service import get_sms_provider

QUESTION_FIELDS = [
    "travel_concern",
    "financial_concern",
    "risk_tolerance_concern",
    "radiation_openness_concern",
]

QUESTION_TEXT = {
    "travel_concern": (
        "How concerned are you about your ability to travel to appointments? "
        "Reply 1) Not concerned 2) Somewhat concerned 3) Very concerned"
    ),
    "financial_concern": (
        "How concerned are you about the financial cost of treatment? "
        "Reply 1) Not concerned 2) Somewhat concerned 3) Very concerned"
    ),
    "risk_tolerance_concern": (
        "How concerned are you about the risks of treatment? "
        "Reply 1) Not concerned 2) Somewhat concerned 3) Very concerned"
    ),
    "radiation_openness_concern": (
        "How concerned are you about radiation as a treatment option? "
        "Reply 1) Not concerned 2) Somewhat concerned 3) Very concerned"
    ),
}

CLARIFY_TEXT = "Sorry, I didn't understand. Please reply 1, 2, or 3."
CLOSING_TEXT = "Thank you — your answers have been shared with your care team ahead of your tumor board review."


def _parse_reply(body: str) -> ConcernLevelEnum | None:
    text = body.strip().lower()
    if text == "1" or "not" in text:
        return ConcernLevelEnum.not_concerned
    if text == "2" or "somewhat" in text:
        return ConcernLevelEnum.somewhat_concerned
    if text == "3" or "very" in text:
        return ConcernLevelEnum.very_concerned
    return None


def start_survey(db: Session, patient: Patient, started_by_id: str | None) -> ConcernSurvey:
    if not patient.phone:
        raise ValueError("Patient has no phone number on file.")

    survey = ConcernSurvey(
        patient_id=patient.id,
        phone_number=patient.phone,
        status=SurveyStatusEnum.in_progress,
        started_by_id=started_by_id,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)

    get_sms_provider().send(survey.phone_number, QUESTION_TEXT[QUESTION_FIELDS[0]])
    return survey


def _apply_to_patient_concerns(db: Session, survey: ConcernSurvey) -> None:
    entry = db.query(PatientConcerns).filter(PatientConcerns.patient_id == survey.patient_id).first()
    if not entry:
        entry = PatientConcerns(patient_id=survey.patient_id)
        db.add(entry)
    entry.travel_concern = survey.travel_concern
    entry.financial_concern = survey.financial_concern
    entry.risk_tolerance_concern = survey.risk_tolerance_concern
    entry.radiation_openness_concern = survey.radiation_openness_concern
    entry.updated_by_id = survey.started_by_id


def advance_survey(db: Session, survey: ConcernSurvey, reply_body: str) -> ConcernSurvey:
    if survey.status != SurveyStatusEnum.in_progress:
        return survey

    provider = get_sms_provider()
    level = _parse_reply(reply_body)
    if level is None:
        provider.send(survey.phone_number, CLARIFY_TEXT)
        return survey

    field = QUESTION_FIELDS[survey.current_question_index]
    setattr(survey, field, level)
    survey.current_question_index += 1

    if survey.current_question_index >= len(QUESTION_FIELDS):
        survey.status = SurveyStatusEnum.completed
        survey.completed_at = _now()
        _apply_to_patient_concerns(db, survey)
        provider.send(survey.phone_number, CLOSING_TEXT)
    else:
        next_field = QUESTION_FIELDS[survey.current_question_index]
        provider.send(survey.phone_number, QUESTION_TEXT[next_field])

    db.commit()
    db.refresh(survey)
    return survey
