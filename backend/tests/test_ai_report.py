import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import SessionReportRequest
from app.ai.llm_report import generate_session_ai_report, generate_deterministic_clinical_report

def assert_true(cond, msg):
    if not cond:
        raise AssertionError(f"Test Failed: {msg}")

def test_case_1_normal_stable_session():
    print("[CASE 1] Normal / stable session report...")
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
    assert_true(report.dataSource == "REAL HARDWARE", "Data source should be REAL HARDWARE")
    assert_true("Movement Quality" in report.sessionOverview, "Session overview includes movement quality")
    assert_true(len(report.posturalAssessment) == 5, "5 postural parameters assessed")
    assert_true(report.movementQuality.score == 92.0, "Movement quality score matches")
    assert_true("prototype composite metric" in report.movementQuality.explanation, "Movement quality monitoring disclaimer present")
    print("  [PASS] Case 1 passed: Normal stable session accurately documented.")

def test_case_2_right_lateral_trunk_deviation():
    print("[CASE 2] Right lateral trunk deviation...")
    req = SessionReportRequest(
        trunk_lean_angle=12.4,
        trunk_lean_direction="right",
        trunk_compensation="medium",
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    lat_item = next(p for p in report.posturalAssessment if p.parameter == "Lateral Trunk Alignment")
    assert_true("Lateral trunk deviation toward the right" in lat_item.interpretation, "Uses exact clinical term 'Lateral trunk deviation toward the right'")
    assert_true(any("lateral trunk compensation (right)" in c.pattern for c in report.movementCompensation), "Identifies lateral trunk compensation right")
    assert_true(any("lateral trunk deviation toward the right" in pt.lower() for pt in report.professionalReviewPoints), "Review point flags lateral trunk deviation right")
    print("  [PASS] Case 2 passed: Right lateral trunk deviation uses precise clinical terminology.")

def test_case_3_left_lateral_trunk_deviation():
    print("[CASE 3] Left lateral trunk deviation...")
    req = SessionReportRequest(
        trunk_lean_angle=14.1,
        trunk_lean_direction="left",
        trunk_compensation="high",
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    lat_item = next(p for p in report.posturalAssessment if p.parameter == "Lateral Trunk Alignment")
    assert_true("Lateral trunk deviation toward the left" in lat_item.interpretation, "Uses exact clinical term 'Lateral trunk deviation toward the left'")
    assert_true(any("lateral trunk compensation (left)" in c.pattern for c in report.movementCompensation), "Identifies lateral trunk compensation left")
    print("  [PASS] Case 3 passed: Left lateral trunk deviation uses precise clinical terminology.")

def test_case_4_anterior_trunk_inclination():
    print("[CASE 4] Anterior trunk inclination...")
    req = SessionReportRequest(
        anterior_inclination_ratio=0.28,
        trunk_compensation="medium",
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    ant_item = next(p for p in report.posturalAssessment if p.parameter == "Anterior Trunk Inclination")
    assert_true("anterior trunk inclination" in ant_item.interpretation.lower(), "Uses exact clinical term 'anterior trunk inclination'")
    assert_true(any("anterior trunk compensation" in c.pattern for c in report.movementCompensation), "Identifies anterior trunk compensation")
    print("  [PASS] Case 4 passed: Anterior trunk inclination accurately identified.")

def test_case_5_shoulder_elevation_asymmetry():
    print("[CASE 5] Bilateral shoulder elevation asymmetry...")
    req = SessionReportRequest(
        shoulder_hike_displacement=0.082,
        shoulder_compensation="high",
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    shld_item = next(p for p in report.posturalAssessment if p.parameter == "Bilateral Shoulder Alignment")
    assert_true("Bilateral shoulder elevation asymmetry" in shld_item.interpretation, "Uses exact clinical term 'Bilateral shoulder elevation asymmetry'")
    assert_true(any("shoulder elevation compensation" in c.pattern for c in report.movementCompensation), "Identifies shoulder elevation compensation")
    print("  [PASS] Case 5 passed: Bilateral shoulder elevation asymmetry mapped accurately.")

def test_case_6_torso_rotation():
    print("[CASE 6] Torso rotation...")
    req = SessionReportRequest(
        torso_rotation_angle=11.5,
        rotation="medium",
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    rot_item = next(p for p in report.posturalAssessment if p.parameter == "Torso Rotation")
    assert_true("Trunk rotation" in rot_item.interpretation, "Uses exact clinical term 'Trunk rotation'")
    assert_true(any("excessive torso rotation" in c.pattern for c in report.movementCompensation), "Identifies excessive torso rotation")
    print("  [PASS] Case 6 passed: Torso rotation mapped accurately.")

def test_case_7_bilateral_force_output_asymmetry():
    print("[CASE 7] Bilateral force-output asymmetry...")
    req = SessionReportRequest(
        left_force=163.0,
        right_force=71.0,
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    assert_true(report.bilateralPerformance is not None, "Bilateral performance section generated")
    assert_true("Bilateral force-output asymmetry" in report.bilateralPerformance.interpretation, "Uses exact clinical term 'Bilateral force-output asymmetry'")
    assert_true("92.0 units" in report.bilateralPerformance.difference, "Computes exact difference")
    # Verify it does NOT diagnose muscle weakness or paralysis
    full_text = report.bilateralPerformance.interpretation.lower()
    assert_true("weakness" not in full_text and "paralysis" not in full_text and "hemiparesis" not in full_text, "No medical diagnosis inferred from force difference")
    print("  [PASS] Case 7 passed: Bilateral force asymmetry reported without unsupported diagnosis.")

def test_case_8_high_reaction_latency():
    print("[CASE 8] Increased reaction latency...")
    req = SessionReportRequest(
        reaction_time=2.45,
        strike_consistency=58.0,
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    rt_item = next(m for m in report.motorPerformance if m.metric == "Reaction Latency")
    assert_true("Increased reaction latency" in rt_item.interpretation, "Uses exact term 'Increased reaction latency'")
    print("  [PASS] Case 8 passed: Reaction latency mapped to objective clinical terminology.")

def test_case_9_low_pose_confidence():
    print("[CASE 9] Low pose confidence handling...")
    req = SessionReportRequest(
        pose_confidence=0.35,
        is_pose_detected=False,
        language="en"
    )
    report = generate_deterministic_clinical_report(req, "en")
    assert_true("tracking conditions" in " ".join(report.temporalAnalysis).lower() or "limited" in report.sessionOverview.lower(), "Acknowledges tracking limitations")
    print("  [PASS] Case 9 passed: Low pose confidence handled with appropriate qualification.")

def test_case_10_demo_vs_real_data_source():
    print("[CASE 10] Demo Telemetry vs Real Hardware labeling...")
    demo_req = SessionReportRequest(telemetry_mode="simulated")
    demo_rep = generate_deterministic_clinical_report(demo_req, "en")
    assert_true(demo_rep.dataSource == "APEX 4 DEMO TELEMETRY", "Labels demo telemetry explicitly")

    hw_req = SessionReportRequest(telemetry_mode="hardware")
    hw_rep = generate_deterministic_clinical_report(hw_req, "en")
    assert_true(hw_rep.dataSource == "REAL HARDWARE", "Labels real hardware explicitly")
    print("  [PASS] Case 10 passed: Clear data source labeling enforced.")

def test_case_11_clinical_safety_boundaries():
    print("[CASE 11] Safety boundaries & non-diagnostic language...")
    req = SessionReportRequest(
        movement_quality=35.0,
        accuracy=40.0,
        force=25.0,
        reaction_time=3.1,
        trunk_compensation="high",
        trunk_lean_angle=18.5,
        shoulder_compensation="high",
        rotation="high",
        left_force=150.0,
        right_force=40.0,
        language="en"
    )
    report = generate_session_ai_report(req)
    combined = (
        report.sessionOverview + " " +
        " ".join(p.interpretation for p in report.posturalAssessment) + " " +
        " ".join(c.details for c in report.movementCompensation) + " " +
        " ".join(report.aiObservations) + " " +
        " ".join(report.professionalReviewPoints) + " " +
        report.limitations + " " +
        report.safetyNotice
    ).lower()

    forbidden_diagnoses = [
        "stroke", "hemiparesis", "hemiplegia", "parkinson", "cerebral palsy",
        "multiple sclerosis", "neuropathy", "muscle weakness", "spasticity",
        "ataxia", "prescribe", "replaces physiotherapist", "cure"
    ]
    for term in forbidden_diagnoses:
        assert_true(term not in combined, f"Forbidden diagnostic term '{term}' must NOT appear in output")

    assert_true("may warrant professional review" in " ".join(report.professionalReviewPoints).lower() or "consider reviewing" in " ".join(report.professionalReviewPoints).lower(), "Review points phrased as suggestions for professional review")
    print("  [PASS] Case 11 passed: Complete safety compliance verified.")

def test_case_12_malayalam_clinical_translation():
    print("[CASE 12] Malayalam clinical report generation...")
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
    assert_true(report.language == "ml", "Language is 'ml'")
    assert_true(len(report.posturalAssessment) == 5, "5 Malayalam postural items")
    assert_true("ചലന നിലവാരം" in report.sessionOverview, "Malayalam overview generated")
    assert_true("രോഗനിർണ്ണയമല്ല" in report.safetyNotice, "Malayalam safety disclaimer present")
    print("  [PASS] Case 12 passed: Malayalam clinical report generated accurately.")

if __name__ == "__main__":
    print("[TEST SUITE] Running APEX 4 Clinically Oriented AI Session Report Tests...\n")
    test_case_1_normal_stable_session()
    test_case_2_right_lateral_trunk_deviation()
    test_case_3_left_lateral_trunk_deviation()
    test_case_4_anterior_trunk_inclination()
    test_case_5_shoulder_elevation_asymmetry()
    test_case_6_torso_rotation()
    test_case_7_bilateral_force_output_asymmetry()
    test_case_8_high_reaction_latency()
    test_case_9_low_pose_confidence()
    test_case_10_demo_vs_real_data_source()
    test_case_11_clinical_safety_boundaries()
    test_case_12_malayalam_clinical_translation()
    print("\n[RESULT] All 12 APEX 4 Clinical AI Report Tests Passed Successfully!")


