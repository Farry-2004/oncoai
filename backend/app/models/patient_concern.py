import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class ConcernLevelEnum(str, enum.Enum):
    not_concerned = "not_concerned"
    somewhat_concerned = "somewhat_concerned"
    very_concerned = "very_concerned"


class ConcernCategoryEnum(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


_LEVEL_SCORE = {
    ConcernLevelEnum.not_concerned: 0,
    ConcernLevelEnum.somewhat_concerned: 1,
    ConcernLevelEnum.very_concerned: 2,
}


class PatientConcerns(Base):
    """Socioeconomic barriers and treatment-concern survey for a patient.

    One row per patient. Concept comes from the Muhimbili ORCI Tumor Board
    prototyping workshop: coordinator-tracked socioeconomic factors, and a
    travel/cost/risk/radiation concern survey used to sort patients into a
    low/moderate/high concern category for the tumor board discussion.
    """

    __tablename__ = "patient_concerns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), unique=True, nullable=False
    )

    transportation_barrier: Mapped[bool] = mapped_column(Boolean, default=False)
    housing_barrier: Mapped[bool] = mapped_column(Boolean, default=False)
    financial_barrier: Mapped[bool] = mapped_column(Boolean, default=False)
    dependent_care_barrier: Mapped[bool] = mapped_column(Boolean, default=False)
    other_barrier_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    travel_concern: Mapped[ConcernLevelEnum] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), default=ConcernLevelEnum.not_concerned
    )
    financial_concern: Mapped[ConcernLevelEnum] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), default=ConcernLevelEnum.not_concerned
    )
    risk_tolerance_concern: Mapped[ConcernLevelEnum] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), default=ConcernLevelEnum.not_concerned
    )
    radiation_openness_concern: Mapped[ConcernLevelEnum] = mapped_column(
        Enum(ConcernLevelEnum, native_enum=False), default=ConcernLevelEnum.not_concerned
    )

    updated_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    @property
    def concern_category(self) -> ConcernCategoryEnum:
        total = sum(
            _LEVEL_SCORE[level]
            for level in (
                self.travel_concern,
                self.financial_concern,
                self.risk_tolerance_concern,
                self.radiation_openness_concern,
            )
        )
        if total <= 1:
            return ConcernCategoryEnum.low
        if total <= 4:
            return ConcernCategoryEnum.moderate
        return ConcernCategoryEnum.high
