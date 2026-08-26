from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskPriorityEnum, TaskStatusEnum


class TaskCommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    author_id: str | None = None
    author_name: str | None = None
    body: str
    created_at: datetime


class TaskCommentCreate(BaseModel):
    body: str


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str | None = None
    patient_id: str | None = None
    patient_name: str | None = None
    tumor_board_case_id: str | None = None
    assigned_to_id: str | None = None
    assigned_to_name: str | None = None
    priority: TaskPriorityEnum
    status: TaskStatusEnum
    due_date: date | None = None
    created_by_id: str | None = None
    created_at: datetime
    comment_count: int = 0


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    patient_id: str | None = None
    tumor_board_case_id: str | None = None
    assigned_to_id: str | None = None
    priority: TaskPriorityEnum = TaskPriorityEnum.medium
    due_date: date | None = None


class TaskUpdate(BaseModel):
    status: TaskStatusEnum | None = None
    priority: TaskPriorityEnum | None = None
    assigned_to_id: str | None = None
    due_date: date | None = None
