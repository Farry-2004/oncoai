from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    user_id: str
    user_name: str | None = None
    user_role: str | None = None
    cme_credit: float
    created_at: datetime


class AttendanceCreate(BaseModel):
    user_id: str
    cme_credit: float = 1.0
