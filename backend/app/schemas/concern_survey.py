from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.concern_survey import SurveyStatusEnum
from app.models.patient_concern import ConcernLevelEnum


class ConcernSurveyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    phone_number: str
    status: SurveyStatusEnum
    current_question_index: int
    travel_concern: ConcernLevelEnum | None = None
    financial_concern: ConcernLevelEnum | None = None
    risk_tolerance_concern: ConcernLevelEnum | None = None
    radiation_openness_concern: ConcernLevelEnum | None = None
    started_at: datetime
    completed_at: datetime | None = None
    sms_provider_configured: bool = False


class SimulateReplyInput(BaseModel):
    body: str
