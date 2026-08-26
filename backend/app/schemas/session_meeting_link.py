from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SessionMeetingLinkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    meeting_link: str
    updated_by_id: str | None = None
    updated_by_name: str | None = None
    updated_at: datetime


class SessionMeetingLinkUpsert(BaseModel):
    meeting_link: str
