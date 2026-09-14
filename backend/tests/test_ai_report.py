import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import SessionReportRequest
from app.ai.llm_report import (
    generate_session_ai_report,
    generate_deterministic_fallback_report,
    format_structured_metrics_prompt,
    LABEL_INSIGHT,
    LABEL_REVIEW,
)

class TestAISessionReport(unittest.TestCase):

    def test_structured_metrics_prompt_formatting(self):
        """Test structured metrics text prompt formatting (NO video/images)."""
        req = SessionReportRequest(
            movement_quality=82.0,
            accuracy=87.0,
            force=64.0,
            reaction_time=1.24,
            trunk_compensation="medium",
            shoulder_compensation="low",
            rotation="low",
            strike_consistency=91.0,
            language="en"
        )
        prompt_text = format_structured_metrics_prompt(req)

        self.assertIn("Movement Quality: 82", prompt_text)
        self.assertIn("Trunk Lean: Medium", prompt_text)
        self.assertIn("Force: 64", prompt_text)
        self.assertIn("Reaction Time: 1.24 seconds", prompt_text)
        self.assertIn("Accuracy: 87%", prompt_text)
        self.assertIn("Consistency: 91%", prompt_text)
        self.assertIn("NO VIDEO DATA", prompt_text)

    def test_required_five_sections_and_labels(self):
        """Verify 5 required report sections & mandatory labels."""
        req = SessionReportRequest(
            movement_quality=82.0,
            accuracy=87.0,
            force=64.0,
            reaction_time=1.24,
            trunk_compensation="medium",
            shoulder_compensation="low",
            rotation="low",
            language="en"
        )
        report = generate_session_ai_report(req)

        # 1. Section 1: Session Summary
        self.assertTrue(len(report.sessionSummary) > 0, "Section 1: sessionSummary must be present")

        # 2. Section 2: Movement Observations
        self.assertTrue(len(report.movementObservations) > 0, "Section 2: movementObservations must be present")

        # 3. Section 3: Performance
        self.assertIsNotNone(report.performanceSummary, "Section 3: performanceSummary must be present")
        self.assertIn("actuatorForce", report.performanceSummary)

        # 4. Section 4: Trend
        self.assertTrue(len(report.sessionTrend) > 0, "Section 4: sessionTrend must be present")

        # 5. Section 5: Discussion Point for Therapist
        self.assertTrue(len(report.therapistDiscussionPoints) > 0, "Section 5: therapistDiscussionPoints must be present")

        # Required Labels
        self.assertEqual(report.label, "AI-generated session insight")
        self.assertEqual(report.sublabel, "For rehabilitation professional review.")

    def test_api_failure_fallback(self):
        """Test deterministic fallback engine during API failure or offline mode."""
        req = SessionReportRequest(
            movement_quality=75.0,
            accuracy=80.0,
            force=50.0,
            reaction_time=1.8,
            trunk_compensation="high",
            shoulder_compensation="medium",
            rotation="low",
            language="en"
        )
        report = generate_deterministic_fallback_report(req, "en")
        self.assertTrue(len(report.sessionSummary) > 0)
        self.assertTrue(len(report.movementObservations) > 0)
        self.assertEqual(report.label, LABEL_INSIGHT)
        self.assertEqual(report.sublabel, LABEL_REVIEW)

    def test_clinical_safety_compliance(self):
        """Test strict non-diagnostic clinical safety guardrails."""
        req = SessionReportRequest(
            movement_quality=40.0,
            accuracy=45.0,
            force=30.0,
            reaction_time=2.8,
            trunk_compensation="high",
            shoulder_compensation="high",
            rotation="high",
            language="en"
        )
        report = generate_session_ai_report(req)
        full_text = (
            report.sessionSummary + " " +
            " ".join(report.movementObservations) + " " +
            report.sessionTrend + " " +
            " ".join(report.therapistDiscussionPoints) + " " +
            report.disclaimer
        ).lower()

        forbidden_phrases = [
            "stroke diagnosis",
            "diagnose disease",
            "prescribe medication",
            "guaranteed recovery",
            "clinically validated diagnosis",
            "replaces physiotherapist"
        ]
        for term in forbidden_phrases:
            self.assertNotIn(term, full_text)

if __name__ == "__main__":
    unittest.main()
