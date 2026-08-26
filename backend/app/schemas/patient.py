from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.patient import PatientStatusEnum, SexEnum


class PatientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    mrn: str
    full_name: str
    date_of_birth: date
    sex: SexEnum
    phone: str | None = None
    cancer_site: str
    histology: str | None = None
    stage: str | None = None
    status: PatientStatusEnum
    priority: str
    primary_physician_id: str | None = None
    primary_physician_name: str | None = None
    facility: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime


class PatientCreate(BaseModel):
    mrn: str
    full_name: str
    date_of_birth: date
    sex: SexEnum
    phone: str | None = None
    cancer_site: str
    histology: str | None = None
    stage: str | None = None
    status: PatientStatusEnum = PatientStatusEnum.new
    priority: str = "medium"
    primary_physician_id: str | None = None
    facility: str


class PatientUpdate(BaseModel):
    full_name: str | None = None
    cancer_site: str | None = None
    histology: str | None = None
    stage: str | None = None
    status: PatientStatusEnum | None = None
    priority: str | None = None
    primary_physician_id: str | None = None


class PatientListResponse(BaseModel):
    items: list[PatientRead]
    total: int
    page: int
    page_size: int
