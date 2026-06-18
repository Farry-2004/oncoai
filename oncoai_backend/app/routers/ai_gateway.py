"""
AI Gateway — routes to the Patient Summary Agent, Tumor Board Agent, and
Medical Knowledge Agent described in the system design doc.

These are stubbed pending model/provider selection. The shape is real:
when an LLM call is wired in, it slots into the marked TODOs without
changing the route contracts that the rest of the app depends on.

Hard rule baked into guideline_query: only de-identified text may be
sent to an external API. Case/TB-minutes summarization, which does
touch PHI, should call a locally-hosted model — never an external API —
until that's explicitly re-evaluated.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import require_roles
from app.models import Case, Meeting, Recommendation, UserRole

router = APIRouter(prefix="/ai", tags=["ai"])

CAN_USE_AI_TOOLS = (
    UserRole.coordinator, UserRole.oncologist, UserRole.surgeon,
    UserRole.radiologist, UserRole.pathologist,
)


class CaseSummaryResponse(BaseModel):
    case_id: uuid.UUID
    draft_summary: str


@router.post("/case-summary/{case_id}", response_model=CaseSummaryResponse)
def generate_case_summary(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*CAN_USE_AI_TOOLS)),
):
    case = (
        db.query(Case)
        .options(joinedload(Case.workup_items))
        .filter(Case.case_id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # TODO: replace with a call to a locally-hosted model (PHI involved).
    # Prompt should assemble: demographics, suspected_diagnosis, each
    # workup_item's result_summary, socioeconomic_factors, and
    # patient_preferences.category — i.e. exactly the fields a coordinator
    # currently compiles by hand for the TB packet.
    draft = (
        f"[DRAFT — coordinator must review before TB presentation]\n"
        f"Suspected diagnosis: {case.suspected_diagnosis}\n"
        f"Workup items: {len(case.workup_items)} "
        f"({sum(1 for w in case.workup_items if w.status.value == 'complete')} complete)\n"
        f"(Full narrative summary pending AI model integration.)"
    )
    return CaseSummaryResponse(case_id=case_id, draft_summary=draft)


class TbMinutesResponse(BaseModel):
    meeting_id: uuid.UUID
    draft_minutes: str


@router.post("/tb-minutes/{meeting_id}", response_model=TbMinutesResponse)
def generate_tb_minutes(
    meeting_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*CAN_USE_AI_TOOLS)),
):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    recs = db.query(Recommendation).filter(Recommendation.meeting_id == meeting_id).all()

    # TODO: replace with a locally-hosted model call. Prompt should turn
    # each Recommendation (recommended_action, vote_breakdown, rationale)
    # into the structured minutes format from Prototype A's discussion
    # checklist (patient summary / diagnostic review / treatment
    # considerations / recommendation / follow-up plan).
    lines = [f"Draft minutes for meeting {meeting_id} — coordinator must review."]
    for rec in recs:
        lines.append(f"- Case {rec.case_id}: {rec.recommended_action}")
    return TbMinutesResponse(meeting_id=meeting_id, draft_minutes="\n".join(lines))


class GuidelineQuery(BaseModel):
    question: str   # must be a de-identified clinical question only


class GuidelineResponse(BaseModel):
    answer: str
    sources: list[str] = []


@router.post("/guideline-query", response_model=GuidelineResponse)
def query_guidelines(
    payload: GuidelineQuery,
    current_user=Depends(require_roles(*CAN_USE_AI_TOOLS)),
):
    # TODO: RAG over WHO/NCCN guidelines + Muhimbili/ORCI local protocols.
    # This is the one AI endpoint allowed to call an external API, and
    # only because the contract here is "no patient identifiers in the
    # question" — enforce that with a PHI-screening step before any
    # external call is added, not just this docstring.
    return GuidelineResponse(
        answer="(Guideline RAG not yet wired up.) Echoing query for now: " + payload.question,
        sources=[],
    )
