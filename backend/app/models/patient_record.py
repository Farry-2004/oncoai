import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class RecordTypeEnum(str, enum.Enum):
    clinical_note = "clinical_note"
    imaging = "imaging"
    pathology = "pathology"
    lab = "lab"
    treatment = "treatment"


class PatientRecord(Base):
    __tablename__ = "patient_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    record_type: Mapped[RecordTypeEnum] = mapped_column(
        Enum(RecordTypeEnum, native_enum=False), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    findings: Mapped[str] = mapped_column(Text, nullable=False)
    recorded_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
