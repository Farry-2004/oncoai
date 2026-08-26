import base64
import hashlib
import hmac
import logging
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


class SmsProvider(Protocol):
    def send(self, to: str, body: str) -> None: ...


class NoOpSmsProvider:
    """Active whenever Twilio credentials aren't configured. Logs the
    message instead of sending it, so the survey flow is fully testable
    without a real SMS account — mirrors how AI endpoints behave without
    an OPENAI_API_KEY."""

    def send(self, to: str, body: str) -> None:
        logger.info("SMS not configured — would send to %s: %s", to, body)


class TwilioSmsProvider:
    def __init__(self, account_sid: str, auth_token: str, from_number: str) -> None:
        from twilio.rest import Client  # local import: twilio isn't a declared dependency yet

        self._client = Client(account_sid, auth_token)
        self._from_number = from_number

    def send(self, to: str, body: str) -> None:
        self._client.messages.create(to=to, from_=self._from_number, body=body)


def is_sms_configured() -> bool:
    return bool(
        settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number
    )


def get_sms_provider() -> SmsProvider:
    if is_sms_configured():
        return TwilioSmsProvider(
            settings.twilio_account_sid,  # type: ignore[arg-type]
            settings.twilio_auth_token,  # type: ignore[arg-type]
            settings.twilio_from_number,  # type: ignore[arg-type]
        )
    return NoOpSmsProvider()


def verify_twilio_signature(
    url: str, params: list[tuple[str, str]], signature: str, auth_token: str
) -> bool:
    """Twilio's request-validation algorithm: sort POST params by key, append
    each key+value (no delimiter) to the exact webhook URL Twilio invoked,
    HMAC-SHA1 that with the auth token, base64-encode, and compare to the
    X-Twilio-Signature header. See https://www.twilio.com/docs/usage/security
    Implemented by hand (rather than the `twilio` SDK) so verification has
    no dependency footprint until Twilio is actually configured.
    """
    data = url + "".join(f"{k}{v}" for k, v in sorted(params, key=lambda kv: kv[0]))
    expected = base64.b64encode(
        hmac.new(auth_token.encode("utf-8"), data.encode("utf-8"), hashlib.sha1).digest()
    ).decode("utf-8")
    return hmac.compare_digest(expected, signature)
