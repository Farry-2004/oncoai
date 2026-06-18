import logging
from agents.base import BaseAgent

logger = logging.getLogger(__name__)

MEDICATION_DATABASE = {
    "tb": {
        "treatments": ["Rifampin", "Isoniazid", "Pyrazinamide", "Ethambutol"],
        "monitoring": "Liver function tests monthly",
        "interactions": "Avoid alcohol; monitor for hepatitis",
    },
    "diabetes": {
        "treatments": ["Metformin", "Insulin", "SGLT2 inhibitors"],
        "monitoring": "HbA1c every 3 months, renal function annually",
        "interactions": "Metformin: caution with renal impairment",
    },
    "hypertension": {
        "treatments": ["ACE inhibitors", "ARBs", "Calcium channel blockers"],
        "monitoring": "Blood pressure weekly, renal panel annually",
        "interactions": "ACEi + ARB: risk of hyperkalemia",
    },
    "asthma": {
        "treatments": ["Albuterol (rescue)", "Inhaled corticosteroids", "Montelukast"],
        "monitoring": "Peak flow monitoring, spirometry annually",
        "interactions": "Beta-blockers may exacerbate asthma",
    },
    "migraine": {
        "treatments": ["Sumatriptan", "Rizatriptan", "Topiramate (preventive)"],
        "monitoring": "Headache diary, monthly follow-up",
        "interactions": "Triptans + SSRIs: serotonin syndrome risk",
    },
    "anxiety": {
        "treatments": ["SSRIs", "SNRIs", "Buspirone", "Cognitive behavioral therapy"],
        "monitoring": "PHQ-9/GAD-7 every visit",
        "interactions": "SSRI + MAOI: serotonin syndrome",
    },
}


class MedicationReviewAgent(BaseAgent):
    name = "medication_review"
    description = "Reviews patient conditions and suggests relevant medication guidelines"

    def should_run(self, patient, db) -> bool:
        return bool(patient.medical_history)

    def run(self, patient, db) -> dict:
        history_lower = (patient.medical_history or "").lower()
        matched = []

        for keyword, info in MEDICATION_DATABASE.items():
            if keyword in history_lower:
                matched.append({"condition": keyword.title(), **info})

        if not matched:
            return {
                "agent": self.name,
                "status": "success",
                "summary": "No specific medication guidelines available for current medical history.",
                "details": {"conditions_reviewed": 0, "guidelines": []},
            }

        lines = ["Medication Review & Guidelines:", ""]
        for m in matched:
            lines.append(f"  Condition: {m['condition']}")
            lines.append(f"  Common Treatments: {', '.join(m['treatments'])}")
            lines.append(f"  Monitoring: {m['monitoring']}")
            lines.append(f"  Key Interactions: {m['interactions']}")
            lines.append("")

        return {
            "agent": self.name,
            "status": "success",
            "summary": "\n".join(lines),
            "details": {
                "conditions_reviewed": len(matched),
                "guidelines": matched,
            },
        }
