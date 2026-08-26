from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.family_conference import FamilyConferenceOutcomeEnum


class FamilyConferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    tumor_board_decision_id: str | None = None
    conducted_at: datetime
    participants: str
    questions_raised: str | None = None
    outcome: FamilyConferenceOutcomeEnum
    conducted_by_id: str | None = None
    conducted_by_name: str | None = None
    created_at: datetime


class FamilyConferenceCreate(BaseModel):
    tumor_board_decision_id: str | None = None
    conducted_at: datetime | None = None
    participants: str
    questions_raised: str | None = None
    outcome: FamilyConferenceOutcomeEnum = FamilyConferenceOutcomeEnum.proceeding
