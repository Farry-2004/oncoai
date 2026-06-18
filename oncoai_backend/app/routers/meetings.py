import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db_audited, require_roles
from app.models import Case, CaseStatus, Meeting, MeetingCase, Recommendation, User, UserRole
from app.schemas import (
    MeetingAddCase, MeetingCreate, MeetingOut, RecommendationCreate, RecommendationOut
)

router = APIRouter(prefix="/meetings", tags=["tumor-board"])

CAN_SCHEDULE = (UserRole.coordinator,)
# Anyone who actually sits on the board can log the outcome of the discussion.
CAN_RECORD_RECOMMENDATION = (
    UserRole.coordinator, UserRole.oncologist, UserRole.surgeon,
    UserRole.radiologist, UserRole.pathologist,
)


@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_SCHEDULE)),
):
    meeting = Meeting(
        meeting_date=payload.meeting_date,
        meeting_time=payload.meeting_time,
        mode=payload.mode,
        coordinator_id=current_user.user_id,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: uuid.UUID, db: Session = Depends(get_db_audited)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/{meeting_id}/cases", status_code=status.HTTP_201_CREATED)
def add_case_to_agenda(
    meeting_id: uuid.UUID,
    payload: MeetingAddCase,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_SCHEDULE)),
):
    meeting = db.get(Meeting, meeting_id)
    case = db.get(Case, payload.case_id)
    if not meeting or not case:
        raise HTTPException(status_code=404, detail="Meeting or case not found")

    link = MeetingCase(
        meeting_id=meeting_id,
        case_id=payload.case_id,
        presentation_order=payload.presentation_order,
    )
    db.add(link)
    db.commit()
    return {"meeting_id": meeting_id, "case_id": payload.case_id, "added": True}


@router.post(
    "/{meeting_id}/cases/{case_id}/recommendation",
    response_model=RecommendationOut,
    status_code=status.HTTP_201_CREATED,
)
def record_recommendation(
    meeting_id: uuid.UUID,
    case_id: uuid.UUID,
    payload: RecommendationCreate,
    db: Session = Depends(get_db_audited),
    current_user: User = Depends(require_roles(*CAN_RECORD_RECOMMENDATION)),
):
    case = db.get(Case, case_id)
    meeting = db.get(Meeting, meeting_id)
    if not case or not meeting:
        raise HTTPException(status_code=404, detail="Meeting or case not found")

    rec = Recommendation(
        case_id=case_id,
        meeting_id=meeting_id,
        recommended_action=payload.recommended_action,
        vote_breakdown=payload.vote_breakdown,
        rationale=payload.rationale,
        decided_by=current_user.user_id,
    )
    db.add(rec)
    case.status = CaseStatus.presented  # at minimum, mark as presented
    db.commit()
    db.refresh(rec)

    # TODO: this is the natural call site for the Tumor Board Agent
    # (AI gateway) to draft structured minutes from this recommendation
    # plus the discussion checklist, for coordinator review before send.
    return rec
