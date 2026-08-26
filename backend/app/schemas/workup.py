from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.workup import WorkupItemTypeEnum, WorkupStatusEnum


class WorkupItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    item_type: WorkupItemTypeEnum
    description: str
    status: WorkupStatusEnum
    ordered_by_id: str | None = None
    due_date: date | None = None
    completed_at: datetime | None = None
    created_at: datetime


class WorkupItemCreate(BaseModel):
    item_type: WorkupItemTypeEnum
    description: str
    status: WorkupStatusEnum = WorkupStatusEnum.ordered
    due_date: date | None = None


class WorkupItemUpdate(BaseModel):
    status: WorkupStatusEnum
