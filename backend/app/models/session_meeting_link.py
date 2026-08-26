from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class SessionMeetingLink(Base):
    """A video call link for a tumor board session, used to dial the patient
    in for the treatment-options discussion — the workshop's "Dialing Patient
    into TB Meeting" prototype, without a real telephony integration."""

    __tablename__ = "session_meeting_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tumor_board_sessions.id"), unique=True, nullable=False
    )
    meeting_link: Mapped[str] = mapped_column(String(500), nullable=False)
    updated_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
