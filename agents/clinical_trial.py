import logging
from agents.base import BaseAgent

logger = logging.getLogger(__name__)

CLINICAL_TRIALS = [
    {
        "id": "NCT001",
        "title": "Evaluating AI-Assisted Diagnosis in Primary Care",
        "phase": "Phase III",
        "condition": "General Diagnostics",
        "eligibility": "Patients aged 18-75 with any chronic condition",
        "location": "Stanford Medicine",
    },
    {
        "id": "NCT002",
        "title": "Remote Monitoring for Hypertension Management",
        "phase": "Phase II",
        "condition": "Hypertension",
        "eligibility": "Adults 18+ with diagnosed hypertension",
        "location": "Multi-center",
    },
    {
        "id": "NCT003",
        "title": "Digital Health Interventions for Diabetes Control",
        "phase": "Phase III",
        "condition": "Type 2 Diabetes",
        "eligibility": "Adults 18-80 with HbA1c > 7.0",
        "location": "Stanford Health Care",
    },
    {
        "id": "NCT004",
        "title": "AI-Driven Asthma Management Platform",
        "phase": "Phase II",
        "condition": "Asthma",
        "eligibility": "Patients 12+ with persistent asthma",
        "location": "Multi-center",
    },
    {
        "id": "NCT005",
        "title": "Personalized Medicine for Migraine Prevention",
        "phase": "Phase IV",
        "condition": "Chronic Migraine",
        "eligibility": "Adults 18-65 with 8+ migraine days/month",
        "location": "Stanford Medicine",
    },
    {
        "id": "NCT006",
        "title": "Wearable ECG Monitoring for Cardiac Patients",
        "phase": "Phase III",
        "condition": "Cardiac Arrhythmia",
        "eligibility": "Adults 18+ with history of arrhythmia",
        "location": "Multi-center",
    },
    {
        "id": "NCT007",
        "title": "Telehealth Cognitive Behavioral Therapy for Anxiety",
        "phase": "Phase II",
        "condition": "Anxiety Disorders",
        "eligibility": "Adults 18-70 with GAD-7 score > 10",
        "location": "Stanford Medicine",
    },
    {
        "id": "NCT008",
        "title": "Machine Learning for TB Treatment Optimization",
        "phase": "Phase III",
        "condition": "Tuberculosis",
        "eligibility": "Patients 18+ with confirmed pulmonary TB",
        "location": "Global Health Initiative",
    },
]


class ClinicalTrialAgent(BaseAgent):
    name = "clinical_trial_matcher"
    description = "Matches patient profile against active clinical trials"

    def should_run(self, patient, db) -> bool:
        return bool(patient.medical_history)

    def run(self, patient, db) -> dict:
        history_lower = (patient.medical_history or "").lower()
        matches = []

        for trial in CLINICAL_TRIALS:
            condition_lower = trial["condition"].lower()
            score = self._match_score(history_lower, condition_lower)
            if score > 0:
                matches.append({**trial, "match_score": score})

        matches.sort(key=lambda x: x["match_score"], reverse=True)
        top_matches = matches[:3]

        if not top_matches:
            return {
                "agent": self.name,
                "status": "success",
                "summary": "No matching clinical trials found based on current medical history.",
                "details": {"trials_matched": 0, "trials": []},
            }

        lines = [
            f"Clinical Trials Matching {patient.name}:",
            "",
        ]
        for t in top_matches:
            bar = "█" * t["match_score"] + "░" * (10 - t["match_score"])
            lines.append(f"  {t['id']} | {t['title']}")
            lines.append(f"        Phase: {t['phase']}  |  Match: {bar} {t['match_score']}/10")
            lines.append(f"        Location: {t['location']}")
            lines.append(f"        Eligibility: {t['eligibility']}")
            lines.append("")

        return {
            "agent": self.name,
            "status": "success",
            "summary": "\n".join(lines),
            "details": {"trials_matched": len(top_matches), "trials": top_matches},
        }

    def _match_score(self, history: str, condition: str) -> int:
        words = set(condition.split())
        history_words = set(history.split())
        common = words & history_words
        if not common:
            return 0
        base = min(len(common) * 3, 8)

        condition_phrases = [
            "diabetes", "hypertension", "asthma", "migraine",
            "anxiety", "cancer", "tuberculosis", "tb",
            "cardiac", "arrhythmia", "heart",
        ]
        for phrase in condition_phrases:
            if phrase in history and phrase in condition:
                base = min(base + 2, 10)
                break

        return base
