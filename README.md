# AI Healthcare Companion 🏥🤖

An end-to-end, production-quality AI-powered healthcare companion built for hackathon evaluation. The platform features an **AI Health Assistant**, **Medical Report OCR & Lab Parameter Extraction**, **Evidence-Based Retrieval-Augmented Generation (RAG)**, **Voice & Multilingual Interaction (English, Malayalam, Hindi)**, **Appointment Management**, and **Interactive Health Analytics**.

---

## 🌟 Key Features

- **🛡️ Safety-First Assistive AI**: Enforces strict non-doctor safety disclaimers, avoids definitive diagnoses, and categorizes findings into educational topics to discuss with your primary physician.
- **📄 Medical Report Intelligence**: Upload PDF, PNG, JPG, or JPEG lab reports. PyMuPDF OCR extraction parses lab values (Hemoglobin, Fasting Glucose, Cholesterol, WBC, Vitamin D), flags status (`normal`, `high`, `low`, `unknown`), and provides plain-language patient explanations.
- **📚 Evidence-Based RAG Layer**: Semantic vector retrieval over clinical guidelines (WHO, ADA, NHLBI, Endocrine Society) and uploaded lab reports, displaying trusted citations alongside AI responses.
- **🎤 Multilingual Voice Companion**: Real-time dictation and audio synthesis in **English**, **Malayalam (മലയാളം)**, and **Hindi (ഹിन्दी)**.
- **📊 Interactive Health Analytics**: Visualizes historical lab trends (Hemoglobin, Glucose, Blood Pressure, Cholesterol) with responsive Recharts graphs.
- **📅 Appointment & Follow-Up System**: Schedule doctor visits, set follow-up re-test reminders, reschedule, or cancel consultations.
- **👨‍⚕️ Dual Experience**: Patient Workspace and Clinical Doctor Portal.

---

## 🏗️ Architecture & Tech Stack

```
USER ──► React 18 + TypeScript (Vite + Tailwind CSS + Recharts + Framer Motion)
           │
           ▼
     FastAPI Backend (Python 3.12 + Pydantic v2 + PyMuPDF)
           │
           ├── AI Service Abstraction (LLM Provider / Mock Heuristic Engine)
           ├── RAG Vector Store & Embeddings Layer (LangChain / Cosine Similarity)
           ├── Document Processing Engine (PyMuPDF OCR)
           └── Database / Storage (Supabase PostgreSQL / In-Memory Store)
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend**: Python 3.12, FastAPI, Pydantic v2, PyMuPDF, Uvicorn
- **Database & Storage**: Supabase PostgreSQL / Local database fallback, Supabase Storage
- **Deployment**: Frontend on Vercel, Backend on Render or Railway

---

## 📁 Repository Structure

```
healthcare_hack/
├── frontend/             # React + TypeScript Vite Web App
│   ├── src/
│   │   ├── components/  # Navbar, Sidebar, MedicalDisclaimer, VoiceController, UI Library
│   │   ├── pages/       # LandingPage, AuthPage, PatientDashboard, AIAssistantPage, etc.
│   │   ├── services/    # api.ts (Service layer connecting to VITE_API_BASE_URL)
│   │   ├── context/     # AuthContext, LanguageContext
│   │   └── types/       # healthcare.ts
├── backend/              # Python FastAPI REST API
│   ├── app/
│   │   ├── main.py      # FastAPI entrypoint with CORS & GET /health
│   │   ├── api/v1/      # REST Router (/auth, /reports, /assistant, /appointments, /analytics)
│   │   ├── ai/          # Provider abstraction (LLMProvider / MockProvider)
│   │   ├── rag/         # Embeddings, Chunk Ingestion, Vector Retriever, RAG Service
│   │   ├── voice/       # SpeechToText / TextToSpeech provider abstractions
│   │   ├── documents/   # PyMuPDF OCR & lab parameter extraction
│   │   └── core/        # Config & Security Safety Guardrails
├── docs/                 # System Architecture & Documentation
├── .env.example          # Environment variable template
├── DEVELOPMENT_PLAN.md   # Hackathon implementation plan
└── README.md             # Project documentation
```

---

## ⚙️ Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# FRONTEND CONFIG
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# BACKEND CONFIG
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# SUPABASE / DATABASE CONFIG
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key-here
DATABASE_URL=postgresql://postgres:yourpassword@db.your-supabase-project.supabase.co:5432/postgres

# OPTIONAL AI PROVIDER API KEYS (Application uses fallback mock engine if not set)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key

# SECURITY
JWT_SECRET=super-secret-healthcare-companion-key-2026
```

---

## 🚀 Quick Start Guide

### 1. Running Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/health` -> `{"status": "ok"}`
- Swagger Interactive Docs: `http://localhost:8000/docs`

### 2. Running Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🌐 Deployment Instructions

- **Frontend (Vercel)**:
  1. Connect GitHub repository `karthik104-code/healthcare_hack`.
  2. Set Root Directory to `frontend`.
  3. Build Command: `npm run build`, Output Directory: `dist`.
  4. Set `VITE_API_BASE_URL` to deployed backend URL.

- **Backend (Render / Railway)**:
  1. Deploy `backend` directory as Python Web Service.
  2. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
  3. Configure environment variables.

---

## 🔒 Healthcare Safety Guardrail

> **Medical Disclaimer**: AI Healthcare Companion is an informative research tool and NOT a doctor. It does not provide medical diagnosis or treatment plans. Always consult a qualified healthcare professional for medical concerns or before acting on health data.
