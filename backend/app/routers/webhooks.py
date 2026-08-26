from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.models.concern_survey import ConcernSurvey, SurveyStatusEnum
from app.services.concern_survey_service import advance_survey
from app.services.sms_service import verify_twilio_signature

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _request_url(request: Request) -> str:
    # Twilio signs the exact URL it invoked. Railway (and most PaaS setups)
    # terminate TLS at an edge proxy and forward plain HTTP internally, so
    # request.url's scheme can't be trusted — rebuild from the forwarded
    # headers Twilio's request actually arrived with.
    scheme = request.headers.get("x-forwarded-proto", "https")
    host = request.headers.get("host", request.url.netloc)
    return f"{scheme}://{host}{request.url.path}"


@router.post("/sms/inbound")
async def sms_inbound(request: Request, db: Session = Depends(get_db)) -> dict:
    # Unauthenticated by design — this is where Twilio posts inbound replies,
    # so there's no user session to require. Integrity instead comes from
    # verifying the X-Twilio-Signature header below, once Twilio is configured.
    form = await request.form()
    params = [(k, str(v)) for k, v in form.multi_items()]

    if settings.twilio_auth_token:
        signature = request.headers.get("X-Twilio-Signature", "")
        if not verify_twilio_signature(_request_url(request), params, signature, settings.twilio_auth_token):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Twilio signature.")

    param_dict = dict(params)
    from_number = param_dict.get("From")
    body = param_dict.get("Body")
    if not from_number or body is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing From/Body.")

    survey = (
        db.query(ConcernSurvey)
        .filter(ConcernSurvey.phone_number == from_number, ConcernSurvey.status == SurveyStatusEnum.in_progress)
        .order_by(ConcernSurvey.started_at.desc())
        .first()
    )
    if not survey:
        return {"status": "ignored"}
    advance_survey(db, survey, body)
    return {"status": "ok"}
