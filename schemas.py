from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ─── Patient ────────────────────────────────────────────────

class PatientCreate(BaseModel):
    patient_code: Optional[str] = None
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_condition: Optional[str] = None
    notes: Optional[str] = None
    cancer_type: Optional[str] = None
    cancer_stage: Optional[str] = None
    journey_status: Optional[str] = None
    date_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    tribe_ethnicity: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    religion: Optional[str] = None
    nationality: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None
    next_of_kin_relationship: Optional[str] = None
    nhif_registered: Optional[bool] = None
    nhif_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    family_cancer_history: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None


class PatientResponse(BaseModel):
    id: int
    patient_code: Optional[str] = None
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_condition: Optional[str] = None
    notes: Optional[str] = None
    cancer_type: Optional[str] = None
    cancer_stage: Optional[str] = None
    journey_status: Optional[str] = None
    date_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    tribe_ethnicity: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    religion: Optional[str] = None
    nationality: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None
    next_of_kin_relationship: Optional[str] = None
    nhif_registered: Optional[bool] = None
    nhif_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    family_cancer_history: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Case ───────────────────────────────────────────────────

class CaseResponse(BaseModel):
    id: int
    patient_id: int
    diagnosis: Optional[str] = None
    summary: Optional[str] = None
    recommendations: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    case_id: int
    filename: str
    document_type: Optional[str] = None
    file_path: str

    class Config:
        from_attributes = True


class CaseDetailResponse(BaseModel):
    id: int
    patient_id: int
    diagnosis: Optional[str] = None
    summary: Optional[str] = None
    recommendations: Optional[str] = None
    created_at: datetime
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    case_id: int
    filename: str
    document_type: str
    message: str


class AnalysisResult(BaseModel):
    case_id: int
    extracted_text: str
    summary: str
    missing_info: List[str]
    diagnosis: Optional[str] = None
    recommendations: Optional[str] = None


class TumorBoardReport(BaseModel):
    case_id: int
    patient_name: str
    patient_code: str
    clinical_history: str
    findings: str
    assessment: str
    recommendations: str


# ─── Referral ───────────────────────────────────────────────

class ReferralCreate(BaseModel):
    doctor_name: str
    doctor_phone: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    status: Optional[str] = "Pending"
    reason: Optional[str] = None
    notes: Optional[str] = None


class ReferralResponse(BaseModel):
    id: int
    patient_id: int
    doctor_name: str
    doctor_phone: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Lab Result ─────────────────────────────────────────────

class LabResultCreate(BaseModel):
    test_name: str
    test_value: Optional[str] = None
    reference_range: Optional[str] = None
    status: Optional[str] = "Pending"
    notes: Optional[str] = None


class LabResultResponse(BaseModel):
    id: int
    patient_id: int
    test_name: str
    test_value: Optional[str] = None
    reference_range: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Pathology ──────────────────────────────────────────────

class PathologyCreate(BaseModel):
    specimen_type: Optional[str] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    pathologist: Optional[str] = None
    status: Optional[str] = "Pending"
    notes: Optional[str] = None


class PathologyResponse(BaseModel):
    id: int
    patient_id: int
    specimen_type: Optional[str] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    pathologist: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Imaging ────────────────────────────────────────────────

class ImagingCreate(BaseModel):
    study_type: Optional[str] = None
    modality: Optional[str] = None
    body_part: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    radiologist: Optional[str] = None
    status: Optional[str] = "Pending"
    notes: Optional[str] = None


class ImagingResponse(BaseModel):
    id: int
    patient_id: int
    study_type: Optional[str] = None
    modality: Optional[str] = None
    body_part: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    radiologist: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Recommendation ─────────────────────────────────────────

class RecommendationCreate(BaseModel):
    priority: Optional[str] = "Medium"
    category: Optional[str] = None
    recommendation_text: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "Active"


class RecommendationResponse(BaseModel):
    id: int
    patient_id: int
    priority: Optional[str] = None
    category: Optional[str] = None
    recommendation_text: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Tumor Board ────────────────────────────────────────────

class TumorBoardCreate(BaseModel):
    scheduled_date: str
    chairperson: Optional[str] = None
    participants: Optional[List[Any]] = []
    discussion: Optional[str] = None
    recommendations: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_date: Optional[str] = None


class TumorBoardUpdate(BaseModel):
    scheduled_date: Optional[str] = None
    chairperson: Optional[str] = None
    status: Optional[str] = None
    participants: Optional[List[Any]] = None
    discussion: Optional[str] = None
    recommendations: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_date: Optional[str] = None
    checklist_patient_summary: Optional[bool] = None
    checklist_diagnostic_review: Optional[bool] = None
    checklist_treatment_considerations: Optional[bool] = None
    checklist_recommendations: Optional[bool] = None
    checklist_follow_up_plan: Optional[bool] = None
    vote_result: Optional[str] = None
    attendance: Optional[List[Any]] = None
    cme_credits_awarded: Optional[bool] = None


class TumorBoardResponse(BaseModel):
    id: int
    patient_id: int
    scheduled_date: datetime
    chairperson: Optional[str] = None
    status: Optional[str] = None
    discussion: Optional[str] = None
    recommendations: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    participants: Optional[List[Any]] = []
    checklist_patient_summary: Optional[bool] = None
    checklist_diagnostic_review: Optional[bool] = None
    checklist_treatment_considerations: Optional[bool] = None
    checklist_recommendations: Optional[bool] = None
    checklist_follow_up_plan: Optional[bool] = None
    vote_result: Optional[str] = None
    attendance: Optional[List[Any]] = []
    cme_credits_awarded: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Review ─────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    author_name: str
    author_role: Optional[str] = None
    rating: Optional[int] = 3
    comment: Optional[str] = None
    department: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    patient_id: int
    author_name: str
    author_role: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Patient Document ───────────────────────────────────────

class PatientDocumentResponse(BaseModel):
    id: int
    patient_id: int
    title: Optional[str] = None
    filename: str
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Summary ────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    id: int
    patient_id: int
    summary_text: str
    method: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SummarizeRequest(BaseModel):
    patient_id: int
    max_sentences: Optional[int] = 5


# ─── Workup Tracking ────────────────────────────────────────

class WorkupTrackingResponse(BaseModel):
    id: int
    patient_id: int
    imaging_complete: bool
    pathology_complete: bool
    lab_complete: bool
    consultation_complete: bool
    dental_assessment_complete: bool
    tb_ready: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class WorkupTrackingUpdate(BaseModel):
    imaging_complete: Optional[bool] = None
    pathology_complete: Optional[bool] = None
    lab_complete: Optional[bool] = None
    consultation_complete: Optional[bool] = None
    dental_assessment_complete: Optional[bool] = None
    tb_ready: Optional[bool] = None
    notes: Optional[str] = None


# ─── Socioeconomic Factors ──────────────────────────────────

class SocioeconomicResponse(BaseModel):
    id: int
    patient_id: int
    transportation: Optional[str] = None
    housing: Optional[str] = None
    financial_situation: Optional[str] = None
    support_system: Optional[str] = None
    insurance_status: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class SocioeconomicUpdate(BaseModel):
    transportation: Optional[str] = None
    housing: Optional[str] = None
    financial_situation: Optional[str] = None
    support_system: Optional[str] = None
    insurance_status: Optional[str] = None
    notes: Optional[str] = None


# ─── Patient Preferences ────────────────────────────────────

class PreferenceResponse(BaseModel):
    id: int
    patient_id: int
    travel_concern: Optional[str] = None
    financial_concern: Optional[str] = None
    risk_tolerance: Optional[str] = None
    radiation_openness: Optional[str] = None
    category: Optional[str] = None
    survey_completed: bool
    survey_method: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class PreferenceUpdate(BaseModel):
    travel_concern: Optional[str] = None
    financial_concern: Optional[str] = None
    risk_tolerance: Optional[str] = None
    radiation_openness: Optional[str] = None
    category: Optional[str] = None
    survey_completed: Optional[bool] = None
    survey_method: Optional[str] = None
    notes: Optional[str] = None


# ─── Patient Tracking ───────────────────────────────────────

class TrackingResponse(BaseModel):
    id: int
    patient_id: int
    cancer_stage: Optional[str] = None
    treatment_phase: Optional[str] = None
    ecog_score: Optional[int] = None
    oncologist: Optional[str] = None
    care_team: Optional[List[Any]] = []
    clinical_trials: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class TrackingUpdate(BaseModel):
    cancer_stage: Optional[str] = None
    treatment_phase: Optional[str] = None
    ecog_score: Optional[int] = None
    oncologist: Optional[str] = None
    care_team: Optional[List[Any]] = None
    clinical_trials: Optional[str] = None
    notes: Optional[str] = None
