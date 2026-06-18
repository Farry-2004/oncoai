from agents.base import BaseAgent


class PatientProfileAgent(BaseAgent):
    name = "patient_profile"
    description = "Summarizes patient demographics, medical history, and key clinical data"

    def should_run(self, patient, db) -> bool:
        return True

    def run(self, patient, db) -> dict:
        history = patient.medical_history or "No recorded medical history"
        lines = [
            f"Patient: {patient.name}",
            f"Age: {patient.age}  |  Gender: {patient.gender}",
            f"Contact: {patient.contact}",
            f"Email: {patient.email or 'N/A'}",
            f"Address: {patient.address or 'N/A'}",
            f"",
            f"Medical History:",
            f"  {history}",
        ]
        if len(patient.documents) > 0:
            lines.append(f"")
            lines.append(f"Documents on file: {len(patient.documents)}")
            for d in patient.documents:
                lines.append(f"  - {d.filename} ({d.file_type or 'unknown type'})")

        return {
            "agent": self.name,
            "status": "success",
            "summary": "\n".join(lines),
            "details": {
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender,
                "contact": patient.contact,
                "email": patient.email,
                "address": patient.address,
                "medical_history": patient.medical_history,
                "document_count": len(patient.documents),
            },
        }
