import logging
from datetime import datetime, timezone
from fastapi import Request
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    request: Request,
    user,
    action: str,
    resource_type: str,
    resource_id: int = None,
    details: dict = None,
):
    from models import AuditLog
    try:
        entry = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "anonymous",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=request.client.host if request.client else None,
            user_agent=(request.headers.get("user-agent") or "")[:500],
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        logger.warning(f"Audit log failed: {e}")
        db.rollback()
