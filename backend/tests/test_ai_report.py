import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import SessionReportRequest
from app.ai.llm_report import (
    generate_session_ai_report,
    generate_deterministic_clinical_report,
    format_structured_metrics_prompt,
    LIMITATIONS_TEXT_EN,
    SAFETY_NOTICE_EN,
)


class TestAISessionReport(unittest.TestCase):

    def test_case_1_normal_stable_session(self):
        req = SessionReportRequest(
            session_id="ses-101",
            movement_quality=92.0,
            accuracy=94.0,
            force=60.0,
            reaction_time=1.10,
            trunk_compensation="low",
            trunk_lean_angle=2.1,
            trunk_lean_direction="neutral",
            anterior_inclination_ratio=0.08,
            shoulder_hike_displacement=0.02,
            torso_rotation_angle=2.5,
            overall_stability=95.0,
            strike_consistency=92.0,
            telemetry_mode="hardware",
            language="en"
        )
        report = generate_session_ai_report(req)
        self.assertEqual(report.dataSource, "REAL HARDWARE")
        self.assertIn("Movement Quality", report.sessionOverview)
        self.assertEqual(len(report.posturalAssessment), 5)
        self.assertEqual(report.movementQuality.score, 92.0)
        self.assertIn("prototype composite metric", report.movementQuality.explanation)

    def test_case_2_right_lateral_trunk_deviation(self):
        req = SessionReportRequest(
            trunk_lean_angle=12.4,
            trunk_lean_direction="right",
            trunk_compensation="medium",
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        lat_item = next(p for p in report.posturalAssessment if p.parameter == "Lateral Trunk Alignment")
        self.assertIn("Lateral trunk deviation toward the right", lat_item.interpretation)
        self.assertTrue(any("lateral trunk compensation (right)" in c.pattern for c in report.movementCompensation))
        self.assertTrue(any("lateral trunk deviation toward the right" in pt.lower() for pt in report.professionalReviewPoints))

    def test_case_3_left_lateral_trunk_deviation(self):
        req = SessionReportRequest(
            trunk_lean_angle=14.1,
            trunk_lean_direction="left",
            trunk_compensation="high",
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        lat_item = next(p for p in report.posturalAssessment if p.parameter == "Lateral Trunk Alignment")
        self.assertIn("Lateral trunk deviation toward the left", lat_item.interpretation)
        self.assertTrue(any("lateral trunk compensation (left)" in c.pattern for c in report.movementCompensation))

    def test_case_4_anterior_trunk_inclination(self):
        req = SessionReportRequest(
            anterior_inclination_ratio=0.28,
            trunk_compensation="medium",
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        ant_item = next(p for p in report.posturalAssessment if p.parameter == "Anterior Trunk Inclination")
        self.assertIn("anterior trunk inclination", ant_item.interpretation.lower())
        self.assertTrue(any("anterior trunk compensation" in c.pattern for c in report.movementCompensation))

    def test_case_5_shoulder_elevation_asymmetry(self):
        req = SessionReportRequest(
            shoulder_hike_displacement=0.082,
            shoulder_compensation="high",
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        sh_item = next(p for p in report.posturalAssessment if p.parameter == "Bilateral Shoulder Alignment")
        self.assertIn("Bilateral shoulder elevation asymmetry", sh_item.interpretation)
        self.assertTrue(any("shoulder elevation compensation" in c.pattern for c in report.movementCompensation))

    def test_case_6_torso_rotation(self):
        req = SessionReportRequest(
            torso_rotation_angle=11.3,
            rotation="high",
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        rot_item = next(p for p in report.posturalAssessment if p.parameter == "Torso Rotation")
        self.assertIn("Trunk rotation", rot_item.interpretation)
        self.assertTrue(any("torso rotation" in c.pattern.lower() for c in report.movementCompensation))

    def test_case_7_bilateral_force_output_asymmetry(self):
        req = SessionReportRequest(
            left_force=163.0,
            right_force=71.0,
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        self.assertIsNotNone(report.bilateralPerformance)
        self.assertIn("Bilateral force-output asymmetry", report.bilateralPerformance.interpretation)
        forbidden = ["weakness", "hemiparesis", "stroke", "deficit", "palsy"]
        for word in forbidden:
            self.assertNotIn(word, report.bilateralPerformance.interpretation.lower())

    def test_case_8_high_reaction_latency(self):
        req = SessionReportRequest(
            reaction_time=2.45,
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        rt_item = next(m for m in report.motorPerformance if m.metric == "Reaction Latency")
        self.assertIn("Increased reaction latency", rt_item.interpretation)

    def test_case_9_low_pose_confidence(self):
        req = SessionReportRequest(
            pose_confidence=0.42,
            is_pose_detected=True,
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        self.assertIn("limited by intermittent pose landmark", report.sessionOverview)

    def test_case_10_demo_vs_real_data_source(self):
        req_demo = SessionReportRequest(telemetry_mode="simulated")
        report_demo = generate_deterministic_clinical_report(req_demo, "en")
        self.assertEqual(report_demo.dataSource, "APEX 4 DEMO TELEMETRY")

        req_real = SessionReportRequest(telemetry_mode="hardware")
        report_real = generate_deterministic_clinical_report(req_real, "en")
        self.assertEqual(report_real.dataSource, "REAL HARDWARE")

    def test_case_11_clinical_safety_boundaries(self):
        req = SessionReportRequest(
            movement_quality=35.0,
            accuracy=40.0,
            force=25.0,
            reaction_time=3.1,
            trunk_compensation="high",
            shoulder_compensation="high",
            rotation="high",
            left_force=180.0,
            right_force=40.0,
            language="en"
        )
        report = generate_deterministic_clinical_report(req, "en")
        combined = (
            report.sessionOverview + " " +
            " ".join(p.interpretation for p in report.posturalAssessment) + " " +
            " ".join(c.details for c in report.movementCompensation) + " " +
            " ".join(m.interpretation for m in report.motorPerformance) + " " +
            " ".join(report.aiObservations) + " " +
            " ".join(report.professionalReviewPoints) + " " +
            report.safetyNotice
        ).lower()

        forbidden_diagnoses = [
            "stroke", "hemiplegia", "hemiparesis", "parkinson", "cerebral palsy",
            "multiple sclerosis", "neuropathy", "muscle weakness", "spasticity", "ataxia"
        ]
        for term in forbidden_diagnoses:
            self.assertNotIn(term, combined)

        self.assertTrue(
            "may warrant professional review" in " ".join(report.professionalReviewPoints).lower() or
            "consider reviewing" in " ".join(report.professionalReviewPoints).lower()
        )

    def test_case_12_malayalam_clinical_translation(self):
        req = SessionReportRequest(
            movement_quality=84.0,
            accuracy=89.0,
            force=70.0,
            reaction_time=1.15,
            trunk_lean_angle=10.2,
            trunk_lean_direction="right",
            language="ml"
        )
        report = generate_deterministic_clinical_report(req, "ml")
        self.assertEqual(report.language, "ml")
        self.assertEqual(len(report.posturalAssessment), 5)
        self.assertIn("ചലന നിലവാരം", report.sessionOverview)
        self.assertIn("രോഗനിർണ്ണയമല്ല", report.safetyNotice)


if __name__ == "__main__":
    unittest.main()
