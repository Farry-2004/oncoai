import os
import shutil
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, get_db, Base
from models import (
    User, Patient, Case, Document, Embedding,
    Referral, LabResult, PathologyReport, ImagingResult,
    Recommendation, TumorBoard, Review, PatientDocument, Summary,
    WorkupTracking, SocioeconomicFactors, PatientPreference, PatientTracking,
    AuditLog,
)
from auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    hash_password, verify_password, create_access_token,
    get_current_user, require_auth, SPECIALTIES,
)
from rbac import require_permission, SPECIALTY_TO_ROLE, get_user_role
from audit import log_action
from websocket_manager import manager as ws_manager
from schemas import (
    PatientCreate, PatientResponse,
    CaseResponse, CaseDetailResponse,
    DocumentResponse, UploadResponse,
    AnalysisResult, TumorBoardReport,
    ReferralCreate, ReferralResponse,
    LabResultCreate, LabResultResponse,
    PathologyCreate, PathologyResponse,
    ImagingCreate, ImagingResponse,
    RecommendationCreate, RecommendationResponse,
    TumorBoardCreate, TumorBoardUpdate, TumorBoardResponse,
    ReviewCreate, ReviewResponse,
    PatientDocumentResponse,
    SummaryResponse, SummarizeRequest,
    WorkupTrackingResponse, WorkupTrackingUpdate,
    SocioeconomicResponse, SocioeconomicUpdate,
    PreferenceResponse, PreferenceUpdate,
    TrackingResponse, TrackingUpdate,
)
from ai_engine import AIAnalysisEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OncoAI — Oncology Decision Support")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ai_engine = AIAnalysisEngine()

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def serve_frontend(request: Request):
    return FileResponse("static/landing.html")


@app.get("/app")
def serve_app(request: Request):
    return FileResponse("static/index.html")


@app.get("/login")
def serve_login():
    return FileResponse("static/login.html")


@app.get("/register")
def serve_register():
    return FileResponse("static/register.html")


@app.get("/static/sw.js")
def serve_sw():
    return FileResponse("static/sw.js", media_type="application/javascript",
                       headers={"Service-Worker-Allowed": "/"})


@app.get("/patient-portal")
def serve_patient_portal():
    return FileResponse("static/patient-portal.html")


@app.get("/.well-known/assetlinks.json")
def asset_links():
    return [{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "com.oncoai.app",
            "sha256_cert_fingerprints": []
        }
    }]


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "OncoAI"}


# ─── Auth Endpoints ─────────────────────────────────────────

@app.get("/api/auth/specialties")
def list_specialties():
    return SPECIALTIES


@app.post("/api/auth/register", response_model=TokenResponse)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")
    role = SPECIALTY_TO_ROLE.get(data.specialty, "medical_officer")
    user = User(
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        specialty=data.specialty,
        role=role,
        phone=data.phone,
        institution=data.institution,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, request, user, "REGISTER", "user", user.id)
    token = create_access_token({"sub": str(user.id), "role": role})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "specialty": user.specialty, "role": role},
    )


@app.post("/api/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account is disabled")
    role = get_user_role(user)
    log_action(db, request, user, "LOGIN", "user", user.id)
    token = create_access_token({"sub": str(user.id), "role": role})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "specialty": user.specialty, "role": role},
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user=Depends(require_auth)):
    return user


@app.get("/api/auth/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).filter(User.is_active == True).order_by(User.full_name).all()


# ─── Online TB Meeting Endpoints ────────────────────────────

@app.post("/api/tumor-boards/{tid}/join")
def join_meeting(tid: int, user=Depends(require_auth), db: Session = Depends(get_db)):
    tb = db.query(TumorBoard).filter(TumorBoard.id == tid).first()
    if not tb:
        raise HTTPException(404, "Meeting not found")
    participants = tb.participants or []
    already = any(p.get("user_id") == user.id for p in participants if isinstance(p, dict))
    if not already:
        participants.append({
            "user_id": user.id, "name": user.full_name,
            "specialty": user.specialty, "role": user.specialty,
            "phone": user.phone or "", "present": True,
            "joined_at": datetime.now(timezone.utc).isoformat(),
        })
        tb.participants = participants
        db.commit()
    return {"detail": "Joined", "participants": tb.participants}


@app.post("/api/tumor-boards/{tid}/vote")
def cast_vote(tid: int, data: dict, user=Depends(require_auth), db: Session = Depends(get_db)):
    tb = db.query(TumorBoard).filter(TumorBoard.id == tid).first()
    if not tb:
        raise HTTPException(404, "Meeting not found")
    attendance = tb.attendance or []
    attendance.append({
        "user_id": user.id, "name": user.full_name,
        "specialty": user.specialty, "vote": data.get("vote", ""),
        "comment": data.get("comment", ""),
        "voted_at": datetime.now(timezone.utc).isoformat(),
    })
    tb.attendance = attendance
    tb.vote_result = data.get("vote", tb.vote_result)
    db.commit()
    return {"detail": "Vote recorded", "attendance": tb.attendance}


@app.post("/api/tumor-boards/{tid}/checklist")
def update_checklist(tid: int, data: dict, db: Session = Depends(get_db)):
    tb = db.query(TumorBoard).filter(TumorBoard.id == tid).first()
    if not tb:
        raise HTTPException(404, "Meeting not found")
    for key in ["checklist_patient_summary", "checklist_diagnostic_review",
                "checklist_treatment_considerations", "checklist_recommendations", "checklist_follow_up_plan"]:
        if key in data:
            setattr(tb, key, data[key])
    db.commit()
    db.refresh(tb)
    return {"detail": "Checklist updated"}


def _get_patient(patient_id: int, db: Session) -> Patient:
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


def _get_case(case_id: int, db: Session) -> Case:
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    return c


def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


# ─── Patient CRUD ───────────────────────────────────────────

@app.post("/api/patients", response_model=PatientResponse, status_code=201)
def create_patient(data: PatientCreate, request: Request, db: Session = Depends(get_db), user=Depends(require_permission("patients", "write"))):
    d = data.model_dump(exclude_unset=True)
    if not d.get("patient_code"):
        count = db.query(Patient).count()
        d["patient_code"] = f"PAT-{count + 1:04d}"
    patient = Patient(**d)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    log_action(db, request, user, "CREATE", "patient", patient.id)
    return patient


@app.get("/api/patients", response_model=List[PatientResponse])
def list_patients(
    search: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Patient)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            Patient.name.ilike(pattern) |
            Patient.patient_code.ilike(pattern) |
            Patient.medical_condition.ilike(pattern)
        )
    return q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()


@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    return _get_patient(patient_id, db)


@app.put("/api/patients/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, data: PatientCreate, request: Request, db: Session = Depends(get_db), user=Depends(require_permission("patients", "write"))):
    patient = _get_patient(patient_id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    return patient


@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: int, request: Request, db: Session = Depends(get_db), user=Depends(require_permission("patients", "write"))):
    patient = _get_patient(patient_id, db)
    db.delete(patient)
    db.commit()
    return {"detail": "Patient deleted"}


# ─── Referrals ──────────────────────────────────────────────

@app.get("/api/referrals", response_model=List[ReferralResponse])
def list_all_referrals(db: Session = Depends(get_db)):
    return db.query(Referral).order_by(Referral.created_at.desc()).all()


@app.get("/api/patients/{pid}/referrals", response_model=List[ReferralResponse])
def list_referrals(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(Referral).filter(Referral.patient_id == pid).order_by(Referral.created_at.desc()).all()


@app.post("/api/patients/{pid}/referrals", response_model=ReferralResponse, status_code=201)
def create_referral(pid: int, data: ReferralCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    ref = Referral(patient_id=pid, **data.model_dump(exclude_unset=True))
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


@app.put("/api/referrals/{rid}", response_model=ReferralResponse)
def update_referral(rid: int, data: ReferralCreate, db: Session = Depends(get_db)):
    ref = db.query(Referral).filter(Referral.id == rid).first()
    if not ref:
        raise HTTPException(404, "Referral not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ref, k, v)
    db.commit()
    db.refresh(ref)
    return ref


@app.delete("/api/referrals/{rid}")
def delete_referral(rid: int, db: Session = Depends(get_db)):
    ref = db.query(Referral).filter(Referral.id == rid).first()
    if not ref:
        raise HTTPException(404, "Referral not found")
    db.delete(ref)
    db.commit()
    return {"detail": "Deleted"}


# ─── Lab Results ────────────────────────────────────────────

@app.get("/api/lab-results", response_model=List[LabResultResponse])
def list_all_lab(db: Session = Depends(get_db)):
    return db.query(LabResult).order_by(LabResult.created_at.desc()).all()


@app.get("/api/patients/{pid}/lab-results", response_model=List[LabResultResponse])
def list_lab(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(LabResult).filter(LabResult.patient_id == pid).order_by(LabResult.created_at.desc()).all()


@app.post("/api/patients/{pid}/lab-results", response_model=LabResultResponse, status_code=201)
def create_lab(pid: int, data: LabResultCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    obj = LabResult(patient_id=pid, **data.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/api/lab-results/{lid}", response_model=LabResultResponse)
def update_lab(lid: int, data: LabResultCreate, db: Session = Depends(get_db)):
    obj = db.query(LabResult).filter(LabResult.id == lid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/api/lab-results/{lid}")
def delete_lab(lid: int, db: Session = Depends(get_db)):
    obj = db.query(LabResult).filter(LabResult.id == lid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Deleted"}


# ─── Pathology Reports ──────────────────────────────────────

@app.get("/api/pathology-reports", response_model=List[PathologyResponse])
def list_all_pathology(db: Session = Depends(get_db)):
    return db.query(PathologyReport).order_by(PathologyReport.created_at.desc()).all()


@app.get("/api/patients/{pid}/pathology-reports", response_model=List[PathologyResponse])
def list_pathology(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(PathologyReport).filter(PathologyReport.patient_id == pid).order_by(PathologyReport.created_at.desc()).all()


@app.post("/api/patients/{pid}/pathology-reports", response_model=PathologyResponse, status_code=201)
def create_pathology(pid: int, data: PathologyCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    obj = PathologyReport(patient_id=pid, **data.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/api/pathology-reports/{oid}", response_model=PathologyResponse)
def update_pathology(oid: int, data: PathologyCreate, db: Session = Depends(get_db)):
    obj = db.query(PathologyReport).filter(PathologyReport.id == oid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/api/pathology-reports/{oid}")
def delete_pathology(oid: int, db: Session = Depends(get_db)):
    obj = db.query(PathologyReport).filter(PathologyReport.id == oid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Deleted"}


# ─── Imaging Results ────────────────────────────────────────

@app.get("/api/imaging-results", response_model=List[ImagingResponse])
def list_all_imaging(db: Session = Depends(get_db)):
    return db.query(ImagingResult).order_by(ImagingResult.created_at.desc()).all()


@app.get("/api/patients/{pid}/imaging-results", response_model=List[ImagingResponse])
def list_imaging(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(ImagingResult).filter(ImagingResult.patient_id == pid).order_by(ImagingResult.created_at.desc()).all()


@app.post("/api/patients/{pid}/imaging-results", response_model=ImagingResponse, status_code=201)
def create_imaging(pid: int, data: ImagingCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    obj = ImagingResult(patient_id=pid, **data.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/api/imaging-results/{oid}", response_model=ImagingResponse)
def update_imaging(oid: int, data: ImagingCreate, db: Session = Depends(get_db)):
    obj = db.query(ImagingResult).filter(ImagingResult.id == oid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/api/imaging-results/{oid}")
def delete_imaging(oid: int, db: Session = Depends(get_db)):
    obj = db.query(ImagingResult).filter(ImagingResult.id == oid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Deleted"}


# ─── Recommendations ────────────────────────────────────────

@app.get("/api/recommendations", response_model=List[RecommendationResponse])
def list_all_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()


@app.get("/api/patients/{pid}/recommendations", response_model=List[RecommendationResponse])
def list_recommendations(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(Recommendation).filter(Recommendation.patient_id == pid).order_by(Recommendation.created_at.desc()).all()


@app.post("/api/patients/{pid}/recommendations", response_model=RecommendationResponse, status_code=201)
def create_recommendation(pid: int, data: RecommendationCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    obj = Recommendation(patient_id=pid, **data.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/api/recommendations/{oid}", response_model=RecommendationResponse)
def update_recommendation(oid: int, data: RecommendationCreate, db: Session = Depends(get_db)):
    obj = db.query(Recommendation).filter(Recommendation.id == oid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/api/recommendations/{oid}")
def delete_recommendation(oid: int, db: Session = Depends(get_db)):
    obj = db.query(Recommendation).filter(Recommendation.id == oid).first()
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Deleted"}


# ─── Tumor Boards ───────────────────────────────────────────

@app.get("/api/tumor-boards", response_model=List[TumorBoardResponse])
def list_all_tumor_boards(
    status: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(TumorBoard)
    if status:
        q = q.filter(TumorBoard.status == status)
    return q.order_by(TumorBoard.scheduled_date.desc()).all()


@app.get("/api/patients/{pid}/tumor-boards", response_model=List[TumorBoardResponse])
def list_tumor_boards(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(TumorBoard).filter(TumorBoard.patient_id == pid).order_by(TumorBoard.scheduled_date.desc()).all()


@app.post("/api/patients/{pid}/tumor-boards", response_model=TumorBoardResponse, status_code=201)
def create_tumor_board(pid: int, data: TumorBoardCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    tb = TumorBoard(
        patient_id=pid,
        scheduled_date=_parse_dt(data.scheduled_date) or datetime.now(timezone.utc),
        chairperson=data.chairperson,
        participants=data.participants or [],
        discussion=data.discussion,
        recommendations=data.recommendations,
        outcome=data.outcome,
        follow_up_date=_parse_dt(data.follow_up_date),
    )
    db.add(tb)
    db.commit()
    db.refresh(tb)
    return tb


@app.put("/api/tumor-boards/{tid}", response_model=TumorBoardResponse)
def update_tumor_board(tid: int, data: TumorBoardUpdate, db: Session = Depends(get_db)):
    tb = db.query(TumorBoard).filter(TumorBoard.id == tid).first()
    if not tb:
        raise HTTPException(404, "Tumor board not found")
    updates = data.model_dump(exclude_unset=True)
    if "scheduled_date" in updates and updates["scheduled_date"]:
        updates["scheduled_date"] = _parse_dt(updates["scheduled_date"])
    if "follow_up_date" in updates and updates["follow_up_date"]:
        updates["follow_up_date"] = _parse_dt(updates["follow_up_date"])
    for k, v in updates.items():
        if v is not None:
            setattr(tb, k, v)
    db.commit()
    db.refresh(tb)
    return tb


@app.delete("/api/tumor-boards/{tid}")
def delete_tumor_board(tid: int, db: Session = Depends(get_db)):
    tb = db.query(TumorBoard).filter(TumorBoard.id == tid).first()
    if not tb:
        raise HTTPException(404, "Not found")
    db.delete(tb)
    db.commit()
    return {"detail": "Deleted"}


# ─── Reviews ────────────────────────────────────────────────

@app.get("/api/reviews", response_model=List[ReviewResponse])
def list_all_reviews(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).all()


@app.get("/api/patients/{pid}/reviews", response_model=List[ReviewResponse])
def list_reviews(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(Review).filter(Review.patient_id == pid).order_by(Review.created_at.desc()).all()


@app.post("/api/patients/{pid}/reviews", response_model=ReviewResponse, status_code=201)
def create_review(pid: int, data: ReviewCreate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    obj = Review(patient_id=pid, **data.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ─── Patient Documents ──────────────────────────────────────

@app.get("/api/patients/{pid}/documents", response_model=List[PatientDocumentResponse])
def list_patient_documents(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(PatientDocument).filter(PatientDocument.patient_id == pid).order_by(PatientDocument.created_at.desc()).all()


@app.post("/api/patients/{pid}/documents", status_code=201)
def upload_patient_document(
    pid: int,
    file: UploadFile = File(...),
    title: str = Form(""),
    db: Session = Depends(get_db),
):
    _get_patient(pid, db)
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_name = f"{pid}_{int(datetime.now(timezone.utc).timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    doc = PatientDocument(
        patient_id=pid,
        title=title or file.filename,
        filename=file.filename or safe_name,
        file_path=file_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "title": doc.title, "filename": doc.filename, "message": "Uploaded"}


@app.get("/api/documents/{did}/download")
def download_document(did: int, db: Session = Depends(get_db)):
    doc = db.query(PatientDocument).filter(PatientDocument.id == did).first()
    if not doc or not doc.file_path:
        raise HTTPException(404, "Not found")
    if not os.path.exists(doc.file_path):
        raise HTTPException(404, "File not found on disk")
    return FileResponse(doc.file_path, filename=doc.filename, media_type="application/octet-stream")


@app.delete("/api/documents/{did}")
def delete_document(did: int, db: Session = Depends(get_db)):
    doc = db.query(PatientDocument).filter(PatientDocument.id == did).first()
    if not doc:
        raise HTTPException(404, "Not found")
    db.delete(doc)
    db.commit()
    return {"detail": "Deleted"}


# ─── Summaries & AI ─────────────────────────────────────────

@app.get("/api/summary-method")
def get_summary_method():
    from ai_engine import USE_OPENAI
    return {"method": "openai-gpt4o" if USE_OPENAI else "extractive"}


@app.get("/api/patients/{pid}/summaries", response_model=List[SummaryResponse])
def list_summaries(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    return db.query(Summary).filter(Summary.patient_id == pid).order_by(Summary.created_at.desc()).all()


@app.post("/api/summarize", response_model=SummaryResponse)
def summarize(data: SummarizeRequest, db: Session = Depends(get_db)):
    patient = _get_patient(data.patient_id, db)
    texts = []
    for doc in db.query(PatientDocument).filter(PatientDocument.patient_id == data.patient_id).all():
        if doc.file_path:
            t = ai_engine.extract_text(doc.file_path)
            if t:
                texts.append(t)
    for case in patient.cases:
        for doc in case.documents:
            t = ai_engine.extract_text(doc.file_path)
            if t:
                texts.append(t)
    combined = "\n\n".join(texts) if texts else f"Patient: {patient.name}. Condition: {patient.medical_condition or 'N/A'}"
    summary_text = ai_engine.generate_summary(combined)
    from ai_engine import USE_OPENAI
    s = Summary(
        patient_id=data.patient_id,
        summary_text=summary_text,
        method="openai" if USE_OPENAI else "extractive",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@app.get("/api/patients/{pid}/board-summary")
def board_summary(pid: int, db: Session = Depends(get_db)):
    patient = _get_patient(pid, db)
    texts = []
    for doc in db.query(PatientDocument).filter(PatientDocument.patient_id == pid).all():
        if doc.file_path:
            t = ai_engine.extract_text(doc.file_path)
            if t:
                texts.append(t)
    combined = "\n".join(texts) if texts else f"Patient {patient.name}, condition: {patient.medical_condition or 'N/A'}"
    summary = ai_engine.generate_summary(combined)
    return {"summary": summary}


# ─── Workup Tracking ────────────────────────────────────────

@app.get("/api/patients/{pid}/workup", response_model=WorkupTrackingResponse)
def get_workup(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    w = db.query(WorkupTracking).filter(WorkupTracking.patient_id == pid).first()
    if not w:
        w = WorkupTracking(patient_id=pid)
        db.add(w)
        db.commit()
        db.refresh(w)
    return w


@app.post("/api/patients/{pid}/workup", response_model=WorkupTrackingResponse)
def update_workup(pid: int, data: WorkupTrackingUpdate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    w = db.query(WorkupTracking).filter(WorkupTracking.patient_id == pid).first()
    if not w:
        w = WorkupTracking(patient_id=pid)
        db.add(w)
        db.flush()
    for k, v in data.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(w, k, v)
    if w.imaging_complete and w.pathology_complete and w.lab_complete and w.consultation_complete:
        w.tb_ready = True
    db.commit()
    db.refresh(w)
    return w


# ─── Socioeconomic Factors ──────────────────────────────────

@app.get("/api/patients/{pid}/socioeconomic", response_model=SocioeconomicResponse)
def get_socioeconomic(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    s = db.query(SocioeconomicFactors).filter(SocioeconomicFactors.patient_id == pid).first()
    if not s:
        s = SocioeconomicFactors(patient_id=pid)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@app.post("/api/patients/{pid}/socioeconomic", response_model=SocioeconomicResponse)
def update_socioeconomic(pid: int, data: SocioeconomicUpdate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    s = db.query(SocioeconomicFactors).filter(SocioeconomicFactors.patient_id == pid).first()
    if not s:
        s = SocioeconomicFactors(patient_id=pid)
        db.add(s)
        db.flush()
    for k, v in data.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


# ─── Patient Preferences ────────────────────────────────────

@app.get("/api/patients/{pid}/preferences", response_model=PreferenceResponse)
def get_preferences(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    p = db.query(PatientPreference).filter(PatientPreference.patient_id == pid).first()
    if not p:
        p = PatientPreference(patient_id=pid)
        db.add(p)
        db.commit()
        db.refresh(p)
    return p


@app.post("/api/patients/{pid}/preferences", response_model=PreferenceResponse)
def update_preferences(pid: int, data: PreferenceUpdate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    p = db.query(PatientPreference).filter(PatientPreference.patient_id == pid).first()
    if not p:
        p = PatientPreference(patient_id=pid)
        db.add(p)
        db.flush()
    for k, v in data.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(p, k, v)
    concern_map = {"not_concerned": 0, "somewhat_concerned": 1, "very_concerned": 2}
    score = sum(concern_map.get(getattr(p, f, "") or "", 0) for f in ["travel_concern", "financial_concern", "risk_tolerance", "radiation_openness"])
    if score <= 2:
        p.category = "A"
    elif score <= 5:
        p.category = "B"
    else:
        p.category = "C"
    db.commit()
    db.refresh(p)
    return p


# ─── Patient Tracking ───────────────────────────────────────

@app.get("/api/patients/{pid}/tracking", response_model=TrackingResponse)
def get_tracking(pid: int, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    t = db.query(PatientTracking).filter(PatientTracking.patient_id == pid).first()
    if not t:
        raise HTTPException(404, "No tracking data")
    return t


@app.post("/api/patients/{pid}/tracking", response_model=TrackingResponse)
def upsert_tracking(pid: int, data: TrackingUpdate, db: Session = Depends(get_db)):
    _get_patient(pid, db)
    t = db.query(PatientTracking).filter(PatientTracking.patient_id == pid).first()
    if not t:
        t = PatientTracking(patient_id=pid)
        db.add(t)
        db.flush()
    for k, v in data.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


# ─── Orchestrator ───────────────────────────────────────────

@app.post("/api/orchestrate")
def orchestrate(data: dict, db: Session = Depends(get_db)):
    pid = data.get("patient_id")
    agents = data.get("agents", [])
    if not pid:
        raise HTTPException(400, "patient_id required")
    patient = _get_patient(int(pid), db)
    results = {}
    for agent_name in agents:
        try:
            from agents.orchestrator import run_agent
            result = run_agent(agent_name, patient, db)
            results[agent_name] = {"summary": result, "error": None}
        except Exception as e:
            results[agent_name] = {"summary": None, "error": str(e)}
    compiled = "\n\n".join(f"[{k}] {v.get('summary','Error')}" for k, v in results.items())
    return {"results": results, "compiled_report": compiled}


# ─── Legacy Upload/Analyze/Report ───────────────────────────

@app.post("/upload", response_model=UploadResponse, status_code=201)
def upload_document(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    document_type: str = Form("pathology"),
    db: Session = Depends(get_db),
):
    patient = _get_patient(patient_id, db)
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_name = f"{patient_id}_{int(datetime.now(timezone.utc).timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    case = Case(patient_id=patient_id)
    db.add(case)
    db.flush()
    doc = Document(case_id=case.id, filename=file.filename, document_type=document_type, file_path=file_path)
    db.add(doc)
    db.commit()
    db.refresh(case)
    return UploadResponse(case_id=case.id, filename=file.filename, document_type=document_type, message="Document uploaded successfully")


@app.post("/analyze", response_model=AnalysisResult)
def analyze_case(case_id: int = Form(...), db: Session = Depends(get_db)):
    case = _get_case(case_id, db)
    if not case.documents:
        raise HTTPException(400, "No documents found for this case")
    doc = case.documents[0]
    text = ai_engine.extract_text(doc.file_path)
    if not text:
        raise HTTPException(400, "Could not extract text from document")
    summary = ai_engine.generate_summary(text)
    missing_info = ai_engine.detect_missing_info(text)
    case.summary = summary
    case.diagnosis = _extract_diagnosis(summary) or case.diagnosis
    db.commit()
    db.refresh(case)
    return AnalysisResult(case_id=case.id, extracted_text=text[:2000], summary=summary, missing_info=missing_info, diagnosis=case.diagnosis, recommendations=case.recommendations)


def _extract_diagnosis(summary: str) -> Optional[str]:
    for line in summary.split("\n"):
        lower = line.lower()
        if "diagnosis" in lower or "cancer" in lower or "carcinoma" in lower:
            return line.strip()
    return None


@app.post("/generate-report", response_model=TumorBoardReport)
def generate_report(case_id: int = Form(...), db: Session = Depends(get_db)):
    case = _get_case(case_id, db)
    patient = case.patient
    text = ""
    for doc in case.documents:
        text += ai_engine.extract_text(doc.file_path) + "\n"
    summary = case.summary or "No summary available."
    patient_info = {"name": patient.name, "patient_code": patient.patient_code}
    report = ai_engine.generate_tumor_board_report(patient_info, text, summary)
    case.recommendations = report
    db.commit()
    return TumorBoardReport(case_id=case.id, patient_name=patient.name, patient_code=patient.patient_code, clinical_history=summary[:500] if summary else "", findings=text[:2000] if text else "", assessment="Based on available clinical data.", recommendations=report)


@app.get("/cases", response_model=List[CaseResponse])
def list_cases(search: str = Query(None), skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    q = db.query(Case).join(Patient)
    if search:
        pattern = f"%{search}%"
        q = q.filter(Patient.patient_code.ilike(pattern) | Patient.name.ilike(pattern) | Case.diagnosis.ilike(pattern))
    return q.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()


@app.get("/case/{case_id}", response_model=CaseDetailResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    return _get_case(case_id, db)


# ─── WebSocket Real-Time ───────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None), db: Session = Depends(get_db)):
    if not token:
        await websocket.close(code=4001)
        return
    from jose import jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return
    await ws_manager.connect(websocket, int(user_id))
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, int(user_id))


# ─── Analytics Endpoints ───────────────────────────────────

@app.get("/api/analytics/cancer-distribution")
def analytics_cancer_distribution(db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    results = db.query(Patient.cancer_type, func.count(Patient.id)).filter(
        Patient.cancer_type.isnot(None), Patient.cancer_type != ""
    ).group_by(Patient.cancer_type).all()
    return {"data": [{"type": r[0], "count": r[1]} for r in results]}


@app.get("/api/analytics/journey-progress")
def analytics_journey_progress(db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    results = db.query(Patient.journey_status, func.count(Patient.id)).group_by(Patient.journey_status).all()
    return {"data": [{"status": r[0] or "unknown", "count": r[1]} for r in results]}


@app.get("/api/analytics/stage-distribution")
def analytics_stage_distribution(db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    results = db.query(Patient.cancer_stage, func.count(Patient.id)).filter(
        Patient.cancer_stage.isnot(None), Patient.cancer_stage != ""
    ).group_by(Patient.cancer_stage).all()
    return {"data": [{"stage": r[0], "count": r[1]} for r in results]}


@app.get("/api/analytics/workup-completion")
def analytics_workup_completion(db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    total = db.query(WorkupTracking).count()
    complete = db.query(WorkupTracking).filter(WorkupTracking.tb_ready == True).count()
    return {"total": total, "complete": complete, "percentage": round((complete / total * 100) if total else 0, 1)}


@app.get("/api/analytics/tb-stats")
def analytics_tb_stats(db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    results = db.query(TumorBoard.status, func.count(TumorBoard.id)).group_by(TumorBoard.status).all()
    stats = {r[0]: r[1] for r in results}
    return {"scheduled": stats.get("scheduled", 0), "in_progress": stats.get("in_progress", 0), "completed": stats.get("completed", 0), "total": sum(stats.values())}


@app.get("/api/analytics/demographics")
def analytics_demographics(db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    gender_results = db.query(Patient.gender, func.count(Patient.id)).filter(
        Patient.gender.isnot(None)
    ).group_by(Patient.gender).all()
    age_ranges = [
        ("0-17", 0, 17), ("18-30", 18, 30), ("31-45", 31, 45),
        ("46-60", 46, 60), ("61-75", 61, 75), ("76+", 76, 200),
    ]
    age_data = []
    for label, low, high in age_ranges:
        count = db.query(Patient).filter(Patient.age >= low, Patient.age <= high).count()
        if count > 0:
            age_data.append({"range": label, "count": count})
    return {
        "gender": [{"gender": r[0], "count": r[1]} for r in gender_results],
        "age_groups": age_data,
    }


@app.get("/api/analytics/trends")
def analytics_trends(period: str = Query("monthly"), db: Session = Depends(get_db), user=Depends(require_permission("analytics", "read"))):
    patients = db.query(Patient).order_by(Patient.created_at).all()
    monthly = {}
    for p in patients:
        if p.created_at:
            key = p.created_at.strftime("%Y-%m")
            monthly[key] = monthly.get(key, 0) + 1
    return {"data": [{"month": k, "patients": v} for k, v in sorted(monthly.items())]}


# ─── Admin Endpoints ───────────────────────────────────────

@app.get("/api/admin/audit-logs")
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: str = Query(None),
    resource_type: str = Query(None),
    user_email: str = Query(None),
    db: Session = Depends(get_db),
    user=Depends(require_permission("admin", "read")),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if user_email:
        q = q.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "logs": [
            {
                "id": l.id, "user_email": l.user_email, "action": l.action,
                "resource_type": l.resource_type, "resource_id": l.resource_id,
                "details": l.details, "ip_address": l.ip_address,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
    }


@app.get("/api/admin/stats")
def admin_stats(db: Session = Depends(get_db), user=Depends(require_permission("admin", "read"))):
    return {
        "users": db.query(User).filter(User.is_active == True).count(),
        "patients": db.query(Patient).count(),
        "tumor_boards": db.query(TumorBoard).count(),
        "lab_results": db.query(LabResult).count(),
        "pathology_reports": db.query(PathologyReport).count(),
        "imaging_results": db.query(ImagingResult).count(),
        "referrals": db.query(Referral).count(),
        "documents": db.query(PatientDocument).count(),
        "audit_logs": db.query(AuditLog).count(),
        "ws_connections": ws_manager.connection_count,
    }


# ─── Email Notification Endpoints ──────────────────────────

@app.post("/api/auth/forgot-password")
def forgot_password(data: dict, db: Session = Depends(get_db)):
    import secrets
    email = data.get("email", "").lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"detail": "If the email exists, a reset link has been sent"}
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(timezone.utc) + __import__("datetime").timedelta(hours=1)
    db.commit()
    # TODO: Send email with reset link when SMTP is configured
    logger.info(f"Password reset token generated for {email}")
    return {"detail": "If the email exists, a reset link has been sent"}


@app.post("/api/auth/reset-password")
def reset_password(data: dict, db: Session = Depends(get_db)):
    token = data.get("token", "")
    new_password = data.get("password", "")
    if not token or not new_password:
        raise HTTPException(400, "Token and password required")
    user = db.query(User).filter(User.password_reset_token == token).first()
    if not user or not user.password_reset_expires or user.password_reset_expires < datetime.now(timezone.utc):
        raise HTTPException(400, "Invalid or expired reset token")
    user.password_hash = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"detail": "Password reset successful"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
