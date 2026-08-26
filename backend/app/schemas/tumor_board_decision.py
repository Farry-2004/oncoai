from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DiscussionChecklist(BaseModel):
    diagnosis_confirmed: bool = False
    stage_confirmed: bool = False
    pathology_reviewed: bool = False
    imaging_reviewed: bool = False
    treatment_history_reviewed: bool = False
    patient_preferences_reviewed: bool = False
    social_considerations_reviewed: bool = False
    financial_considerations_reviewed: bool = False
    treatment_options_discussed: bool = False
    consensus_reached: bool = False

    def is_complete(self) -> bool:
        return all(self.model_dump().values())


class TumorBoardDecisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tumor_board_case_id: str
    checklist: DiscussionChecklist
    decision: str
    treatment_plan: str
    rationale: str
    additional_investigations: str | None = None
    responsible_team: str
    follow_up_date: date | None = None
    decided_by_id: str | None = None
    decided_by_name: str | None = None
    created_at: datetime


class TumorBoardDecisionCreate(BaseModel):
    checklist: DiscussionChecklist
    decision: str
    treatment_plan: str
    rationale: str
    additional_investigations: str | None = None
    responsible_team: str
    follow_up_date: date | None = None
