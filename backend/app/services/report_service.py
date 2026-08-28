from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.ai_analysis import AIAnalysis, AnalysisTypeEnum
from app.models.follow_up import FollowUp, FollowUpStatusEnum
from app.models.patient import Patient
from app.models.patient_record import PatientRecord
from app.models.tumor_board import TumorBoardCase, TumorBoardSession
from app.models.tumor_board_decision import TumorBoardDecision
from app.models.user import User
from app.models.workup import WorkupItem

DISCLAIMER = "AI-generated clinical support — requires review and confirmation by qualified clinicians."


@dataclass
class GeneratedReport:
    title: str
    content: str
    ai_sourced: bool


def _latest_ai_analysis(db: Session, patient_id: str, analysis_type: AnalysisTypeEnum) -> AIAnalysis | None:
    return (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.patient_id == patient_id,
            AIAnalysis.analysis_type == analysis_type,
            AIAnalysis.ok.is_(True),
        )
        .order_by(AIAnalysis.created_at.desc())
        .first()
    )


def _latest_decision(db: Session, patient_id: str) -> TumorBoardDecision | None:
    return (
        db.query(TumorBoardDecision)
        .join(TumorBoardCase, TumorBoardDecision.tumor_board_case_id == TumorBoardCase.id)
        .filter(TumorBoardCase.patient_id == patient_id)
        .order_by(TumorBoardDecision.created_at.desc())
        .first()
    )


def _patient_header(patient: Patient) -> list[str]:
    return [
        f"Patient: {patient.full_name}",
        f"MRN: {patient.mrn}",
        f"Sex: {patient.sex.value}   Date of birth: {patient.date_of_birth}",
        f"Cancer site: {patient.cancer_site}",
        f"Histology: {patient.histology or 'Not recorded'}",
        f"Stage: {patient.stage or 'Not recorded'}",
        f"Facility: {patient.facility}",
        "",
    ]


def generate_clinical_summary(db: Session, patient: Patient) -> GeneratedReport:
    lines = [f"CLINICAL SUMMARY — {patient.full_name}", ""]
    lines += _patient_header(patient)

    workups = db.query(WorkupItem).filter(WorkupItem.patient_id == patient.id).all()
    lines.append("WORKUP STATUS")
    if workups:
        for w in workups:
            lines.append(f"  - [{w.item_type.value}] {w.description}: {w.status.value}")
    else:
        lines.append("  - No workup items recorded.")
    lines.append("")

    records = db.query(PatientRecord).filter(PatientRecord.patient_id == patient.id).all()
    lines.append("CLINICAL RECORDS")
    if records:
        for r in records:
            lines.append(f"  - [{r.record_type.value}] {r.title} ({r.recorded_at.date()}): {r.findings}")
    else:
        lines.append("  - No clinical records recorded.")
    lines.append("")

    ai_sourced = False
    ai = _latest_ai_analysis(db, patient.id, AnalysisTypeEnum.case_summary)
    if ai:
        ai_sourced = True
        lines += ["AI-GENERATED CASE SUMMARY (requires clinician review)", ai.content, ""]
    else:
        lines += ["AI-GENERATED CASE SUMMARY", "No AI case summary has been generated for this patient yet.", ""]

    return GeneratedReport(title=f"Clinical Summary — {patient.full_name}", content="\n".join(lines), ai_sourced=ai_sourced)


def generate_treatment_plan(db: Session, patient: Patient) -> GeneratedReport:
    lines = [f"TREATMENT PLAN — {patient.full_name}", ""]
    lines += _patient_header(patient)

    decision = _latest_decision(db, patient.id)
    if decision:
        lines += [
            "TUMOR BOARD DECISION",
            f"  Decision: {decision.decision}",
            f"  Treatment Plan: {decision.treatment_plan}",
            f"  Rationale: {decision.rationale}",
            f"  Responsible Team: {decision.responsible_team}",
        ]
        if decision.additional_investigations:
            lines.append(f"  Additional Investigations: {decision.additional_investigations}")
        if decision.follow_up_date:
            lines.append(f"  Follow-up Date: {decision.follow_up_date}")
        decided_by = db.get(User, decision.decided_by_id) if decision.decided_by_id else None
        lines.append(f"  Recorded by: {decided_by.full_name if decided_by else 'Unknown'} on {decision.created_at.date()}")
    else:
        lines.append("No tumor board decision has been recorded for this patient yet.")

    return GeneratedReport(title=f"Treatment Plan — {patient.full_name}", content="\n".join(lines), ai_sourced=False)


def generate_follow_up_summary(db: Session, patient: Patient) -> GeneratedReport:
    lines = [f"FOLLOW-UP SUMMARY — {patient.full_name}", ""]
    lines += _patient_header(patient)

    follow_ups = (
        db.query(FollowUp)
        .filter(FollowUp.patient_id == patient.id)
        .order_by(FollowUp.follow_up_date.asc())
        .all()
    )
    lines.append("FOLLOW-UP SCHEDULE")
    if follow_ups:
        for f in follow_ups:
            line = f"  - {f.follow_up_date} [{f.status.value}]"
            if f.notes:
                line += f": {f.notes}"
            lines.append(line)
    else:
        lines.append("  - No follow-ups scheduled.")
    lines.append("")

    ai_sourced = False
    ai = _latest_ai_analysis(db, patient.id, AnalysisTypeEnum.follow_up_summary)
    if ai:
        ai_sourced = True
        lines += ["AI-GENERATED FOLLOW-UP NOTES (requires clinician review)", ai.content]
    else:
        lines += ["AI-GENERATED FOLLOW-UP NOTES", "No AI follow-up summary has been generated for this patient yet."]

    return GeneratedReport(
        title=f"Follow-up Summary — {patient.full_name}", content="\n".join(lines), ai_sourced=ai_sourced
    )


def generate_medical_passport(db: Session, patient: Patient) -> GeneratedReport:
    lines = [
        f"DIGITAL MEDICAL PASSPORT — {patient.full_name}",
        f"This passport summarizes your care at {patient.facility}.",
        "",
    ]
    lines += _patient_header(patient)

    ai_sourced = False
    explanation = _latest_ai_analysis(db, patient.id, AnalysisTypeEnum.patient_explanation)
    lines.append("ABOUT YOUR DIAGNOSIS")
    if explanation:
        ai_sourced = True
        lines.append(explanation.content)
    else:
        lines.append(
            f"You are being cared for at {patient.facility} for {patient.cancer_site} cancer"
            f"{f', currently staged as {patient.stage}' if patient.stage else ''}. "
            "Ask your care team for a plain-language explanation of your diagnosis."
        )
    lines.append("")

    decision = _latest_decision(db, patient.id)
    lines.append("YOUR TREATMENT PLAN")
    if decision:
        lines.append(f"  {decision.treatment_plan}")
        lines.append(f"  Care team: {decision.responsible_team}")
        if decision.follow_up_date:
            lines.append(f"  Next scheduled follow-up: {decision.follow_up_date}")
    else:
        lines.append("  Your treatment plan has not yet been finalized by the tumor board.")
    lines.append("")

    follow_ups = (
        db.query(FollowUp)
        .filter(FollowUp.patient_id == patient.id, FollowUp.status == FollowUpStatusEnum.scheduled)
        .order_by(FollowUp.follow_up_date.asc())
        .all()
    )
    lines.append("UPCOMING APPOINTMENTS")
    if follow_ups:
        for f in follow_ups:
            lines.append(f"  - {f.follow_up_date}{': ' + f.notes if f.notes else ''}")
    else:
        lines.append("  - No upcoming appointments scheduled.")
    lines.append("")
    lines.append(DISCLAIMER)

    return GeneratedReport(
        title=f"Medical Passport — {patient.full_name}", content="\n".join(lines), ai_sourced=ai_sourced
    )


def generate_tumor_board_report(db: Session, session: TumorBoardSession) -> GeneratedReport:
    lines = [f"TUMOR BOARD REPORT — {session.title}", ""]
    lines += [
        f"Date: {session.scheduled_at}",
        f"Location: {session.location or 'Not recorded'}",
        f"Facility: {session.facility}",
    ]
    chair = db.get(User, session.chair_id) if session.chair_id else None
    coordinator = db.get(User, session.coordinator_id) if session.coordinator_id else None
    lines.append(f"Chair: {chair.full_name if chair else 'Not recorded'}")
    lines.append(f"Coordinator: {coordinator.full_name if coordinator else 'Not recorded'}")
    lines.append("")

    cases = (
        db.query(TumorBoardCase)
        .filter(TumorBoardCase.session_id == session.id)
        .order_by(TumorBoardCase.queue_position.asc())
        .all()
    )
    lines.append(f"CASES PRESENTED ({len(cases)})")
    lines.append("")
    for i, c in enumerate(cases, start=1):
        patient = db.get(Patient, c.patient_id)
        lines.append(f"{i}. {patient.full_name if patient else 'Unknown patient'} ({patient.mrn if patient else '—'})")
        lines.append(f"   Diagnosis: {patient.cancer_site if patient else '—'} — {patient.stage or 'stage n/a' if patient else '—'}")
        lines.append(f"   Priority: {c.priority.value}   Status: {c.status.value}")

        decision = (
            db.query(TumorBoardDecision).filter(TumorBoardDecision.tumor_board_case_id == c.id).first()
        )
        if decision:
            lines.append(f"   Decision: {decision.decision}")
            lines.append(f"   Treatment Plan: {decision.treatment_plan}")
            lines.append(f"   Responsible Team: {decision.responsible_team}")
        else:
            lines.append("   Decision: Not yet recorded.")
        lines.append("")

    return GeneratedReport(
        title=f"Tumor Board Report — {session.title}", content="\n".join(lines), ai_sourced=False
    )
