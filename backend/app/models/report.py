import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class ReportTypeEnum(str, enum.Enum):
    tumor_board_report = "tumor_board_report"
    clinical_summary = "clinical_summary"
    medical_passport = "medical_passport"
    treatment_plan = "treatment_plan"
    follow_up_summary = "follow_up_summary"


class ReportStatusEnum(str, enum.Enum):
    draft = "draft"
    approved = "approved"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    report_type: Mapped[ReportTypeEnum] = mapped_column(Enum(ReportTypeEnum, native_enum=False), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    patient_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("patients.id"), nullable=True)
    tumor_board_session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tumor_board_sessions.id"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    ai_sourced: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[ReportStatusEnum] = mapped_column(
        Enum(ReportStatusEnum, native_enum=False), default=ReportStatusEnum.draft
    )
    created_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    approved_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
