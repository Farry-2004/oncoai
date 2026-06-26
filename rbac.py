from fastapi import Depends, HTTPException
from auth import require_auth

SPECIALTY_TO_ROLE = {
    "Oncologist": "oncologist",
    "Surgeon": "surgeon",
    "Radiologist": "radiologist",
    "Pathologist": "pathologist",
    "Nurse": "nurse",
    "TB Coordinator": "tb_coordinator",
    "Nutritionist": "medical_officer",
    "Social Worker": "social_worker",
    "Dentist": "medical_officer",
    "Medical Officer": "medical_officer",
    "Pharmacist": "pharmacist",
    "Admin": "admin",
    "Other": "medical_officer",
}

PERMISSIONS = {
    "admin": {"*:*"},
    "tb_coordinator": {
        "patients:read", "patients:write",
        "tumor_boards:read", "tumor_boards:write",
        "workup:read", "workup:write",
        "lab_results:read", "pathology:read", "imaging:read",
        "referrals:read", "referrals:write",
        "recommendations:read", "recommendations:write",
        "documents:read", "documents:write",
        "summaries:read", "summaries:write",
        "analytics:read", "reviews:read", "reviews:write",
        "socioeconomic:read", "socioeconomic:write",
        "preferences:read", "preferences:write",
        "tracking:read", "tracking:write",
        "orchestrator:read",
    },
    "oncologist": {
        "patients:read", "patients:write",
        "lab_results:read", "lab_results:write",
        "pathology:read", "imaging:read",
        "recommendations:read", "recommendations:write",
        "tumor_boards:read", "tumor_boards:write",
        "workup:read", "workup:write",
        "referrals:read", "referrals:write",
        "documents:read", "documents:write",
        "summaries:read", "summaries:write",
        "analytics:read", "reviews:read",
        "socioeconomic:read", "preferences:read",
        "tracking:read", "tracking:write",
        "orchestrator:read",
    },
    "surgeon": {
        "patients:read", "patients:write",
        "lab_results:read", "pathology:read", "imaging:read",
        "recommendations:read", "recommendations:write",
        "tumor_boards:read", "tumor_boards:write",
        "referrals:read", "referrals:write",
        "documents:read", "documents:write",
        "analytics:read", "summaries:read",
        "socioeconomic:read", "preferences:read",
        "tracking:read",
    },
    "pathologist": {
        "patients:read",
        "pathology:read", "pathology:write",
        "lab_results:read",
        "tumor_boards:read",
        "documents:read", "documents:write",
        "imaging:read",
        "summaries:read",
    },
    "radiologist": {
        "patients:read",
        "imaging:read", "imaging:write",
        "tumor_boards:read",
        "documents:read",
        "lab_results:read", "pathology:read",
        "summaries:read",
    },
    "nurse": {
        "patients:read",
        "lab_results:read", "lab_results:write",
        "pathology:read", "imaging:read",
        "workup:read",
        "documents:read",
        "referrals:read",
        "tracking:read",
    },
    "pharmacist": {
        "patients:read",
        "lab_results:read",
        "recommendations:read",
        "documents:read",
    },
    "social_worker": {
        "patients:read",
        "socioeconomic:read", "socioeconomic:write",
        "preferences:read", "preferences:write",
        "referrals:read",
        "documents:read",
    },
    "medical_officer": {
        "patients:read", "patients:write",
        "lab_results:read", "lab_results:write",
        "pathology:read", "imaging:read",
        "tumor_boards:read",
        "referrals:read", "referrals:write",
        "documents:read", "documents:write",
        "analytics:read", "summaries:read",
        "socioeconomic:read", "preferences:read",
        "tracking:read",
    },
    "patient": {
        "own_data:read",
    },
}


def require_permission(resource: str, action: str):
    def checker(user=Depends(require_auth)):
        user_role = getattr(user, "role", None) or SPECIALTY_TO_ROLE.get(user.specialty, "medical_officer")
        user_perms = PERMISSIONS.get(user_role, set())
        if "*:*" in user_perms or f"{resource}:{action}" in user_perms:
            return user
        raise HTTPException(status_code=403, detail=f"Insufficient permissions for {resource}:{action}")
    return checker


def get_user_role(user) -> str:
    return getattr(user, "role", None) or SPECIALTY_TO_ROLE.get(user.specialty, "medical_officer")


def get_user_permissions(user) -> set:
    role = get_user_role(user)
    return PERMISSIONS.get(role, set())
