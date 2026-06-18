import os
import re
import logging
from typing import List

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
USE_OPENAI = bool(OPENAI_API_KEY)


class AIAnalysisEngine:
    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return self._extract_pdf(file_path)
        elif ext == ".docx":
            return self._extract_docx(file_path)
        elif ext == ".txt":
            return self._extract_txt(file_path)
        else:
            return self._extract_txt(file_path)

    def _extract_pdf(self, path: str) -> str:
        try:
            from pypdf import PdfReader
            reader = PdfReader(path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            logger.warning(f"pypdf failed: {e}")
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(path)
                return "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception as e2:
                logger.error(f"PyPDF2 also failed: {e2}")
                return ""

    def _extract_docx(self, path: str) -> str:
        try:
            from docx import Document
            doc = Document(path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return ""

    def _extract_txt(self, path: str) -> str:
        try:
            with open(path, "r", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"TXT extraction failed: {e}")
            return ""

    def generate_summary(self, text: str) -> str:
        if USE_OPENAI:
            return self._openai_summary(text)
        return self._local_summary(text)

    def detect_missing_info(self, text: str) -> List[str]:
        if USE_OPENAI:
            return self._openai_missing_info(text)
        return self._local_missing_info(text)

    def generate_tumor_board_report(self, patient_info: dict, extracted_text: str, summary: str) -> str:
        if USE_OPENAI:
            return self._openai_tumor_board(patient_info, extracted_text, summary)
        return self._local_tumor_board(patient_info, extracted_text, summary)

    def _openai_summary(self, text: str) -> str:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an oncology AI assistant. Generate a concise clinical summary from the provided medical document. Include: patient demographics, diagnosis, key findings, current treatment."},
                {"role": "user", "content": f"Summarize this medical document:\n\n{text[:8000]}"},
            ],
            temperature=0.3,
        )
        return resp.choices[0].message.content or ""

    def _openai_missing_info(self, text: str) -> List[str]:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an oncology AI assistant. Identify missing clinical information that would be important for tumor board review. Return a comma-separated list."},
                {"role": "user", "content": f"Identify missing information in this document:\n\n{text[:8000]}"},
            ],
            temperature=0.3,
        )
        content = resp.choices[0].message.content or ""
        return [item.strip() for item in content.split(",") if item.strip()]

    def _openai_tumor_board(self, patient_info: dict, text: str, summary: str) -> str:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        prompt = (
            f"Generate a Tumor Board Report with these sections:\n"
            f"1. Patient Information\n"
            f"2. Clinical History\n"
            f"3. Findings\n"
            f"4. Assessment\n"
            f"5. Recommendations\n\n"
            f"Patient: {patient_info.get('name', 'Unknown')} ({patient_info.get('patient_code', 'N/A')})\n"
            f"Clinical Data:\n{text[:6000]}\n\n"
            f"Summary:\n{summary[:2000]}"
        )
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an oncology AI assistant that generates structured Tumor Board reports."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        return resp.choices[0].message.content or ""

    def _local_summary(self, text: str) -> str:
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        if not sentences:
            return "No content to summarize."
        key_sentences = [s for s in sentences if any(w in s.lower() for w in
                         ["diagnosis", "cancer", "tumor", "carcinoma", "stage", "grade", "treatment", "prognosis",
                          "biopsy", "pathology", "positive", "negative", "metastasis", "lymph node", "margins"])]
        if not key_sentences:
            key_sentences = sentences[:5]
        return " ".join(key_sentences[:5])

    def _local_missing_info(self, text: str) -> List[str]:
        text_lower = text.lower()
        checks = {
            "HPV status": ["hpv", "human papillomavirus"],
            "MRI report": ["mri", "magnetic resonance"],
            "Histology grade": ["grade", "histolog", "differentiation"],
            "Staging information": ["stage", "tnm", "staging"],
            "Surgical margins": ["margin", "resection"],
            "Lymph node status": ["lymph node", "nodal", "node status"],
            "Biopsy details": ["biopsy", "core needle", "fine needle"],
            "Molecular markers": ["molecular", "her2", "egfr", "braf", "kras"],
            "ECOG performance status": ["ecog", "performance status"],
            "Previous treatment history": ["prior treatment", "previous therapy", "history of treatment"],
            "Family history": ["family history", "familial", "genetic"],
            "Medication list": ["medication", "drug", "prescription"],
        }
        missing = []
        for label, keywords in checks.items():
            if not any(k in text_lower for k in keywords):
                missing.append(label)
        return missing

    def _local_tumor_board(self, patient_info: dict, text: str, summary: str) -> str:
        name = patient_info.get("name", "Unknown")
        code = patient_info.get("patient_code", "N/A")
        findings = self._local_summary(text)
        missing = self._local_missing_info(text)
        return (
            f"# TUMOR BOARD REPORT\n\n"
            f"## Patient Information\n"
            f"- **Name:** {name}\n"
            f"- **Patient Code:** {code}\n\n"
            f"## Clinical History\n"
            f"{summary[:500] if summary else 'No clinical history available.'}\n\n"
            f"## Findings\n"
            f"{findings}\n\n"
            f"## Assessment\n"
            f"Based on the available clinical data, the patient presents with findings consistent with the above diagnosis. "
            f"Further workup may be required.\n\n"
            f"## Recommendations\n"
            f"### Missing Information to Address:\n"
            + "\n".join(f"- {item}" for item in missing) +
            "\n\n### Suggested Next Steps:\n"
            f"- Complete the missing diagnostic workup\n"
            f"- Review case at next tumor board meeting\n"
            f"- Consider multidisciplinary consultation\n"
        )
