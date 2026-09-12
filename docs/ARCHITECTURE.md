# Architecture & Foundation Document: AI Healthcare Companion

## Overview
This monorepo contains the complete production foundation for the **AI Healthcare Companion** hackathon platform.

### Folder Structure
```
healthcare_hack/
├── frontend/             # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/  # Navbar, Sidebar, MedicalDisclaimer, VoiceController
│   │   │   └── ui/      # Button, Card, Modal, LoadingState, ErrorState, Toast, PageContainer
│   │   ├── pages/       # LandingPage, AuthPage, PatientDashboard, AIAssistantPage, etc.
│   │   ├── services/    # api.ts (Service layer connecting to VITE_API_BASE_URL)
│   │   ├── context/     # AuthContext, LanguageContext
│   │   └── types/       # healthcare.ts
│   └── ...
├── backend/              # Python FastAPI REST API
│   ├── app/
│   │   ├── main.py      # Entrypoint with CORS & GET /health
│   │   ├── api/v1/      # REST Endpoints (/auth, /reports, /ai, /appointments, /analytics)
│   │   ├── ai/          # LLM & RAG Engine Provider Abstraction
│   │   ├── documents/   # PyMuPDF OCR & Medical Parameter Extraction
│   │   └── core/        # Config & Security Safety Guardrails
├── docs/                 # Documentation & Architecture Specifications
├── .env.example          # Environment variable template
├── DEVELOPMENT_PLAN.md   # Hackathon implementation strategy plan
└── README.md             # Project overview & quickstart
```

---

## Health Check & Service Verification

- Backend Health Check Endpoint: `GET /health` -> `{"status": "ok"}`
- Frontend API Service Layer: Reads base URL from `import.meta.env.VITE_API_BASE_URL` with resilient demo fallbacks.
