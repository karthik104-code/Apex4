import os
import json
import requests
from app.models.schemas import SessionReportRequest, AIReportResponse

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def generate_session_ai_report(req: SessionReportRequest) -> AIReportResponse:
    """
    Generates structured clinical session summaries from MSV1 session metrics using Gemini LLM API
    or a deterministic local fallback engine.
    """
    target_lang = req.language.lower() if req.language else "en"
    
    # 1. Attempt LLM API call if API key is present
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            
            lang_instruction = "Generate all text response fields in clear Malayalam (മലയാളം)." if target_lang == "ml" else "Generate response in English."

            prompt = f"""
Act as an assistive rehabilitation data scientist providing structured progress insights for a physiotherapist reviewing foot-operated MSV1 actuator therapy metrics.

Session Metrics:
- Movement Quality Score: {req.movement_quality}%
- Strike Accuracy: {req.accuracy}%
- Actuator Force: {req.force}%
- Reaction Time: {req.reaction_time}s
- Trunk Compensation: {req.trunk_compensation} ({req.trunk_lean_angle}°)
- Shoulder Compensation: {req.shoulder_compensation} ({req.shoulder_hike_displacement} ratio)
- Torso Rotation: {req.rotation} ({req.torso_rotation_angle}°)

Safety Guidelines (CRITICAL):
- DO NOT diagnose stroke, paralysis, or medical conditions.
- DO NOT prescribe medication or medical treatment.
- DO NOT claim cure or recovery.
- State that findings are "worth reviewing with the rehabilitation professional."

Language Requirement:
{lang_instruction}

Generate a strict raw JSON object with this exact structure:
{{
  "positiveObservations": ["short bullet 1", "short bullet 2"],
  "measurableConcerns": ["short bullet 1", "short bullet 2"],
  "sessionTrend": "1 concise sentence comparing progress",
  "therapistDiscussionPoints": ["safe suggestion 1", "safe suggestion 2"],
  "disclaimer": "AI-generated from session metrics for clinical decision support. Not a diagnostic tool. Worth reviewing with the rehabilitation professional."
}}
Return raw valid JSON only.
"""
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                raw_text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(cleaned_text)
                return AIReportResponse(
                    positiveObservations=data.get("positiveObservations", []),
                    measurableConcerns=data.get("measurableConcerns", []),
                    sessionTrend=data.get("sessionTrend", "Session completed successfully."),
                    therapistDiscussionPoints=data.get("therapistDiscussionPoints", []),
                    disclaimer=data.get("disclaimer", "AI-generated summary. Worth reviewing with the rehabilitation professional."),
                    language=target_lang
                )
        except Exception as e:
            print(f"Gemini API call unavailable/failed ({e}); switching to local deterministic generator.")

    # 2. Local Deterministic Rule-Based Report Generator (Fallback)
    return generate_deterministic_fallback_report(req, target_lang)


def generate_deterministic_fallback_report(req: SessionReportRequest, target_lang: str) -> AIReportResponse:
    """Produces a deterministic, structured session report from session metrics without external API dependencies."""
    
    # Defaults & Extracted Values
    mq = req.movement_quality
    acc = req.accuracy
    rt = req.reaction_time
    trunk_level = (req.trunk_compensation or "low").lower()
    shoulder_level = (req.shoulder_compensation or "low").lower()
    rotation_level = (req.rotation or "low").lower()

    if target_lang == "ml":
        positives = []
        if mq >= 75:
            positives.append(f"മൊത്തത്തിലുള്ള ചലന നിലവാരം ഉയർന്ന നിലയിൽ നിലനിർത്തി ({mq}%).")
        if acc >= 80:
            positives.append(f"ഉപകരണ കൃത്യത മികച്ച നിലവാരത്തിൽ നിലനിർത്തി ({acc}%).")
        if rt <= 1.5:
            positives.append(f"പാദത്തിന്റെ പ്രതികരണ സമയം മികച്ചതായിരുന്നു ({rt} സെക്കൻഡ്).")
        if not positives:
            positives.append("ആവശ്യമായ സമയം മുഴുവൻ പരിശീലനം വിജയകരമായി പൂർത്തിയാക്കി.")

        concerns = []
        if trunk_level != "low":
            concerns.append(f"ട്രങ്ക് ബോഡി മാറ്റങ്ങൾ ശ്രദ്ധയിൽപെട്ടു ({trunk_level.upper()}).")
        if shoulder_level != "low":
            concerns.append(f"തോളിന്റെ തലം മാറ്റം ശ്രദ്ധയിൽപെട്ടു ({shoulder_level.upper()}).")
        if rotation_level != "low":
            concerns.append(f"ശരീര തിരിവ് ചലനങ്ങൾ ശ്രദ്ധയിൽപെട്ടു ({rotation_level.upper()}).")
        if not concerns:
            concerns.append("പ്രത്യേകിച്ച് കഠിനമായ ശരീര പ്രയാസങ്ങൾ ഒന്നും കണ്ടില്ല.")

        trend = f"കഴിഞ്ഞ സെഷനുകളുമായി താരതമ്യം ചെയ്യുമ്പോൾ ചലന നിലവാരം സന്തുലിതമായി തുടരുന്നു ({mq}%)."
        
        discussion = [
            "പാദത്തിന്റെ ബലം കൂട്ടുമ്പോൾ ശരീര നിലവാരം നിലനിർത്തുന്നത് പുനരധിവാസ വിദഗ്ദ്ധനുമായി (Physiotherapist) ചർച്ച ചെയ്യാവുന്നതാണ്.",
            "തുടർന്നുള്ള പരിശീലനങ്ങളിൽ തോളുകളുടെ സമനില കൂടുതൽ മെച്ചപ്പെടുത്താൻ ശ്രദ്ധിക്കാം."
        ]

        disclaimer = "സെഷൻ അളവുകളിൽ നിന്ന് AI സ്വയം തയാറാക്കിയത്. രോഗനിർണ്ണയത്തിനുള്ളതല്ല. വിഗ്ദ്ധ പുനരധിവാസ പ്രൊഫഷണലുമായി ചർച്ച ചെയ്യേണ്ടതാണ്."

        return AIReportResponse(
            positiveObservations=positives,
            measurableConcerns=concerns,
            sessionTrend=trend,
            therapistDiscussionPoints=discussion,
            disclaimer=disclaimer,
            language="ml"
        )

    # Primary English Report Generation
    positives = []
    if mq >= 75:
        positives.append(f"Maintained high movement symmetry score ({mq}%).")
    if acc >= 80:
        positives.append(f"Demonstrated strong target strike accuracy ({acc}%).")
    if rt <= 1.5:
        positives.append(f"Prompt foot actuator response time recorded ({rt}s).")
    if not positives:
        positives.append("Patient actively engaged throughout the complete session duration.")

    concerns = []
    if trunk_level != "low":
        concerns.append(f"Additional trunk movement detected ({trunk_level.upper()} level compensation).")
    if shoulder_level != "low":
        concerns.append(f"Acromion shoulder elevation observed ({shoulder_level.upper()} level).")
    if rotation_level != "low":
        concerns.append(f"Torso rotational variance noted during strikes ({rotation_level.upper()} level).")
    if not concerns:
        concerns.append("Minimal compensatory posture deviations identified during active strikes.")

    trend = f"Session performance indicates stable motor coordination baseline ({mq}% movement quality, {acc}% accuracy)."

    discussion = [
        "Trunk posture alignment is worth reviewing with the rehabilitation professional when adjusting actuator force levels.",
        "Consider pacing repetitions if fatigue-induced shoulder elevation occurs during extended play."
    ]

    disclaimer = "AI-generated from session metrics for clinical decision support. Not a diagnostic tool. Findings are worth reviewing with the rehabilitation professional."

    return AIReportResponse(
        positiveObservations=positives,
        measurableConcerns=concerns,
        sessionTrend=trend,
        therapistDiscussionPoints=discussion,
        disclaimer=disclaimer,
        language="en"
    )
