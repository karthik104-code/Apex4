# MSV1 System Architecture

This document describes the software architecture for the **MSV1 AI-Assisted Rehabilitation Platform**.

```
                           +--------------------------------+
                           |  MSV1 Physical Foot Actuator   |
                           |    (Force, Speed, Accuracy)    |
                           +---------------+----------------+
                                           |
                                           v
                              +-------------------------+
                              | Telemetry API Adapter   |
                              |  (Simulated / Live HW)  |
                              +------------+------------+
                                           |
+--------------------------+               |
| Webcam / MediaPipe Pose  |               |
|  (33 Anatomical Joints)  |               v
+------------+-------------+     +-------------------+
             |                   | Sensor Fusion     |
             +------------------>| Calculation Engine|
                                 +---------+---------+
                                           |
                                           v
                             +---------------------------+
                             | Real-Time Dashboard &     |
                             | Clinical Report Generator |
                             |   (Gemini API / Local)    |
                             +---------------------------+
```

---

## 🏗️ Architectural Layers

### 1. Computer Vision Layer
- **Technology**: MediaPipe Pose / Pose Landmarker (Client-side WASM/JS).
- **Module**: `frontend/src/pose/compensation.ts` (`MovementCompensationEngine`).
- **Function**: Extracts 33 3D body landmarks. Computes distance-normalized metrics for:
  - Trunk Lean Angle ($\theta = \arctan(|dx|/|dy|)$)
  - Shoulder Hike Displacement ratio
  - Torso Rotation Angle mismatch
  - Posture Stability Index (%)

### 2. Hardware Telemetry Layer
- **Module**: `frontend/src/services/telemetry/index.ts`.
- **Adapters**:
  - `DemoSimulatorAdapter`: Emits realistic, dynamic actuator telemetry (`force`, `reaction_time`, `accuracy`, `consistency`, `timestamp`).
  - `HardwareInterfaceAdapter`: API abstraction for physical MSV1 foot actuator data streams.
- **Sanitizer**: `validateTelemetryData` guarantees safe defaults against malformed or missing payloads.

### 3. Sensor Fusion Engine
- **Module**: `frontend/src/services/fusionEngine.ts`.
- **Formula**:
  $$\text{Session Score} = 0.50 \times \text{Movement Quality} + 0.35 \times \text{Performance Score} + 0.15 \times \text{Stability}$$
- **Output**: Fuses pose compensation and actuator performance into real-time quality scores and synthesized relationship messages.

### 4. Generative AI Reporting & Safety Layer
- **Backend Service**: `backend/app/ai/llm_report.py`.
- **Primary LLM**: Google Gemini 1.5 Flash API via REST.
- **Fallback Engine**: Local rule-based natural language generator.
- **Safety Enforcement**: Strict non-diagnostic system prompts and fallback text filters.
- **Localization**: Supports English (`en`) and Malayalam (`ml`).

---

## 🔒 Safety & Non-Diagnostic Principles

1. All scores and indicators are labeled as **rehabilitation monitoring metrics**, not medical diagnostic scores.
2. The AI generator operates under explicit guardrails: no disease diagnosis, no medication prescription, no claims of cure.
3. Every report card and dashboard screen includes clinical prototype disclaimers.
