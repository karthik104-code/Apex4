"""
APEX 4 — AI Session Report Generator Engine

Generates structured clinical progress summaries exclusively from structured session metrics
(movement quality, posture compensation, actuator force, reaction time, accuracy, strike consistency).

Safety & Guardrail Policy:
- NEVER receives raw webcam video or images.
- NEVER diagnoses stroke, medical conditions, or injuries.
- NEVER prescribes treatment, recommends medication, or promises guaranteed recovery.
- NEVER claims clinical validation or replaces therapist judgment.
- MUST include required labels: "AI-generated session insight" & "For rehabilitation professional review."
"""

import os
import json
import requests
from typing import Dict, Any, Optional
from app.models.schemas import SessionReportRequest, AIReportResponse

LABEL_INSIGHT = "AI-generated session insight"
LABEL_REVIEW = "For rehabilitation professional review."
SAFETY_DISCLAIMER = (
    "AI-generated session insight. For rehabilitation professional review. "
    "Does NOT provide medical diagnosis, prescribe treatment, recommend medication, "
    "or claim clinical validation. Designed for progress tracking and therapist review."
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def format_structured_metrics_prompt(req: SessionReportRequest) -> str:
    """Formats structured numeric metrics into clean text prompt payload (NO video/images)."""
    mq = int(req.movement_quality) if float(req.movement_quality).is_integer() else round(req.movement_quality, 1)
    acc = int(req.accuracy) if float(req.accuracy).is_integer() else round(req.accuracy, 1)
    force = int(req.force) if float(req.force).is_integer() else round(req.force, 1)
    rt = round(req.reaction_time, 2)
    trunk_level = (req.trunk_compensation or "Low").capitalize()
    trunk_angle = round(req.trunk_lean_angle or 0.0, 1)
    shoulder_level = (req.shoulder_compensation or "Low").capitalize()
    shoulder_disp = round(req.shoulder_hike_displacement or 0.0, 3)
    rotation_level = (req.rotation or "Low").capitalize()
    rotation_angle = round(req.torso_rotation_angle or 0.0, 1)
    cons_val = float(req.strike_consistency or 85.0)
    consistency = int(cons_val) if cons_val.is_integer() else round(cons_val, 1)

    return f"""
STRUCTURED REHABILITATION SESSION METRICS (NO VIDEO DATA):

Movement Quality: {mq}
Trunk Lean: {trunk_level} ({trunk_angle}°)
Shoulder Hike: {shoulder_level} ({shoulder_disp})
Torso Rotation: {rotation_level} ({rotation_angle}°)
Force: {force}%
Reaction Time: {rt} seconds
Accuracy: {acc}%
Consistency: {consistency}%
"""


def generate_session_ai_report(req: SessionReportRequest) -> AIReportResponse:
    """
    Main entry point for generating AI Session Reports.
    Attempts LLM API (Gemini / OpenAI), falling back seamlessly to local deterministic engine if key is absent or call fails.
    """
    target_lang = (req.language or "en").lower()
    metrics_text = format_structured_metrics_prompt(req)

    # 1. Attempt Gemini API if key is present
    if GEMINI_API_KEY:
        try:
            return call_gemini_api(metrics_text, req, target_lang)
        except Exception as e:
            print(f"[AI Report] Gemini API call failed ({e}). Falling back to local deterministic engine.")

    # 2. Attempt OpenAI API if key is present
    if OPENAI_API_KEY:
        try:
            return call_openai_api(metrics_text, req, target_lang)
        except Exception as e:
            print(f"[AI Report] OpenAI API call failed ({e}). Falling back to local deterministic engine.")

    # 3. Deterministic Local Fallback Engine (Offline guaranteed)
    return generate_deterministic_fallback_report(req, target_lang)


def call_gemini_api(metrics_text: str, req: SessionReportRequest, target_lang: str) -> AIReportResponse:
    """Calls Gemini REST API using structured metrics prompt."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    lang_instruction = "Generate text response fields in clear Malayalam (മലയാളം)." if target_lang == "ml" else "Generate response in English."

    prompt = f"""
Act as an assistive rehabilitation data analyst providing structured progress insights for a physiotherapist reviewing foot-operated actuator session metrics.

{metrics_text}

CRITICAL SAFETY DIRECTIVES:
- DO NOT diagnose stroke, paralysis, or medical conditions.
- DO NOT prescribe treatment or recommend medication.
- DO NOT claim guaranteed recovery or clinical validation.
- DO NOT claim to replace the therapist.
- Every insight is for therapist discussion and progress tracking only.

Required Labels:
- "AI-generated session insight"
- "For rehabilitation professional review."

Language instruction: {lang_instruction}

Generate a raw JSON object with this EXACT structure:
{{
  "sessionSummary": "1-2 concise sentences summarizing session duration and overall movement quality.",
  "movementObservations": [
    "Observation bullet regarding posture symmetry or trunk/shoulder alignment",
    "Observation bullet regarding posture stability"
  ],
  "performanceSummary": {{
    "actuatorForce": "{req.force}%",
    "reactionTime": "{req.reaction_time}s",
    "accuracy": "{req.accuracy}%",
    "consistency": "{req.strike_consistency or 85}%"
  }},
  "sessionTrend": "1 concise sentence comparing progress with baseline motor coordination.",
  "therapistDiscussionPoints": [
    "Discussion point 1 for therapist review during force adjustment",
    "Discussion point 2 regarding posture pacing"
  ],
  "disclaimer": "{SAFETY_DISCLAIMER}"
}}
Return raw valid JSON only.
"""

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    res = requests.post(url, json=payload, timeout=8)
    if res.status_code == 200:
        raw_text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_text)
        return build_ai_report_response(data, req, target_lang)

    raise RuntimeError(f"Gemini API returned status code {res.status_code}")


def call_openai_api(metrics_text: str, req: SessionReportRequest, target_lang: str) -> AIReportResponse:
    """Calls OpenAI REST API using structured metrics prompt."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    prompt = f"""
Act as an assistive rehabilitation data analyst providing structured progress insights.

{metrics_text}

CRITICAL SAFETY DIRECTIVES:
- DO NOT diagnose medical conditions.
- DO NOT prescribe treatment or recommend medication.
- DO NOT claim guaranteed recovery or replace therapist judgment.

Generate a raw JSON object with exact fields:
- sessionSummary
- movementObservations (list of strings)
- performanceSummary (dict)
- sessionTrend
- therapistDiscussionPoints (list of strings)
- disclaimer
Return raw valid JSON only.
"""
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }
    res = requests.post(url, headers=headers, json=payload, timeout=8)
    if res.status_code == 200:
        raw_text = res.json()["choices"][0]["message"]["content"]
        cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_text)
        return build_ai_report_response(data, req, target_lang)

    raise RuntimeError(f"OpenAI API returned status code {res.status_code}")


def build_ai_report_response(data: Dict[str, Any], req: SessionReportRequest, target_lang: str) -> AIReportResponse:
    """Standardizes dictionary output into AIReportResponse Pydantic model with exact 5 sections and required labels."""
    obs = data.get("movementObservations", [])
    positives = [o for o in obs if "good" in o.lower() or "optimal" in o.lower() or "maintained" in o.lower()]
    concerns = [o for o in obs if o not in positives]

    if not positives:
        positives = [f"Maintained movement quality score of {req.movement_quality}%."]
    if not concerns:
        concerns = ["Minimal compensatory posture deviation noted."]

    return AIReportResponse(
        sessionSummary=data.get("sessionSummary", f"Session completed with {req.movement_quality}% movement quality score."),
        movementObservations=obs if obs else positives + concerns,
        performanceSummary=data.get("performanceSummary", {
            "actuatorForce": f"{req.force}%",
            "reactionTime": f"{req.reaction_time}s",
            "accuracy": f"{req.accuracy}%",
            "consistency": f"{req.strike_consistency or 85}%",
        }),
        sessionTrend=data.get("sessionTrend", f"Session metrics indicate stable motor coordination baseline ({req.movement_quality}% quality, {req.accuracy}% accuracy)."),
        therapistDiscussionPoints=data.get("therapistDiscussionPoints", [
            "Trunk posture alignment is worth reviewing with the rehabilitation professional when adjusting actuator force levels.",
            "Consider pacing repetitions if fatigue-induced shoulder elevation occurs during extended play.",
        ]),
        positiveObservations=positives,
        measurableConcerns=concerns,
        disclaimer=data.get("disclaimer", SAFETY_DISCLAIMER),
        label=LABEL_INSIGHT,
        sublabel=LABEL_REVIEW,
        language=target_lang,
    )


def generate_deterministic_fallback_report(req: SessionReportRequest, target_lang: str) -> AIReportResponse:
    """
    Produces a deterministic, structured 5-section session report from structured metrics offline
    without external API dependencies, guaranteeing 100% demo completion reliability.
    """
    mq = req.movement_quality
    acc = req.accuracy
    rt = req.reaction_time
    force = req.force
    consistency = req.strike_consistency or 85.0

    trunk_level = (req.trunk_compensation or "low").lower()
    shoulder_level = (req.shoulder_compensation or "low").lower()
    rotation_level = (req.rotation or "low").lower()

    # 1. Section 1: Session Summary
    if target_lang == "ml":
        summary = f"സെഷൻ വിജയകരമായി പൂർത്തിയാക്കി. ചലന നിലവാര സ്കോർ: {mq}%."
    else:
        summary = f"Session completed with structured movement analysis. Overall movement quality score achieved: {mq}%."

    # 2. Section 2: Movement Observations
    observations = []
    positives = []
    concerns = []

    if target_lang == "ml":
        if mq >= 75:
            positives.append(f"മൊത്തത്തിലുള്ള ചലന നിലവാരം ഉയർന്ന നിലയിൽ നിലനിർത്തി ({mq}%).")
        if acc >= 80:
            positives.append(f"ഉപകരണ കൃത്യത മികച്ച നിലവാരത്തിൽ നിലനിർത്തി ({acc}%).")
        if rt <= 1.5:
            positives.append(f"പാദത്തിന്റെ പ്രതികരണ സമയം മികച്ചതായിരുന്നു ({rt} സെക്കൻഡ്).")
        if trunk_level != "low":
            concerns.append(f"ട്രങ്ക് ശരീര മാറ്റങ്ങൾ ശ്രദ്ധയിൽപെട്ടു ({trunk_level.upper()}).")
        if shoulder_level != "low":
            concerns.append(f"തോളിന്റെ തലം മാറ്റം ശ്രദ്ധയിൽപെട്ടു ({shoulder_level.upper()}).")
        if rotation_level != "low":
            concerns.append(f"ശരീര തിരിവ് ചലനങ്ങൾ ശ്രദ്ധയിൽപെട്ടു ({rotation_level.upper()}).")
    else:
        if mq >= 75:
            positives.append(f"Maintained strong posture control and movement symmetry score ({mq}%).")
        if acc >= 80:
            positives.append(f"Demonstrated consistent target strike accuracy ({acc}%).")
        if rt <= 1.5:
            positives.append(f"Prompt foot actuator response time recorded ({rt}s).")
        if trunk_level != "low":
            concerns.append(f"Trunk posture deviation detected ({trunk_level.upper()} level compensation).")
        if shoulder_level != "low":
            concerns.append(f"Shoulder elevation observed during strikes ({shoulder_level.upper()} level).")
        if rotation_level != "low":
            concerns.append(f"Torso rotational variance noted ({rotation_level.upper()} level).")

    if not positives:
        positives.append("Patient actively engaged throughout the complete session duration.")
    if not concerns:
        concerns.append("Minimal compensatory posture deviations identified during active strikes.")

    observations = positives + concerns

    # 3. Section 3: Performance Summary
    perf_summary = {
        "actuatorForce": f"{force}%",
        "reactionTime": f"{rt}s",
        "accuracy": f"{acc}%",
        "consistency": f"{consistency}%",
    }

    # 4. Section 4: Trend
    if target_lang == "ml":
        trend = f"കഴിഞ്ഞ സെഷനുകളുമായി താരതമ്യം ചെയ്യുമ്പോൾ ചലന നിലവാരം സന്തുലിതമായി തുടരുന്നു ({mq}% നിലവാരം, {acc}% കൃത്യത)."
    else:
        trend = f"Session metrics indicate stable motor coordination baseline ({mq}% movement quality, {acc}% accuracy)."

    # 5. Section 5: Discussion Point for Therapist
    if target_lang == "ml":
        discussion = [
            "പാദത്തിന്റെ ബലം കൂട്ടുമ്പോൾ ശരീര നിലവാരം നിലനിർത്തുന്നത് പുനരധിവാസ വിദഗ്ദ്ധനുമായി (Physiotherapist) ചർച്ച ചെയ്യാവുന്നതാണ്.",
            "തുടർന്നുള്ള പരിശീലനങ്ങളിൽ തോളുകളുടെ സമനില കൂടുതൽ മെച്ചപ്പെടുത്താൻ ശ്രദ്ധിക്കാം."
        ]
        disclaimer_text = f"{LABEL_INSIGHT}. {LABEL_REVIEW}. രോഗനിർണ്ണയത്തിനുള്ളതല്ല. വിഗ്ദ്ധ പുനരധിവാസ പ്രൊഫഷണലുമായി ചർച്ച ചെയ്യേണ്ടതാണ്."
    else:
        discussion = [
            "Trunk posture alignment is worth reviewing with the rehabilitation professional when adjusting actuator force levels.",
            "Consider pacing repetitions if fatigue-induced shoulder elevation occurs during extended play.",
        ]
        disclaimer_text = SAFETY_DISCLAIMER

    return AIReportResponse(
        sessionSummary=summary,
        movementObservations=observations,
        performanceSummary=perf_summary,
        sessionTrend=trend,
        therapistDiscussionPoints=discussion,
        positiveObservations=positives,
        measurableConcerns=concerns,
        disclaimer=disclaimer_text,
        label=LABEL_INSIGHT,
        sublabel=LABEL_REVIEW,
        language=target_lang,
    )
