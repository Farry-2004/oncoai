from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class TumorBoardAttendance(Base):
    """Per-clinician attendance and CME credit for a tumor board session."""

    __tablename__ = "tumor_board_attendance"
    __table_args__ = (
        UniqueConstraint("session_id", "user_id", name="uq_attendance_session_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tumor_board_sessions.id"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    cme_credit: Mapped[float] = mapped_column(Float, default=1.0)
    recorded_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
