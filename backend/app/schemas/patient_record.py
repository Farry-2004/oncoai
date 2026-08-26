from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.patient_record import RecordTypeEnum


class PatientRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    record_type: RecordTypeEnum
    title: str
    findings: str
    recorded_by_id: str | None = None
    recorded_by_name: str | None = None
    recorded_at: datetime
    created_at: datetime


class PatientRecordCreate(BaseModel):
    record_type: RecordTypeEnum
    title: str
    findings: str
    recorded_at: datetime | None = None
