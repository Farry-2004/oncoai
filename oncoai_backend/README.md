# OncoAI — Tumor Board Coordination API (Backend Skeleton)

FastAPI service implementing the API surface from the OncoAI system design
doc, mapped onto the schema in `oncoai_schema.sql`.

## What's real vs. stubbed

**Implemented with real logic:**
- Auth (JWT, bcrypt password hashing)
- RBAC per endpoint, matching the roles in the system design doc
- Case + diagnostic workup CRUD and status tracking
- Tumor board scheduling, agenda management, recommendation logging
- Patient registration with field-level encryption via pgcrypto
- Preference survey response handling + A/B/C categorization logic
- Audit-context wiring (`get_db_audited`) so every audited write carries
  the acting user's ID and IP into the Postgres triggers defined in
  `oncoai_schema.sql`

**Stubbed, with TODOs marking the exact integration point:**
- WhatsApp Business API calls (sending messages, verifying webhooks)
- SMS gateway calls (sending the preference survey, verifying webhooks)
- Video/dial-in service calls
- AI model calls (case summary, TB minutes, guideline RAG) — the routes
  and response shapes exist; the actual model call is not wired in

This split is deliberate: those four integrations were flagged as the
next deliverables, and stubbing them here means the rest of the app
doesn't need to change shape once they're built — you fill in the
marked TODOs.

## Local setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Provision the database first:
psql -d oncoai -f db/oncoai_schema.sql

# Then create a .env (or export env vars) — see app/config.py for the
# full list. At minimum:
export DATABASE_URL="postgresql+psycopg2://oncoai_app:yourpassword@localhost:5432/oncoai"
export JWT_SECRET="generate-a-real-secret"
export FIELD_ENCRYPTION_KEY="generate-a-real-key"

uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs once running.

## A note on testing in this environment

This code was written and syntax-checked (`python -m py_compile`) but
**not executed against a live FastAPI/Postgres stack** — the sandbox this
was built in has no network access to install fastapi/sqlalchemy/etc. or
spin up Postgres. Treat it as a carefully-reasoned skeleton, not as
something that's been integration-tested. Run it locally and report back
anything that breaks — most likely candidates are minor import-name
mismatches or SQLAlchemy 2.0 API details that differ slightly from what's
written here.

## Creating your first admin user

There's no public signup endpoint by design (healthcare staff accounts
shouldn't be self-service). Insert the first administrator directly:

```python
from app.auth import hash_password
print(hash_password("temporary-password"))
```

Then insert into `users` with `role = 'administrator'` and that hash,
using the SQL seed pattern at the bottom of `oncoai_schema.sql` as a
starting point. From there, use `POST /admin/users` for everyone else.
