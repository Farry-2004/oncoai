import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class SessionStatusEnum(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class CasePriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class CaseStatusEnum(str, enum.Enum):
    pending = "pending"
    presenting = "presenting"
    discussed = "discussed"
    deferred = "deferred"


class TumorBoardSession(Base):
    __tablename__ = "tumor_board_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[SessionStatusEnum] = mapped_column(
        Enum(SessionStatusEnum, native_enum=False), default=SessionStatusEnum.scheduled
    )
    chair_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    coordinator_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    facility: Mapped[str] = mapped_column(String(120), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )


class TumorBoardCase(Base):
    __tablename__ = "tumor_board_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tumor_board_sessions.id"), nullable=False
    )
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    queue_position: Mapped[int] = mapped_column(Integer, default=0)
    presenter_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    priority: Mapped[CasePriorityEnum] = mapped_column(
        Enum(CasePriorityEnum, native_enum=False), default=CasePriorityEnum.medium
    )
    status: Mapped[CaseStatusEnum] = mapped_column(
        Enum(CaseStatusEnum, native_enum=False), default=CaseStatusEnum.pending
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_summary_demo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
