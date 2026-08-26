from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.follow_up import FollowUpStatusEnum


class FollowUpRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    follow_up_date: date
    status: FollowUpStatusEnum
    notes: str | None = None
    next_appointment_date: date | None = None
    created_by_id: str | None = None
    created_by_name: str | None = None
    created_at: datetime


class FollowUpCreate(BaseModel):
    follow_up_date: date
    status: FollowUpStatusEnum = FollowUpStatusEnum.scheduled
    notes: str | None = None
    next_appointment_date: date | None = None
