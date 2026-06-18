import logging
from datetime import datetime, timezone
from agents.base import BaseAgent

logger = logging.getLogger(__name__)


class RecommendationAgent(BaseAgent):
    name = "recommendations"
    description = "Analyzes patient data and generates clinical recommendations"

    def should_run(self, patient, db) -> bool:
        return True

    def run(self, patient, db) -> dict:
        from models import Recommendation
        existing = db.query(Recommendation).filter(
            Recommendation.patient_id == patient.id,
            Recommendation.status == "active"
        ).all()

        recommendations = self._generate_recommendations(patient, existing)

        lines = ["Clinical Recommendations:", ""]
        if recommendations:
            for r in recommendations:
                priority_tag = {"high": "!!!", "medium": "!", "low": "-"}.get(r["priority"], "!")
                lines.append(f"  {priority_tag} [{r['category'].upper()}] {r['title']}")
                lines.append(f"     {r['description']}")
                if r.get("due_date"):
                    lines.append(f"     Due: {r['due_date']}")
                lines.append("")
        else:
            lines.append("  No specific recommendations at this time.")
            lines.append("")

        return {
            "agent": self.name,
            "status": "success",
            "summary": "\n".join(lines),
            "details": {"recommendations": recommendations, "active_count": len(existing)},
        }

    def _generate_recommendations(self, patient, existing) -> list:
        recs = []
        history_lower = (patient.medical_history or "").lower()

        existing_titles = {r.title.lower() for r in existing}

        def add(category, title, desc, priority="medium", due_days=None):
            if title.lower() not in existing_titles:
                due = None
                if due_days:
                    d = datetime.now(timezone.utc)
                    from datetime import timedelta
                    d += timedelta(days=due_days)
                    due = d.strftime("%Y-%m-%d")
                recs.append({
                    "category": category,
                    "title": title,
                    "description": desc,
                    "priority": priority,
                    "due_date": due,
                })

        conditions_map = {
            "tb": ("Infectious Disease", [
                ("Schedule monthly liver function tests",
                 "Patients on TB therapy require monthly LFT monitoring for hepatotoxicity", "high", 30),
                ("Refer for sputum culture follow-up",
                 "Follow-up sputum cultures needed at 2 months to confirm treatment response", "high", 60),
            ]),
            "diabetes": ("Endocrinology", [
                ("HbA1c recheck in 3 months",
                 "Diabetic patients need HbA1c monitoring every 3 months to assess glycemic control", "high", 90),
                ("Refer to diabetes education",
                 "Structured diabetes education improves outcomes and self-management", "medium", 30),
            ]),
            "hypertension": ("Cardiology", [
                ("Weekly blood pressure monitoring",
                 "Home BP monitoring recommended with log review at next visit", "high", 7),
                ("Renal function panel",
                 "Annual renal function testing for patients on antihypertensive therapy", "medium", 30),
            ]),
            "asthma": ("Pulmonology", [
                ("Peak flow monitoring diary",
                 "Daily peak flow monitoring to track asthma control and detect exacerbations early", "high", 1),
                ("Spirometry re-evaluation",
                 "Annual spirometry to assess lung function and adjust therapy", "medium", 90),
            ]),
            "migraine": ("Neurology", [
                ("Maintain headache diary",
                 "Daily headache diary to identify triggers and assess treatment response", "medium", 1),
                ("Neurology follow-up",
                 "Regular neurology follow-up for migraine management optimization", "medium", 90),
            ]),
            "anxiety": ("Psychiatry", [
                ("GAD-7 screening at next visit",
                 "Monitor anxiety symptoms with standardized GAD-7 questionnaire", "medium", 30),
                ("CBT referral",
                 "Cognitive behavioral therapy is first-line treatment for anxiety disorders", "medium", 14),
            ]),
        }

        for keyword, (_, items) in conditions_map.items():
            if keyword in history_lower:
                for title, desc, priority, days in items:
                    add("clinical", title, desc, priority, days)

        if patient.age > 60:
            add("preventive", "Annual health screening",
                "Patients over 60 should have annual comprehensive health screening including lipid profile, renal function, and cancer screening",
                "high", 90)

        if not patient.medical_history:
            add("general", "Routine health maintenance",
                "Schedule routine annual physical examination with standard lab work",
                "medium", 365)

        return recs
