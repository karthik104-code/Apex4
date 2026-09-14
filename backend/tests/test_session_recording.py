import sys
import os
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import RecordedSessionPayload

class TestSessionRecordingSchema(unittest.TestCase):

    def test_recorded_session_payload_validation(self):
        """Test validation of structured recorded session payload object."""
        started = datetime.now(timezone.utc).isoformat()
        ended = datetime.now(timezone.utc).isoformat()

        payload = RecordedSessionPayload(
            sessionId="ses-1726327500000",
            startedAt=started,
            endedAt=ended,
            durationSeconds=120,
            telemetry={
                "leftForce": 140,
                "rightForce": 130,
                "rudder": 128,
                "force": 72.0,
                "reactionTime": 1.1,
                "accuracy": 92.0,
                "strikeConsistency": 88.0,
            },
            vision={
                "trunkLeanAngle": 2.5,
                "shoulderHikeDisplacement": 0.01,
                "torsoRotationAngle": 1.5,
                "overallStability": 91.0,
            },
            analytics={
                "movementQuality": 90.0,
                "compensationScore": 92.0,
                "performanceScore": 88.0,
                "combinedSessionScore": 89.0,
            },
            source="hardware",
            status="completed",
            sampleCount=120,
        )

        self.assertEqual(payload.sessionId, "ses-1726327500000")
        self.assertEqual(payload.source, "hardware")
        self.assertEqual(payload.status, "completed")
        self.assertEqual(payload.durationSeconds, 120)
        self.assertEqual(payload.telemetry["leftForce"], 140)

    def test_demo_source_session_payload(self):
        """Test payload validation for demo mode session."""
        started = datetime.now(timezone.utc).isoformat()
        ended = datetime.now(timezone.utc).isoformat()

        payload = RecordedSessionPayload(
            sessionId="ses-demo-999",
            startedAt=started,
            endedAt=ended,
            durationSeconds=60,
            source="demo",
            status="completed",
        )

        self.assertEqual(payload.sessionId, "ses-demo-999")
        self.assertEqual(payload.source, "demo")
        self.assertEqual(payload.status, "completed")

if __name__ == "__main__":
    unittest.main()
