from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.ai_analysis import AnalysisTypeEnum


class AIAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    analysis_type: AnalysisTypeEnum
    content: str
    ok: bool
    model_used: str
    requested_by_id: str | None = None
    requested_by_name: str | None = None
    created_at: datetime
