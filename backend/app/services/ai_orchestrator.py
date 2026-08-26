import enum

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_analysis import AIAnalysis, AnalysisTypeEnum
from app.models.patient import Patient
from app.models.patient_record import PatientRecord
from app.models.tumor_board import TumorBoardCase
from app.models.user import RoleEnum, User
from app.models.workup import WorkupItem
from app.services.ai_service import generate_ai_analysis
from app.services.notification_service import create_notification


class OrchestrationTrigger(str, enum.Enum):
    workup_completed = "workup_completed"
    case_added_to_board = "case_added_to_board"
    decision_recorded = "decision_recorded"
    high_concern_survey = "high_concern_survey"


PIPELINES: dict[OrchestrationTrigger, list[str]] = {
    OrchestrationTrigger.workup_completed: [
        AnalysisTypeEnum.extract_clinical_facts.value,
        AnalysisTypeEnum.missing_information.value,
        AnalysisTypeEnum.tumor_board_brief.value,
    ],
    OrchestrationTrigger.case_added_to_board: [
        AnalysisTypeEnum.tumor_board_brief.value,
    ],
    OrchestrationTrigger.decision_recorded: [
        AnalysisTypeEnum.follow_up_summary.value,
        AnalysisTypeEnum.patient_explanation.value,
    ],
    OrchestrationTrigger.high_concern_survey: [
        AnalysisTypeEnum.specialist_questions.value,
    ],
}


def run_orchestration(
    db: Session,
    patient: Patient,
    trigger: OrchestrationTrigger,
    tb_case: TumorBoardCase | None = None,
) -> list[AIAnalysis]:
    """Chains the AI steps for a clinical workflow event, unattended.

    Unlike the manual `/patients/{id}/ai/{type}` endpoint — which always
    records a result because a clinician explicitly asked for one — this
    silently does nothing when OPENAI_API_KEY isn't set, so routine workflow
    events (a workup completing, a case being queued) don't spam the AI
    analysis list with "not configured" placeholders nobody asked for.

    Runs are recorded with requested_by_id left null, distinguishing an
    orchestrated run from a manually requested one.
    """
    if not settings.openai_api_key:
        return []

    records = db.query(PatientRecord).filter(PatientRecord.patient_id == patient.id).all()
    workups = db.query(WorkupItem).filter(WorkupItem.patient_id == patient.id).all()
    tb_cases = db.query(TumorBoardCase).filter(TumorBoardCase.patient_id == patient.id).all()

    results: list[AIAnalysis] = []
    outputs: dict[str, str] = {}
    for analysis_type in PIPELINES[trigger]:
        result = generate_ai_analysis(analysis_type, patient, records, workups, tb_cases)
        entry = AIAnalysis(
            patient_id=patient.id,
            analysis_type=analysis_type,
            content=result.content,
            ok=result.ok,
            model_used=result.model_used,
            requested_by_id=None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        results.append(entry)
        outputs[analysis_type] = result.content

    if trigger == OrchestrationTrigger.case_added_to_board and tb_case is not None:
        brief = outputs.get(AnalysisTypeEnum.tumor_board_brief.value)
        if brief:
            tb_case.ai_summary_demo = brief
            db.commit()

    if trigger == OrchestrationTrigger.high_concern_survey:
        for coordinator in db.query(User).filter(User.role == RoleEnum.tumor_board_coordinator).all():
            create_notification(
                db,
                recipient_id=coordinator.id,
                message=(
                    f"{patient.full_name} scored HIGH concern on the pre-TB survey — "
                    "AI-drafted specialist questions are ready for review."
                ),
                link=f"/patients/{patient.id}",
            )

    return results
