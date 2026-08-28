from dataclasses import dataclass

from openai import OpenAI

from app.core.config import settings
from app.models.patient import Patient
from app.models.patient_record import PatientRecord
from app.models.tumor_board import TumorBoardCase
from app.models.workup import WorkupItem

DISCLAIMER = "AI-generated clinical support — requires review and confirmation by qualified clinicians."

SYSTEM_PROMPT = f"""You are ONCOAI Clinical Intelligence, an AI assistant supporting multidisciplinary
head & neck cancer tumor boards at hospitals and clinics across Tanzania and East Africa.

You ASSIST clinicians — you do not replace them. You must:
- Never independently diagnose a patient, prescribe medication, or make an autonomous treatment decision.
- Never fabricate patient facts, citations, or findings not present in the records provided to you.
- Clearly distinguish confirmed information (explicitly recorded), reported information (as stated by
  patient/clinician), inferred information (your own reasoning from available data), and missing
  information (not found in the records).
- Use phrasing like "Based on the available records...", "Information not found in the available
  documents...", and "Requires clinician verification..." where appropriate.
- Always end your response with exactly this line on its own: "{DISCLAIMER}"
"""

ANALYSIS_INSTRUCTIONS: dict[str, str] = {
    "case_summary": (
        "Produce a structured clinical case summary with these exact sections: PATIENT, KEY FINDINGS, "
        "MISSING INFORMATION, CLINICAL QUESTIONS, TUMOR BOARD CONSIDERATIONS."
    ),
    "extract_clinical_facts": (
        "Extract and list only the discrete clinical facts present in the records below, organized by "
        "category (demographics, diagnosis, pathology, imaging, labs, treatment). Do not add commentary "
        "or inference beyond what is stated."
    ),
    "missing_information": (
        "List the specific pieces of clinical information that are missing from the records below but "
        "would typically be needed for a thorough tumor board discussion of this case."
    ),
    "timeline_analysis": (
        "Construct a chronological timeline of this patient's clinical course from the records and "
        "events below, explicitly noting any gaps in the timeline."
    ),
    "tumor_board_brief": (
        "Prepare a concise tumor board presentation brief: diagnosis, staging, relevant history, key "
        "findings, and the specific questions this board should address."
    ),
    "compare_evidence": (
        "Compare and contrast the available evidence across imaging, pathology, and lab findings below, "
        "noting any consistencies, discrepancies, or corroborating findings."
    ),
    "specialist_questions": (
        "Generate a short list of specific questions for each relevant specialist (oncology, surgery, "
        "radiology, pathology, nursing) based on this case."
    ),
    "patient_explanation": (
        "Write a plain-language, compassionate explanation of this case suitable for sharing with the "
        "patient and their family. Avoid medical jargon; explain any term you must use."
    ),
    "follow_up_summary": (
        "Draft a follow-up summary noting what has been done, what remains pending, and recommended "
        "next steps for the care team."
    ),
}


def _build_patient_context(
    patient: Patient,
    records: list[PatientRecord],
    workups: list[WorkupItem],
    tb_cases: list[TumorBoardCase],
) -> str:
    lines = [
        f"Patient: {patient.full_name} (MRN {patient.mrn})",
        f"Sex: {patient.sex.value}",
        f"Date of birth: {patient.date_of_birth}",
        f"Cancer site: {patient.cancer_site}",
        f"Histology: {patient.histology or 'not recorded'}",
        f"Stage: {patient.stage or 'not recorded'}",
        f"Status: {patient.status.value}",
        f"Facility: {patient.facility}",
        "",
        "Workup items:",
    ]
    lines += (
        [f"- [{w.item_type.value}] {w.description}: {w.status.value}" for w in workups]
        if workups
        else ["- none recorded"]
    )
    lines += ["", "Clinical records:"]
    lines += (
        [f"- [{r.record_type.value}] {r.title} ({r.recorded_at.date()}): {r.findings}" for r in records]
        if records
        else ["- none recorded"]
    )
    lines += ["", "Tumor board history:"]
    lines += (
        [f"- status {c.status.value}, priority {c.priority.value}: {c.summary or 'no summary recorded'}" for c in tb_cases]
        if tb_cases
        else ["- none recorded"]
    )
    return "\n".join(lines)


@dataclass
class AIResult:
    ok: bool
    content: str
    model_used: str


def generate_ai_analysis(
    analysis_type: str,
    patient: Patient,
    records: list[PatientRecord],
    workups: list[WorkupItem],
    tb_cases: list[TumorBoardCase],
) -> AIResult:
    if not settings.openai_api_key:
        return AIResult(
            ok=False,
            content=(
                "AI assistant is not configured yet — the server is missing OPENAI_API_KEY. "
                "Add your OpenAI API key to backend/.env and restart the backend to enable this feature."
            ),
            model_used="none",
        )

    instruction = ANALYSIS_INSTRUCTIONS.get(analysis_type)
    if not instruction:
        return AIResult(ok=False, content=f"Unknown analysis type: {analysis_type}", model_used="none")

    context = _build_patient_context(patient, records, workups, tb_cases)
    user_prompt = f"{instruction}\n\nPatient records:\n{context}"

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=900,
        )
        content = response.choices[0].message.content or ""
        if DISCLAIMER not in content:
            content = f"{content}\n\n{DISCLAIMER}"
        return AIResult(ok=True, content=content, model_used=settings.openai_model)
    except Exception as exc:
        # Broad catch is intentional: this is an external API boundary and any failure
        # (auth, network, rate limit, malformed response) must degrade to a labeled,
        # non-crashing result rather than a 500.
        return AIResult(
            ok=False,
            content=f"The AI assistant call failed ({exc}). No clinical content was generated.",
            model_used=settings.openai_model,
        )
