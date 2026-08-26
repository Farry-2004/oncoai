from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.ai_analysis import AIAnalysis, AnalysisTypeEnum
from app.models.patient import Patient
from app.models.patient_record import PatientRecord
from app.models.tumor_board import TumorBoardCase
from app.models.user import User
from app.models.workup import WorkupItem
from app.schemas.ai_analysis import AIAnalysisRead
from app.services.ai_service import generate_ai_analysis
from app.services.audit_service import write_audit_event

router = APIRouter(prefix="/patients/{patient_id}/ai", tags=["ai"])


def _to_read(entry: AIAnalysis, db: Session) -> AIAnalysisRead:
    read = AIAnalysisRead.model_validate(entry)
    if entry.requested_by_id:
        user = db.get(User, entry.requested_by_id)
        if user:
            read.requested_by_name = user.full_name
    return read


@router.get("", response_model=list[AIAnalysisRead])
def list_ai_analyses(
    patient_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[AIAnalysisRead]:
    entries = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.patient_id == patient_id)
        .order_by(AIAnalysis.created_at.desc())
        .all()
    )
    return [_to_read(e, db) for e in entries]


@router.post("/{analysis_type}", response_model=AIAnalysisRead, status_code=status.HTTP_201_CREATED)
def run_ai_analysis(
    patient_id: str,
    analysis_type: AnalysisTypeEnum,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIAnalysisRead:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    records = db.query(PatientRecord).filter(PatientRecord.patient_id == patient_id).all()
    workups = db.query(WorkupItem).filter(WorkupItem.patient_id == patient_id).all()
    tb_cases = db.query(TumorBoardCase).filter(TumorBoardCase.patient_id == patient_id).all()

    result = generate_ai_analysis(analysis_type.value, patient, records, workups, tb_cases)

    entry = AIAnalysis(
        patient_id=patient_id,
        analysis_type=analysis_type,
        content=result.content,
        ok=result.ok,
        model_used=result.model_used,
        requested_by_id=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="ai_analysis.generated",
        entity_type="ai_analysis",
        entity_id=entry.id,
        metadata={"patient_id": patient_id, "analysis_type": analysis_type.value, "ok": result.ok},
    )
    return _to_read(entry, db)
