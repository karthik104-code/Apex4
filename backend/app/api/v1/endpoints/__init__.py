import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Header
from app.models.schemas import (
    UserLogin, UserRegister, AuthResponse, UserProfile,
    StructuredReportResult, ReportExplanationResponse,
    Appointment, AppointmentCreate,
    HealthMetric, MetricCreate,
    ChatRequest, ChatResponse, AssistantChatRequest, AssistantChatResponse,
    ConversationItem, ChatMessage, NotificationItem
)
from app.documents.extractor import process_medical_document
from app.ai.llm_engine import generate_ai_health_response
from app.ai.provider import get_ai_provider, SAFETY_DISCLAIMER
from app.core.security import create_access_token, decode_access_token
from app.rag.service import ingest_patient_report, query_rag_pipeline
from app.voice.provider import get_stt_provider, get_tts_provider

from .session import router as session_router
from .hardware import router as hardware_router

router = APIRouter()
router.include_router(session_router)
router.include_router(hardware_router, prefix="/hardware", tags=["Hardware Bridge"])


# --- IN-MEMORY DEMO DATABASE STORE ---
DEMO_USER = UserProfile(
    id="user-demo-101",
    email="patient@healthcare.ai",
    full_name="John Doe",
    role="patient",
    age=34,
    gender="Male",
    blood_group="O+",
    height_cm=176.0,
    weight_kg=72.5,
    medical_history=["Mild Seasonal Allergies", "Borderline Anemia (2025)"],
    emergency_contact="+1 (555) 019-2834",
    language_preference="en"
)

DEMO_REPORTS: List[StructuredReportResult] = []

DEMO_CONVERSATIONS: List[ConversationItem] = [
    ConversationItem(
        id="conv-101",
        title="Hemoglobin & Iron Diet Advice",
        created_at="2026-09-10 14:30"
    ),
    ConversationItem(
        id="conv-102",
        title="Fasting Glucose Preparation",
        created_at="2026-09-08 09:15"
    )
]

DEMO_MESSAGES: Dict[str, List[ChatMessage]] = {
    "conv-101": [
        ChatMessage(
            id="m-1",
            sender="user",
            text="What dietary steps can help improve my low hemoglobin levels?",
            created_at="14:30"
        ),
        ChatMessage(
            id="m-2",
            sender="assistant",
            text="### Understanding Low Hemoglobin & Iron Intake\n\nYour hemoglobin level (10.2 g/dL) is slightly below the standard reference range (12.0 - 16.5 g/dL).\n\n**Key Recommendations:**\n1. **Iron-Rich Foods**: Spinach, lentils, beans, dark leafy greens, and lean meats.\n2. **Vitamin C**: Pair iron-rich meals with Vitamin C (oranges, lemons, bell peppers) to boost absorption.\n3. **Consult Physician**: Please discuss with your doctor to check serum ferritin levels.",
            created_at="14:31",
            sources=[
                {"source": "WHO Clinical Guidelines 2024", "snippet": "Mild anemia can be supported with dietary iron and Vitamin C intake."}
            ]
        )
    ],
    "conv-102": [
        ChatMessage(
            id="m-3",
            sender="user",
            text="How do I prepare for a fasting blood sugar test?",
            created_at="09:15"
        ),
        ChatMessage(
            id="m-4",
            sender="assistant",
            text="### Fasting Blood Glucose Test Preparation\n\nFast for at least 8 to 12 hours prior to your blood draw. You may drink plain water, but avoid coffee, tea, juices, or food.",
            created_at="09:16",
            sources=[
                {"source": "American Diabetes Association Standard of Care", "snippet": "Fasting blood glucose testing requires 8-12 hours of overnight fasting."}
            ]
        )
    ]
}

DEMO_APPOINTMENTS: List[Appointment] = [
    Appointment(
        id="apt-101",
        patient_id="user-demo-101",
        doctor_name="Dr. Sarah Jenkins, MD",
        specialty="General Endocrinology & Internal Medicine",
        appointment_date=(datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
        status="scheduled"
    ),
    Appointment(
        id="apt-102",
        patient_id="user-demo-101",
        doctor_name="Dr. Rajesh Kumar",
        specialty="Cardiology Specialist",
        appointment_date=(datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
        status="completed"
    )
]

DEMO_METRICS: List[HealthMetric] = [
    HealthMetric(id="m1", metric_type="hemoglobin", value=11.5, unit="g/dL", created_at="2026-01-15"),
    HealthMetric(id="m2", metric_type="hemoglobin", value=10.8, unit="g/dL", created_at="2026-05-10"),
    HealthMetric(id="m3", metric_type="hemoglobin", value=10.2, unit="g/dL", created_at="2026-09-01"),
]

DEMO_NOTIFICATIONS: List[NotificationItem] = [
    NotificationItem(
        id="notif-1",
        title="Upcoming Doctor Appointment",
        message="Consultation with Dr. Sarah Jenkins scheduled for 10:30 AM in 3 days.",
        is_read=False,
        created_at="10 mins ago"
    )
]

# --- AUTH ENDPOINTS ---
@router.post("/auth/login", response_model=AuthResponse)
def login(payload: UserLogin):
    token = create_access_token({"sub": DEMO_USER.id, "email": payload.email})
    return AuthResponse(access_token=token, user=DEMO_USER)

@router.post("/auth/register", response_model=AuthResponse)
def register(payload: UserRegister):
    user = UserProfile(
        id=str(uuid.uuid4()),
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role or "patient"
    )
    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(access_token=token, user=user)

@router.get("/auth/me", response_model=UserProfile)
def get_current_user():
    return DEMO_USER

@router.get("/reports/", response_model=List[StructuredReportResult])
def list_reports():
    return DEMO_REPORTS
