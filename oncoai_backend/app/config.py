"""
Application configuration.

All values are read from environment variables so secrets never live in
source control. In production, point DATABASE_URL at the same database
provisioned by oncoai_schema.sql, and source JWT_SECRET / FIELD_ENCRYPTION_KEY
from a secrets manager (not a .env file checked into git).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://oncoai_app:changeme@localhost:5432/oncoai"

    JWT_SECRET: str = "changeme-dev-only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Used by the app layer to encrypt/decrypt patients.encrypted_* columns
    # via pgcrypto. Never hardcode a real value here — inject via env/KMS.
    FIELD_ENCRYPTION_KEY: str = "changeme-dev-only"

    # Populated once the WhatsApp/SMS integration layer is built out.
    WHATSAPP_API_BASE_URL: str | None = None
    WHATSAPP_API_TOKEN: str | None = None
    SMS_GATEWAY_BASE_URL: str | None = None
    SMS_GATEWAY_API_KEY: str | None = None


settings = Settings()
