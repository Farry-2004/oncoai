import logging
import threading
from agents import get_available_agents

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    def __init__(self):
        self.results = {}

    def run_for_patient(self, patient, db, agent_names: list[str] = None) -> dict:
        available = get_available_agents(patient, db)

        if agent_names:
            available = [a for a in available if a.name in agent_names]

        if not available:
            return {
                "patient_id": patient.id,
                "patient_name": patient.name,
                "status": "no_agents",
                "message": "No agents applicable for this patient",
                "agent_results": [],
                "compiled_summary": "No data available to analyze.",
            }

        threads = []
        results = {}

        def run_agent(agent):
            try:
                results[agent.name] = agent.run(patient, db)
            except Exception as e:
                logger.error(f"Agent {agent.name} failed: {e}")
                results[agent.name] = {
                    "agent": agent.name,
                    "status": "error",
                    "summary": f"Agent encountered an error: {str(e)}",
                    "details": {},
                }

        for agent in available:
            t = threading.Thread(target=run_agent, args=(agent,))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        agent_results = [results[name] for name in sorted(results.keys())]

        compiled = self._compile_summary(agent_results, patient)

        return {
            "patient_id": patient.id,
            "patient_name": patient.name,
            "status": "success",
            "agents_executed": len(agent_results),
            "agent_results": agent_results,
            "compiled_summary": compiled,
        }

    def _compile_summary(self, agent_results: list, patient) -> str:
        lines = [
            "=" * 60,
            f"COMPREHENSIVE PATIENT REPORT",
            f"{patient.name}  |  Age: {patient.age}  |  ID: {patient.id}",
            "=" * 60,
            "",
        ]

        for result in agent_results:
            if result["status"] == "error":
                continue
            lines.append(result["summary"])
            lines.append("-" * 40)
            lines.append("")

        lines.append("=" * 60)
        lines.append("END OF REPORT")
        lines.append("=" * 60)

        return "\n".join(lines)
