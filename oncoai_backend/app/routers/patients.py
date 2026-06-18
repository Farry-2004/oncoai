import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crypto import encrypt_field
from app.deps import get_db_audited, require_roles
from app.models import (
    CommChannel, CommDirection, CommunicationLog, ConcernLevel, Patient,
    PatientPreference, PreferenceCategory, SocioeconomicFactors, User, UserRole
)
from app.schemas import (
    DialInRequest, FamilyConferenceRequest, PatientCreate, PatientOut,
    PatientPreferenceOut, PreferenceSurveyResponse, SocioeconomicFactorsIn
)

router = APIRouter(prefix="/patients", tags=["patients"])

CAN_REGISTER_PATIENT = (UserRole.coordinator, UserRole.oncologist, UserRole.surgeon, UserRole.nurse)
CAN_CONTACT_PATIENT = (UserRole.coordinator, UserRole.nurse, UserRole.oncologist, UserRole.surgeon)


def _categorize(responses: PreferenceSurveyResponse) -> PreferenceCategory:
    """
    Mirrors the workbook's "Text Message Survey" prototype: sort patients
    into A (low concern) / B (moderate) / C (high concern) based on how
    many dimensions come back very/somewhat concerned. Tune thresholds
    with clinical input before relying on this for real triage.
    """
    levels = [
        responses.travel_concern, responses.financial_concern,
        responses.risk_tolerance, responses.radiation_openness,
    ]
    very = sum(1 for lvl in levels if lvl == ConcernLevel.very_concerned)
    somewhat = sum(1 for lvl in levels if lvl == ConcernLevel.somewhat_concerned)

    if very >= 2:
        return PreferenceCategory.C
    if very == 1 or somewhat >= 2:
        return PreferenceCategory.B
    return PreferenceCategory.A


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def register_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_REGISTER_PATIENT)),
):
    existing = db.query(Patient).filter(Patient.identifier_hash == payload.identifier_hash).first()
    if existing:
        raise HTTPException(status_code=409, detail="Patient already registered")

    patient = Patient(
        identifier_hash=payload.identifier_hash,
        encrypted_full_name=encrypt_field(db, payload.full_name),
        dob=payload.dob,
        gender=payload.gender,
        encrypted_phone=encrypt_field(db, payload.phone),
        encrypted_next_of_kin_contact=encrypt_field(db, payload.next_of_kin_contact),
        region=payload.region,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: uuid.UUID, db: Session = Depends(get_db_audited)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}/socioeconomic-factors")
def upsert_socioeconomic_factors(
    patient_id: uuid.UUID,
    payload: SocioeconomicFactorsIn,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_REGISTER_PATIENT)),
):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")

    factors = db.get(SocioeconomicFactors, patient_id)
    if factors is None:
        factors = SocioeconomicFactors(patient_id=patient_id)
        db.add(factors)

    factors.transportation_concern = payload.transportation_concern
    factors.housing_concern = payload.housing_concern
    factors.financial_concern = payload.financial_concern
    factors.support_system_concern = payload.support_system_concern
    factors.notes = payload.notes
    db.commit()
    return {"patient_id": patient_id, "saved": True}


@router.post("/{patient_id}/preference-survey/send", status_code=status.HTTP_202_ACCEPTED)
def send_preference_survey(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_CONTACT_PATIENT)),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # TODO: call the SMS gateway (see integrations router) with the four
    # standard questions (travel / financial / risk tolerance / radiation).
    # If the patient has no responsive phone number on file, fall back to
    # flagging this for the coordinator to ask by phone, per the workbook.

    log = CommunicationLog(
        patient_id=patient_id,
        channel=CommChannel.sms,
        direction=CommDirection.outbound,
        content_summary="Preference survey sent (travel/financial/risk/radiation).",
        sent_by=current_user.user_id,
    )
    db.add(log)
    db.commit()
    return {"patient_id": patient_id, "survey_sent": True}


@router.post("/{patient_id}/preference-survey/response", response_model=PatientPreferenceOut)
def record_preference_response(
    patient_id: uuid.UUID,
    payload: PreferenceSurveyResponse,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_CONTACT_PATIENT)),
):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")

    category = _categorize(payload)

    pref = db.get(PatientPreference, patient_id)
    if pref is None:
        pref = PatientPreference(patient_id=patient_id)
        db.add(pref)

    pref.travel_concern = payload.travel_concern
    pref.financial_concern = payload.financial_concern
    pref.risk_tolerance = payload.risk_tolerance
    pref.radiation_openness = payload.radiation_openness
    pref.category = category
    pref.collected_via = payload.collected_via

    pref.collected_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pref)
    return pref


@router.post("/{patient_id}/dial-in", status_code=status.HTTP_202_ACCEPTED)
def dial_patient_into_meeting(
    patient_id: uuid.UUID,
    payload: DialInRequest,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_CONTACT_PATIENT)),
):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")

    # TODO: call the video service (see integrations router) to actually
    # place the dial-in. This endpoint logs the event regardless of how
    # the call is technically placed.
    log = CommunicationLog(
        patient_id=patient_id,
        channel=CommChannel.call,
        direction=CommDirection.outbound,
        content_summary=f"Dialed into tumor board meeting {payload.meeting_id}.",
        sent_by=current_user.user_id,
    )
    db.add(log)
    db.commit()
    return {"patient_id": patient_id, "dialed_in": True}


@router.post("/{patient_id}/family-conference", status_code=status.HTTP_201_CREATED)
def log_family_conference(
    patient_id: uuid.UUID,
    payload: FamilyConferenceRequest,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_CONTACT_PATIENT)),
):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")

    log = CommunicationLog(
        patient_id=patient_id,
        case_id=payload.case_id,
        channel=CommChannel.call,
        direction=CommDirection.outbound,
        content_summary=payload.summary,
        sent_by=current_user.user_id,
    )
    db.add(log)
    db.commit()

    # TODO: if the patient indicates they cannot proceed with the decided
    # plan, this is the call site to re-open the case (status -> presented
    # or a new "needs_re_review" state) and re-add it to a future agenda,
    # per Prototype C's "Family Conference Post-TB" loop.
    return {"patient_id": patient_id, "logged": True, "family_included": payload.family_included}
