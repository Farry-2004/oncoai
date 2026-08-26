from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.follow_up import FollowUp
from app.models.patient import Patient
from app.models.user import User
from app.schemas.follow_up import FollowUpCreate, FollowUpRead
from app.services.audit_service import write_audit_event

router = APIRouter(prefix="/patients/{patient_id}/follow-ups", tags=["follow-ups"])


def _to_read(entry: FollowUp, db: Session) -> FollowUpRead:
    read = FollowUpRead.model_validate(entry)
    if entry.created_by_id:
        author = db.get(User, entry.created_by_id)
        if author:
            read.created_by_name = author.full_name
    return read


@router.get("", response_model=list[FollowUpRead])
def list_follow_ups(
    patient_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[FollowUpRead]:
    entries = (
        db.query(FollowUp)
        .filter(FollowUp.patient_id == patient_id)
        .order_by(FollowUp.follow_up_date.desc())
        .all()
    )
    return [_to_read(e, db) for e in entries]


@router.post("", response_model=FollowUpRead, status_code=status.HTTP_201_CREATED)
def create_follow_up(
    patient_id: str,
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FollowUpRead:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    entry = FollowUp(patient_id=patient_id, created_by_id=current_user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="follow_up.create",
        entity_type="follow_up",
        entity_id=entry.id,
        metadata={"patient_id": patient_id},
    )
    return _to_read(entry, db)
