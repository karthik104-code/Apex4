import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Header
from app.models.schemas import (
    UserLogin, UserRegister, AuthResponse, UserProfile,
    StructuredReportResult, ReportExplanationResponse,
    Appointment, AppointmentCreate,
    HealthMetric, MetricCreate,
    ChatRequest, ChatResponse, NotificationItem
)
from app.documents.extractor import process_medical_document
from app.ai.llm_engine import generate_ai_health_response
from app.core.security import create_access_token, decode_access_token, SAFETY_DISCLAIMER

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
        # Populate initial sample report if list is empty
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

# --- AI ASSISTANT & CHAT ---
@router.post("/ai/chat", response_model=ChatResponse)
def chat_ai(payload: ChatRequest):
    report_ctx = None
    if payload.report_id:
        for r in DEMO_REPORTS:
            if r.id == payload.report_id:
                report_ctx = f"Report Findings: {', '.join(r.key_findings)}"
                break
    
    resp = generate_ai_health_response(
        query=payload.message, 
        report_context=report_ctx,
        language=payload.language or "en"
    )
    return ChatResponse(
        message_id=resp["message_id"],
        conversation_id=resp["conversation_id"],
        reply_text=resp["reply_text"],
        language=resp["language"],
        sources=resp["sources"],
        disclaimer=SAFETY_DISCLAIMER
    )

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
