from pydantic import BaseModel


class BreakdownItem(BaseModel):
    key: str
    label: str
    value: int


class AnalyticsSummary(BaseModel):
    patients_registered: int
    cases_reviewed: int
    cases_awaiting_tb: int
    pending_investigations: int
    avg_workup_completion_days: float | None
    avg_diagnosis_to_tb_days: float | None
    avg_treatment_turnaround_days: float | None
    follow_up_completion_pct: float
    patients_by_cancer_site: list[BreakdownItem]
    workup_by_status: list[BreakdownItem]
    cases_by_priority: list[BreakdownItem]
