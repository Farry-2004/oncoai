import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class PatientStatusEnum(str, enum.Enum):
    new = "new"
    in_workup = "in_workup"
    ready_for_board = "ready_for_board"
    under_treatment = "under_treatment"
    follow_up = "follow_up"
    discharged = "discharged"


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    mrn: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[SexEnum] = mapped_column(Enum(SexEnum, native_enum=False), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    cancer_site: Mapped[str] = mapped_column(String(120), nullable=False)
    histology: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stage: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[PatientStatusEnum] = mapped_column(
        Enum(PatientStatusEnum, native_enum=False), default=PatientStatusEnum.new
    )
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    primary_physician_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    facility: Mapped[str] = mapped_column(String(120), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
