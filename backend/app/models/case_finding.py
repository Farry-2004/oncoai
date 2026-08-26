import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class FindingTypeEnum(str, enum.Enum):
    pathology = "pathology"
    imaging = "imaging"
    other = "other"


class FindingFormatEnum(str, enum.Enum):
    written = "written"
    video_link = "video_link"


class CaseFinding(Base):
    """A pre-recorded finding (written or video) attached to a tumor board
    case, contributed either by someone present or an on-call/remote
    diagnostician — the workshop's "Hybrid with On-Call Diagnosticians"
    prototype."""

    __tablename__ = "case_findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tumor_board_case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tumor_board_cases.id"), nullable=False
    )
    finding_type: Mapped[FindingTypeEnum] = mapped_column(
        Enum(FindingTypeEnum, native_enum=False), nullable=False
    )
    format: Mapped[FindingFormatEnum] = mapped_column(
        Enum(FindingFormatEnum, native_enum=False), default=FindingFormatEnum.written
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_remote_consult: Mapped[bool] = mapped_column(Boolean, default=False)
    contributed_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
