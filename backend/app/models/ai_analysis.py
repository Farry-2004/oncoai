import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import _now, _uuid


class AnalysisTypeEnum(str, enum.Enum):
    case_summary = "case_summary"
    extract_clinical_facts = "extract_clinical_facts"
    missing_information = "missing_information"
    timeline_analysis = "timeline_analysis"
    tumor_board_brief = "tumor_board_brief"
    compare_evidence = "compare_evidence"
    specialist_questions = "specialist_questions"
    patient_explanation = "patient_explanation"
    follow_up_summary = "follow_up_summary"


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    analysis_type: Mapped[AnalysisTypeEnum] = mapped_column(
        Enum(AnalysisTypeEnum, native_enum=False), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    ok: Mapped[bool] = mapped_column(default=True)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    requested_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
