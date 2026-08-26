from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RecordImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_record_id: str
    filename: str
    content_type: str
    file_size: int
    uploaded_by_id: str | None = None
    uploaded_by_name: str | None = None
    created_at: datetime
