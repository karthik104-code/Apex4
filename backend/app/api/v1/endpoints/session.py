from fastapi import APIRouter, HTTPException
from app.models.schemas import SessionReportRequest, AIReportResponse, TelemetryData
from app.ai.llm_report import generate_session_ai_report

router = APIRouter()

@router.post("/reports/generate", response_model=AIReportResponse)
def generate_report(req: SessionReportRequest):
    """Generate AI Clinical Session Report from fused vision + telemetry metrics."""
    return generate_session_ai_report(req)

@router.get("/sessions/history")
def get_session_history():
    """Return historical session data."""
    return [
        {
            "id": "s-demo-101",
            "patientId": "patient-01",
            "patientName": "Alex Mercer",
            "date": "2026-09-12",
            "durationSeconds": 240,
            "fusionScore": {
                "movementQuality": 82,
                "performanceScore": 84,
                "combinedSessionScore": 83,
                "compensationSummary": "Medium trunk lean detected."
            },
            "compensationMetrics": {
                "trunkLeanAngle": 12.4,
                "trunkLeanLevel": "medium",
                "shoulderHikeDisplacement": 0.06,
                "shoulderHikeLevel": "medium",
                "torsoRotationAngle": 5.2,
                "torsoRotationLevel": "low",
                "overallStability": 81
            },
            "telemetry": {
                "force": 64,
                "reactionTime": 1.24,
                "accuracy": 87,
                "strikeConsistency": 82,
                "mode": "simulated"
            },
            "status": "completed"
        }
    ]

@router.get("/hardware/telemetry", response_model=TelemetryData)
def get_hardware_telemetry():
    """Hardware API endpoint for physical MSV1 foot actuator data."""
    return TelemetryData(
        force=68.5,
        reactionTime=1.18,
        accuracy=89.0,
        strikeConsistency=86.0,
        mode="hardware"
    )
