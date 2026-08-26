from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.concern_survey import ConcernSurvey, SurveyStatusEnum
from app.services.concern_survey_service import advance_survey

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/sms/inbound")
def sms_inbound(
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db),
) -> dict:
    # NOTE: unauthenticated by design — this is where Twilio posts inbound replies.
    # Before going live with real Twilio credentials, this must verify the
    # X-Twilio-Signature header against TWILIO_AUTH_TOKEN, or any caller could
    # inject fake survey answers for a patient's phone number.
    survey = (
        db.query(ConcernSurvey)
        .filter(ConcernSurvey.phone_number == From, ConcernSurvey.status == SurveyStatusEnum.in_progress)
        .order_by(ConcernSurvey.started_at.desc())
        .first()
    )
    if not survey:
        return {"status": "ignored"}
    advance_survey(db, survey, Body)
    return {"status": "ok"}
