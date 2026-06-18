import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.deps import get_db, require_roles
from app.models import AuditLog, User, UserRole
from app.schemas import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_ONLY = (UserRole.administrator,)


class UserCreate(BaseModel):
    hospital_id: uuid.UUID
    full_name: str
    role: UserRole
    specialty: str | None = None
    contact: str
    password: str


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
    specialty: str | None = None


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*ADMIN_ONLY))):
    return db.query(User).order_by(User.full_name).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
):
    existing = db.query(User).filter(User.contact == payload.contact).first()
    if existing:
        raise HTTPException(status_code=409, detail="A user with this contact already exists")

    user = User(
        hospital_id=payload.hospital_id,
        full_name=payload.full_name,
        role=payload.role,
        specialty=payload.specialty,
        contact=payload.contact,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.specialty is not None:
        user.specialty = payload.specialty

    db.commit()
    db.refresh(user)
    return user


class AuditLogOut(BaseModel):
    log_id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    occurred_at: str

    class Config:
        from_attributes = True


@router.get("/audit-log")
def get_audit_log(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
):
    rows = (
        db.query(AuditLog)
        .order_by(AuditLog.occurred_at.desc())
        .offset(offset)
        .limit(min(limit, 500))
        .all()
    )
    return [
        {
            "log_id": r.log_id,
            "user_id": r.user_id,
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "occurred_at": r.occurred_at,
            "ip_address": str(r.ip_address) if r.ip_address else None,
        }
        for r in rows
    ]
