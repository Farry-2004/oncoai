from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.audit import AuditLog
from app.models.patient import Patient, PatientStatusEnum
from app.models.patient_record import PatientRecord, RecordTypeEnum
from app.models.tumor_board import CasePriorityEnum, TumorBoardCase, TumorBoardSession
from app.models.user import User
from app.models.workup import WorkupItem, WorkupStatusEnum
from app.routers.tumor_boards import case_to_read
from app.schemas.audit import AuditLogRead
from app.schemas.dashboard import (
    DashboardSummary,
    PreparationChecklist,
    TBPreparationCase,
    TBPreparationSummary,
)

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


@router.get("/tb-preparation", response_model=TBPreparationSummary)
def get_tb_preparation(
    db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)
) -> TBPreparationSummary:
    """Readiness for the next upcoming tumor board session, derived entirely
    from real record/workup data -- not an AI judgment call, so it's labeled
    "preparation" rather than anything implying AI analysis happened."""
    now = datetime.now(timezone.utc)
    session = (
        db.query(TumorBoardSession)
        .filter(TumorBoardSession.scheduled_at >= now)
        .order_by(TumorBoardSession.scheduled_at.asc())
        .first()
    )
    if not session:
        return TBPreparationSummary(cases=[], ready_count=0, total_count=0)

    cases = (
        db.query(TumorBoardCase)
        .filter(TumorBoardCase.session_id == session.id)
        .order_by(TumorBoardCase.queue_position.asc())
        .all()
    )

    chair_name = None
    if session.chair_id:
        chair = db.get(User, session.chair_id)
        if chair:
            chair_name = chair.full_name

    prep_cases: list[TBPreparationCase] = []
    for case in cases:
        patient = db.get(Patient, case.patient_id)
        record_types = {
            row[0]
            for row in db.query(PatientRecord.record_type)
            .filter(PatientRecord.patient_id == case.patient_id)
            .distinct()
        }
        workups = db.query(WorkupItem).filter(WorkupItem.patient_id == case.patient_id).all()
        workup_complete = bool(workups) and all(w.status == WorkupStatusEnum.completed for w in workups)

        checklist = PreparationChecklist(
            patient_history=RecordTypeEnum.clinical_note in record_types,
            pathology=RecordTypeEnum.pathology in record_types,
            imaging=RecordTypeEnum.imaging in record_types,
            laboratory=RecordTypeEnum.lab in record_types,
            treatment_history=RecordTypeEnum.treatment in record_types,
            workup_complete=workup_complete,
        )
        missing: list[str] = []
        if not checklist.patient_history:
            missing.append("Patient history")
        if not checklist.pathology:
            missing.append("Pathology report")
        if not checklist.imaging:
            missing.append("Imaging")
        if not checklist.laboratory:
            missing.append("Laboratory results")
        if not checklist.workup_complete:
            missing.append("Workup incomplete")

        prep_cases.append(
            TBPreparationCase(
                case_id=case.id,
                patient_id=case.patient_id,
                patient_name=patient.full_name if patient else "Unknown patient",
                ready=checklist.pathology and checklist.imaging and checklist.workup_complete,
                checklist=checklist,
                missing=missing,
            )
        )

    return TBPreparationSummary(
        session_id=session.id,
        session_title=session.title,
        scheduled_at=session.scheduled_at,
        chair_name=chair_name,
        location=session.location,
        cases=prep_cases,
        ready_count=sum(1 for c in prep_cases if c.ready),
        total_count=len(prep_cases),
    )
