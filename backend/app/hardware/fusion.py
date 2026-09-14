"""
APEX 4 — Session-Level Data Fusion Engine (Python Backend)

Fuses:
SOURCE 1 — HARDWARE TELEMETRY (leftForce, rightForce, rudder, force/performance metrics)
+
SOURCE 2 — COMPUTER VISION METRICS (trunk lean, shoulder hike, torso rotation, movement stability/consistency)
↓
DATA FUSION
↓
STRUCTURED MOVEMENT ANALYTICS

Non-Diagnostic Guardrails:
- No medical claims.
- Never use "Stroke Recovery Score".
- Use "Movement Quality", "Movement Compensation", "Movement Analysis", "Session Analytics".
- Clearly marked as prototype analytics.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

DISCLAIMER_TEXT = (
    "PROTOTYPE ANALYTICS: Sensor fusion scores are rule-based analytical metrics designed for progress "
    "tracking and performance evaluation. They are NOT clinically validated diagnostic medical scores."
)

class HardwareSourceMetrics(BaseModel):
    """Source 1 — Hardware Telemetry Data"""
    leftForce: int = 0
    rightForce: int = 0
    rudder: int = 128
    force: float = 0.0
    reactionTime: float = 1.2
    accuracy: float = 85.0
    strikeConsistency: float = 85.0

class VisionSourceMetrics(BaseModel):
    """Source 2 — Computer Vision Movement Metrics"""
    trunkLeanAngle: float = 0.0
    trunkLeanLevel: str = "low"
    shoulderHikeDisplacement: float = 0.0
    shoulderHikeLevel: str = "low"
    torsoRotationAngle: float = 0.0
    torsoRotationLevel: str = "low"
    movementStability: float = 85.0
    movementConsistency: float = 85.0

class MovementCompensationAnalytics(BaseModel):
    label: str = "Movement Compensation"
    compensationScore: float = 100.0
    compensationLevel: str = "low"
    summary: str = "Optimal movement symmetry detected."
    details: Dict[str, Any] = Field(default_factory=dict)

class HardwarePerformanceAnalytics(BaseModel):
    label: str = "APEX 4 Performance"
    performanceScore: float = 85.0
    leftForce: int = 0
    rightForce: int = 0
    rudder: int = 128
    force: float = 0.0
    reactionTime: float = 1.2
    accuracy: float = 85.0
    strikeConsistency: float = 85.0

class SessionAnalytics(BaseModel):
    label: str = "Session Analytics"
    combinedSessionScore: float = 85.0
    rating: str = "Optimal"
    insight: str = "Optimal movement symmetry paired with high actuator precision."
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SessionDataFusionResult(BaseModel):
    movementQualityLabel: str = "Movement Quality"
    movementQuality: float = 85.0
    movementCompensation: MovementCompensationAnalytics
    hardwarePerformance: HardwarePerformanceAnalytics
    visionMetrics: VisionSourceMetrics
    sessionAnalytics: SessionAnalytics
    disclaimer: str = DISCLAIMER_TEXT

class FusionModelStrategy:
    """Transparent Model Strategy interface. Easily replaceable with a trained ML model in the future."""
    name: str = "APEX-Python-RuleBased-Fusion-v1.0"
    version: str = "1.0.0"

    def evaluate(self, hardware: HardwareSourceMetrics, vision: VisionSourceMetrics) -> SessionDataFusionResult:
        # 1. Vision Movement Quality & Compensation
        lean_penalty = vision.trunkLeanAngle * 1.5
        hike_penalty = vision.shoulderHikeDisplacement * 180.0
        rot_penalty = vision.torsoRotationAngle * 1.2
        total_penalty = lean_penalty + hike_penalty + rot_penalty

        movement_quality = max(0.0, min(100.0, round(100.0 - total_penalty, 1)))
        compensation_score = max(0.0, min(100.0, round(100.0 - total_penalty * 1.2, 1)))

        levels = [vision.trunkLeanLevel.lower(), vision.shoulderHikeLevel.lower(), vision.torsoRotationLevel.lower()]
        compensation_level = "low"
        if "high" in levels:
            compensation_level = "high"
        elif "medium" in levels:
            compensation_level = "medium"

        high_comp_flags = []
        if vision.trunkLeanLevel.lower() != "low":
            high_comp_flags.append(f"Trunk Lean ({vision.trunkLeanAngle}°)")
        if vision.shoulderHikeLevel.lower() != "low":
            high_comp_flags.append("Shoulder Hike")
        if vision.torsoRotationLevel.lower() != "low":
            high_comp_flags.append(f"Torso Rotation ({vision.torsoRotationAngle}°)")

        summary = (
            f"Compensatory movement observed: {', '.join(high_comp_flags)}."
            if high_comp_flags
            else "Optimal movement symmetry detected."
        )

        comp_analytics = MovementCompensationAnalytics(
            compensationScore=compensation_score,
            compensationLevel=compensation_level,
            summary=summary,
            details={
                "trunkLean": {"angle": vision.trunkLeanAngle, "level": vision.trunkLeanLevel},
                "shoulderHike": {"displacement": vision.shoulderHikeDisplacement, "level": vision.shoulderHikeLevel},
                "torsoRotation": {"angle": vision.torsoRotationAngle, "level": vision.torsoRotationLevel},
            }
        )

        # 2. Hardware Performance
        rt = max(0.01, hardware.reactionTime)
        rt_score = max(20.0, min(100.0, round(100.0 - max(0.0, rt - 1.0) * 25.0, 1)))
        performance_score = round(hardware.accuracy * 0.4 + hardware.strikeConsistency * 0.3 + rt_score * 0.3, 1)

        hw_analytics = HardwarePerformanceAnalytics(
            performanceScore=performance_score,
            leftForce=hardware.leftForce,
            rightForce=hardware.rightForce,
            rudder=hardware.rudder,
            force=hardware.force,
            reactionTime=rt,
            accuracy=hardware.accuracy,
            strikeConsistency=hardware.strikeConsistency,
        )

        # 3. Combined Session Analytics
        stability = vision.movementStability
        combined_score = round(movement_quality * 0.50 + performance_score * 0.35 + stability * 0.15, 1)

        rating = "Optimal"
        if combined_score < 60:
            rating = "Needs Attention"
        elif combined_score < 75:
            rating = "Moderate"
        elif combined_score < 88:
            rating = "Good"

        if compensation_level == "low" and performance_score >= 75:
            insight = f"Optimal movement symmetry paired with high actuator precision ({performance_score}%)."
        elif compensation_level != "low" and performance_score >= 75:
            insight = f"Good actuator performance ({performance_score}%), but achieved with {compensation_level.upper()} body compensation."
        elif compensation_level == "low" and performance_score < 75:
            insight = f"Excellent posture control with LOW compensation, but reduced actuator response speed ({rt:.2f}s)."
        else:
            insight = f"{compensation_level.upper()} compensation detected alongside reduced strike performance ({performance_score}%)."

        sess_analytics = SessionAnalytics(
            combinedSessionScore=combined_score,
            rating=rating,
            insight=insight,
        )

        return SessionDataFusionResult(
            movementQuality=movement_quality,
            movementCompensation=comp_analytics,
            hardwarePerformance=hw_analytics,
            visionMetrics=vision,
            sessionAnalytics=sess_analytics,
            disclaimer=DISCLAIMER_TEXT,
        )

def fuse_session_data(hardware: HardwareSourceMetrics, vision: VisionSourceMetrics, model: Optional[FusionModelStrategy] = None) -> SessionDataFusionResult:
    """Session-level data fusion endpoint function."""
    engine = model or FusionModelStrategy()
    return engine.evaluate(hardware, vision)
