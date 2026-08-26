from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./oncoai.db"
    jwt_secret: str = "dev-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    # Required for the SMS concern survey (Patient Profile > Concerns > Send survey).
    # Without these set, the survey still runs but logs messages instead of sending
    # real texts — see app/services/sms_service.py.
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_number: str | None = None

    # Where uploaded imaging attachments are stored. On Railway this should
    # point at the persistent volume (e.g. /data/uploads) so files survive
    # redeploys, same as the SQLite database.
    uploads_dir: str = "uploads"
    max_upload_bytes: int = 8 * 1024 * 1024


settings = Settings()
