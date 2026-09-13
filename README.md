# MSV1 — AI-Assisted Rehabilitation Through Play

**MSV1** is an AI-assisted rehabilitation and monitoring platform designed for foot-operated carrom actuator therapy. It combines assistive hardware telemetry, computer vision pose tracking, and generative AI reporting to make rehabilitation practice measurable, engaging, and clinically insightful.

---

## 🌟 Key Features

1. **Browser-Based Pose Tracking**: MediaPipe Pose camera tracking of 33 anatomical landmarks (trunk lean angle, shoulder hike displacement, torso rotation).
2. **MSV1 Hardware Telemetry**: Dual adapter architecture supporting both **Demo Simulator** and physical **Live Hardware** data streams (`force`, `reaction_time`, `accuracy`, `consistency`).
3. **Sensor Fusion Engine**: Real-time mathematical fusion combining vision AI symmetry metrics and actuator performance into a unified **Movement Quality Score (0–100%)**.
4. **Generative AI Clinical Reports**: Gemini 1.5 Flash API service generating structured session summaries with English & Malayalam (മലയാളം) localization, backed by a 100% offline deterministic fallback engine.
5. **Therapist Dashboard**: Recharts progress trajectory visualizer, 10-second KPI executive summary cards, patient profile management, and interactive session audit modal.

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Backend (`backend/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key_here  # Optional: App uses local fallback if unconfigured
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --host 127.0.0.1
```

### 2. Frontend Setup (React + Vite + TypeScript)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Unit & Integration Tests

### Backend AI Report Tests
```bash
python backend/tests/test_ai_report.py
```

### Frontend Compensation Engine Tests
```bash
npx tsx frontend/src/pose/compensation.test.ts
```

### Frontend Hardware Telemetry Tests
```bash
npx tsx frontend/src/services/telemetry.test.ts
```

### Frontend Sensor Fusion Tests
```bash
npx tsx frontend/src/services/fusionEngine.test.ts
```

### Frontend Dashboard Tests
```bash
npx tsx frontend/src/services/dashboard.test.ts
```

---

## 📋 Hackathon Presentation Guide

Please see [`DEMO.md`](file:///c:/Users/Lakshmigauri/Desktop/CSK/healthcare_hack/DEMO.md) for step-by-step presentation instructions for judges.

---

## 🔒 Safety & Non-Diagnostic Disclaimer

MSV1 is a research prototype designed for rehabilitation movement monitoring and decision support. It is **not** a medical diagnostic tool and does not provide medical treatment plans or stroke diagnoses. All findings should be reviewed with a qualified healthcare professional.
