from pydantic import BaseModel, Field
from typing import List, Optional

class SessionReportRequest(BaseModel):
    session_id: str
    movement_quality: float = Field(..., ge=0, le=100)
    trunk_lean_angle: float
    shoulder_hike_displacement: float
    torso_rotation_angle: float
    force: float
    reaction_time: float
    accuracy: float
    strike_consistency: float

class AIReportResponse(BaseModel):
    positiveObservations: List[str]
    measurableConcerns: List[str]
    sessionTrend: str
    therapistDiscussionPoints: List[str]
    disclaimer: str

class TelemetryData(BaseModel):
    force: float
    reactionTime: float
    accuracy: float
    strikeConsistency: float
    mode: str = "simulated"
