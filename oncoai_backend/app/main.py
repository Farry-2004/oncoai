from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, ai_gateway, auth, cases, integrations, meetings, patients

app = FastAPI(
    title="OncoAI — Tumor Board Coordination API",
    version="0.1.0",
    description=(
        "Core API for case intake, diagnostic workup tracking, tumor board "
        "scheduling, recommendations, and patient communication. Scoped to "
        "the workflows validated in the Muhimbili/ORCI prototyping workbook."
    ),
)

# Tighten this before production — currently permissive for local dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(cases.router)
app.include_router(meetings.router)
app.include_router(integrations.router)
app.include_router(ai_gateway.router)
app.include_router(admin.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
