from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- AUTH & USER ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "patient"

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "patient"
    age: Optional[int] = 32
    gender: Optional[str] = "Male"
    blood_group: Optional[str] = "O+"
    height_cm: Optional[float] = 175.0
    weight_kg: Optional[float] = 70.0
    medical_history: List[str] = []
    emergency_contact: Optional[str] = "+1 (555) 019-2834"
    language_preference: str = "en"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# --- MEDICAL REPORT & VALUES ---
class ReportValue(BaseModel):
    test_name: str
    value: str
    unit: str
    reference_range: str
    status: str  # 'normal', 'high', 'low', 'abnormal'
    category: Optional[str] = "General Lab"

class StructuredReportResult(BaseModel):
    id: str
    title: str
    report_type: str
    upload_date: str
    patient_name: str
    summary: str
    patient_explanation: str
    key_findings: List[str]
    abnormal_count: int
    extracted_values: List[ReportValue]
    recommended_questions: List[str]

class ReportExplanationResponse(BaseModel):
    report_id: str
    patient_explanation: str
    actionable_advice: List[str]
    questions_for_doctor: List[str]
    disclaimer: str

# --- APPOINTMENTS ---
class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str
    appointment_date: str
    time_slot: str
    location_type: str = "in_person"
    notes: Optional[str] = ""

class Appointment(BaseModel):
    id: str
    patient_id: str
    doctor_name: str
    specialty: str
    appointment_date: str
    time_slot: str
    location_type: str
    status: str  # 'scheduled', 'completed', 'cancelled'
    notes: Optional[str]
    follow_up_date: Optional[str]

# --- HEALTH METRICS & ANALYTICS ---
class MetricCreate(BaseModel):
    metric_type: str  # 'hemoglobin', 'glucose', 'blood_pressure_sys', 'cholesterol'
    value: float
    unit: str

class HealthMetric(BaseModel):
    id: str
    metric_type: str
    value: float
    unit: str
    recorded_at: str

# --- AI CHAT & VOICE ---
class ChatMessage(BaseModel):
    id: str
    sender: str  # 'user' | 'assistant'
    text: str
    created_at: str
    sources: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    report_id: Optional[str] = None
    language: Optional[str] = "en"  # 'en', 'ml', 'hi'

class ChatResponse(BaseModel):
    message_id: str
    conversation_id: str
    reply_text: str
    language: str
    sources: List[Dict[str, Any]] = []
    disclaimer: str

# --- NOTIFICATIONS ---
class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    type: str  # 'appointment', 'follow_up', 'report', 'AI_tip'
    is_read: bool = False
    created_at: str
