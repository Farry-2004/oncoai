"""
Thin wrapper around pgcrypto's pgp_sym_encrypt/pgp_sym_decrypt.

The encryption key is read from settings (sourced from a secrets manager
in real deployments) and passed as a bound parameter — it is never
interpolated into SQL text and never stored in the database.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings


def encrypt_field(db: Session, plaintext: str | None) -> bytes | None:
    if plaintext is None:
        return None
    result = db.execute(
        text("SELECT pgp_sym_encrypt(:val, :key)"),
        {"val": plaintext, "key": settings.FIELD_ENCRYPTION_KEY},
    ).scalar()
    return result


def decrypt_field(db: Session, ciphertext: bytes | None) -> str | None:
    if ciphertext is None:
        return None
    result = db.execute(
        text("SELECT pgp_sym_decrypt(:val, :key)"),
        {"val": ciphertext, "key": settings.FIELD_ENCRYPTION_KEY},
    ).scalar()
    return result
