import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class WorkupItemTypeEnum(str, enum.Enum):
    imaging = "imaging"
    pathology = "pathology"
    labs = "labs"
    genomics = "genomics"
    other = "other"


class WorkupStatusEnum(str, enum.Enum):
    ordered = "ordered"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class WorkupItem(Base):
    __tablename__ = "workup_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    item_type: Mapped[WorkupItemTypeEnum] = mapped_column(
        Enum(WorkupItemTypeEnum, native_enum=False), nullable=False
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[WorkupStatusEnum] = mapped_column(
        Enum(WorkupStatusEnum, native_enum=False), default=WorkupStatusEnum.ordered
    )
    ordered_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
