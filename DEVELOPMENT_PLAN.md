# DEVELOPMENT PLAN: AI HEALTHCARE COMPANION

## 1. Project Overview & Hackathon Strategy
**Project Name**: AI Healthcare Companion  
**Repository**: `https://github.com/karthik104-code/healthcare_hack.git`  
**Git Author Email**: `cskarthik25cs@cce.edu.in`  

### Strategic Goals:
- Deliver an **end-to-end, production-grade healthcare application** for hackathon evaluation.
- High visual impact: Dark modern design system with glassmorphism, smooth animations, crisp typography, and responsive dashboard layouts.
- Strict Healthcare Safety: Non-diagnostic assistive design, mandatory safety disclaimers, clear distinction between raw extracted laboratory metrics and AI interpretations.
- Multi-modal: Document OCR/Extraction (PDF/Images), Voice Input/Output (Web Speech API for English, Malayalam, Hindi), and interactive Recharts health analytics.
- Resilient Architecture: Works out-of-the-box with optional live backend / Supabase services AND realistic mock/fallback services if external API keys or DB credentials are not present during local evaluation.

---

## 2. Architecture Diagram

```
                 +-------------------------------------------------------+
                 |            React 18 + TypeScript Frontend             |
                 |      (Vite + Tailwind CSS + Framer Motion + Recharts) |
                 +--------------------------+----------------------------+
                                            |
                                  HTTP REST / WebSockets
                                            v
                 +-------------------------------------------------------+
                 |                FastAPI Python Backend                 |
                 |      (Async Endpoints + Pydantic v2 Validation)      |
                 +--------+-----------------+-------------------+--------+
                          |                 |                   |
                          v                 v                   v
            +-------------------+  +-------------------+  +-------------------+
            |    AI & RAG       |  |  Doc Processing   |  |     Supabase      |
            | - Provider Engine |  | - PyMuPDF (fitz)  |  | - PostgreSQL DB   |
            |   (Gemini/Groq/   |  | - OCR / Regex     |  | - Supabase Auth   |
            |    Mock Engine)   |  |   Extraction      |  | - Storage Buckets |
            | - LangChain RAG   |  | - Structured JSON |  | - Vector Embeds   |
            | - Safety Guard    |  |   Normalizer      |  |                   |
            +-------------------+  +-------------------+  +-------------------+
```

---

## 3. Database Schema Design (PostgreSQL / Supabase)

### Tables & Relationships:
1. `users`
   - `id` (UUID, PK)
   - `email` (TEXT, UNIQUE)
   - `password_hash` (TEXT)
   - `full_name` (TEXT)
   - `role` (TEXT: 'patient' | 'doctor' | 'admin')
   - `avatar_url` (TEXT)
   - `created_at` (TIMESTAMPTZ)

2. `profiles`
   - `id` (UUID, PK)
   - `user_id` (UUID, FK -> users.id)
   - `age` (INTEGER)
   - `gender` (TEXT)
   - `blood_group` (TEXT)
   - `height_cm` (FLOAT)
   - `weight_kg` (FLOAT)
   - `medical_history` (TEXT[])
   - `emergency_contact` (TEXT)
   - `language_preference` (TEXT: 'en' | 'ml' | 'hi')

3. `medical_reports`
   - `id` (UUID, PK)
   - `user_id` (UUID, FK -> users.id)
   - `title` (TEXT)
   - `report_type` (TEXT: 'blood_test' | 'radiology' | 'prescription' | 'general')
   - `file_url` (TEXT)
   - `upload_date` (TIMESTAMPTZ)
   - `raw_text` (TEXT)
   - `summary` (TEXT)
   - `patient_explanation` (TEXT)
   - `key_findings` (TEXT[])
   - `abnormal_count` (INTEGER)
   - `status` (TEXT: 'processing' | 'completed' | 'error')

4. `report_values`
   - `id` (UUID, PK)
   - `report_id` (UUID, FK -> medical_reports.id)
   - `test_name` (TEXT)
   - `value` (TEXT)
   - `unit` (TEXT)
   - `reference_range` (TEXT)
   - `status` (TEXT: 'normal' | 'high' | 'low' | 'abnormal')
   - `category` (TEXT)

5. `appointments`
   - `id` (UUID, PK)
   - `patient_id` (UUID, FK -> users.id)
   - `doctor_name` (TEXT)
   - `specialty` (TEXT)
   - `appointment_date` (TIMESTAMPTZ)
   - `time_slot` (TEXT)
   - `location_type` (TEXT: 'in_person' | 'telehealth')
   - `status` (TEXT: 'scheduled' | 'completed' | 'cancelled')
   - `notes` (TEXT)
   - `follow_up_date` (TIMESTAMPTZ)

6. `conversations` & `messages`
   - `conversations`: `id`, `user_id`, `title`, `created_at`, `report_id`
   - `messages`: `id`, `conversation_id`, `sender` ('user'|'assistant'), `text`, `audio_url`, `sources` (JSONB), `created_at`

7. `health_metrics`
   - `id` (UUID, PK)
   - `user_id` (UUID, FK -> users.id)
   - `metric_type` (TEXT: 'blood_pressure_sys' | 'blood_pressure_dia' | 'glucose' | 'hemoglobin' | 'cholesterol' | 'heart_rate')
   - `value` (FLOAT)
   - `unit` (TEXT)
   - `recorded_at` (TIMESTAMPTZ)

8. `notifications`
   - `id`, `user_id`, `title`, `message`, `type`, `is_read`, `scheduled_for`, `created_at`

---

## 4. Technical Implementation Phases

### Phase 1: Environment & Workspace Foundation
- Workspace setup with dual frontend (`React + Vite + TS`) and backend (`FastAPI + Python`).
- Git repository initialization and email configuration (`cskarthik25cs@cce.edu.in`).
- Configuration files: `.env.example`, `requirements.txt`, `package.json`, `.gitignore`.

### Phase 2: Backend Core & Safety AI Engine
- FastAPI app setup with modular routing (`auth`, `reports`, `ai`, `appointments`, `analytics`, `patients`).
- AI Engine Provider Abstraction (supporting Gemini/OpenAI API + Heuristic Medical Knowledge fallback).
- Document Extraction Engine (PyMuPDF / OCR / Regex pattern matching for medical parameters).
- Safety Guardrail Layer enforcing strict assistive disclaimers.

### Phase 3: Modern Responsive Frontend UI System
- Design tokens with Tailwind CSS (Medical Teal, Deep Slate Dark Theme, Emerald Accents, Coral Warning highlights).
- Navigation Layout: Navbar, Sidebar with page indicators, Mobile drawer.
- Core Pages:
  - Landing Page with interactive demo preview.
  - Auth Page (Login/Register + Demo quick login).
  - Patient Dashboard (Vitals cards, upcoming appointments, recent reports alert, AI summary widget).
  - AI Assistant Chat Interface with markdown rendering, suggested questions, voice input dictation, text-to-speech playback, language selector (EN, ML, HI).
  - Medical Reports Management (Drag-and-drop uploader, analysis progress spinner, interactive lab value cards with High/Low status badges, AI patient explanation).
  - Appointment & Follow-up Scheduler (Create, edit, cancel, filter upcoming/past, set follow-up reminders).
  - Interactive Health Analytics (Recharts trend graphs for Hemoglobin, Blood Sugar, Blood Pressure, Cholesterol over time).
  - User Profile, Settings, and Notifications Center.

### Phase 4: Full Stack Integration & Refinement
- Connect frontend API services with backend FastAPI endpoints.
- Pre-populate rich sample lab reports and health history for immediate high-impact demo.
- Verify end-to-end user demo flow.
- Audit security, error boundaries, loading skeletons, and mobile responsiveness.

---

## 5. Environment Variables (.env.example)

```env
# FRONTEND CONFIG
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# BACKEND CONFIG
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# SUPABASE CONFIG
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
DATABASE_URL=postgresql://postgres:password@db.your-supabase-project.supabase.co:5432/postgres

# AI PROVIDER CONFIG (Optional, app runs with mock AI engine if not set)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key

# SECURITY
JWT_SECRET=super-secret-healthcare-hackathon-jwt-key
```

---

## 6. Verification & Quality Checklist
- [x] Resilient API fallback for zero-downtime hackathon demos.
- [x] Responsive layout tested on desktop, tablet, and mobile screens.
- [x] Clear medical safety warnings on all AI interactions.
- [x] Zero API key leaks in frontend code.
- [x] Full Git history with clean commit messages under `cskarthik25cs@cce.edu.in`.
