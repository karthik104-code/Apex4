# MSV1 AI-Assisted Rehabilitation Through Play — Development Plan

## Project Overview
Transformation of the application into **MSV1**, an AI-assisted rehabilitation and monitoring system for foot-operated carrom actuator rehab. The platform combines webcam-based computer vision (MediaPipe Pose landmark tracking), movement compensation detection (trunk lean, shoulder hike, torso rotation), MSV1 hardware telemetry (force, reaction time, accuracy), real-time sensor fusion, and LLM-generated therapist session reports.

---

## Architecture & Data Flow

```
[Webcam Feed] ──> MediaPipe Pose ──> Pose Landmarks (Shoulders, Torso, Hips)
                                            │
                                            ▼
                               [Compensation Engine] (Trunk Lean, Hike, Rotation)
                                            │
[MSV1 Hardware / Simulator] ──> [Hardware Telemetry] (Force, RT, Accuracy)
                                            │
                                            ▼
                                 [Sensor Fusion Engine]
                                            │
                                            ▼
                              [Real-Time Session Quality Score (0-100%)]
                                            │
                                            ▼
                              [FastAPI Backend & LLM Service]
                                            │
                                            ▼
                             [Therapist Dashboard & AI Report]
```

---

## Implementation Phases

### Phase 1: Core Setup & MediaPipe Pose Integration
- Install `@mediapipe/tasks-vision` or `@tensorflow-models/pose-detection` in `frontend`.
- Create `PoseCameraView.tsx` component with live webcam feed rendering and canvas overlay of 33 body pose landmarks.
- Build `pose/landmarker.ts` helper for smooth client-side pose detection.

### Phase 2: Biomechanical Compensation Detection Engine
- Create `pose/compensation.ts` with angle and displacement calculations:
  - **Trunk Lean**: Angular deviation of mid-shoulder-hip spine line relative to vertical baseline.
  - **Shoulder Hike**: Vertical asymmetry ratio between left and right acromion landmarks.
  - **Torso Rotation**: Cross-sectional angle mismatch between shoulder line and hip line.
  - **Movement Stability**: Variance of torso center of mass over time.
- Implement baseline calibration screen (`CalibrationPage.tsx`) to capture neutral posture.

### Phase 3: MSV1 Hardware Telemetry & Demo Simulator Adapter
- Build `hardwareSimulator.ts` supporting dual modes:
  - **Mode 1 (Demo Simulation)**: Generates realistic force (N), reaction time (s), accuracy (%), and strike consistency metrics with profile presets (*Normal*, *Fatigue*, *High-Compensation*).
  - **Mode 2 (Hardware API Adapter)**: Standard REST/WebSocket interface for physical MSV1 hardware integration.

### Phase 4: Real-Time Sensor Fusion & Session Engine
- Build `fusionEngine.ts` to compute combined Movement Quality Score (0–100%) and Compensation Levels (*Low*, *Medium*, *High*).
- Build `LiveSessionPage.tsx` integrating live camera feed, skeleton overlay, real-time gauges, telemetry panel, live session score, and session controls.

### Phase 5: FastAPI Backend, Session Storage & LLM Generative AI Report
- Create Pydantic models for `SessionData`, `PoseMetrics`, `TelemetryData`, and `AIReport`.
- Build FastAPI endpoints:
  - `POST /api/v1/sessions/save`
  - `GET /api/v1/sessions/history`
  - `POST /api/v1/reports/generate`
- Implement `llm_report.py` using Gemini API with fallback rule-based natural language generator.

### Phase 6: Therapist Dashboard & Session History
- Build `TherapistDashboardPage.tsx` with clinical key metrics, compensation trends (Recharts), patient selector, session drill-downs, and 1-click **"Generate AI Session Report"**.
- Build `LandingPage.tsx` introducing MSV1, hardware explanation, rehabilitation problem statement, hero CTA, and clinical safety disclaimer.

### Phase 7: Verification, UI Polish & Final Hackathon Audit
- Verify client-side webcam performance, test fallback local reports when API key is missing.
- Ensure strict clinical safety language throughout UI ("AI-assisted monitoring and decision support, not medical diagnosis").
- Verify `npx vite build` and `py_compile` pass cleanly.

---

## Rules & Constraints
- **DO NOT PUSH TO GITHUB** until explicitly directed by the user.
- Maintain clean separation between simulation adapter and hardware API interface.
- Ensure all simulated data is explicitly labeled as `"MSV1 Demo Telemetry"`.
