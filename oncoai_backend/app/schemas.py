"""
Pydantic schemas for request validation and response serialization.

Kept separate from models.py on purpose: ORM models describe storage,
schemas describe the API contract. They will drift from each other as the
API evolves (e.g. hiding encrypted_* columns from responses entirely).
"""

import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict

from app.models import (
    CaseComplexity, CaseStatus, CommChannel, CommDirection, ConcernLevel,
    MeetingMode, PreferenceCategory, UserRole, WorkupStatus, WorkupType
)


# ---------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------

class LoginRequest(BaseModel):
    contact: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    hospital_id: uuid.UUID
    full_name: str
    role: UserRole
    specialty: str | None = None
    is_active: bool


# ---------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------

class PatientCreate(BaseModel):
    identifier_hash: str          # computed app-side (HMAC of MRN/national ID)
    full_name: str                # plaintext in, encrypted before storage
    dob: date | None = None
    gender: str | None = None
    phone: str | None = None      # plaintext in, encrypted before storage
    next_of_kin_contact: str | None = None
    region: str | None = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_id: uuid.UUID
    identifier_hash: str
    dob: date | None
    gender: str | None
    region: str | None
    # Decrypted name/phone are intentionally NOT included here by default —
    # add a separate, audited "reveal PII" endpoint rather than returning
    # it on every read.


class SocioeconomicFactorsIn(BaseModel):
    transportation_concern: bool = False
    housing_concern: bool = False
    financial_concern: bool = False
    support_system_concern: bool = False
    notes: str | None = None


class PreferenceSurveyResponse(BaseModel):
    travel_concern: ConcernLevel
    financial_concern: ConcernLevel
    risk_tolerance: ConcernLevel
    radiation_openness: ConcernLevel
    collected_via: CommChannel


class PatientPreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    travel_concern: ConcernLevel | None
    financial_concern: ConcernLevel | None
    risk_tolerance: ConcernLevel | None
    radiation_openness: ConcernLevel | None
    category: PreferenceCategory | None
    collected_via: CommChannel | None
    collected_at: datetime | None


# ---------------------------------------------------------------------
# Cases & Workup
# ---------------------------------------------------------------------

class CaseCreate(BaseModel):
    patient_id: uuid.UUID
    suspected_diagnosis: str
    complexity: CaseComplexity = CaseComplexity.simple


class CaseStatusUpdate(BaseModel):
    status: CaseStatus


class WorkupCreate(BaseModel):
    type: WorkupType
    assigned_provider: uuid.UUID | None = None


class WorkupUpdate(BaseModel):
    status: WorkupStatus
    result_summary: str | None = None
    file_reference: str | None = None


class WorkupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workup_id: uuid.UUID
    case_id: uuid.UUID
    type: WorkupType
    status: WorkupStatus
    assigned_provider: uuid.UUID | None
    result_summary: str | None
    file_reference: str | None
    completed_at: datetime | None


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: uuid.UUID
    patient_id: uuid.UUID
    opened_by: uuid.UUID
    suspected_diagnosis: str
    complexity: CaseComplexity
    status: CaseStatus
    opened_at: datetime
    workup_items: list[WorkupOut] = []


# ---------------------------------------------------------------------
# Meetings & Recommendations
# ---------------------------------------------------------------------

class MeetingCreate(BaseModel):
    meeting_date: date
    meeting_time: time | None = None
    mode: MeetingMode = MeetingMode.hybrid


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    meeting_id: uuid.UUID
    meeting_date: date
    meeting_time: time | None
    mode: MeetingMode
    coordinator_id: uuid.UUID


class MeetingAddCase(BaseModel):
    case_id: uuid.UUID
    presentation_order: int | None = None


class RecommendationCreate(BaseModel):
    recommended_action: str
    vote_breakdown: dict | None = None
    rationale: str | None = None


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recommendation_id: uuid.UUID
    case_id: uuid.UUID
    meeting_id: uuid.UUID | None
    recommended_action: str
    vote_breakdown: dict | None
    rationale: str | None
    decided_by: uuid.UUID | None
    created_at: datetime


# ---------------------------------------------------------------------
# Communications
# ---------------------------------------------------------------------

class CommunicationLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    comm_id: uuid.UUID
    patient_id: uuid.UUID
    case_id: uuid.UUID | None
    channel: CommChannel
    direction: CommDirection
    content_summary: str | None
    sent_at: datetime


class DialInRequest(BaseModel):
    meeting_id: uuid.UUID


class FamilyConferenceRequest(BaseModel):
    case_id: uuid.UUID
    summary: str
    family_included: bool = False
