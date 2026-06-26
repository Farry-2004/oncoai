import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Float, JSON, TypeDecorator
from sqlalchemy.orm import relationship
from database import Base, SQLALCHEMY_DATABASE_URL

# SQLite doesn't support native JSON — use Text with serialization
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    class JSONType(TypeDecorator):
        impl = Text
        cache_ok = True
        def process_bind_param(self, value, dialect):
            return json.dumps(value) if value is not None else None
        def process_result_value(self, value, dialect):
            return json.loads(value) if value is not None else None
    JSON = JSONType


def generate_uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    specialty = Column(String(50))
    role = Column(String(30), default="medical_officer")
    phone = Column(String(30))
    institution = Column(String(200))
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    password_reset_token = Column(String(100))
    password_reset_expires = Column(DateTime)
    notification_preferences = Column(JSON, default=dict)
    fcm_token = Column(String(500))
    created_at = Column(DateTime, default=_now)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    age = Column(Integer)
    phone = Column(String(30))
    email = Column(String(120))
    address = Column(Text)
    medical_condition = Column(Text)
    notes = Column(Text)
    cancer_type = Column(String(100))
    cancer_stage = Column(String(30))
    diagnosis_date = Column(DateTime)
    # Demographics & background
    date_of_birth = Column(String(20))
    place_of_birth = Column(String(100))
    tribe_ethnicity = Column(String(100))
    marital_status = Column(String(20))
    occupation = Column(String(100))
    education_level = Column(String(50))
    religion = Column(String(50))
    nationality = Column(String(50), default="Tanzanian")
    next_of_kin_name = Column(String(100))
    next_of_kin_phone = Column(String(30))
    next_of_kin_relationship = Column(String(50))
    # Insurance & medical
    nhif_registered = Column(Boolean, default=False)
    nhif_number = Column(String(50))
    insurance_provider = Column(String(100))
    insurance_number = Column(String(50))
    blood_group = Column(String(10))
    allergies = Column(Text)
    chronic_conditions = Column(Text)
    current_medications = Column(Text)
    family_cancer_history = Column(Text)
    smoking_status = Column(String(30))
    alcohol_use = Column(String(30))
    height_cm = Column(Integer)
    weight_kg = Column(Float)
    # Patient journey
    journey_status = Column(String(30), default="arrival")
    created_at = Column(DateTime, default=_now)

    cases = relationship("Case", back_populates="patient", cascade="all, delete-orphan")
    referrals = relationship("Referral", back_populates="patient", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="patient", cascade="all, delete-orphan")
    pathology_reports = relationship("PathologyReport", back_populates="patient", cascade="all, delete-orphan")
    imaging_results = relationship("ImagingResult", back_populates="patient", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="patient", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="patient", cascade="all, delete-orphan")
    tumor_boards = relationship("TumorBoard", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("PatientDocument", back_populates="patient", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="patient", cascade="all, delete-orphan")
    workup = relationship("WorkupTracking", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    socioeconomic = relationship("SocioeconomicFactors", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("PatientPreference", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    tracking = relationship("PatientTracking", back_populates="patient", uselist=False, cascade="all, delete-orphan")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis = Column(Text)
    summary = Column(Text)
    recommendations = Column(Text)
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="cases")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    document_type = Column(String(50))
    file_path = Column(String(500), nullable=False)

    case = relationship("Case", back_populates="documents")
    embeddings = relationship("Embedding", back_populates="document", cascade="all, delete-orphan", uselist=False)


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, unique=True)

    document = relationship("Document", back_populates="embeddings")


# ─── Workbook-informed models ───────────────────────────────


class WorkupTracking(Base):
    __tablename__ = "workup_tracking"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True)
    imaging_complete = Column(Boolean, default=False)
    pathology_complete = Column(Boolean, default=False)
    lab_complete = Column(Boolean, default=False)
    consultation_complete = Column(Boolean, default=False)
    dental_assessment_complete = Column(Boolean, default=False)
    tb_ready = Column(Boolean, default=False)
    notes = Column(Text)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("Patient", back_populates="workup")


class SocioeconomicFactors(Base):
    __tablename__ = "socioeconomic_factors"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True)
    transportation = Column(String(50))
    housing = Column(String(50))
    financial_situation = Column(String(50))
    support_system = Column(String(50))
    insurance_status = Column(String(50))
    notes = Column(Text)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("Patient", back_populates="socioeconomic")


class PatientPreference(Base):
    __tablename__ = "patient_preferences"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True)
    travel_concern = Column(String(20))
    financial_concern = Column(String(20))
    risk_tolerance = Column(String(20))
    radiation_openness = Column(String(20))
    # A = Low Concern, B = Moderate Concern, C = High Concern
    category = Column(String(1))
    survey_completed = Column(Boolean, default=False)
    survey_method = Column(String(20))
    notes = Column(Text)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("Patient", back_populates="preferences")


class PatientTracking(Base):
    __tablename__ = "patient_tracking"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True)
    cancer_stage = Column(String(30))
    treatment_phase = Column(String(30))
    ecog_score = Column(Integer)
    oncologist = Column(String(100))
    care_team = Column(JSON, default=list)
    clinical_trials = Column(Text)
    notes = Column(Text)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("Patient", back_populates="tracking")


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String(100), nullable=False)
    doctor_phone = Column(String(30))
    specialty = Column(String(100))
    hospital = Column(String(200))
    status = Column(String(30), default="Pending")
    reason = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="referrals")


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    test_name = Column(String(200), nullable=False)
    test_value = Column(Text)
    reference_range = Column(String(100))
    status = Column(String(30), default="Pending")
    notes = Column(Text)
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="lab_results")


class PathologyReport(Base):
    __tablename__ = "pathology_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    specimen_type = Column(String(200))
    findings = Column(Text)
    diagnosis = Column(Text)
    pathologist = Column(String(100))
    status = Column(String(30), default="Pending")
    notes = Column(Text)
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="pathology_reports")


class ImagingResult(Base):
    __tablename__ = "imaging_results"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    study_type = Column(String(100))
    modality = Column(String(50))
    body_part = Column(String(100))
    findings = Column(Text)
    impression = Column(Text)
    radiologist = Column(String(100))
    status = Column(String(30), default="Pending")
    notes = Column(Text)
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="imaging_results")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    priority = Column(String(10), default="Medium")
    category = Column(String(100))
    recommendation_text = Column(Text)
    title = Column(String(200))
    description = Column(Text)
    status = Column(String(30), default="Active")
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="recommendations")


class TumorBoard(Base):
    __tablename__ = "tumor_boards"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    chairperson = Column(String(100))
    status = Column(String(30), default="scheduled")
    discussion = Column(Text)
    recommendations = Column(Text)
    outcome = Column(Text)
    follow_up_date = Column(DateTime)
    participants = Column(JSON, default=list)
    # Discussion checklist (from workbook p.10)
    checklist_patient_summary = Column(Boolean, default=False)
    checklist_diagnostic_review = Column(Boolean, default=False)
    checklist_treatment_considerations = Column(Boolean, default=False)
    checklist_recommendations = Column(Boolean, default=False)
    checklist_follow_up_plan = Column(Boolean, default=False)
    vote_result = Column(String(50))
    # Attendance & CME
    attendance = Column(JSON, default=list)
    cme_credits_awarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="tumor_boards")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    author_role = Column(String(50))
    rating = Column(Integer, default=3)
    comment = Column(Text)
    department = Column(String(100))
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="reviews")


class PatientDocument(Base):
    __tablename__ = "patient_documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    title = Column(String(255))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500))
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="documents")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    summary_text = Column(Text, nullable=False)
    method = Column(String(30))
    created_at = Column(DateTime, default=_now)

    patient = relationship("Patient", back_populates="summaries")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(120))
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=_now, index=True)
