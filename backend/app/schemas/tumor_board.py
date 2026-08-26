from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.tumor_board import CasePriorityEnum, CaseStatusEnum, SessionStatusEnum
from app.schemas.patient import PatientRead


class TumorBoardCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    patient_id: str
    patient: PatientRead | None = None
    queue_position: int
    presenter_id: str | None = None
    presenter_name: str | None = None
    priority: CasePriorityEnum
    status: CaseStatusEnum
    summary: str | None = None
    ai_summary_demo: str | None = None
    created_at: datetime


class TumorBoardCaseCreate(BaseModel):
    patient_id: str
    priority: CasePriorityEnum = CasePriorityEnum.medium
    presenter_id: str | None = None
    summary: str | None = None


class TumorBoardCaseUpdate(BaseModel):
    priority: CasePriorityEnum | None = None
    status: CaseStatusEnum | None = None
    queue_position: int | None = None
    summary: str | None = None


class TumorBoardSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    scheduled_at: datetime
    location: str | None = None
    status: SessionStatusEnum
    chair_id: str | None = None
    chair_name: str | None = None
    coordinator_id: str | None = None
    coordinator_name: str | None = None
    facility: str
    is_demo: bool


class TumorBoardSessionDetail(TumorBoardSessionRead):
    cases: list[TumorBoardCaseRead] = []


class TumorBoardSessionCreate(BaseModel):
    title: str
    scheduled_at: datetime
    location: str | None = None
    chair_id: str | None = None
    coordinator_id: str | None = None
    facility: str
