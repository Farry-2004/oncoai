"""Idempotent synthetic demo-data seeder for ONCOAI.

Run with: uv run python -m app.seed.seed_data

All data created here is synthetic and clearly flagged `is_demo=True`.
Never use real patient information with this script.
"""

import random
from datetime import date, datetime, timedelta, timezone

from app.core.security import hash_password
from app.db.base import Base, SessionLocal, engine
from app.models.audit import AuditLog
from app.models.patient import Patient, PatientStatusEnum, SexEnum
from app.models.tumor_board import (
    CasePriorityEnum,
    CaseStatusEnum,
    SessionStatusEnum,
    TumorBoardCase,
    TumorBoardSession,
)
from app.models.user import RoleEnum, User
from app.models.workup import WorkupItem, WorkupItemTypeEnum, WorkupStatusEnum

DEMO_PASSWORD = "Demo1234!"
FACILITY_MNH = "Muhimbili National Hospital"
FACILITY_ORCI = "Ocean Road Cancer Institute"

DEMO_USERS = [
    dict(
        email="coordinator@oncoai.demo",
        full_name="Neema Mushi",
        role=RoleEnum.tumor_board_coordinator,
        title="Coordinator",
        department="Tumor Board Office",
    ),
    dict(
        email="oncologist@oncoai.demo",
        full_name="Dr. Baraka Mwakalinga",
        role=RoleEnum.oncologist,
        title="Dr.",
        department="Medical Oncology",
    ),
    dict(
        email="surgeon@oncoai.demo",
        full_name="Dr. Amina Rashidi",
        role=RoleEnum.surgeon,
        title="Dr.",
        department="Head & Neck Surgery",
    ),
    dict(
        email="radiologist@oncoai.demo",
        full_name="Dr. Frank Mkwawa",
        role=RoleEnum.radiologist,
        title="Dr.",
        department="Radiology",
    ),
    dict(
        email="pathologist@oncoai.demo",
        full_name="Dr. Grace Temba",
        role=RoleEnum.pathologist,
        title="Dr.",
        department="Pathology",
    ),
    dict(
        email="admin@oncoai.demo",
        full_name="Joseph Kileo",
        role=RoleEnum.administrator,
        title="Mr.",
        department="Hospital Administration",
    ),
]

CANCER_SITES = [
    "Oropharynx",
    "Larynx",
    "Oral Cavity",
    "Nasopharynx",
    "Hypopharynx",
    "Thyroid",
    "Salivary Gland",
]
STAGES = [
    "Stage I (T1N0M0)",
    "Stage II (T2N0M0)",
    "Stage III (T2N1M0)",
    "Stage IVA (T3N1M0)",
    "Stage IVA (T4aN2M0)",
    "Stage IVB (T4bN3M0)",
]
FIRST_NAMES = [
    "Asha", "Juma", "Fatuma", "Hassan", "Zainab", "Elias", "Rehema", "Salum",
    "Mariam", "Yusuf", "Neema", "Idrissa", "Halima", "Rashid", "Consolata",
    "Godfrey", "Winnie", "Peter", "Zawadi", "Emmanuel",
]
LAST_NAMES = [
    "Mrisho", "Kileo", "Mwakalinga", "Rashidi", "Mkwawa", "Temba", "Shirima",
    "Nyerere", "Kimaro", "Mbwana", "Chuma", "Lyimo", "Massawe", "Ngowi", "Kway",
]
PATIENT_STATUSES = [
    PatientStatusEnum.new,
    PatientStatusEnum.in_workup,
    PatientStatusEnum.in_workup,
    PatientStatusEnum.ready_for_board,
    PatientStatusEnum.under_treatment,
    PatientStatusEnum.follow_up,
]
PRIORITIES = ["low", "medium", "medium", "high", "critical"]

WORKUP_TEMPLATES = [
    (WorkupItemTypeEnum.imaging, "Contrast-enhanced CT Neck"),
    (WorkupItemTypeEnum.imaging, "MRI Skull Base"),
    (WorkupItemTypeEnum.imaging, "Chest X-ray"),
    (WorkupItemTypeEnum.pathology, "Core biopsy histopathology"),
    (WorkupItemTypeEnum.pathology, "HPV p16 IHC"),
    (WorkupItemTypeEnum.labs, "Full blood count"),
    (WorkupItemTypeEnum.labs, "Renal function panel"),
    (WorkupItemTypeEnum.genomics, "EGFR mutation panel"),
    (WorkupItemTypeEnum.other, "Dental clearance"),
    (WorkupItemTypeEnum.other, "Nutrition assessment"),
]

AI_SUMMARY_DEMO_TEXT = (
    "DEMO CONTENT — Based on the available records: locally advanced disease "
    "with imaging and pathology on file. Information not found in the "
    "available documents: nutritional status, prior treatment response. "
    "Requires clinician verification. "
    "AI-generated clinical support — requires review and confirmation by "
    "qualified clinicians."
)


def _rand_date_of_birth() -> date:
    age_years = random.randint(35, 78)
    return date.today() - timedelta(days=age_years * 365)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Patient).filter(Patient.is_demo.is_(True)).count() > 0:
            print("Demo data already present — skipping seed (idempotent).")
            return

        # --- Users ---
        users: list[User] = []
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                users.append(existing)
                continue
            user = User(hashed_password=hash_password(DEMO_PASSWORD), **u)
            db.add(user)
            users.append(user)
        db.commit()
        for u in users:
            db.refresh(u)

        coordinator, oncologist, surgeon, radiologist, pathologist, admin = users

        # --- Patients ---
        patients: list[Patient] = []
        used_names: set[str] = set()
        for i in range(1, 16):
            while True:
                name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
                if name not in used_names:
                    used_names.add(name)
                    break
            patient = Patient(
                mrn=f"MNH-2026-{i:05d}",
                full_name=name,
                date_of_birth=_rand_date_of_birth(),
                sex=random.choice([SexEnum.male, SexEnum.female]),
                phone=f"+2557{random.randint(10000000, 99999999)}",
                cancer_site=random.choice(CANCER_SITES),
                histology="Squamous cell carcinoma",
                stage=random.choice(STAGES),
                status=random.choice(PATIENT_STATUSES),
                priority=random.choice(PRIORITIES),
                primary_physician_id=random.choice([oncologist.id, surgeon.id]),
                facility=random.choice([FACILITY_MNH, FACILITY_ORCI]),
                is_demo=True,
            )
            db.add(patient)
            patients.append(patient)
        db.commit()
        for p in patients:
            db.refresh(p)

        # --- Workup items ---
        for patient in patients:
            n_items = random.randint(2, 4)
            for item_type, description in random.sample(WORKUP_TEMPLATES, n_items):
                wu_status = random.choice(
                    [WorkupStatusEnum.completed, WorkupStatusEnum.completed, WorkupStatusEnum.in_progress, WorkupStatusEnum.ordered]
                )
                db.add(
                    WorkupItem(
                        patient_id=patient.id,
                        item_type=item_type,
                        description=description,
                        status=wu_status,
                        ordered_by_id=random.choice([oncologist.id, radiologist.id, pathologist.id]),
                        due_date=date.today() + timedelta(days=random.randint(-5, 14)),
                        completed_at=datetime.now(timezone.utc) if wu_status == WorkupStatusEnum.completed else None,
                    )
                )
        db.commit()

        # --- Tumor board sessions ---
        now = datetime.now(timezone.utc)
        sessions_spec = [
            ("H&N Tumor Board — Past Session", now - timedelta(days=7), SessionStatusEnum.completed),
            ("H&N Tumor Board — Today", now.replace(hour=14, minute=0, second=0, microsecond=0), SessionStatusEnum.in_progress),
            ("H&N Tumor Board — Next Week", now + timedelta(days=7), SessionStatusEnum.scheduled),
        ]
        remaining_patients = list(patients)
        for title, scheduled_at, sess_status in sessions_spec:
            session = TumorBoardSession(
                title=title,
                scheduled_at=scheduled_at,
                location="MNH Conference Room B" if sess_status != SessionStatusEnum.scheduled else "Virtual — Zoom",
                status=sess_status,
                chair_id=oncologist.id,
                coordinator_id=coordinator.id,
                facility=FACILITY_MNH,
                is_demo=True,
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            n_cases = random.randint(4, 6)
            case_patients = random.sample(remaining_patients, min(n_cases, len(remaining_patients)))
            for position, patient in enumerate(case_patients):
                case_status = (
                    CaseStatusEnum.discussed
                    if sess_status == SessionStatusEnum.completed
                    else CaseStatusEnum.pending
                )
                db.add(
                    TumorBoardCase(
                        session_id=session.id,
                        patient_id=patient.id,
                        queue_position=position,
                        presenter_id=random.choice([oncologist.id, surgeon.id, radiologist.id]),
                        priority=CasePriorityEnum(patient.priority) if patient.priority in CasePriorityEnum._value2member_map_ else CasePriorityEnum.medium,
                        status=case_status,
                        summary=f"{patient.cancer_site} — {patient.stage}. Presenting for multidisciplinary review.",
                        ai_summary_demo=AI_SUMMARY_DEMO_TEXT,
                    )
                )
            db.commit()

        # --- Audit trail seed rows ---
        for user in users:
            db.add(
                AuditLog(
                    actor_id=user.id,
                    action="login",
                    entity_type="user",
                    entity_id=user.id,
                    event_metadata={"seed": True},
                )
            )
        db.commit()

        print("Seeded ONCOAI demo data:")
        print(f"  Users:    {len(users)}")
        print(f"  Patients: {len(patients)}")
        print(f"  Sessions: {len(sessions_spec)}")
        print()
        print("Demo login accounts (password for all: " + DEMO_PASSWORD + "):")
        for u in DEMO_USERS:
            print(f"  {u['email']:<28} {u['role'].value}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
