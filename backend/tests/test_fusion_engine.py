import sys
import os
import unittest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.hardware.fusion import (
    HardwareSourceMetrics,
    VisionSourceMetrics,
    fuse_session_data,
    FusionModelStrategy,
    SessionDataFusionResult,
    DISCLAIMER_TEXT,
)

class TestBackendDataFusionLayer(unittest.TestCase):

    def test_data_source_separation_and_fusion(self):
        """Test that Source 1 (Hardware) and Source 2 (Vision) fuse into structured analytics."""
        hardware = HardwareSourceMetrics(
            leftForce=128,
            rightForce=95,
            rudder=135,
            force=70.0,
            reactionTime=1.1,
            accuracy=92.0,
            strikeConsistency=88.0,
        )

        vision = VisionSourceMetrics(
            trunkLeanAngle=2.5,
            trunkLeanLevel="low",
            shoulderHikeDisplacement=0.01,
            shoulderHikeLevel="low",
            torsoRotationAngle=1.5,
            torsoRotationLevel="low",
            movementStability=90.0,
            movementConsistency=92.0,
        )

        result = fuse_session_data(hardware, vision)

        # Verify structured outputs
        self.assertGreaterEqual(result.movementQuality, 85.0)
        self.assertEqual(result.movementCompensation.compensationLevel, "low")
        self.assertEqual(result.hardwarePerformance.leftForce, 128)
        self.assertEqual(result.hardwarePerformance.rightForce, 95)
        self.assertEqual(result.hardwarePerformance.rudder, 135)
        self.assertEqual(result.visionMetrics.trunkLeanAngle, 2.5)
        self.assertGreaterEqual(result.sessionAnalytics.combinedSessionScore, 85.0)
        self.assertIn("NOT clinically validated", result.disclaimer)

    def test_high_compensation_and_low_performance(self):
        """Test fusion behavior when vision detects high compensation and telemetry records low performance."""
        hardware = HardwareSourceMetrics(
            leftForce=30,
            rightForce=20,
            rudder=70,
            force=25.0,
            reactionTime=2.5,
            accuracy=45.0,
            strikeConsistency=40.0,
        )

        vision = VisionSourceMetrics(
            trunkLeanAngle=22.0,
            trunkLeanLevel="high",
            shoulderHikeDisplacement=0.15,
            shoulderHikeLevel="high",
            torsoRotationAngle=16.0,
            torsoRotationLevel="high",
            movementStability=50.0,
            movementConsistency=45.0,
        )

        result = fuse_session_data(hardware, vision)

        self.assertLess(result.movementQuality, 65.0)
        self.assertEqual(result.movementCompensation.compensationLevel, "high")
        self.assertLess(result.hardwarePerformance.performanceScore, 65.0)
        self.assertLess(result.sessionAnalytics.combinedSessionScore, 60.0)

    def test_medical_guardrails_and_forbidden_terms(self):
        """Ensure forbidden medical diagnostic claims and terms like 'Stroke Recovery Score' are completely absent."""
        hardware = HardwareSourceMetrics()
        vision = VisionSourceMetrics()
        result = fuse_session_data(hardware, vision)

        serialized = json.dumps(result.model_dump())
        self.assertNotIn("Stroke Recovery Score", serialized)
        self.assertIn("Movement Quality", serialized)
        self.assertIn("Movement Compensation", serialized)
        self.assertIn("Session Analytics", serialized)

    def test_model_pluggability(self):
        """Test model strategy pluggability for future ML model replacement."""
        class DummyMLStrategy(FusionModelStrategy):
            name = "Dummy-ML-Model-v2"

            def evaluate(self, hardware: HardwareSourceMetrics, vision: VisionSourceMetrics) -> SessionDataFusionResult:
                res = super().evaluate(hardware, vision)
                res.sessionAnalytics.insight = "Trained ML prediction model activated."
                return res

        hardware = HardwareSourceMetrics()
        vision = VisionSourceMetrics()
        result = fuse_session_data(hardware, vision, model=DummyMLStrategy())

        self.assertEqual(result.sessionAnalytics.insight, "Trained ML prediction model activated.")

if __name__ == "__main__":
    unittest.main()
