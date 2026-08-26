import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.patient import Patient
from app.models.patient_record import PatientRecord
from app.models.record_image import RecordImage
from app.models.user import User
from app.schemas.patient_record import PatientRecordCreate, PatientRecordRead
from app.schemas.record_image import RecordImageRead
from app.services.audit_service import write_audit_event

router = APIRouter(prefix="/patients/{patient_id}/records", tags=["patient-records"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _to_read(record: PatientRecord, db: Session) -> PatientRecordRead:
    read = PatientRecordRead.model_validate(record)
    if record.recorded_by_id:
        author = db.get(User, record.recorded_by_id)
        if author:
            read.recorded_by_name = author.full_name
    return read


def _get_record(patient_id: str, record_id: str, db: Session) -> PatientRecord:
    record = db.get(PatientRecord, record_id)
    if not record or record.patient_id != patient_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")
    return record


def _image_to_read(image: RecordImage, db: Session) -> RecordImageRead:
    read = RecordImageRead.model_validate(image)
    if image.uploaded_by_id:
        uploader = db.get(User, image.uploaded_by_id)
        if uploader:
            read.uploaded_by_name = uploader.full_name
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


@router.get("/{record_id}/images", response_model=list[RecordImageRead])
def list_record_images(
    patient_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[RecordImageRead]:
    _get_record(patient_id, record_id, db)
    images = (
        db.query(RecordImage)
        .filter(RecordImage.patient_record_id == record_id)
        .order_by(RecordImage.created_at.desc())
        .all()
    )
    return [_image_to_read(i, db) for i in images]


@router.post(
    "/{record_id}/images", response_model=RecordImageRead, status_code=status.HTTP_201_CREATED
)
async def upload_record_image(
    patient_id: str,
    record_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecordImageRead:
    _get_record(patient_id, record_id, db)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, WEBP, or GIF images are accepted.",
        )

    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds the {settings.max_upload_bytes // (1024 * 1024)}MB limit.",
        )

    uploads_dir = Path(settings.uploads_dir)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    extension = os.path.splitext(file.filename or "")[1][:10]
    storage_path = uploads_dir / f"{uuid4()}{extension}"
    storage_path.write_bytes(contents)

    image = RecordImage(
        patient_record_id=record_id,
        filename=file.filename or storage_path.name,
        content_type=file.content_type,
        storage_path=str(storage_path),
        file_size=len(contents),
        uploaded_by_id=current_user.id,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="record_image.uploaded",
        entity_type="record_image",
        entity_id=image.id,
        metadata={"patient_id": patient_id, "record_id": record_id, "file_size": image.file_size},
    )
    return _image_to_read(image, db)


@router.get("/{record_id}/images/{image_id}/file")
def get_record_image_file(
    patient_id: str,
    record_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Response:
    _get_record(patient_id, record_id, db)
    image = db.get(RecordImage, image_id)
    if not image or image.patient_record_id != record_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")
    path = Path(image.storage_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file missing on disk.")
    return Response(content=path.read_bytes(), media_type=image.content_type)


@router.delete("/{record_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record_image(
    patient_id: str,
    record_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    _get_record(patient_id, record_id, db)
    image = db.get(RecordImage, image_id)
    if not image or image.patient_record_id != record_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")
    path = Path(image.storage_path)
    if path.exists():
        path.unlink()
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="record_image.deleted",
        entity_type="record_image",
        entity_id=image.id,
        metadata={"patient_id": patient_id, "record_id": record_id},
    )
    db.delete(image)
    db.commit()
