from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.follow_up import FollowUp, FollowUpStatusEnum
from app.models.patient import Patient
from app.models.tumor_board import CasePriorityEnum, CaseStatusEnum, TumorBoardCase
from app.models.tumor_board_decision import TumorBoardDecision
from app.models.user import User
from app.models.workup import WorkupItem, WorkupStatusEnum
from app.schemas.analytics import AnalyticsSummary, BreakdownItem

router = APIRouter(prefix="/analytics", tags=["analytics"])

WORKUP_STATUS_LABELS = {"ordered": "Ordered", "in_progress": "In Progress", "completed": "Completed", "cancelled": "Cancelled"}
PRIORITY_LABELS = {"low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"}


def _avg_days(deltas: list[float]) -> float | None:
    if not deltas:
        return None
    avg = round(sum(deltas) / len(deltas), 1)
    return avg + 0.0  # normalizes -0.0 to 0.0


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)
) -> AnalyticsSummary:
    patients = db.query(Patient).all()
    workups = db.query(WorkupItem).all()
    cases = db.query(TumorBoardCase).all()
    decisions = db.query(TumorBoardDecision).all()
    follow_ups = db.query(FollowUp).all()

    patients_by_id = {p.id: p for p in patients}
    cases_by_id = {c.id: c for c in cases}

    cases_reviewed = sum(1 for c in cases if c.status == CaseStatusEnum.discussed)
    cases_awaiting_tb = sum(1 for c in cases if c.status == CaseStatusEnum.pending)
    pending_investigations = sum(1 for w in workups if w.status != WorkupStatusEnum.completed)

    workup_completion_days = [
        (w.completed_at - w.created_at).total_seconds() / 86400
        for w in workups
        if w.status == WorkupStatusEnum.completed and w.completed_at
    ]

    # Diagnosis proxy: patient registration date (no separate diagnosis-date field is tracked yet).
    diagnosis_to_tb_days = []
    seen_patient_ids = set()
    for c in sorted(cases, key=lambda c: c.created_at):
        if c.patient_id in seen_patient_ids:
            continue
        seen_patient_ids.add(c.patient_id)
        patient = patients_by_id.get(c.patient_id)
        if patient:
            diagnosis_to_tb_days.append((c.created_at - patient.created_at).total_seconds() / 86400)

    treatment_turnaround_days = []
    for d in decisions:
        case = cases_by_id.get(d.tumor_board_case_id)
        if case:
            treatment_turnaround_days.append((d.created_at - case.created_at).total_seconds() / 86400)

    completed_follow_ups = sum(1 for f in follow_ups if f.status == FollowUpStatusEnum.completed)
    follow_up_completion_pct = round((completed_follow_ups / len(follow_ups)) * 100, 1) if follow_ups else 0.0

    site_counts = Counter(p.cancer_site for p in patients)
    patients_by_cancer_site = [
        BreakdownItem(key=site, label=site, value=count)
        for site, count in sorted(site_counts.items(), key=lambda kv: -kv[1])
    ]

    workup_status_counts = Counter(w.status.value for w in workups)
    workup_by_status = [
        BreakdownItem(key=key, label=WORKUP_STATUS_LABELS.get(key, key), value=workup_status_counts.get(key, 0))
        for key in ["completed", "in_progress", "ordered", "cancelled"]
        if workup_status_counts.get(key, 0) > 0
    ]

    priority_counts = Counter(c.priority.value for c in cases)
    cases_by_priority = [
        BreakdownItem(key=key, label=PRIORITY_LABELS.get(key, key), value=priority_counts.get(key, 0))
        for key in ["critical", "high", "medium", "low"]
        if priority_counts.get(key, 0) > 0
    ]

    return AnalyticsSummary(
        patients_registered=len(patients),
        cases_reviewed=cases_reviewed,
        cases_awaiting_tb=cases_awaiting_tb,
        pending_investigations=pending_investigations,
        avg_workup_completion_days=_avg_days(workup_completion_days),
        avg_diagnosis_to_tb_days=_avg_days(diagnosis_to_tb_days),
        avg_treatment_turnaround_days=_avg_days(treatment_turnaround_days),
        follow_up_completion_pct=follow_up_completion_pct,
        patients_by_cancer_site=patients_by_cancer_site,
        workup_by_status=workup_by_status,
        cases_by_priority=cases_by_priority,
    )
