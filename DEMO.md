# MSV1 AI-Assisted Rehabilitation Platform — Hackathon Demo Guide

Welcome to the **MSV1 Platform Demo Guide**. This document outlines the step-by-step procedure for a flawless 3–5 minute hackathon presentation.

---

## 🚀 3-Minute Judging Presentation Flow

### Step 1: Platform Introduction (0:00 - 0:45)
1. Launch the application landing page at `http://localhost:5173`.
2. Explain the core problem:
   - **MSV1** is an assistive foot-operated carrom actuator enabling people with upper-limb disabilities to play carrom through foot control.
   - The platform turns MSV1 into an **AI-assisted rehabilitation and monitoring engine**.
3. Highlight the 3 pillars:
   - **Hardware Telemetry** (Foot actuator force, reaction time, accuracy)
   - **Computer Vision** (Real-time body pose compensation tracking)
   - **Sensor Fusion & AI Reporting** (Movement quality score & clinical summaries)

---

### Step 2: Postural Baseline Calibration (0:45 - 1:15)
1. Click **"Start Demo"** or navigate to `/calibration`.
2. Click **"Capture Neutral Baseline"** to record sitting posture baseline.
3. Show how baseline normalization eliminates camera placement bias.

---

### Step 3: Live Session & Real-Time Sensor Fusion (1:15 - 2:45)
1. Click **"Start Live Session"** (`/session`).
2. Point out the live multi-panel interface:
   - **Camera Feed with Pose Skeleton Overlay**: Displays spine vector, shoulder line, hip alignment.
   - **AI Movement Analysis Panel**: Real-time Trunk Lean Angle (°), Shoulder Hike ratio, Torso Rotation Angle (°).
   - **MSV1 Performance Panel**: Actuator Force (%), Reaction Time (s), Strike Accuracy (%), Consistency (%).
   - **Demo Control Presets**: Demonstrate preset toggles (`Normal`, `Fatigue Pattern`, `High Compensation`). Watch metrics update instantly!
   - **Combined Session Insight**: Real-time Movement Quality Score (%) and postural-telemetry relationship message.

---

### Step 4: Session Analysis & Generative AI Report (2:45 - 3:30)
1. Click **"End & Analyze Session"**.
2. Navigate to **Therapist Dashboard** (`/dashboard`).
3. Click **"Generate AI Session Report"**.
4. Demonstrate structured output:
   - **Positive Observations**
   - **Session Observations / Compensations**
   - **Progress Trend**
   - **Therapist Discussion Points**
5. Toggle language switch between **EN** and **മലയാളം (Malayalam)**.

---

### Step 5: Therapist Progress Trajectory (3:30 - 4:00)
1. Review 10-second KPI summary cards.
2. Toggle Recharts visualizer tabs (**Quality %**, **Accuracy %**, **Trunk Lean °**, **Reaction Time s**).
3. Click any row in **Session History Archive** to open `SessionDetailsModal` for audit breakdown.

---

## 🛠️ Demo Presets & Fallback Safety

- **Camera Permission Denied / No Webcam**: Automatic **Pose Simulator Loop** activates, emitting realistic body pose landmarks so demo never fails.
- **Offline / LLM API Key Unavailable**: Automatic **Deterministic Local Fallback Generator** generates structured reports without network delays.
- **Physical Hardware Disconnected**: **Demo Simulator Adapter** streams realistic MSV1 telemetry, marked clearly as `SIMULATED`.
