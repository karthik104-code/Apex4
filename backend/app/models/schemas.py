from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class SessionReportRequest(BaseModel):
    session_id: Optional[str] = "ses-default"
    movement_quality: float = Field(default=80.0, ge=0, le=100)
    accuracy: float = Field(default=85.0, ge=0, le=100)
    force: float = Field(default=65.0, ge=0, le=100)
    reaction_time: float = Field(default=1.2, ge=0.01)
    trunk_compensation: Optional[str] = "low"
    shoulder_compensation: Optional[str] = "low"
    rotation: Optional[str] = "low"
    trunk_lean_angle: Optional[float] = 0.0
    shoulder_hike_displacement: Optional[float] = 0.0
    torso_rotation_angle: Optional[float] = 0.0
    strike_consistency: Optional[float] = 85.0
    language: Optional[str] = "en"


class AIReportResponse(BaseModel):
    sessionSummary: str = "Session completed with stable movement metrics."
    movementObservations: List[str] = Field(default_factory=list)
    performanceSummary: Dict[str, Any] = Field(default_factory=dict)
    sessionTrend: str = "Stable movement baseline maintained."
    therapistDiscussionPoints: List[str] = Field(default_factory=list)
    positiveObservations: List[str] = Field(default_factory=list)
    measurableConcerns: List[str] = Field(default_factory=list)
    disclaimer: str = "AI-generated session insight. For rehabilitation professional review. Does not diagnose or prescribe treatment."
    label: str = "AI-generated session insight"
    sublabel: str = "For rehabilitation professional review."
    language: str = "en"



class TelemetryData(BaseModel):
    force: float
    reactionTime: float
    accuracy: float
    strikeConsistency: float
    mode: str = "simulated"


class HardwareStatusResponse(BaseModel):
    connected: bool = False
    pedalsConnected: bool = False
    arduinoConnected: bool = False
    port: Optional[str] = None
    mode: str = "demo"


class HardwareTelemetryPayload(BaseModel):
    connected: bool = False
    pedalsConnected: bool = False
    arduinoConnected: bool = False
    leftForce: int = 0
    rightForce: int = 0
    rudder: int = 0
    force: float = 0.0
    reactionTime: float = 0.0
    accuracy: float = 0.0
    strikeConsistency: float = 0.0
    timestamp: str
    source: str = "simulated"


class RecordedSessionPayload(BaseModel):
    sessionId: str
    startedAt: str
    endedAt: str
    durationSeconds: int = 0
    telemetry: Dict[str, Any] = Field(default_factory=dict)
    vision: Dict[str, Any] = Field(default_factory=dict)
    analytics: Dict[str, Any] = Field(default_factory=dict)
    source: str = "demo"  # "hardware" | "demo"
    status: str = "completed"  # "completed" | "invalid"
    sampleCount: Optional[int] = 0



class HardwareConnectRequest(BaseModel):
    port: Optional[str] = None
    baudRate: int = 9600


class HardwareCalibrateRequest(BaseModel):
    zeroLeft: Optional[int] = 0
    zeroRight: Optional[int] = 0


# Authentication & User Schemas
class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Any


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    medical_history: List[str] = []
    emergency_contact: Optional[str] = None
    language_preference: str = "en"


# Health Reports & Analytics
class StructuredReportResult(BaseModel):
    id: str
    file_name: str
    summary: str
    metrics: Dict[str, Any] = {}
    created_at: str


class ReportValue(BaseModel):
    value: Any
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[bool] = False


class ReportExplanationResponse(BaseModel):
    explanation: str
    disclaimer: str


# Clinical Appointments & Metrics
class Appointment(BaseModel):
    id: str
    patient_id: str
    doctor_name: str
    specialty: str
    appointment_date: str
    status: str = "scheduled"


class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str
    appointment_date: str


class HealthMetric(BaseModel):
    id: str
    metric_type: str
    value: float
    unit: str
    created_at: str


class MetricCreate(BaseModel):
    metric_type: str
    value: float
    unit: str


# Chat & Assistant Schemas
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    sources: List[Dict[str, str]] = []


class AssistantChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str


class AssistantChatResponse(BaseModel):
    conversation_id: str
    reply: str
    sources: List[Dict[str, str]] = []


class ConversationItem(BaseModel):
    id: str
    title: str
    created_at: str


class ChatMessage(BaseModel):
    id: str
    sender: str
    text: str
    created_at: str
    sources: List[Dict[str, str]] = []


class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    is_read: bool = False
    created_at: str
