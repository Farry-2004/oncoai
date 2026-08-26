from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class TumorBoardDecision(Base):
    __tablename__ = "tumor_board_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tumor_board_case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tumor_board_cases.id"), unique=True, nullable=False
    )
    checklist: Mapped[dict] = mapped_column(JSON, nullable=False)
    decision: Mapped[str] = mapped_column(Text, nullable=False)
    treatment_plan: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    additional_investigations: Mapped[str | None] = mapped_column(Text, nullable=True)
    responsible_team: Mapped[str] = mapped_column(String(255), nullable=False)
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    decided_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
