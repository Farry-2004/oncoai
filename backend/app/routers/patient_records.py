from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.patient import Patient
from app.models.patient_record import PatientRecord
from app.models.user import User
from app.schemas.patient_record import PatientRecordCreate, PatientRecordRead
from app.services.audit_service import write_audit_event

router = APIRouter(prefix="/patients/{patient_id}/records", tags=["patient-records"])


def _to_read(record: PatientRecord, db: Session) -> PatientRecordRead:
    read = PatientRecordRead.model_validate(record)
    if record.recorded_by_id:
        author = db.get(User, record.recorded_by_id)
        if author:
            read.recorded_by_name = author.full_name
    return read


@router.get("", response_model=list[PatientRecordRead])
def list_records(
    patient_id: str,
    record_type: str | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[PatientRecordRead]:
    query = db.query(PatientRecord).filter(PatientRecord.patient_id == patient_id)
    if record_type:
        query = query.filter(PatientRecord.record_type == record_type)
    records = query.order_by(PatientRecord.recorded_at.desc()).all()
    return [_to_read(r, db) for r in records]


@router.post("", response_model=PatientRecordRead, status_code=status.HTTP_201_CREATED)
def create_record(
    patient_id: str,
    payload: PatientRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientRecordRead:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    data = payload.model_dump()
    if data.get("recorded_at") is None:
        data.pop("recorded_at", None)
    record = PatientRecord(patient_id=patient_id, recorded_by_id=current_user.id, **data)
    db.add(record)
    db.commit()
    db.refresh(record)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="patient_record.create",
        entity_type="patient_record",
        entity_id=record.id,
        metadata={"patient_id": patient_id, "record_type": record.record_type.value},
    )
    return _to_read(record, db)
