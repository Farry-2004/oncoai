from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base, engine
from app.routers import (
    ai,
    analytics,
    audit,
    auth,
    dashboard,
    family_conferences,
    follow_ups,
    notifications,
    patient_records,
    patients,
    reports,
    search,
    tasks,
    tumor_board_decisions,
    tumor_boards,
    users,
    webhooks,
)

# Import models so they're registered on Base.metadata before create_all().
import app.models  # noqa: F401

app = FastAPI(
    title="ONCOAI API",
    description=(
        "ONCOAI clinical coordination API — demo backend. "
        "All patient data served by this API is synthetic demo data, not real "
        "clinical information."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(patients.router)
app.include_router(tumor_boards.router)
app.include_router(tumor_board_decisions.router)
app.include_router(audit.router)
app.include_router(patient_records.router)
app.include_router(follow_ups.router)
app.include_router(family_conferences.router)
app.include_router(ai.router)
app.include_router(tasks.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(webhooks.router)


@app.get("/")
def root() -> dict:
    return {"service": "oncoai-api", "status": "ok"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
