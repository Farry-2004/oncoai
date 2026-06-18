from abc import ABC, abstractmethod


class BaseAgent(ABC):
    name: str = ""
    description: str = ""

    @abstractmethod
    def should_run(self, patient, db) -> bool:
        """Determine if this agent should run for this patient."""
        pass

    @abstractmethod
    def run(self, patient, db) -> dict:
        """
        Execute the agent and return:
        {
            "agent": self.name,
            "status": "success" | "skipped" | "error",
            "summary": str,
            "details": dict (optional)
        }
        """
        pass
