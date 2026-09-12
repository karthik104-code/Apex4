# AI Healthcare Companion 🏥🤖

An end-to-end, production-quality AI-powered healthcare companion built for hackathon evaluation. The platform features an **AI Health Assistant**, **Medical Report OCR & Lab Parameter Extraction**, **Voice & Multilingual Interaction (English, Malayalam, Hindi)**, **Appointment Management**, and **Interactive Health Analytics**.

---

## 🌟 Key Features

- **🛡️ Safety-First Assistive AI**: Enforces strict medical disclaimers and avoids diagnostic assertions. Provides educational, patient-friendly guidance and questions to ask your doctor.
- **📄 Medical Report Analyzer**: Extracts blood tests, vitals, reference ranges, and highlights High/Low abnormal indicators from uploaded PDFs or images.
- **🎤 Multilingual Voice Companion**: Supports real-time dictation and spoken response synthesis in **English**, **Malayalam (മലയാളം)**, and **Hindi (हिन्दी)**.
- **📊 Interactive Health Analytics**: Visualizes historical lab trends (Hemoglobin, Glucose, Blood Pressure, Cholesterol) with responsive Recharts graphs.
- **📅 Appointment & Follow-Up System**: Allows booking doctor appointments, setting reminders, and managing follow-ups.
- **👨‍⚕️ Dual Experience**: Dedicated Patient Dashboard and Doctor Overview interface.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend**: Python 3.12, FastAPI, Pydantic v2, PyMuPDF, LangChain, Uvicorn
- **Database & Storage**: Supabase PostgreSQL / Local SQLite fallback, Supabase Storage
- **Deployment**: Frontend on Vercel, Backend on Render/Railway

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ & npm
- Python 3.10+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will be running at: `http://localhost:5173`.

---

## 🔒 Healthcare Safety Guardrail

> **Medical Disclaimer**: AI Healthcare Companion is an informative research tool and NOT a doctor. It does not provide medical diagnosis or treatment plans. Always consult a qualified healthcare professional for medical concerns or before acting on health data.
