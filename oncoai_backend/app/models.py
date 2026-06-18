"""
ORM models mapped onto the tables/enums defined in oncoai_schema.sql.

create_type=False on every PgEnum below is deliberate: the enum types
already exist in the database (created by the DDL script), and we don't
want SQLAlchemy attempting to recreate them.
"""

import enum
import uuid

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer, LargeBinary,
    String, Text, Time, UniqueConstraint
)
from sqlalchemy import Enum as PgEnum
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# ---------------------------------------------------------------------
# Enums (Python-side mirrors of the Postgres enum types)
# ---------------------------------------------------------------------

class UserRole(str, enum.Enum):
    coordinator = "coordinator"
    oncologist = "oncologist"
    surgeon = "surgeon"
    radiologist = "radiologist"
    pathologist = "pathologist"
    remote_specialist = "remote_specialist"
    nurse = "nurse"
    nutritionist = "nutritionist"
    administrator = "administrator"
    researcher = "researcher"


class CaseStatus(str, enum.Enum):
    awaiting_workup = "awaiting_workup"
    ready_for_tb = "ready_for_tb"
    presented = "presented"
    treatment_decided = "treatment_decided"
    closed = "closed"


class CaseComplexity(str, enum.Enum):
    simple = "simple"
    complex = "complex"


class WorkupType(str, enum.Enum):
    imaging = "imaging"
    pathology = "pathology"
    lab = "lab"
    dental = "dental"
    other = "other"


class WorkupStatus(str, enum.Enum):
    ordered = "ordered"
    in_progress = "in_progress"
    complete = "complete"


class MeetingMode(str, enum.Enum):
    in_person = "in_person"
    hybrid = "hybrid"
    virtual = "virtual"


class CommChannel(str, enum.Enum):
    sms = "sms"
    whatsapp = "whatsapp"
    call = "call"
    in_person = "in_person"


class CommDirection(str, enum.Enum):
    outbound = "outbound"
    inbound = "inbound"


class ConsentType(str, enum.Enum):
    data_use = "data_use"
    tb_discussion = "tb_discussion"
    remote_consult = "remote_consult"
    research_use = "research_use"


class ConsentMethod(str, enum.Enum):
    verbal = "verbal"
    written = "written"
    sms_confirmation = "sms_confirmation"


class ConcernLevel(str, enum.Enum):
    not_concerned = "not_concerned"
    somewhat_concerned = "somewhat_concerned"
    very_concerned = "very_concerned"


class PreferenceCategory(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


def pg_enum(py_enum: type[enum.Enum], pg_name: str):
    return PgEnum(py_enum, name=pg_name, create_type=False)


# ---------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------

class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    region = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="hospital")


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id"), nullable=False)
    full_name = Column(Text, nullable=False)
    role = Column(pg_enum(UserRole, "user_role"), nullable=False)
    specialty = Column(Text)
    contact = Column(Text)
    password_hash = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital", back_populates="users")


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    identifier_hash = Column(Text, nullable=False, unique=True)
    encrypted_full_name = Column(LargeBinary)
    dob = Column(Date)
    gender = Column(Text)
    encrypted_phone = Column(LargeBinary)
    encrypted_next_of_kin_contact = Column(LargeBinary)
    region = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    socioeconomic_factors = relationship(
        "SocioeconomicFactors", back_populates="patient", uselist=False
    )
    preferences = relationship(
        "PatientPreference", back_populates="patient", uselist=False
    )
    cases = relationship("Case", back_populates="patient")


class SocioeconomicFactors(Base):
    __tablename__ = "socioeconomic_factors"

    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.patient_id"), primary_key=True)
    transportation_concern = Column(Boolean, nullable=False, default=False)
    housing_concern = Column(Boolean, nullable=False, default=False)
    financial_concern = Column(Boolean, nullable=False, default=False)
    support_system_concern = Column(Boolean, nullable=False, default=False)
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="socioeconomic_factors")


class PatientPreference(Base):
    __tablename__ = "patient_preferences"

    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.patient_id"), primary_key=True)
    travel_concern = Column(pg_enum(ConcernLevel, "concern_level"))
    financial_concern = Column(pg_enum(ConcernLevel, "concern_level"))
    risk_tolerance = Column(pg_enum(ConcernLevel, "concern_level"))
    radiation_openness = Column(pg_enum(ConcernLevel, "concern_level"))
    category = Column(pg_enum(PreferenceCategory, "preference_category"))
    collected_via = Column(pg_enum(CommChannel, "comm_channel"))
    collected_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="preferences")


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.patient_id"), nullable=False)
    opened_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    suspected_diagnosis = Column(Text, nullable=False)
    complexity = Column(pg_enum(CaseComplexity, "case_complexity"), nullable=False,
                         default=CaseComplexity.simple)
    status = Column(pg_enum(CaseStatus, "case_status"), nullable=False,
                     default=CaseStatus.awaiting_workup)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="cases")
    workup_items = relationship("DiagnosticWorkup", back_populates="case")
    recommendations = relationship("Recommendation", back_populates="case")


class DiagnosticWorkup(Base):
    __tablename__ = "diagnostic_workup"

    workup_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id"), nullable=False)
    type = Column(pg_enum(WorkupType, "workup_type"), nullable=False)
    status = Column(pg_enum(WorkupStatus, "workup_status"), nullable=False,
                     default=WorkupStatus.ordered)
    assigned_provider = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    result_summary = Column(Text)
    file_reference = Column(Text)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="workup_items")


class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_date = Column(Date, nullable=False)
    meeting_time = Column(Time)
    mode = Column(pg_enum(MeetingMode, "meeting_mode"), nullable=False, default=MeetingMode.hybrid)
    coordinator_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recommendations = relationship("Recommendation", back_populates="meeting")


class MeetingCase(Base):
    __tablename__ = "meeting_cases"

    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.meeting_id"), primary_key=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id"), primary_key=True)
    presentation_order = Column(Integer)


class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id"), nullable=False)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.meeting_id"))
    recommended_action = Column(Text, nullable=False)
    vote_breakdown = Column(JSONB)
    rationale = Column(Text)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="recommendations")
    meeting = relationship("Meeting", back_populates="recommendations")


class CommunicationLog(Base):
    __tablename__ = "communications_log"

    comm_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.patient_id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id"))
    channel = Column(pg_enum(CommChannel, "comm_channel"), nullable=False)
    direction = Column(pg_enum(CommDirection, "comm_direction"), nullable=False)
    content_summary = Column(Text)
    sent_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    sent_at = Column(DateTime(timezone=True), server_default=func.now())


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    consent_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.patient_id"), nullable=False)
    consent_type = Column(pg_enum(ConsentType, "consent_type"), nullable=False)
    method = Column(pg_enum(ConsentMethod, "consent_method"), nullable=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    action = Column(String, nullable=False)  # audit_action enum, read-only from app side
    entity_type = Column(Text, nullable=False)
    entity_id = Column(UUID(as_uuid=True))
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(INET)
