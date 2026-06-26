import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "OncoAI <noreply@oncoai.health>")
SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() == "true"

EMAIL_ENABLED = bool(SMTP_HOST and SMTP_USER)

template_dir = Path(__file__).parent / "templates" / "email"
jinja_env = Environment(loader=FileSystemLoader(str(template_dir))) if template_dir.exists() else None


def _send_email(to: str, subject: str, html_body: str):
    if not EMAIL_ENABLED:
        logger.info(f"Email not configured. Would send to {to}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_TLS:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


def _render_template(template_name: str, **kwargs) -> str:
    if jinja_env:
        try:
            tmpl = jinja_env.get_template(template_name)
            return tmpl.render(**kwargs)
        except Exception:
            pass
    return kwargs.get("fallback_text", "")


def send_welcome_email(user_email: str, user_name: str):
    html = _render_template("welcome.html", name=user_name, email=user_email,
                            fallback_text=f"<h2>Welcome to OncoAI, {user_name}!</h2><p>Your account has been created.</p>")
    if not html:
        html = f"<h2>Welcome to OncoAI, {user_name}!</h2><p>Your account has been created successfully.</p>"
    _send_email(user_email, "Welcome to OncoAI", html)


def send_tb_invite(recipient_emails: list, meeting_date: str, chairperson: str, patient_name: str):
    html = _render_template("tb_invite.html", meeting_date=meeting_date, chairperson=chairperson, patient_name=patient_name,
                            fallback_text=f"<h2>Tumor Board Meeting</h2><p>You are invited to a TB meeting for {patient_name} on {meeting_date}.</p>")
    if not html:
        html = f"<h2>Tumor Board Meeting</h2><p>Meeting for {patient_name} on {meeting_date}. Chair: {chairperson}</p>"
    for email in recipient_emails:
        _send_email(email, f"TB Meeting Invitation: {patient_name}", html)


def send_lab_alert(user_email: str, patient_name: str, test_name: str, test_value: str, status: str):
    severity = "CRITICAL" if status == "Critical" else "Alert"
    html = _render_template("lab_alert.html", patient_name=patient_name, test_name=test_name,
                            test_value=test_value, status=status,
                            fallback_text=f"<h2>{severity}: Lab Result</h2><p>{test_name}: {test_value} ({status}) for {patient_name}</p>")
    if not html:
        html = f"<h2>{severity}: Lab Result</h2><p>{test_name}: {test_value} ({status}) for patient {patient_name}</p>"
    _send_email(user_email, f"{severity}: {test_name} result for {patient_name}", html)


def send_password_reset(user_email: str, reset_token: str, base_url: str = ""):
    reset_url = f"{base_url}/login?reset_token={reset_token}" if base_url else f"Reset token: {reset_token}"
    html = _render_template("password_reset.html", reset_url=reset_url,
                            fallback_text=f"<h2>Password Reset</h2><p>Click here to reset: {reset_url}</p>")
    if not html:
        html = f"<h2>Password Reset</h2><p>Use this link to reset your password: {reset_url}</p><p>This link expires in 1 hour.</p>"
    _send_email(user_email, "OncoAI Password Reset", html)


def send_workup_reminder(user_email: str, patient_name: str, missing_items: list):
    items_html = "".join(f"<li>{item}</li>" for item in missing_items)
    html = f"<h2>Workup Reminder</h2><p>Patient <strong>{patient_name}</strong> has incomplete workup items:</p><ul>{items_html}</ul>"
    _send_email(user_email, f"Workup Reminder: {patient_name}", html)
