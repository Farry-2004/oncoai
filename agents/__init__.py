from agents.patient_profile import PatientProfileAgent
from agents.document_analysis import DocumentAnalysisAgent
from agents.clinical_trial import ClinicalTrialAgent
from agents.medication_review import MedicationReviewAgent
from agents.literature_search import LiteratureSearchAgent
from agents.recommendation_agent import RecommendationAgent

ALL_AGENTS = [
    PatientProfileAgent(),
    DocumentAnalysisAgent(),
    ClinicalTrialAgent(),
    MedicationReviewAgent(),
    LiteratureSearchAgent(),
    RecommendationAgent(),
]

AGENT_MAP = {a.name: a for a in ALL_AGENTS}


def get_agent(name: str):
    return AGENT_MAP.get(name)


def get_available_agents(patient, db):
    available = []
    for agent in ALL_AGENTS:
        if agent.should_run(patient, db):
            available.append(agent)
    return available
