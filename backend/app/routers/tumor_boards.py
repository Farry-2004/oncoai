from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_role
from app.models.patient import Patient
from app.models.tumor_board import TumorBoardCase, TumorBoardSession
from app.models.user import RoleEnum, User
from app.routers.patients import patient_to_read
from app.schemas.tumor_board import (
    TumorBoardCaseCreate,
    TumorBoardCaseRead,
    TumorBoardCaseUpdate,
    TumorBoardSessionCreate,
    TumorBoardSessionDetail,
    TumorBoardSessionRead,
)
from app.services.audit_service import write_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/tumor-boards", tags=["tumor-boards"])


def _session_to_read(session: TumorBoardSession, db: Session) -> TumorBoardSessionRead:
    read = TumorBoardSessionRead.model_validate(session)
    if session.chair_id:
        chair = db.get(User, session.chair_id)
        if chair:
            read.chair_name = chair.full_name
    if session.coordinator_id:
        coordinator = db.get(User, session.coordinator_id)
        if coordinator:
            read.coordinator_name = coordinator.full_name
    return read


def case_to_read(case: TumorBoardCase, db: Session) -> TumorBoardCaseRead:
    read = TumorBoardCaseRead.model_validate(case)
    patient = db.get(Patient, case.patient_id)
    if patient:
        read.patient = patient_to_read(patient, db)
    if case.presenter_id:
        presenter = db.get(User, case.presenter_id)
        if presenter:
            read.presenter_name = presenter.full_name
    return read


@router.get("", response_model=list[TumorBoardSessionRead])
def list_sessions(
    status_filter: str | None = None,
    upcoming: bool | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[TumorBoardSessionRead]:
    query = db.query(TumorBoardSession)
    if status_filter:
        query = query.filter(TumorBoardSession.status == status_filter)
    if upcoming:
        query = query.filter(TumorBoardSession.scheduled_at >= datetime.now(timezone.utc))
    sessions = query.order_by(TumorBoardSession.scheduled_at.asc()).all()
    return [_session_to_read(s, db) for s in sessions]


@router.get("/{session_id}", response_model=TumorBoardSessionDetail)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> TumorBoardSessionDetail:
    session = db.get(TumorBoardSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tumor board session not found.")
    cases = (
        db.query(TumorBoardCase)
        .filter(TumorBoardCase.session_id == session_id)
        .order_by(TumorBoardCase.queue_position.asc())
        .all()
    )
    detail = TumorBoardSessionDetail(
        **_session_to_read(session, db).model_dump(), cases=[case_to_read(c, db) for c in cases]
    )
    return detail


@router.post("", response_model=TumorBoardSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: TumorBoardSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(RoleEnum.tumor_board_coordinator, RoleEnum.administrator)
    ),
) -> TumorBoardSessionRead:
    session = TumorBoardSession(**payload.model_dump(), is_demo=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="tumor_board.create",
        entity_type="tumor_board_session",
        entity_id=session.id,
    )
    return _session_to_read(session, db)


@router.post(
    "/{session_id}/cases", response_model=TumorBoardCaseRead, status_code=status.HTTP_201_CREATED
)
def add_case(
    session_id: str,
    payload: TumorBoardCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TumorBoardCaseRead:
    session = db.get(TumorBoardSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tumor board session not found.")
    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    max_position = (
        db.query(TumorBoardCase)
        .filter(TumorBoardCase.session_id == session_id)
        .count()
    )
    case = TumorBoardCase(
        session_id=session_id,
        queue_position=max_position,
        **payload.model_dump(),
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="tumor_board.case_added",
        entity_type="tumor_board_case",
        entity_id=case.id,
        metadata={"session_id": session_id, "patient_id": payload.patient_id},
    )
    if case.presenter_id and case.presenter_id != current_user.id:
        create_notification(
            db,
            recipient_id=case.presenter_id,
            message=f"You've been added to present {patient.full_name} at {session.title}.",
            link=f"/tumor-board/{session_id}",
        )
    return case_to_read(case, db)


@router.patch("/{session_id}/cases/{case_id}", response_model=TumorBoardCaseRead)
def update_case(
    session_id: str,
    case_id: str,
    payload: TumorBoardCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TumorBoardCaseRead:
    case = db.get(TumorBoardCase, case_id)
    if not case or case.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tumor board case not found.")
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="tumor_board.case_status_change",
        entity_type="tumor_board_case",
        entity_id=case.id,
        metadata=changes,
    )
    return case_to_read(case, db)
