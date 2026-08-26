from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.audit import AuditLog
from app.models.patient import Patient, PatientStatusEnum
from app.models.tumor_board import CasePriorityEnum, TumorBoardCase, TumorBoardSession
from app.models.user import User
from app.models.workup import WorkupItem, WorkupStatusEnum
from app.routers.tumor_boards import case_to_read
from app.schemas.audit import AuditLogRead
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)
) -> DashboardSummary:
    active_patients = (
        db.query(Patient).filter(Patient.status != PatientStatusEnum.discharged).count()
    )
    open_cases = (
        db.query(TumorBoardCase)
        .join(TumorBoardSession)
        .filter(TumorBoardSession.status.in_(["scheduled", "in_progress"]))
        .count()
    )
    critical_cases = (
        db.query(TumorBoardCase).filter(TumorBoardCase.priority == CasePriorityEnum.critical).count()
    )
    now = datetime.now(timezone.utc)
    upcoming_sessions = (
        db.query(TumorBoardSession)
        .filter(TumorBoardSession.scheduled_at >= now)
        .order_by(TumorBoardSession.scheduled_at.asc())
        .all()
    )
    incomplete_workups = (
        db.query(WorkupItem).filter(WorkupItem.status != WorkupStatusEnum.completed).count()
    )

    recent_cases = (
        db.query(TumorBoardCase).order_by(TumorBoardCase.created_at.desc()).limit(5).all()
    )
    recent_activity = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()

    activity_reads = []
    for entry in recent_activity:
        read = AuditLogRead.model_validate(entry)
        if entry.actor_id:
            actor = db.get(User, entry.actor_id)
            if actor:
                read.actor_name = actor.full_name
        activity_reads.append(read)

    return DashboardSummary(
        active_patients=active_patients,
        open_cases=open_cases,
        critical_cases=critical_cases,
        upcoming_boards=len(upcoming_sessions),
        next_board_at=upcoming_sessions[0].scheduled_at if upcoming_sessions else None,
        incomplete_workups=incomplete_workups,
        recent_cases=[case_to_read(c, db) for c in recent_cases],
        recent_activity=activity_reads,
    )
