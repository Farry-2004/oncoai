from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.case_finding import FindingFormatEnum, FindingTypeEnum


class CaseFindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tumor_board_case_id: str
    finding_type: FindingTypeEnum
    format: FindingFormatEnum
    content: str
    is_remote_consult: bool
    contributed_by_id: str | None = None
    contributed_by_name: str | None = None
    created_at: datetime


class CaseFindingCreate(BaseModel):
    finding_type: FindingTypeEnum
    format: FindingFormatEnum = FindingFormatEnum.written
    content: str
    is_remote_consult: bool = False
