import os
import re
import logging

from agents.base import BaseAgent

logger = logging.getLogger(__name__)


class DocumentAnalysisAgent(BaseAgent):
    name = "document_analysis"
    description = "Reads and extracts key information from uploaded medical documents"

    def should_run(self, patient, db) -> bool:
        return len(patient.documents) > 0

    def run(self, patient, db) -> dict:
        findings = []
        for doc in patient.documents:
            info = self._analyze_document(doc)
            findings.append(info)

        summary_lines = ["Document Analysis Results:", ""]
        for f in findings:
            summary_lines.append(f"  [{f['filename']}]")
            summary_lines.append(f"    Type: {f['file_type']}")
            summary_lines.append(f"    Size: {f['file_size']}")
            if f.get("preview"):
                summary_lines.append(f"    Preview: {f['preview']}")
            summary_lines.append("")

        return {
            "agent": self.name,
            "status": "success",
            "summary": "\n".join(summary_lines),
            "details": {"documents": findings},
        }

    def _analyze_document(self, doc):
        result = {
            "filename": doc.filename,
            "file_type": doc.file_type or "unknown",
            "file_size": self._format_size(doc.file_size),
            "description": doc.description or "",
            "preview": None,
        }

        if doc.filepath and os.path.exists(doc.filepath):
            try:
                if doc.file_type and "text" in doc.file_type:
                    with open(doc.filepath, "r", errors="ignore") as f:
                        content = f.read(500)
                    result["preview"] = content[:300]
                elif doc.filepath.endswith(".txt"):
                    with open(doc.filepath, "r", errors="ignore") as f:
                        content = f.read(500)
                    result["preview"] = content[:300]
            except Exception as e:
                logger.warning(f"Could not read {doc.filepath}: {e}")

        return result

    def _format_size(self, bytes_val):
        if not bytes_val:
            return "unknown"
        for unit in ("B", "KB", "MB", "GB"):
            if bytes_val < 1024:
                return f"{bytes_val:.1f} {unit}"
            bytes_val /= 1024
        return f"{bytes_val:.1f} TB"
