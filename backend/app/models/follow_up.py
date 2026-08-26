import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class FollowUpStatusEnum(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    missed = "missed"
    cancelled = "cancelled"


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    follow_up_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[FollowUpStatusEnum] = mapped_column(
        Enum(FollowUpStatusEnum, native_enum=False), default=FollowUpStatusEnum.scheduled
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_appointment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
