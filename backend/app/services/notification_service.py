from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, *, recipient_id: str | None, message: str, link: str | None = None) -> None:
    """No-op when there's no concrete recipient (e.g. presenter not yet assigned) —
    a notification with nowhere to land is silently skipped rather than stored orphaned."""
    if not recipient_id:
        return
    db.add(Notification(recipient_id=recipient_id, message=message, link=link))
    db.commit()
