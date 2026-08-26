import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class FamilyConferenceOutcomeEnum(str, enum.Enum):
    proceeding = "proceeding"
    needs_more_time = "needs_more_time"
    declined = "declined"


class FamilyConference(Base):
    """Post-tumor-board call to the patient (and family/support system) that
    relays the decided treatment plan and records whether they can proceed
    with it, per the workshop's "Family Conference Post-TB" concept."""

    __tablename__ = "family_conferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    tumor_board_decision_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tumor_board_decisions.id"), nullable=True
    )
    conducted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    participants: Mapped[str] = mapped_column(String(500), nullable=False)
    questions_raised: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[FamilyConferenceOutcomeEnum] = mapped_column(
        Enum(FamilyConferenceOutcomeEnum, native_enum=False),
        default=FamilyConferenceOutcomeEnum.proceeding,
    )
    conducted_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
