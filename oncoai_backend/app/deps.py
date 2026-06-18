"""
Shared FastAPI dependencies.

The most important one here is `get_db_audited`: it wraps get_db() and
sets the two Postgres session variables (app.current_user_id,
app.client_ip) that the log_audit() trigger in oncoai_schema.sql reads.
Use this dependency instead of the plain get_db() in any route that
writes to an audited table (patients, cases, diagnostic_workup,
recommendations) — otherwise audit rows will be written with no actor.
"""

import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import decode_access_token
from app.database import get_db
from app.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.get(User, uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: UserRole):
    """Dependency factory: require_roles(UserRole.coordinator, UserRole.administrator)"""

    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to perform this action.",
            )
        return current_user

    return _check


def get_db_audited(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Session:
    """
    Use in place of get_db() for any write to an audited table.
    Sets session-local Postgres variables consumed by log_audit().
    """
    client_ip = request.client.host if request.client else None
    db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(current_user.user_id)})
    if client_ip:
        db.execute(text("SET LOCAL app.client_ip = :ip"), {"ip": client_ip})
    return db
