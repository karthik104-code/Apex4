import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import SessionReportRequest
from app.ai.llm_report import generate_session_ai_report, generate_deterministic_fallback_report

def assert_true(cond, msg):
    if not cond:
        raise AssertionError(f"Test Failed: {msg}")

def test_successful_or_fallback_report():
    print("[TEST 1] Standard English AI session report generation...")
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
    assert_true(len(report.positiveObservations) > 0, "Should have positive observations")
    assert_true(len(report.measurableConcerns) > 0, "Should have concerns/observations")
    assert_true(len(report.sessionTrend) > 0, "Should have session trend string")
    assert_true(len(report.therapistDiscussionPoints) > 0, "Should have discussion points")
    assert_true("diagnostic" in report.disclaimer.lower() or "professional" in report.disclaimer.lower(), "Disclaimer present")
    print("  [PASS] English report successfully generated with required structured sections.")

def test_api_failure_fallback():
    print("[TEST 2] API failure / Offline fallback mechanism...")
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
    assert_true("HIGH" in report.measurableConcerns[0] or "compensation" in report.measurableConcerns[0].lower(), "Fallback correctly parsed high trunk compensation")
    assert_true("professional" in report.disclaimer, "Safety disclaimer includes therapist review statement")
    print("  [PASS] Deterministic fallback generated valid structured report during offline/API failure simulation.")

def test_empty_or_malformed_fields():
    print("[TEST 3] Handling missing or empty session fields...")
    req = SessionReportRequest()
    report = generate_session_ai_report(req)
    assert_true(report is not None, "Should handle default request without throwing")
    assert_true(len(report.positiveObservations) > 0, "Default values produce valid positive findings")
    print("  [PASS] Empty/default session fields handled safely with fallback values.")

def test_malayalam_language_support():
    print("[TEST 4] Malayalam report generation...")
    req = SessionReportRequest(
        movement_quality=84.0,
        accuracy=89.0,
        force=70.0,
        reaction_time=1.15,
        trunk_compensation="medium",
        shoulder_compensation="low",
        rotation="low",
        language="ml"
    )
    report = generate_session_ai_report(req)
    assert_true(report.language == "ml", "Language field should be 'ml'")
    assert_true(len(report.positiveObservations) > 0, "Malayalam report contains positive observations")
    print("  [PASS] Malayalam session report generated successfully.")

def test_clinical_safety_compliance():
    print("[TEST 5] Clinical safety guardrail compliance...")
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
        " ".join(report.positiveObservations) + " " +
        " ".join(report.measurableConcerns) + " " +
        report.sessionTrend + " " +
        " ".join(report.therapistDiscussionPoints)
    ).lower()

    forbidden_terms = ["stroke diagnosis", "prescribe", "medication", "cure", "replaces physiotherapist"]
    for term in forbidden_terms:
        assert_true(term not in full_text, f"Forbidden clinical term '{term}' found in AI output")

    print("  [PASS] AI report strictly complies with non-diagnostic clinical safety guardrails.")

if __name__ == "__main__":
    print("Starting Phase 6 Generative AI Report Backend Unit Tests...\n")
    test_successful_or_fallback_report()
    test_api_failure_fallback()
    test_empty_or_malformed_fields()
    test_malayalam_language_support()
    test_clinical_safety_compliance()
    print("\n[RESULT] All 5 AI Report Backend Tests Passed Successfully!")

