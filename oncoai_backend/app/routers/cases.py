import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.deps import get_db_audited, require_roles
from app.models import Case, CaseStatus, DiagnosticWorkup, User, UserRole
from app.schemas import CaseCreate, CaseOut, CaseStatusUpdate, WorkupCreate, WorkupOut, WorkupUpdate

router = APIRouter(prefix="/cases", tags=["cases"])

CAN_OPEN_CASE = (UserRole.coordinator, UserRole.oncologist, UserRole.surgeon, UserRole.nurse)
CAN_UPDATE_STATUS = (UserRole.coordinator, UserRole.oncologist, UserRole.surgeon)
CAN_MANAGE_WORKUP = (UserRole.coordinator, UserRole.radiologist, UserRole.pathologist, UserRole.nurse)


@router.post("", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_OPEN_CASE)),
):
    case = Case(
        patient_id=payload.patient_id,
        opened_by=current_user.user_id,
        suspected_diagnosis=payload.suspected_diagnosis,
        complexity=payload.complexity,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: uuid.UUID, db: Session = Depends(get_db_audited)):
    case = (
        db.query(Case)
        .options(joinedload(Case.workup_items))
        .filter(Case.case_id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("", response_model=list[CaseOut])
def list_cases(
    status_filter: CaseStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db_audited),
):
    query = db.query(Case).options(joinedload(Case.workup_items))
    if status_filter:
        query = query.filter(Case.status == status_filter)
    return query.order_by(Case.opened_at.asc()).all()


@router.patch("/{case_id}/status", response_model=CaseOut)
def update_case_status(
    case_id: uuid.UUID,
    payload: CaseStatusUpdate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_UPDATE_STATUS)),
):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = payload.status
    db.commit()
    db.refresh(case)
    return case


@router.post("/{case_id}/workup", response_model=WorkupOut, status_code=status.HTTP_201_CREATED)
def add_workup_item(
    case_id: uuid.UUID,
    payload: WorkupCreate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_MANAGE_WORKUP)),
):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    item = DiagnosticWorkup(
        case_id=case_id,
        type=payload.type,
        assigned_provider=payload.assigned_provider,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{case_id}/workup/{workup_id}", response_model=WorkupOut)
def update_workup_item(
    case_id: uuid.UUID,
    workup_id: uuid.UUID,
    payload: WorkupUpdate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_MANAGE_WORKUP)),
):
    item = db.get(DiagnosticWorkup, workup_id)
    if not item or item.case_id != case_id:
        raise HTTPException(status_code=404, detail="Workup item not found")

    item.status = payload.status
    if payload.result_summary is not None:
        item.result_summary = payload.result_summary
    if payload.file_reference is not None:
        item.file_reference = payload.file_reference

    db.commit()
    db.refresh(item)

    # TODO: when all workup items for this case are complete, this is the
    # natural trigger point to flip case.status -> ready_for_tb and fire
    # the WhatsApp "ready for tumor board" notification (see Prototype C).
    return item
