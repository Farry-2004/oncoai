from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/audit-log", tags=["audit"])


@router.get("", response_model=list[AuditLogRead])
def list_audit_log(
    limit: int = 50,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[AuditLogRead]:
    entries = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    reads = []
    for entry in entries:
        read = AuditLogRead.model_validate(entry)
        if entry.actor_id:
            actor = db.get(User, entry.actor_id)
            if actor:
                read.actor_name = actor.full_name
        reads.append(read)
    return reads
