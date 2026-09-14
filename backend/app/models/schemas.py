from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class SessionReportRequest(BaseModel):
    session_id: Optional[str] = "ses-default"
    patient_name: Optional[str] = "Alex Mercer"
    session_date: Optional[str] = "2026-09-14"
    session_duration_seconds: Optional[int] = 240
    movement_quality: float = Field(default=80.0, ge=0, le=100)
    accuracy: float = Field(default=85.0, ge=0, le=100)
    force: float = Field(default=65.0, ge=0, le=100)
    reaction_time: float = Field(default=1.2, ge=0.01)
    trunk_compensation: Optional[str] = "low"
    shoulder_compensation: Optional[str] = "low"
    rotation: Optional[str] = "low"
    trunk_lean_angle: Optional[float] = 0.0
    trunk_lean_direction: Optional[str] = "neutral"  # "left" | "right" | "neutral"
    anterior_inclination_ratio: Optional[float] = 0.0
    shoulder_hike_displacement: Optional[float] = 0.0
    torso_rotation_angle: Optional[float] = 0.0
    overall_stability: Optional[float] = 85.0
    strike_consistency: Optional[float] = 85.0
    left_force: Optional[float] = None
    right_force: Optional[float] = None
    pose_confidence: Optional[float] = 0.95
    is_pose_detected: Optional[bool] = True
    telemetry_mode: Optional[str] = "simulated"  # "hardware" | "simulated"
    connection_status: Optional[str] = "connected"
    task_name: Optional[str] = "MSV1 Actuator Target Strike"
    language: Optional[str] = "en"


class PosturalParameterAssessment(BaseModel):
    parameter: str
    observedValue: str
    referenceThreshold: str
    interpretation: str


class CompensationItem(BaseModel):
    pattern: str
    magnitude: str
    frequency: str
    phase: str
    details: str


class MotorPerformanceItem(BaseModel):
    metric: str
    value: str
    unit: str
    interpretation: str


class BilateralPerformance(BaseModel):
    leftValue: Optional[str] = None
    rightValue: Optional[str] = None
    difference: Optional[str] = None
    interpretation: str


class MovementQualitySection(BaseModel):
    score: float
    label: str = "APEX 4 Movement Quality Score"
    explanation: str


class AIReportResponse(BaseModel):
    sessionId: str = "ses-default"
    sessionDate: str = "2026-09-14"
    sessionDuration: str = "4m 0s"
    dataSource: str = "APEX 4 DEMO TELEMETRY"
    poseAnalysisSource: str = "MediaPipe Computer Vision Pose Estimation"
    sessionOverview: str
    posturalAssessment: List[PosturalParameterAssessment]
    movementCompensation: List[CompensationItem]
    motorPerformance: List[MotorPerformanceItem]
    bilateralPerformance: Optional[BilateralPerformance] = None
    movementQuality: MovementQualitySection
    temporalAnalysis: List[str]
    aiObservations: List[str]
    professionalReviewPoints: List[str]
    limitations: str
    safetyNotice: str
    language: str = "en"
    
    # Backward compatibility fields for legacy consumers
    sessionSummary: Optional[str] = "Session completed with stable movement metrics."
    movementObservations: Optional[List[str]] = Field(default_factory=list)
    performanceSummary: Optional[Dict[str, Any]] = Field(default_factory=dict)
    positiveObservations: Optional[List[str]] = Field(default_factory=list)
    measurableConcerns: Optional[List[str]] = Field(default_factory=list)
    sessionTrend: Optional[str] = ""
    therapistDiscussionPoints: Optional[List[str]] = Field(default_factory=list)
    disclaimer: Optional[str] = "AI-generated session insight. For rehabilitation professional review. Does not diagnose or prescribe treatment."
    label: Optional[str] = "AI-generated session insight"
    sublabel: Optional[str] = "For rehabilitation professional review."


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
