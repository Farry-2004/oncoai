import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt as _bcrypt
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "oncoai-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

SPECIALTIES = [
    "Oncologist",
    "Surgeon",
    "Radiologist",
    "Pathologist",
    "Nurse",
    "TB Coordinator",
    "Nutritionist",
    "Social Worker",
    "Dentist",
    "Medical Officer",
    "Pharmacist",
    "Admin",
    "Other",
]


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    specialty: str
    phone: Optional[str] = None
    institution: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    specialty: str
    role: Optional[str] = "medical_officer"
    phone: Optional[str] = None
    institution: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    from models import User
    user = db.query(User).filter(User.id == user_id).first()
    return user


def require_auth(request: Request, token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_current_user(request, token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
