from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.patient import Patient
from app.models.report import Report, ReportStatusEnum
from app.models.tumor_board import TumorBoardSession
from app.models.user import User
from app.schemas.report import ReportGenerate, ReportRead, ReportUpdate
from app.services.audit_service import write_audit_event
from app.services.report_service import (
    generate_clinical_summary,
    generate_follow_up_summary,
    generate_medical_passport,
    generate_treatment_plan,
    generate_tumor_board_report,
)

router = APIRouter(prefix="/reports", tags=["reports"])

PATIENT_SCOPED_GENERATORS = {
    "clinical_summary": generate_clinical_summary,
    "treatment_plan": generate_treatment_plan,
    "follow_up_summary": generate_follow_up_summary,
    "medical_passport": generate_medical_passport,
}


def _to_read(report: Report, db: Session) -> ReportRead:
    read = ReportRead.model_validate(report)
    if report.patient_id:
        patient = db.get(Patient, report.patient_id)
        if patient:
            read.patient_name = patient.full_name
    if report.created_by_id:
        creator = db.get(User, report.created_by_id)
        if creator:
            read.created_by_name = creator.full_name
    if report.approved_by_id:
        approver = db.get(User, report.approved_by_id)
        if approver:
            read.approved_by_name = approver.full_name
    return read


@router.get("", response_model=list[ReportRead])
def list_reports(
    patient_id: str | None = None,
    report_type: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[ReportRead]:
    query = db.query(Report)
    if patient_id:
        query = query.filter(Report.patient_id == patient_id)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    reports = query.order_by(Report.created_at.desc()).all()
    return [_to_read(r, db) for r in reports]


@router.get("/{report_id}", response_model=ReportRead)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> ReportRead:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return _to_read(report, db)


@router.post("/generate", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def generate_report(
    payload: ReportGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportRead:
    report_type = payload.report_type.value

    if report_type == "tumor_board_report":
        if not payload.tumor_board_session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="tumor_board_session_id is required for a Tumor Board Report.",
            )
        session = db.get(TumorBoardSession, payload.tumor_board_session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tumor board session not found.")
        generated = generate_tumor_board_report(db, session)
        report = Report(
            report_type=payload.report_type,
            title=generated.title,
            tumor_board_session_id=session.id,
            content=generated.content,
            ai_sourced=generated.ai_sourced,
            created_by_id=current_user.id,
        )
    else:
        generator = PATIENT_SCOPED_GENERATORS.get(report_type)
        if not generator:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown report type.")
        if not payload.patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="patient_id is required for this report type."
            )
        patient = db.get(Patient, payload.patient_id)
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
        generated = generator(db, patient)
        report = Report(
            report_type=payload.report_type,
            title=generated.title,
            patient_id=patient.id,
            content=generated.content,
            ai_sourced=generated.ai_sourced,
            created_by_id=current_user.id,
        )

    db.add(report)
    db.commit()
    db.refresh(report)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="report.generate",
        entity_type="report",
        entity_id=report.id,
        metadata={"report_type": report_type},
    )
    return _to_read(report, db)


@router.patch("/{report_id}", response_model=ReportRead)
def update_report(
    report_id: str,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportRead:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(report, field, value)

    # Editing an approved report reverts it to draft so "approved" always reflects reviewed content.
    if changes and report.status == ReportStatusEnum.approved:
        report.status = ReportStatusEnum.draft
        report.approved_by_id = None
        report.approved_at = None

    db.commit()
    db.refresh(report)
    write_audit_event(
        db, actor_id=current_user.id, action="report.edit", entity_type="report", entity_id=report.id
    )
    return _to_read(report, db)


@router.post("/{report_id}/approve", response_model=ReportRead)
def approve_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportRead:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    report.status = ReportStatusEnum.approved
    report.approved_by_id = current_user.id
    report.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    write_audit_event(
        db, actor_id=current_user.id, action="report.approve", entity_type="report", entity_id=report.id
    )
    return _to_read(report, db)
