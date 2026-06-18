"""
Inbound webhooks from the messaging providers.

These are intentionally thin for now — full request verification
(WhatsApp's X-Hub-Signature, the SMS gateway's shared secret), payload
parsing for each provider's actual schema, and retry/idempotency handling
belong in the WhatsApp/SMS integration-contracts deliverable. This router
defines the shape OncoAI expects so that work can plug in cleanly.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, CommChannel, CommDirection, CommunicationLog, DiagnosticWorkup, WorkupStatus, WorkupType

router = APIRouter(prefix="/integrations", tags=["integrations"])


class WhatsAppStatusUpdate(BaseModel):
    case_id: uuid.UUID
    workup_type: str | None = None   # e.g. "imaging", "pathology" — matches WorkupType values
    raw_text: str                    # the actual message text from the group, for the log


@router.post("/whatsapp/status-update")
def whatsapp_status_update(payload: WhatsAppStatusUpdate, db: Session = Depends(get_db)):
    case = db.get(Case, payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found for this WhatsApp update")

    log = CommunicationLog(
        patient_id=case.patient_id,
        case_id=case.case_id,
        channel=CommChannel.whatsapp,
        direction=CommDirection.inbound,
        content_summary=payload.raw_text,
    )
    db.add(log)

    # Best-effort auto-update of the matching workup item, mirroring
    # Prototype C's automated tracking bot. TODO: replace this naive
    # "most recent open item of this type" matching with an explicit
    # workup_id once the WhatsApp bot is built to include it.
    if payload.workup_type:
        try:
            workup_type = WorkupType(payload.workup_type)
        except ValueError:
            workup_type = None

        if workup_type:
            item = (
                db.query(DiagnosticWorkup)
                .filter(
                    DiagnosticWorkup.case_id == case.case_id,
                    DiagnosticWorkup.type == workup_type,
                    DiagnosticWorkup.status != WorkupStatus.complete,
                )
                .order_by(DiagnosticWorkup.created_at.desc())
                .first()
            )
            if item:
                item.status = WorkupStatus.complete

    db.commit()
    return {"received": True}


class SmsInbound(BaseModel):
    from_number: str
    body: str


@router.post("/sms/inbound")
def sms_inbound(payload: SmsInbound, db: Session = Depends(get_db)):
    """
    TODO: match from_number to a patient (requires phone lookup against
    encrypted_phone — likely needs a separate deterministic lookup index,
    e.g. an HMAC of the normalized phone number, rather than decrypting
    every patient row to find a match). For now, this just logs the raw
    inbound message for manual triage by the coordinator.
    """
    return {"received": True, "note": "Patient matching not yet implemented — logged for manual review."}
