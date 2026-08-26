from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_role
from app.models.patient import Patient, PatientStatusEnum
from app.models.user import RoleEnum, User
from app.schemas.patient import PatientCreate, PatientListResponse, PatientRead, PatientUpdate
from app.schemas.tumor_board import TumorBoardCaseRead
from app.schemas.workup import WorkupItemCreate, WorkupItemRead, WorkupItemUpdate
from app.models.tumor_board import TumorBoardCase
from app.models.workup import WorkupItem, WorkupStatusEnum
from app.services.audit_service import write_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/patients", tags=["patients"])


def patient_to_read(patient: Patient, db: Session) -> PatientRead:
    read = PatientRead.model_validate(patient)
    if patient.primary_physician_id:
        physician = db.get(User, patient.primary_physician_id)
        if physician:
            read.primary_physician_name = physician.full_name
    return read


@router.get("", response_model=PatientListResponse)
def list_patients(
    status_filter: str | None = None,
    cancer_site: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> PatientListResponse:
    query = db.query(Patient)
    if status_filter:
        query = query.filter(Patient.status == status_filter)
    if cancer_site:
        query = query.filter(Patient.cancer_site == cancer_site)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Patient.full_name.ilike(like), Patient.mrn.ilike(like)))

    total = query.count()
    items = (
        query.order_by(Patient.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PatientListResponse(
        items=[patient_to_read(p, db) for p in items], total=total, page=page, page_size=page_size
    )


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientRead:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    write_audit_event(
        db, actor_id=current_user.id, action="patient.viewed", entity_type="patient", entity_id=patient.id
    )
    return patient_to_read(patient, db)


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(RoleEnum.tumor_board_coordinator, RoleEnum.administrator, RoleEnum.nurse)
    ),
) -> PatientRead:
    existing = db.query(Patient).filter(Patient.mrn == payload.mrn).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="A patient with this MRN already exists."
        )
    patient = Patient(**payload.model_dump(), is_demo=True)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="patient.create",
        entity_type="patient",
        entity_id=patient.id,
        ip_address=request.client.host if request.client else None,
    )
    return patient_to_read(patient, db)


@router.patch("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientRead:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    write_audit_event(
        db, actor_id=current_user.id, action="patient.edit", entity_type="patient", entity_id=patient.id
    )
    return patient_to_read(patient, db)


@router.get("/{patient_id}/workups", response_model=list[WorkupItemRead])
def list_workups(
    patient_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[WorkupItem]:
    return db.query(WorkupItem).filter(WorkupItem.patient_id == patient_id).all()


@router.post("/{patient_id}/workups", response_model=WorkupItemRead, status_code=status.HTTP_201_CREATED)
def create_workup(
    patient_id: str,
    payload: WorkupItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkupItem:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    item = WorkupItem(patient_id=patient_id, ordered_by_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{patient_id}/workups/{workup_id}", response_model=WorkupItemRead)
def update_workup(
    patient_id: str,
    workup_id: str,
    payload: WorkupItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkupItem:
    item = db.get(WorkupItem, workup_id)
    if not item or item.patient_id != patient_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workup item not found.")

    item.status = payload.status
    item.completed_at = datetime.now(timezone.utc) if payload.status == WorkupStatusEnum.completed else None
    db.commit()
    db.refresh(item)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="workup.status_change",
        entity_type="workup_item",
        entity_id=item.id,
        metadata={"status": payload.status.value},
    )

    # Automation rule: IF every workup item for this patient is complete -> mark Ready for Tumor Board.
    patient = db.get(Patient, patient_id)
    if patient and patient.status in (PatientStatusEnum.new, PatientStatusEnum.in_workup):
        all_items = db.query(WorkupItem).filter(WorkupItem.patient_id == patient_id).all()
        if all_items and all(w.status == WorkupStatusEnum.completed for w in all_items):
            patient.status = PatientStatusEnum.ready_for_board
            db.commit()
            recipients = {patient.primary_physician_id}
            recipients |= {
                u.id for u in db.query(User).filter(User.role == RoleEnum.tumor_board_coordinator).all()
            }
            for recipient_id in recipients:
                if recipient_id and recipient_id != current_user.id:
                    create_notification(
                        db,
                        recipient_id=recipient_id,
                        message=f"Patient {patient.full_name} has completed workup and is ready for Tumor Board.",
                        link=f"/patients/{patient.id}",
                    )

    return item


@router.get("/{patient_id}/cases", response_model=list[TumorBoardCaseRead])
def list_patient_cases(
    patient_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[TumorBoardCaseRead]:
    # Local import avoids a circular import: tumor_boards.py imports patient_to_read from
    # this module, so this module cannot import from tumor_boards.py at module load time.
    from app.routers.tumor_boards import case_to_read

    cases = (
        db.query(TumorBoardCase)
        .filter(TumorBoardCase.patient_id == patient_id)
        .order_by(TumorBoardCase.created_at.desc())
        .all()
    )
    return [case_to_read(c, db) for c in cases]
