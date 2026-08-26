from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.report import ReportStatusEnum, ReportTypeEnum


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    report_type: ReportTypeEnum
    title: str
    patient_id: str | None = None
    patient_name: str | None = None
    tumor_board_session_id: str | None = None
    content: str
    ai_sourced: bool
    status: ReportStatusEnum
    created_by_id: str | None = None
    created_by_name: str | None = None
    approved_by_id: str | None = None
    approved_by_name: str | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ReportGenerate(BaseModel):
    report_type: ReportTypeEnum
    patient_id: str | None = None
    tumor_board_session_id: str | None = None


class ReportUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
