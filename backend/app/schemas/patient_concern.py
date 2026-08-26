from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.patient_concern import ConcernCategoryEnum, ConcernLevelEnum


class PatientConcernsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    transportation_barrier: bool
    housing_barrier: bool
    financial_barrier: bool
    dependent_care_barrier: bool
    other_barrier_notes: str | None = None
    travel_concern: ConcernLevelEnum
    financial_concern: ConcernLevelEnum
    risk_tolerance_concern: ConcernLevelEnum
    radiation_openness_concern: ConcernLevelEnum
    concern_category: ConcernCategoryEnum
    updated_by_id: str | None = None
    updated_by_name: str | None = None
    updated_at: datetime


class PatientConcernsUpsert(BaseModel):
    transportation_barrier: bool = False
    housing_barrier: bool = False
    financial_barrier: bool = False
    dependent_care_barrier: bool = False
    other_barrier_notes: str | None = None
    travel_concern: ConcernLevelEnum = ConcernLevelEnum.not_concerned
    financial_concern: ConcernLevelEnum = ConcernLevelEnum.not_concerned
    risk_tolerance_concern: ConcernLevelEnum = ConcernLevelEnum.not_concerned
    radiation_openness_concern: ConcernLevelEnum = ConcernLevelEnum.not_concerned
