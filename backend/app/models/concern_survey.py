import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.patient_concern import ConcernLevelEnum
from app.models.user import _now, _uuid


class SurveyStatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class ConcernSurvey(Base):
    """An automated SMS concern survey run — the workshop's "Text Message
    Survey" prototype. Walks the patient through the same four questions
    PatientConcerns tracks manually, one text at a time, then writes the
    results into PatientConcerns on completion.

    Sends go through app.services.sms_service, which no-ops (logs only)
    until Twilio credentials are configured.
    """

    __tablename__ = "concern_surveys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[SurveyStatusEnum] = mapped_column(
        Enum(SurveyStatusEnum, native_enum=False), default=SurveyStatusEnum.pending
    )
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)

    travel_concern: Mapped[ConcernLevelEnum | None] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), nullable=True
    )
    financial_concern: Mapped[ConcernLevelEnum | None] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), nullable=True
    )
    risk_tolerance_concern: Mapped[ConcernLevelEnum | None] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), nullable=True
    )
    radiation_openness_concern: Mapped[ConcernLevelEnum | None] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), nullable=True
    )

    started_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
