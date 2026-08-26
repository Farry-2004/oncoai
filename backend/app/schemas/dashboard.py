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
