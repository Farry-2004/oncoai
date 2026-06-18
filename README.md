<p align="center">
  <img src="static/img/logo.png" alt="OncoAI" width="400">
</p>

<h1 align="center">OncoAI — Intelligent Oncology & Tumor Board Platform</h1>

<p align="center">
  <strong>AI-Powered Clinical Decision Support for Head & Neck Cancer Care</strong><br>
  Smarter Decisions. Better Outcomes.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#ai-agents">AI Agents</a> •
  <a href="#clinical-workflow">Clinical Workflow</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## About

**OncoAI** is a comprehensive, AI-powered oncology decision support platform designed for **head and neck cancer care** in resource-limited settings. Built in collaboration with the **Muhimbili National Hospital / Ocean Road Cancer Institute (ORCI) Tumor Board** in Dar es Salaam, Tanzania, the platform addresses critical gaps in multidisciplinary cancer care coordination.

The system was developed based on prototypes from a **Human-Centered Design workshop** (The Better Lab, May 2026) that brought together surgeons, oncologists, pathologists, radiologists, nurses, and social workers to reimagine how head and neck cancer care can be delivered more effectively in the Tanzanian context.

### The Problem

Head and neck cancer care in East Africa faces systemic challenges:

- **Late-stage presentation** — Most patients arrive with Stage III–IV disease due to referral delays and financial barriers
- **Fragmented care pathways** — Patient records scattered across facilities with no centralized tracking
- **Limited specialist access** — Pathologists and radiologists are scarce; multidisciplinary coordination is ad-hoc
- **No structured tumor board process** — Discussions lack checklists, voting, or follow-up tracking
- **Socioeconomic barriers** — Transportation, housing, and financial constraints delay treatment

### The Solution

OncoAI provides an integrated digital platform that:

1. **Centralizes patient data** with complete medical records, workup tracking, and journey monitoring
2. **Coordinates tumor board meetings** with video calls, structured checklists, treatment voting, and CME credits
3. **Deploys 9 specialized AI agents** that analyze patient data in parallel and produce evidence-based recommendations
4. **Bridges communication gaps** via WhatsApp integration for care teams and patients
5. **Empowers patients** through a self-service portal for viewing results, completing surveys, and contacting their care team

---

## Features

### 🏥 Patient Management
- Full patient registration with **Tanzanian context** (NHIF insurance, tribe/ethnicity, next of kin, socioeconomic factors)
- **38 patient data fields** including demographics, medical history, cancer staging, allergies, chronic conditions, medications, smoking/alcohol status
- **Patient journey tracker** — Visual 10-step workflow from ENT Arrival → Evaluation → Biopsy → Results → Case Compiled → TB Scheduled → TB Presented → Treatment Plan → Awaiting Treatment → In Treatment
- **Workup completion checker** — Auto-detects progress from imaging, pathology, and lab records; flags "TB Ready" when all tests complete
- **Medical passport generator** — Printable summary of all patient data for continuity across facilities

### 🧬 Tumor Board Coordination
- **Schedule and manage** tumor board meetings with participants, dates, and agendas
- **Video/voice calls** via Jitsi Meet (free, no install required)
- **Dial in patients** via WhatsApp during treatment discussion
- **Structured discussion checklist** (from workbook Prototype 2A):
  - Patient Summary → Diagnostic Review → Treatment Options → Recommendations & Vote → Follow-up Plan → Patient Input
- **Treatment voting** — Specialists vote on recommended action (Surgery, Radiation, Chemotherapy, Clinical Trial, Supportive Care, Deferred) with vote tally
- **Attendance tracking** with CME credit awards
- **AI Board Briefing** — Auto-generates a tumor board presentation from patient data
- **Calendar and timeline views** for scheduling

### 🤖 AI Agent Orchestrator (Stanford Medicine-style)
Nine specialized AI agents coordinated by a central orchestrator:

| Agent | Function |
|---|---|
| **Patient Profile** | Compiles demographics, history, socioeconomic factors |
| **Document Analyzer** | Extracts key findings from uploaded clinical documents |
| **Clinical Trial Matcher** | Matches patient to eligible clinical trials |
| **Medication Review** | Reviews medications, interactions, contraindications |
| **Literature Search** | Searches PubMed/NCCN for relevant evidence |
| **Treatment Recommender** | Synthesizes all data into treatment recommendations |
| **Guideline Checker** | Validates against NCCN/WHO H&N cancer guidelines |
| **Risk Assessor** | Calculates recurrence risk and survival probability |
| **TB Briefing Generator** | Prepares structured tumor board presentation |

**Orchestration modes:**
- **Full Analysis** — Runs all 9 agents
- **Smart Route** — Auto-detects which agents are needed based on patient data
- **Pre-TB Briefing** — Focused tumor board preparation
- **Treatment Recommendation** — Treatment-focused synthesis

Features live pipeline visualization, agent communication log, and a clinical intelligence dashboard with risk score, guideline match %, and elapsed time.

### 🔬 Pathology Reports
Structured pathology reporting system for head & neck cancer:
- **22 specimen sites** — Oral cavity, tongue, oropharynx, nasopharynx, larynx (3 sub-sites), salivary glands, thyroid, lymph nodes, etc.
- **21 histological types** — SCC variants (well/moderate/poorly differentiated), adenoid cystic, mucoepidermoid, lymphoma, melanoma, thyroid carcinomas, dysplasia grades
- **TNM pathological staging** — pT (TX–T4b), pN (NX–N3b), pM (M0/M1/MX)
- **Margin status** — Clear (≥5mm), Close (1–5mm), Positive
- **Key features** — Lymphovascular invasion, perineural invasion, HPV/p16 status, grade (G1–G4)
- **Slide image uploads** with gallery view
- **WhatsApp sharing** of pathology summaries

### 🧪 Laboratory (70+ Tests)
Quick-add panel with 9 categories and auto-status detection:

| Category | Tests |
|---|---|
| **Hematology (CBC)** | Hb, WBC, Platelets, RBC, HCT, MCV, MCH, Neutrophils, Lymphocytes, ESR |
| **Chemistry** | Glucose, HbA1c, Cholesterol (Total/LDL/HDL), Triglycerides, Na+, K+, Ca²+, Cl- |
| **Liver Function** | ALT, AST, ALP, GGT, Bilirubin, Albumin, Total Protein |
| **Renal Function** | Creatinine, BUN, Uric Acid, eGFR |
| **Tumor Markers** | CEA, CA 19-9, CA 125, AFP, PSA, SCC Antigen, LDH, Beta-2 Microglobulin |
| **Coagulation** | PT, INR, aPTT, D-Dimer, Fibrinogen |
| **Thyroid** | TSH, Free T4, Free T3 |
| **HIV / Infectious** | HIV 1/2, CD4, Viral Load, HBsAg, Anti-HCV |
| **Urinalysis** | pH, Protein, Glucose, Blood, WBC |

Each test has reference ranges, units, and live validation (✓ Normal, ↓ Low, ↑ High, ‼ CRIT).

### 🧠 Clinical AI Intelligence
- **Patient Safety Alerts** — Critical lab values, allergy warnings, comorbidity alerts (HIV, diabetes, hypertension), smoking cessation flags
- **Care Gap Detection** — Missing imaging, biopsy, labs, referrals, insurance, TB scheduling, staging
- **Pre-Visit Summary** — Auto-generated briefing with history, workup status, abnormal results, action items
- **AI Clinical Notes (SOAP)** — Structured Subjective/Objective/Assessment/Plan notes
- **Post-Visit Follow-up Tasks** — Prioritized task list (URGENT/HIGH/MEDIUM/LOW) with department assignments

### 📱 Patient Preference Survey
Based on workbook Prototype 3A (Text Message Survey):
- Collects patient concerns: ability to travel, financial costs, risk tolerance, openness to radiation
- Auto-categorizes patients into:
  - **Category A** — Low Concern (standard pathway)
  - **Category B** — Moderate Concern (consider socioeconomic factors)
  - **Category C** — High Concern (prioritize accessible treatment, financial support)

### 📊 Analytics Dashboard
- Cancer type distribution chart
- Patient journey progress visualization
- Stage at diagnosis breakdown
- Workup completion rate (donut chart)
- Tumor board meeting statistics
- Real-time notification system with auto-polling for critical values

### 💬 WhatsApp Integration
- Send workup reminders to patients
- Share referral documents between specialists
- Dial patients into tumor board meetings
- Coordinate care teams
- Share pathology summaries and meeting links

### 🌐 Patient Portal
Self-service portal at `/patient-portal` where patients can:
- View their journey progress
- See upcoming tumor board meetings
- Review test results
- Complete the preference survey
- Contact the TB Coordinator via WhatsApp

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Landing Page (/)                   │
│         Public description + social media            │
├─────────────┬──────────────┬────────────────────────┤
│  Login      │  Register    │  Patient Portal         │
│  /login     │  /register   │  /patient-portal        │
├─────────────┴──────────────┴────────────────────────┤
│              Main Application (/app)                 │
│  ┌──────────────────────────────────────────────┐   │
│  │  Dashboard │ Patients │ Clinical Data │ AI    │   │
│  │  Analytics │ Journey  │ Lab/Path/Img  │ Orch  │   │
│  │  Alerts    │ Workup   │ Referrals     │ SOAP  │   │
│  │  Notifs    │ Survey   │ Documents     │ TB    │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│              FastAPI Backend (Python)                 │
│  ┌────────┐ ┌──────────┐ ┌───────────────────────┐ │
│  │  Auth  │ │  CRUD    │ │  AI Agent Orchestrator │ │
│  │  JWT   │ │  APIs    │ │  9 Specialized Agents  │ │
│  └────────┘ └──────────┘ └───────────────────────┘ │
├─────────────────────────────────────────────────────┤
│              PostgreSQL Database                      │
│  patients │ cases │ labs │ pathology │ imaging        │
│  tumor_boards │ referrals │ users │ workup │ prefs   │
└─────────────────────────────────────────────────────┘
```

---

## Clinical Workflow

Based on the **Muhimbili ORCI Tumor Board Prototyping Workbook** (The Better Lab, May 2026):

### Prototype A — Centralized Patient Tracking Database
A tumor board coordinator collects all eligible patients in OncoAI, tracks workup completion including socioeconomic factors, checks in with patients, and assists in navigating health systems.

### Prototype B — Patient-Held Medical Passport
Patients carry a standardized passport (generated by OncoAI) containing clinical records, imaging, and pathology reports for continuity across facilities.

### Prototype C — Online Group Chat and Task Management
Complex patients are assigned a WhatsApp group with all relevant providers. OncoAI sends automated tracking messages as diagnostic tests complete and schedules TB presentation when ready.

### Tumor Board Organization
- **Structured checklists** with protocolized discussion
- **Voting component** for treatment recommendations
- **Attendance tracking** with CME credits
- **Hybrid model** support — pathologists/radiologists can pre-record findings

### Patient Communication
- **Text message survey** collecting patient preferences before TB
- **Patient dial-in** to the tumor board meeting for treatment discussion
- **Family conference** post-TB with summary and follow-up

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML/CSS/JS, Remix Icons, Inter font |
| **Backend** | Python, FastAPI, SQLAlchemy |
| **Database** | PostgreSQL |
| **Auth** | JWT (python-jose), bcrypt |
| **AI** | OpenAI GPT-4o (optional), extractive summarization (local) |
| **Video Calls** | Jitsi Meet (free, no install) |
| **Messaging** | WhatsApp Web API (click-to-chat) |
| **Deployment** | Docker, Nginx, Gunicorn |

---

## Deployment

### Quick Start (Development)
```bash
git clone https://github.com/Farry-2004/oncoai.git
cd oncoai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
# Open http://localhost:8000
```

### Docker (Production)
```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d
# Open http://localhost:8000
```

### Cloud Platforms
- **Render** — Auto-deploys from `render.yaml` (free tier)
- **Railway** — Auto-deploys from `railway.toml`
- **Fly.io** — Uses `fly.toml` (Africa region: Johannesburg)
- **DigitalOcean/AWS** — Use Docker deployment

See [DEPLOY.md](DEPLOY.md) for full deployment guide including SSL, backups, and systemd service.

---

## API Endpoints

| Group | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| **Patients** | CRUD at `/api/patients`, workup, socioeconomic, preferences, tracking |
| **Lab Results** | CRUD at `/api/lab-results`, per-patient at `/api/patients/{id}/lab-results` |
| **Pathology** | CRUD at `/api/pathology-reports` |
| **Imaging** | CRUD at `/api/imaging-results` |
| **Referrals** | CRUD at `/api/referrals`, document uploads |
| **Tumor Boards** | CRUD at `/api/tumor-boards`, join, vote, checklist |
| **AI** | `/api/orchestrate`, `/api/summarize`, `/api/patients/{id}/board-summary` |
| **Documents** | Upload, download, delete at `/api/patients/{id}/documents` |

---

## Contributing

OncoAI is built for the global oncology community. Contributions welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Acknowledgments

- **The Better Lab** — Human-Centered Design prototyping methodology
- **Muhimbili National Hospital / ORCI** — Clinical context and tumor board workflow
- **Stanford Medicine** — Healthcare Agent Orchestrator architecture inspiration
- **Microsoft Build 2025** — Multi-agent AI system design patterns

---

## License

This project is open source. See individual file headers for details.

---

<p align="center">
  <strong>OncoAI</strong> — Smarter Decisions. Better Outcomes.<br>
  Built with ❤️ for cancer patients in Tanzania and beyond.
</p>
