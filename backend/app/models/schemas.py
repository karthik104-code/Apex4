from pydantic import BaseModel, Field
from typing import List, Optional

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
    positiveObservations: List[str]
    measurableConcerns: List[str]
    sessionTrend: str
    therapistDiscussionPoints: List[str]
    disclaimer: str
    language: str = "en"

class TelemetryData(BaseModel):
    force: float
    reactionTime: float
    accuracy: float
    strikeConsistency: float
    mode: str = "simulated"
