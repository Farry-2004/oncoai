from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.patient import Patient
from app.models.report import Report
from app.models.tumor_board import TumorBoardSession
from app.models.user import User
from app.schemas.search import SearchResultItem, SearchResults

router = APIRouter(prefix="/search", tags=["search"])

LIMIT = 6


@router.get("", response_model=SearchResults)
def search(
    q: str = "",
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> SearchResults:
    q = q.strip()
    if len(q) < 2:
        return SearchResults(patients=[], tumor_boards=[], specialists=[], reports=[])

    like = f"%{q}%"

    patients = (
        db.query(Patient)
        .filter(
            or_(
                Patient.full_name.ilike(like),
                Patient.mrn.ilike(like),
                Patient.cancer_site.ilike(like),
                Patient.stage.ilike(like),
            )
        )
        .limit(LIMIT)
        .all()
    )
    patient_items = [
        SearchResultItem(
            id=p.id,
            label=p.full_name,
            sublabel=f"{p.mrn} · {p.cancer_site}",
            link=f"/patients/{p.id}",
        )
        for p in patients
    ]

    sessions = db.query(TumorBoardSession).filter(TumorBoardSession.title.ilike(like)).limit(LIMIT).all()
    session_items = [
        SearchResultItem(
            id=s.id,
            label=s.title,
            sublabel=s.scheduled_at.strftime("%Y-%m-%d %H:%M"),
            link=f"/tumor-board/{s.id}",
        )
        for s in sessions
    ]

    specialists = (
        db.query(User)
        .filter(or_(User.full_name.ilike(like), User.role.ilike(like), User.department.ilike(like)))
        .limit(LIMIT)
        .all()
    )
    specialist_items = [
        SearchResultItem(
            id=u.id,
            label=u.full_name,
            sublabel=u.role.value.replace("_", " ").title(),
            link="/tasks",
        )
        for u in specialists
    ]

    reports = db.query(Report).filter(Report.title.ilike(like)).limit(LIMIT).all()
    report_items = [
        SearchResultItem(id=r.id, label=r.title, sublabel=r.status.value, link=f"/reports/{r.id}")
        for r in reports
    ]

    return SearchResults(
        patients=patient_items,
        tumor_boards=session_items,
        specialists=specialist_items,
        reports=report_items,
    )
