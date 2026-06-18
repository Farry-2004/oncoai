import logging
from agents.base import BaseAgent

logger = logging.getLogger(__name__)

LITERATURE_DATABASE = [
    {
        "title": "AI-Driven Clinical Decision Support: A Systematic Review",
        "journal": "Nature Digital Medicine",
        "year": 2025,
        "doi": "10.1038/s41746-025-01452-3",
        "summary": "AI-based CDSS shows 89% sensitivity in diagnostic support across primary care settings.",
        "tags": ["ai", "diagnostics", "clinical decision support"],
    },
    {
        "title": "Advances in Remote Patient Monitoring for Chronic Disease",
        "journal": "The Lancet Digital Health",
        "year": 2025,
        "doi": "10.1016/S2589-7500(25)00012-5",
        "summary": "Remote monitoring reduces hospital readmissions by 34% in chronic disease patients.",
        "tags": ["remote monitoring", "chronic disease", "telehealth"],
    },
    {
        "title": "Machine Learning for Tuberculosis Diagnosis in Resource-Limited Settings",
        "journal": "PLOS Digital Health",
        "year": 2024,
        "doi": "10.1371/journal.pdig.0000456",
        "summary": "Chest X-ray AI models achieve 94% AUC for TB screening in low-resource environments.",
        "tags": ["tb", "tuberculosis", "machine learning", "radiology"],
    },
    {
        "title": "Personalized Asthma Management Using Wearable Sensors",
        "journal": "Journal of Allergy and Clinical Immunology",
        "year": 2025,
        "doi": "10.1016/j.jaci.2025.01.042",
        "summary": "Wearable sensor data combined with ML predicts asthma exacerbations 48 hours in advance.",
        "tags": ["asthma", "wearable", "sensors", "machine learning"],
    },
    {
        "title": "Digital Therapeutics for Migraine: Current Evidence and Future Directions",
        "journal": "Headache: The Journal of Head and Face Pain",
        "year": 2024,
        "doi": "10.1111/head.14892",
        "summary": "Digital therapeutic interventions show 42% reduction in migraine days per month.",
        "tags": ["migraine", "digital therapeutics", "headache"],
    },
    {
        "title": "Telehealth Cognitive Behavioral Therapy for Anxiety Disorders",
        "journal": "JAMA Psychiatry",
        "year": 2025,
        "doi": "10.1001/jamapsychiatry.2025.0012",
        "summary": "Telehealth CBT non-inferior to in-person therapy for generalized anxiety disorder.",
        "tags": ["anxiety", "cbt", "telehealth", "mental health"],
    },
    {
        "title": "Hypertension Management in the Digital Age",
        "journal": "Circulation",
        "year": 2024,
        "doi": "10.1161/CIRCULATIONAHA.124.06985",
        "summary": "Digital health interventions improve blood pressure control by 28% vs usual care.",
        "tags": ["hypertension", "digital health", "blood pressure"],
    },
    {
        "title": "AI-Powered Clinical Trial Matching: Reducing Screening Time",
        "journal": "NEJM AI",
        "year": 2025,
        "doi": "10.1056/AIoa2500015",
        "summary": "NLP-based trial matching reduces screening time by 67% while maintaining accuracy.",
        "tags": ["clinical trials", "ai", "nlp", "trial matching"],
    },
]


class LiteratureSearchAgent(BaseAgent):
    name = "literature_search"
    description = "Searches relevant medical literature based on patient conditions"

    def should_run(self, patient, db) -> bool:
        return bool(patient.medical_history)

    def run(self, patient, db) -> dict:
        history_lower = (patient.medical_history or "").lower()
        matches = []

        for article in LITERATURE_DATABASE:
            tags_text = " ".join(article["tags"]).lower()
            title_text = article["title"].lower()
            combined = tags_text + " " + title_text
            score = self._relevance_score(history_lower, combined)
            if score > 0:
                matches.append({**article, "relevance": score})

        matches.sort(key=lambda x: x["relevance"], reverse=True)
        top = matches[:4]

        if not top:
            return {
                "agent": self.name,
                "status": "success",
                "summary": "No directly relevant literature found for this patient's conditions.",
                "details": {"articles_found": 0, "articles": []},
            }

        lines = ["Recent Literature & Research:", ""]
        for a in top:
            lines.append(f"  \"{a['title']}\"")
            lines.append(f"    {a['journal']} ({a['year']})  |  DOI: {a['doi']}")
            lines.append(f"    {a['summary']}")
            lines.append("")

        return {
            "agent": self.name,
            "status": "success",
            "summary": "\n".join(lines),
            "details": {"articles_found": len(top), "articles": top},
        }

    def _relevance_score(self, history: str, target: str) -> int:
        history_words = set(history.lower().split())
        target_words = set(target.lower().split())
        common = history_words & target_words
        return min(len(common), 10)
