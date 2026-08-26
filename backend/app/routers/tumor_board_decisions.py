from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.patient import Patient
from app.models.tumor_board import CaseStatusEnum, TumorBoardCase, TumorBoardSession
from app.models.tumor_board_decision import TumorBoardDecision
from app.models.user import User
from app.schemas.tumor_board_decision import TumorBoardDecisionCreate, TumorBoardDecisionRead
from app.services.audit_service import write_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/tumor-boards/{session_id}/cases/{case_id}/decision", tags=["tumor-board-decisions"])


def _to_read(decision: TumorBoardDecision, db: Session) -> TumorBoardDecisionRead:
    read = TumorBoardDecisionRead.model_validate(decision)
    if decision.decided_by_id:
        user = db.get(User, decision.decided_by_id)
        if user:
            read.decided_by_name = user.full_name
    return read


def _get_case(session_id: str, case_id: str, db: Session) -> TumorBoardCase:
    case = db.get(TumorBoardCase, case_id)
    if not case or case.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tumor board case not found.")
    return case


@router.get("", response_model=TumorBoardDecisionRead | None)
def get_decision(
    session_id: str,
    case_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> TumorBoardDecisionRead | None:
    _get_case(session_id, case_id, db)
    decision = (
        db.query(TumorBoardDecision).filter(TumorBoardDecision.tumor_board_case_id == case_id).first()
    )
    return _to_read(decision, db) if decision else None


@router.post("", response_model=TumorBoardDecisionRead, status_code=status.HTTP_201_CREATED)
def record_decision(
    session_id: str,
    case_id: str,
    payload: TumorBoardDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TumorBoardDecisionRead:
    case = _get_case(session_id, case_id, db)

    if not payload.checklist.is_complete():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The structured discussion checklist must be fully complete before a decision can be recorded.",
        )

    existing = (
        db.query(TumorBoardDecision).filter(TumorBoardDecision.tumor_board_case_id == case_id).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A decision has already been recorded for this case.",
        )

    decision = TumorBoardDecision(
        tumor_board_case_id=case_id,
        decided_by_id=current_user.id,
        checklist=payload.checklist.model_dump(),
        decision=payload.decision,
        treatment_plan=payload.treatment_plan,
        rationale=payload.rationale,
        additional_investigations=payload.additional_investigations,
        responsible_team=payload.responsible_team,
        follow_up_date=payload.follow_up_date,
    )
    db.add(decision)
    case.status = CaseStatusEnum.discussed
    db.commit()
    db.refresh(decision)

    write_audit_event(
        db,
        actor_id=current_user.id,
        action="tumor_board.decision_recorded",
        entity_type="tumor_board_decision",
        entity_id=decision.id,
        metadata={"case_id": case_id, "session_id": session_id},
    )

    session = db.get(TumorBoardSession, session_id)
    patient = db.get(Patient, case.patient_id)
    patient_name = patient.full_name if patient else "the patient"
    for recipient_id in {session.coordinator_id if session else None, patient.primary_physician_id if patient else None}:
        if recipient_id and recipient_id != current_user.id:
            create_notification(
                db,
                recipient_id=recipient_id,
                message=f"Tumor board decision recorded for {patient_name}: {decision.decision}",
                link=f"/patients/{patient.id}" if patient else f"/tumor-board/{session_id}",
            )

    return _to_read(decision, db)
