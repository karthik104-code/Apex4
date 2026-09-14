from pydantic import BaseModel, Field
from typing import List, Optional

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
    positiveObservations: Optional[List[str]] = Field(default_factory=list)
    measurableConcerns: Optional[List[str]] = Field(default_factory=list)
    sessionTrend: Optional[str] = ""
    therapistDiscussionPoints: Optional[List[str]] = Field(default_factory=list)
    disclaimer: Optional[str] = ""

class TelemetryData(BaseModel):
    force: float
    reactionTime: float
    accuracy: float
    strikeConsistency: float
    mode: str = "simulated"

