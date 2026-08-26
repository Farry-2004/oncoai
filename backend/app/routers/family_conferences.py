from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.family_conference import FamilyConference
from app.models.patient import Patient
from app.models.user import User
from app.schemas.family_conference import FamilyConferenceCreate, FamilyConferenceRead
from app.services.audit_service import write_audit_event

router = APIRouter(prefix="/patients/{patient_id}/family-conferences", tags=["family-conferences"])


def _to_read(entry: FamilyConference, db: Session) -> FamilyConferenceRead:
    read = FamilyConferenceRead.model_validate(entry)
    if entry.conducted_by_id:
        author = db.get(User, entry.conducted_by_id)
        if author:
            read.conducted_by_name = author.full_name
    return read


@router.get("", response_model=list[FamilyConferenceRead])
def list_family_conferences(
    patient_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[FamilyConferenceRead]:
    entries = (
        db.query(FamilyConference)
        .filter(FamilyConference.patient_id == patient_id)
        .order_by(FamilyConference.conducted_at.desc())
        .all()
    )
    return [_to_read(e, db) for e in entries]


@router.post("", response_model=FamilyConferenceRead, status_code=status.HTTP_201_CREATED)
def create_family_conference(
    patient_id: str,
    payload: FamilyConferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyConferenceRead:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    data = payload.model_dump()
    if not data.get("conducted_at"):
        data.pop("conducted_at", None)
    entry = FamilyConference(patient_id=patient_id, conducted_by_id=current_user.id, **data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="family_conference.create",
        entity_type="family_conference",
        entity_id=entry.id,
        metadata={"patient_id": patient_id, "outcome": entry.outcome.value},
    )
    return _to_read(entry, db)
