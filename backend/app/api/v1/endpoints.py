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

router = APIRouter()

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
        time_slot="10:30 AM",
        location_type="in_person",
        status="scheduled",
        notes="Review blood glucose & iron laboratory panel findings.",
        follow_up_date=(datetime.now() + timedelta(days=17)).strftime("%Y-%m-%d")
    ),
    Appointment(
        id="apt-102",
        patient_id="user-demo-101",
        doctor_name="Dr. Rajesh Kumar",
        specialty="Cardiology Specialist",
        appointment_date=(datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
        time_slot="02:15 PM",
        location_type="telehealth",
        status="completed",
        notes="Routine cardiovascular lipid check.",
        follow_up_date=(datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d")
    )
]

DEMO_METRICS: List[HealthMetric] = [
    HealthMetric(id="m1", metric_type="hemoglobin", value=11.5, unit="g/dL", recorded_at="2026-01-15"),
    HealthMetric(id="m2", metric_type="hemoglobin", value=10.8, unit="g/dL", recorded_at="2026-05-10"),
    HealthMetric(id="m3", metric_type="hemoglobin", value=10.2, unit="g/dL", recorded_at="2026-09-01"),
    HealthMetric(id="m4", metric_type="glucose", value=110.0, unit="mg/dL", recorded_at="2026-01-15"),
    HealthMetric(id="m5", metric_type="glucose", value=132.0, unit="mg/dL", recorded_at="2026-05-10"),
    HealthMetric(id="m6", metric_type="glucose", value=145.0, unit="mg/dL", recorded_at="2026-09-01"),
    HealthMetric(id="m7", metric_type="cholesterol", value=190.0, unit="mg/dL", recorded_at="2026-01-15"),
    HealthMetric(id="m8", metric_type="cholesterol", value=210.0, unit="mg/dL", recorded_at="2026-09-01"),
]

DEMO_NOTIFICATIONS: List[NotificationItem] = [
    NotificationItem(
        id="notif-1",
        title="Upcoming Doctor Appointment",
        message="Consultation with Dr. Sarah Jenkins scheduled for 10:30 AM in 3 days.",
        type="appointment",
        is_read=False,
        created_at="10 mins ago"
    ),
    NotificationItem(
        id="notif-2",
        title="Abnormal Lab Indicator Alert",
        message="Hemoglobin (10.2 g/dL) is below standard threshold. View AI explanation.",
        type="report",
        is_read=False,
        created_at="2 hours ago"
    ),
    NotificationItem(
        id="notif-3",
        title="Follow-Up Iron Supplement Reminder",
        message="Take evening dietary supplement with Vitamin C.",
        type="follow_up",
        is_read=True,
        created_at="Yesterday"
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

# --- REPORT PROCESSING ENDPOINTS ---
@router.post("/reports/upload", response_model=StructuredReportResult)
async def upload_report(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    content = await file.read()
    result = process_medical_document(content, file.filename)
    DEMO_REPORTS.insert(0, result)
    return result

@router.get("/reports/", response_model=List[StructuredReportResult])
def list_reports():
    if not DEMO_REPORTS:
        sample = process_medical_document(b"Sample Blood Panel", "sample_lab_report.pdf")
        DEMO_REPORTS.append(sample)
    return DEMO_REPORTS

@router.get("/reports/{report_id}", response_model=StructuredReportResult)
def get_report(report_id: str):
    for r in DEMO_REPORTS:
        if r.id == report_id:
            return r
    if DEMO_REPORTS:
        return DEMO_REPORTS[0]
    sample = process_medical_document(b"Sample Blood Panel", "sample_lab_report.pdf")
    return sample

# --- PHASE 2: AI HEALTHCARE ASSISTANT ENDPOINTS ---
@router.post("/assistant/chat", response_model=AssistantChatResponse)
@router.post("/ai/chat", response_model=ChatResponse)
def assistant_chat(payload: AssistantChatRequest):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    conv_id = payload.conversation_id or f"conv-{uuid.uuid4().hex[:6]}"
    
    # Store user message
    user_msg = ChatMessage(
        id=f"msg-{uuid.uuid4().hex[:6]}",
        sender="user",
        text=payload.message,
        created_at=datetime.now().strftime("%H:%M")
    )
    
    if conv_id not in DEMO_MESSAGES:
        DEMO_MESSAGES[conv_id] = []
        new_conv = ConversationItem(
            id=conv_id,
            title=payload.message[:30] + ("..." if len(payload.message) > 30 else ""),
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M")
        )
        DEMO_CONVERSATIONS.insert(0, new_conv)

    DEMO_MESSAGES[conv_id].append(user_msg)

    # Use AI Provider abstraction (LLM or Mock fallback)
    provider = get_ai_provider()
    result = provider.generate_chat_response(
        message=payload.message,
        conversation_id=conv_id,
        language=payload.language or "en"
    )

    # Store assistant message
    asst_msg = ChatMessage(
        id=f"msg-{uuid.uuid4().hex[:6]}",
        sender="assistant",
        text=result["answer"],
        created_at=datetime.now().strftime("%H:%M"),
        sources=result["sources"]
    )
    DEMO_MESSAGES[conv_id].append(asst_msg)

    return AssistantChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        disclaimer=result["disclaimer"]
    )

@router.get("/assistant/conversations", response_model=List[ConversationItem])
def list_conversations():
    return DEMO_CONVERSATIONS

@router.post("/assistant/conversations/new", response_model=ConversationItem)
def create_new_conversation():
    new_conv = ConversationItem(
        id=f"conv-{uuid.uuid4().hex[:6]}",
        title="New Healthcare Chat",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    DEMO_CONVERSATIONS.insert(0, new_conv)
    DEMO_MESSAGES[new_conv.id] = []
    return new_conv

@router.get("/assistant/conversations/{conv_id}/messages", response_model=List[ChatMessage])
def get_conversation_messages(conv_id: str):
    if conv_id not in DEMO_MESSAGES:
        return []
    return DEMO_MESSAGES[conv_id]

@router.get("/ai/suggested-questions", response_model=List[str])
def suggested_questions():
    return [
        "What dietary steps can help improve low hemoglobin?",
        "How do I prepare for a fasting blood sugar test?",
        "What questions should I ask my doctor about my cholesterol?",
        "What are natural ways to boost Vitamin D absorption?",
        "Can exercise help reduce fasting glucose levels?"
    ]

# --- APPOINTMENTS ---
@router.get("/appointments/", response_model=List[Appointment])
def list_appointments():
    return DEMO_APPOINTMENTS

@router.post("/appointments/create", response_model=Appointment)
def create_appointment(payload: AppointmentCreate):
    apt = Appointment(
        id=f"apt-{uuid.uuid4().hex[:6]}",
        patient_id=DEMO_USER.id,
        doctor_name=payload.doctor_name,
        specialty=payload.specialty,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        location_type=payload.location_type,
        status="scheduled",
        notes=payload.notes or "",
        follow_up_date=(datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    )
    DEMO_APPOINTMENTS.insert(0, apt)
    return apt

# --- HEALTH METRICS & ANALYTICS ---
@router.get("/analytics/vitals", response_model=List[HealthMetric])
def get_vitals():
    return DEMO_METRICS

@router.post("/analytics/vitals/log", response_model=HealthMetric)
def log_vital(payload: MetricCreate):
    m = HealthMetric(
        id=f"m-{uuid.uuid4().hex[:6]}",
        metric_type=payload.metric_type,
        value=payload.value,
        unit=payload.unit,
        recorded_at=datetime.now().strftime("%Y-%m-%d")
    )
    DEMO_METRICS.append(m)
    return m

# --- NOTIFICATIONS ---
@router.get("/notifications/", response_model=List[NotificationItem])
def get_notifications():
    return DEMO_NOTIFICATIONS
