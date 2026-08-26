import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RoleEnum(str, enum.Enum):
    """Exactly the 12 roles named in the ONCOAI brief's Authentication section."""

    tumor_board_coordinator = "tumor_board_coordinator"
    oncologist = "oncologist"
    surgeon = "surgeon"
    radiologist = "radiologist"
    pathologist = "pathologist"
    nurse = "nurse"
    medical_officer = "medical_officer"
    nutritionist = "nutritionist"
    social_worker = "social_worker"
    dentist = "dentist"
    pharmacist = "pharmacist"
    administrator = "administrator"


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum, native_enum=False), nullable=False)
    title: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
