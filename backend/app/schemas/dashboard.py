from datetime import datetime

from pydantic import BaseModel

from app.schemas.audit import AuditLogRead
from app.schemas.tumor_board import TumorBoardCaseRead


class DashboardSummary(BaseModel):
    active_patients: int
    open_cases: int
    critical_cases: int
    upcoming_boards: int
    next_board_at: datetime | None = None
    incomplete_workups: int
    recent_cases: list[TumorBoardCaseRead]
    recent_activity: list[AuditLogRead]


class PreparationChecklist(BaseModel):
    patient_history: bool
    pathology: bool
    imaging: bool
    laboratory: bool
    treatment_history: bool
    workup_complete: bool


class TBPreparationCase(BaseModel):
    case_id: str
    patient_id: str
    patient_name: str
    ready: bool
    checklist: PreparationChecklist
    missing: list[str]


class TBPreparationSummary(BaseModel):
    session_id: str | None = None
    session_title: str | None = None
    scheduled_at: datetime | None = None
    chair_name: str | None = None
    location: str | None = None
    cases: list[TBPreparationCase]
    ready_count: int
    total_count: int
