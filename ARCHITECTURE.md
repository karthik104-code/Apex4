# MSV1 System Architecture Document

## Overview
MSV1 is an AI-assisted rehabilitation platform that transforms foot-operated carrom gameplay into a quantifiable therapeutic monitoring system for individuals with upper-limb motor impairments.

---

## Technical Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                │
│  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts  │
│                                                                         │
│  ┌────────────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ MediaPipe Pose Engine │  │ Compensation AI  │  │ Hardware Sim    │ │
│  │ (Client-side Vision)   │  │ Calculation      │  │ / API Adapter   │ │
│  └───────────┬────────────┘  └────────┬─────────┘  └────────┬────────┘ │
│              │                        │                     │          │
│              └────────────────────────┼─────────────────────┘          │
│                                       ▼                                │
│                         [Client-Side Sensor Fusion]                    │
│                                       │                                │
└───────────────────────────────────────┼────────────────────────────────┘
                                        │ REST / JSON
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                 │
│                   FastAPI (Python 3.12) REST API                        │
│                                                                         │
│  ┌────────────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ Session Analytics      │  │ Score Fusion     │  │ Generative AI   │ │
│  │ & History Store        │  │ Verification     │  │ Session Report  │ │
│  └────────────────────────┘  └──────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Perception Layer (Computer Vision)
- **Model**: MediaPipe Pose Landmarker running client-side inside HTML5 Canvas via `@mediapipe/tasks-vision` or MediaPipe Pose JS SDK.
- **Landmarks Evaluated**:
  - `LEFT_SHOULDER` (11), `RIGHT_SHOULDER` (12)
  - `LEFT_HIP` (23), `RIGHT_HIP` (24)
  - `NOSE` / `MID_SHOULDER` / `MID_HIP` (Spinal Alignment Vector)

## 2. Movement Compensation Layer
- **Trunk Lean Index**: Vector deflection of torso mid-line from calibrated vertical baseline $\theta_{\text{lean}} = \arccos(\vec{v}_{\text{spine}} \cdot \vec{v}_{\text{baseline}})$.
- **Shoulder Hike Index**: Asymmetry ratio $d_{\text{hike}} = \frac{|y_{\text{left\_shoulder}} - y_{\text{right\_shoulder}}|}{W_{\text{shoulder\_baseline}}}$.
- **Torso Rotation Index**: Angular discrepancy between shoulder line and hip line vectors in 2D projection.
- **Normalization**: Normalized against shoulder width $W_{\text{shoulder\_baseline}}$ to compensate for camera distance variations.

## 3. Hardware Telemetry & Sensor Fusion Layer
- **MSV1 Metrics**:
  - `Force` ($N$ / $0-100\%$)
  - `Reaction Time` ($s$)
  - `Accuracy` ($\%$)
  - `Strike Consistency` ($\%$)
- **Fusion Formula**:
  $$\text{Movement Quality} = \max(0, 100 - (\lambda_1 \cdot \text{Lean} + \lambda_2 \cdot \text{Hike} + \lambda_3 \cdot \text{Rotation}))$$
  $$\text{Session Score} = 0.5 \cdot \text{Movement Quality} + 0.3 \cdot \text{Accuracy} + 0.2 \cdot \text{Consistency}$$

## 4. Generative AI Layer
- Structured JSON prompt fed to Gemini LLM (with fallback local response generator).
- Generates 4-part concise clinical session summary:
  1. *Positive Observations*
  2. *Measurable Compensation Concerns*
  3. *Session Performance Trend*
  4. *Therapist Discussion Point*

---

## Clinical Safety & Disclaimer
> *"This prototype is designed for rehabilitation monitoring and research demonstration. It is not a diagnostic system and does not replace assessment or clinical decisions by qualified healthcare professionals."*
