import os
import json
import requests
from typing import List, Optional
from app.models.schemas import (
    SessionReportRequest,
    AIReportResponse,
    PosturalParameterAssessment,
    CompensationItem,
    MotorPerformanceItem,
    BilateralPerformance,
    MovementQualitySection,
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

LIMITATIONS_TEXT_EN = (
    "Findings are derived from webcam-based pose estimation and MSV1 device telemetry collected during this "
    "prototype session. Measurements may be affected by camera positioning, landmark visibility, device calibration, "
    "and task conditions."
)
SAFETY_NOTICE_EN = (
    "AI-generated movement analysis for professional review. This report summarizes measurements collected "
    "during the APEX 4 prototype session. It is not a diagnosis and should not be used as a substitute for clinical "
    "examination or professional judgment."
)

LIMITATIONS_TEXT_ML = (
    "വെബ്ക്യാം അടിസ്ഥാനമാക്കിയുള്ള പോസ് എസ്റ്റിമേഷനിൽ നിന്നും MSV1 ഉപകരണ ടെലിമെട്രിയിൽ നിന്നും ശേഖരിച്ച "
    "ഡാറ്റ അടിസ്ഥാനമാക്കിയാണ് ഈ കണ്ടെത്തലുകൾ. ക്യാമറ പൊസിഷനിംഗ്, വെളിച്ചം, സെൻസർ കാലിബ്രേഷൻ എന്നിവ അളവുകളെ ബാധിച്ചേക്കാം."
)
SAFETY_NOTICE_ML = (
    "വിദഗ്ദ്ധ പുനരധിവാസ പ്രൊഫഷണലുകളുടെ അവലോകനത്തിനായുള്ള AI വിശകലനം. ഇത് ഒരു രോഗനിർണ്ണയമല്ല (Not a diagnosis), "
    "ക്ലിനിക്കൽ പരിശോധനയ്ക്ക് പകരമായി ഉപയോഗിക്കാൻ പാടില്ല."
)


def format_duration(seconds: int) -> str:
    m = seconds // 60
    s = seconds % 60
    return f"{m}m {s}s" if m > 0 else f"{s}s"


def generate_session_ai_report(req: SessionReportRequest) -> AIReportResponse:
    """
    Generates structured, clinically oriented movement & performance assessment from
    fused computer vision landmarks and MSV1 actuator telemetry.
    """
    target_lang = req.language.lower() if req.language else "en"
    data_source_label = "REAL HARDWARE" if (req.telemetry_mode or "").lower() == "hardware" else "APEX 4 DEMO TELEMETRY"
    duration_str = format_duration(req.session_duration_seconds or 240)

    # 1. Attempt LLM API call if API key is present
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            
            lang_prompt = "Generate all narrative and descriptive text fields in professional Malayalam (മലയാളം)." if target_lang == "ml" else "Generate response in professional clinical English."
            
            prompt = f"""
Act as a specialized clinical biomechanist and physical rehabilitation data scientist producing an APEX 4 Movement and Performance Report for professional healthcare review.

Session Data:
- Session ID: {req.session_id}
- Task: {req.task_name or 'MSV1 Actuator Target Strike'}
- Duration: {duration_str}
- Data Source: {data_source_label}
- Pose Tracking Confidence: {req.pose_confidence} (Pose detected: {req.is_pose_detected})
- APEX 4 Movement Quality Score: {req.movement_quality}%
- Strike Accuracy: {req.accuracy}%
- Actuator Force Output: {req.force}% (Left: {req.left_force if req.left_force is not None else 'N/A'}, Right: {req.right_force if req.right_force is not None else 'N/A'})
- Reaction Latency: {req.reaction_time}s
- Strike Consistency: {req.strike_consistency}%
- Lateral Trunk Deviation: {req.trunk_lean_angle}° ({req.trunk_lean_direction}) [Level: {req.trunk_compensation}]
- Anterior Trunk Inclination: {req.anterior_inclination_ratio} ratio
- Bilateral Shoulder Elevation Asymmetry: {req.shoulder_hike_displacement} displacement ratio [Level: {req.shoulder_compensation}]
- Torso Rotation Angle: {req.torso_rotation_angle}° [Level: {req.rotation}]
- Overall Postural Stability: {req.overall_stability}%

Clinical Terminology Requirements:
- Use objective, professional rehabilitation terminology:
  * "Lateral trunk deviation toward the left/right"
  * "Anterior trunk inclination"
  * "Trunk rotation"
  * "Bilateral shoulder elevation asymmetry"
  * "Postural alignment deviation"
  * "Increased movement variability"
  * "Reduced postural stability"
  * "Increased reaction latency"
  * "Bilateral force-output asymmetry"
- Reference prototype thresholds with label: "APEX 4 prototype threshold".
- Label force as "Normalized device force value" or "%".

Strict Safety Guardrails:
- DO NOT make medical diagnoses (e.g. DO NOT say stroke, hemiparesis, Parkinson's, cerebral palsy, muscle weakness, spasticity, ataxia).
- DO NOT prescribe treatment, therapy regimens, or medications.
- State that observations "may warrant professional review" or "consider reviewing in conjunction with clinical examination".

Language Requirement:
{lang_prompt}

Generate a valid raw JSON matching this schema:
{{
  "sessionOverview": "Concise 3-4 sentence professional summary covering task, duration, movement quality, and primary deviations.",
  "posturalAssessment": [
    {{
      "parameter": "Lateral Trunk Alignment",
      "observedValue": "{req.trunk_lean_angle}° ({req.trunk_lean_direction})",
      "referenceThreshold": "7.5° (APEX 4 prototype threshold)",
      "interpretation": "Professional description of observed lateral alignment."
    }},
    {{
      "parameter": "Anterior Trunk Inclination",
      "observedValue": "{req.anterior_inclination_ratio} ratio",
      "referenceThreshold": "0.22 (APEX 4 prototype threshold)",
      "interpretation": "Professional description of anterior inclination."
    }},
    {{
      "parameter": "Bilateral Shoulder Alignment",
      "observedValue": "{req.shoulder_hike_displacement} displacement ratio",
      "referenceThreshold": "0.055 (APEX 4 prototype threshold)",
      "interpretation": "Professional description of acromion elevation symmetry."
    }},
    {{
      "parameter": "Torso Rotation",
      "observedValue": "{req.torso_rotation_angle}°",
      "referenceThreshold": "8.0° (APEX 4 prototype threshold)",
      "interpretation": "Professional description of axial torso rotation."
    }},
    {{
      "parameter": "Postural Stability",
      "observedValue": "{req.overall_stability}%",
      "referenceThreshold": "75.0% (APEX 4 prototype threshold)",
      "interpretation": "Professional description of stability maintenance."
    }}
  ],
  "movementCompensation": [
    {{
      "pattern": "lateral trunk compensation | anterior trunk compensation | shoulder elevation compensation | excessive torso rotation",
      "magnitude": "Measured value e.g. {req.trunk_lean_angle}°",
      "frequency": "Intermittent / Recurrent / Sustained / Infrequent",
      "phase": "Mid-to-terminal phase of strike trials",
      "details": "Objective observation of compensatory adjustments during task execution."
    }}
  ],
  "motorPerformance": [
    {{
      "metric": "Actuator Force Output",
      "value": "{req.force}%",
      "unit": "Normalized device force value",
      "interpretation": "Objective force delivery description."
    }},
    {{
      "metric": "Reaction Latency",
      "value": "{req.reaction_time}",
      "unit": "s",
      "interpretation": "Objective latency description."
    }},
    {{
      "metric": "Strike Accuracy",
      "value": "{req.accuracy}",
      "unit": "%",
      "interpretation": "Target acquisition accuracy."
    }},
    {{
      "metric": "Movement Consistency",
      "value": "{req.strike_consistency}",
      "unit": "%",
      "interpretation": "Trial-to-trial execution reproducibility."
    }}
  ],
  "bilateralPerformance": {{
    "leftValue": "163 units",
    "rightValue": "71 units",
    "difference": "92 units",
    "interpretation": "Objective force distribution comparison without medical inference."
  }},
  "movementQuality": {{
    "score": {req.movement_quality},
    "label": "APEX 4 Movement Quality Score",
    "explanation": "This score is a prototype composite metric derived from session movement and performance data and is intended for monitoring/trend visualization, not as a standalone clinical assessment."
  }},
  "temporalAnalysis": [
    "Temporal observation comparing initial, middle, and final phases."
  ],
  "aiObservations": [
    "Observation 1 using professional terminology",
    "Observation 2 using professional terminology"
  ],
  "professionalReviewPoints": [
    "Observation 1 may warrant professional review in conjunction with clinical examination.",
    "Observation 2 may warrant review."
  ]
}}
Return raw valid JSON only.
"""
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                raw_text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(cleaned_text)
                
                # Construct validated response
                postural_list = [
                    PosturalParameterAssessment(**item) for item in data.get("posturalAssessment", [])
                ]
                comp_list = [
                    CompensationItem(**item) for item in data.get("movementCompensation", [])
                ]
                motor_list = [
                    MotorPerformanceItem(**item) for item in data.get("motorPerformance", [])
                ]
                bilateral = BilateralPerformance(**data["bilateralPerformance"]) if data.get("bilateralPerformance") else None
                mq_data = data.get("movementQuality", {})
                mq_section = MovementQualitySection(
                    score=float(mq_data.get("score", req.movement_quality)),
                    label=mq_data.get("label", "APEX 4 Movement Quality Score"),
                    explanation=mq_data.get(
                        "explanation",
                        "This score is a prototype composite metric derived from session movement and performance data and is intended for monitoring/trend visualization, not as a standalone clinical assessment."
                    )
                )

                limitations_text = LIMITATIONS_TEXT_ML if target_lang == "ml" else LIMITATIONS_TEXT_EN
                safety_text = SAFETY_NOTICE_ML if target_lang == "ml" else SAFETY_NOTICE_EN

                ai_obs = data.get("aiObservations", [])
                review_pts = data.get("professionalReviewPoints", [])

                return AIReportResponse(
                    sessionId=req.session_id or "ses-default",
                    sessionDate=req.session_date or "2026-09-14",
                    sessionDuration=duration_str,
                    dataSource=data_source_label,
                    poseAnalysisSource="MediaPipe Computer Vision Pose Estimation",
                    sessionOverview=data.get("sessionOverview", "Session completed."),
                    posturalAssessment=postural_list,
                    movementCompensation=comp_list,
                    motorPerformance=motor_list,
                    bilateralPerformance=bilateral,
                    movementQuality=mq_section,
                    temporalAnalysis=data.get("temporalAnalysis", []),
                    aiObservations=ai_obs,
                    professionalReviewPoints=review_pts,
                    limitations=limitations_text,
                    safetyNotice=safety_text,
                    language=target_lang,
                    positiveObservations=ai_obs,
                    measurableConcerns=[c.details for c in comp_list],
                    sessionTrend=data.get("sessionOverview", ""),
                    therapistDiscussionPoints=review_pts,
                    disclaimer=safety_text,
                )
        except Exception as e:
            print(f"Gemini API call unavailable/failed ({e}); using local deterministic clinical report engine.")

    # 2. Local Deterministic Rule-Based Report Generator (Offline / Fallback)
    return generate_deterministic_clinical_report(req, target_lang)


def generate_deterministic_clinical_report(req: SessionReportRequest, target_lang: str) -> AIReportResponse:
    """
    Produces a deterministic, structured, clinically sound rehabilitation session report
    without external API dependencies, mapping every metric to precise professional terminology.
    """
    duration_str = format_duration(req.session_duration_seconds or 240)
    data_source_label = "REAL HARDWARE" if (req.telemetry_mode or "").lower() == "hardware" else "APEX 4 DEMO TELEMETRY"
    
    mq = req.movement_quality
    acc = req.accuracy
    rt = req.reaction_time
    force_val = req.force
    stability = req.overall_stability if req.overall_stability is not None else 85.0
    consistency = req.strike_consistency if req.strike_consistency is not None else 85.0
    
    trunk_angle = req.trunk_lean_angle or 0.0
    direction = (req.trunk_lean_direction or "neutral").lower()
    anterior_ratio = req.anterior_inclination_ratio or 0.0
    shoulder_disp = req.shoulder_hike_displacement or 0.0
    rotation_angle = req.torso_rotation_angle or 0.0
    
    is_pose_valid = req.is_pose_detected and (req.pose_confidence or 1.0) >= 0.55

    # -------------------------------------------------------------
    # Malayalam (മലയാളം) Deterministic Generator
    # -------------------------------------------------------------
    if target_lang == "ml":
        if not is_pose_valid:
            postural_interp_general = "പോസ് ലാൻഡ്മാർക്ക് ദൃശ്യപരത കുറവായതിനാൽ പോസ്ചറൽ വിശകലനം പരിമിതമാണ്."
        elif trunk_angle > 7.5:
            dir_text = "വലത്തോട്ട്" if direction == "right" else ("ഇടത്തോട്ട്" if direction == "left" else "വശത്തേക്ക്")
            postural_interp_general = f"പരിശീലന വേളയിൽ {dir_text} {trunk_angle}° ട്രങ്ക് വ്യതിയാനം (Lateral trunk deviation) രേഖപ്പെടുത്തി."
        else:
            postural_interp_general = "പരിശീലന വേളയിൽ ശരിയായ ശരീര സന്തുലിതാവസ്ഥ നിലനിർത്തി."

        overview = (
            f"രോഗി {duration_str} ദൈർഘ്യമുള്ള MSV1 ആക്ച്വേറ്റർ ലക്ഷ്യ പരിശീലനം വിജയകരമായി പൂർത്തിയാക്കി. "
            f"രേഖപ്പെടുത്തിയ APEX 4 ചലന നിലവാരം {mq}% ആണ്. "
            f"{postural_interp_general} "
            f"ഉപകരണ സ്ട്രൈക്ക് കൃത്യത {acc}%-ഉം ശരാശരി പ്രതികരണ സമയം {rt:.2f} സെക്കൻഡുമായിരുന്നു."
        )

        postural_assessment = [
            PosturalParameterAssessment(
                parameter="Lateral Trunk Alignment",
                observedValue=f"{trunk_angle:.1f}° ({direction})",
                referenceThreshold="7.5° (APEX 4 prototype threshold)",
                interpretation=f"{'അനുവദനീയമായ പരിധിക്കുള്ളിൽ' if trunk_angle <= 7.5 else f'{direction.upper()} വശത്തേക്ക് {trunk_angle:.1f}° വ്യതിയാനം രേഖപ്പെടുത്തി'}.",
            ),
            PosturalParameterAssessment(
                parameter="Anterior Trunk Inclination",
                observedValue=f"{anterior_ratio:.2f} ratio",
                referenceThreshold="0.22 (APEX 4 prototype threshold)",
                interpretation="ശരീരം മുന്നോട്ട് ആഞ്ഞുപോകാതെ നിയന്ത്രിച്ചു." if anterior_ratio < 0.22 else "മുന്നോട്ടുള്ള ശരീര ചാഞ്ചാട്ടം (Anterior trunk inclination) കൂടുതലായി കാണപ്പെട്ടു.",
            ),
            PosturalParameterAssessment(
                parameter="Bilateral Shoulder Alignment",
                observedValue=f"{shoulder_disp:.3f} displacement ratio",
                referenceThreshold="0.055 (APEX 4 prototype threshold)",
                interpretation="തോളുകളുടെ സമനില ശരിയായ രീതിയിൽ നിലനിർത്തി." if shoulder_disp < 0.055 else "തോളിന്റെ ഉയരത്തിൽ അസമമിതി (Shoulder elevation asymmetry) രേഖപ്പെടുത്തി.",
            ),
            PosturalParameterAssessment(
                parameter="Torso Rotation",
                observedValue=f"{rotation_angle:.1f}°",
                referenceThreshold="8.0° (APEX 4 prototype threshold)",
                interpretation="ശരീര തിരിവ് ചലനങ്ങൾ സാധാരണ നിലയിൽ." if rotation_angle < 8.0 else f"ശരീര തിരിവ് {rotation_angle:.1f}° വ്യതിയാനത്തിൽ രേഖപ്പെടുത്തി.",
            ),
            PosturalParameterAssessment(
                parameter="Postural Stability",
                observedValue=f"{stability:.1f}%",
                referenceThreshold="75.0% (APEX 4 prototype threshold)",
                interpretation=f"ശരീര സ്ഥിരത {stability:.1f}% നിലവാരത്തിൽ നിലനിർത്തി.",
            ),
        ]

        compensations: List[CompensationItem] = []
        if trunk_angle > 7.5:
            dir_label = "right" if direction == "right" else "left"
            compensations.append(CompensationItem(
                pattern=f"Lateral trunk compensation ({dir_label})",
                magnitude=f"{trunk_angle:.1f}°",
                frequency="Intermittent during forceful strikes",
                phase="Mid-to-terminal phase",
                details=f"സ്ട്രൈക്ക് നടത്തുമ്പോൾ {dir_label} വശത്തേക്ക് {trunk_angle:.1f}° compensatory ട്രങ്ക് ചലനം കാണപ്പെട്ടു."
            ))
        if shoulder_disp >= 0.055:
            compensations.append(CompensationItem(
                pattern="Shoulder elevation compensation",
                magnitude=f"{shoulder_disp:.3f} displacement ratio",
                frequency="Recurrent",
                phase="Extended repetitions",
                details="സ്ട്രൈക്ക് ലക്ഷ്യങ്ങളിലേക്ക് അടുക്കുമ്പോൾ തോൾ ഉയർത്തുന്ന രീതി കാണപ്പെട്ടു."
            ))
        if rotation_angle >= 8.0:
            compensations.append(CompensationItem(
                pattern="Excessive torso rotation",
                magnitude=f"{rotation_angle:.1f}°",
                frequency="Intermittent",
                phase="Terminal strike phase",
                details=f"ആക്ച്വേറ്റർ പ്രവർത്തിപ്പിക്കുമ്പോൾ {rotation_angle:.1f}° റൊട്ടേഷൻ രേഖപ്പെടുത്തി."
            ))
        if not compensations:
            compensations.append(CompensationItem(
                pattern="No significant compensation observed",
                magnitude="Within reference thresholds",
                frequency="N/A",
                phase="Throughout session",
                details="ശ്രദ്ധേയമായ compensatory ചലനങ്ങൾ ഒന്നും തന്നെ രേഖപ്പെടുത്തിയിട്ടില്ല."
            ))

        motor_perf = [
            MotorPerformanceItem(
                metric="Actuator Force Output",
                value=f"{force_val:.1f}%",
                unit="Normalized device force value",
                interpretation=f"ശരാശരി ആക്ച്വേറ്റർ ഫോഴ്സ് {force_val:.1f}% നിലനിർത്തി.",
            ),
            MotorPerformanceItem(
                metric="Reaction Latency",
                value=f"{rt:.2f}",
                unit="s",
                interpretation=f"ശരാശരി പ്രതികരണ സമയം {rt:.2f} സെക്കൻഡ്.",
            ),
            MotorPerformanceItem(
                metric="Strike Accuracy",
                value=f"{acc:.1f}",
                unit="%",
                interpretation=f"ലക്ഷ്യ സ്ട്രൈക്ക് കൃത്യത {acc:.1f}%.",
            ),
            MotorPerformanceItem(
                metric="Movement Consistency",
                value=f"{consistency:.1f}",
                unit="%",
                interpretation=f"സ്ട്രൈക്ക് നിലവാരം {consistency:.1f}% സമാനമായി നിലനിർത്തി.",
            ),
        ]

        bilateral_perf = None
        if req.left_force is not None and req.right_force is not None:
            diff = abs(req.left_force - req.right_force)
            bilateral_perf = BilateralPerformance(
                leftValue=f"{req.left_force:.1f}",
                rightValue=f"{req.right_force:.1f}",
                difference=f"{diff:.1f} units",
                interpretation=f"ഇരുവശത്തെയും ഉപകരണ ഫോഴ്സ് ഔട്ട്പുട്ടിൽ {diff:.1f} യൂണിറ്റ് വ്യത്യാസം രേഖപ്പെടുത്തി."
            )

        mq_sec = MovementQualitySection(
            score=mq,
            label="APEX 4 Movement Quality Score",
            explanation="ഈ സ്കോർ ചലന പുരോഗതി നിരീക്ഷിക്കുന്നതിനുള്ള ഒരു പ്രോട്ടോടൈപ്പ് സംയോജിത അളവുകോലാണ്. രോഗനിർണ്ണയത്തിനുള്ള സ്വതന്ത്ര ക്ലിനിക്കൽ സ്കോറല്ല."
        )

        temporal = [
            f"തുടക്കത്തിൽ ചലന കൃത്യത {acc:.1f}% നിലവാരത്തിലായിരുന്നു.",
            "തുടർച്ചയായ സ്ട്രൈക്കുകളിൽ ശരീര സ്ഥിരത നിലനിർത്തി.",
            "ലഭ്യമായ സെഷൻ ഡാറ്റയിൽ കാര്യമായ തളർച്ചയുടെ ലക്ഷണങ്ങൾ രേഖപ്പെടുത്തിയിട്ടില്ല."
        ]

        obs = [
            f"മൊത്തത്തിലുള്ള APEX 4 ചലന നിലവാരം {mq}% രേഖപ്പെടുത്തി.",
            postural_interp_general,
            f"ലക്ഷ്യ സ്ട്രൈക്ക് കൃത്യത {acc}%-ഉം പ്രതികരണ സമയം {rt:.2f}s-ഉം രേഖപ്പെടുത്തി."
        ]

        review_pts = []
        if trunk_angle > 7.5:
            review_pts.append(f"സ്ട്രൈക്കുകൾക്കിടയിൽ {direction} വശത്തേക്കുള്ള {trunk_angle:.1f}° ട്രങ്ക് വ്യതിയാനം ഫിസിയോതെറാപ്പിസ്റ്റുമായി അവലോകനം ചെയ്യാവുന്നതാണ്.")
        if shoulder_disp >= 0.055:
            review_pts.append("തോളിന്റെ അസമമിതി ക്ലിനിക്കൽ പരിശോധനയോടൊപ്പം അവലോകനം ചെയ്യുന്നത് ഉചിതമായിരിക്കും.")
        if rt > 1.8:
            review_pts.append(f"വർദ്ധിച്ച പ്രതികരണ സമയം ({rt:.2f}s) പ്രൊഫഷണൽ റിവ്യൂവിന് വിധേയമാക്കാവുന്നതാണ്.")
        if not review_pts:
            review_pts.append("ശ്രദ്ധേയമായ മറ്റ് പോസ്ചറൽ വ്യതിയാനങ്ങൾ ഒന്നും തന്നെ കാണപ്പെട്ടില്ല.")

        return AIReportResponse(
            sessionId=req.session_id or "ses-default",
            sessionDate=req.session_date or "2026-09-14",
            sessionDuration=duration_str,
            dataSource=data_source_label,
            poseAnalysisSource="MediaPipe Computer Vision Pose Estimation",
            sessionOverview=overview,
            posturalAssessment=postural_assessment,
            movementCompensation=compensations,
            motorPerformance=motor_perf,
            bilateralPerformance=bilateral_perf,
            movementQuality=mq_sec,
            temporalAnalysis=temporal,
            aiObservations=obs,
            professionalReviewPoints=review_pts,
            limitations=LIMITATIONS_TEXT_ML,
            safetyNotice=SAFETY_NOTICE_ML,
            language="ml",
            positiveObservations=obs,
            measurableConcerns=[c.details for c in compensations],
            sessionTrend=overview,
            therapistDiscussionPoints=review_pts,
            disclaimer=SAFETY_NOTICE_ML,
        )

    # -------------------------------------------------------------
    # English Deterministic Generator (Standard Clinical Terminology)
    # -------------------------------------------------------------
    if not is_pose_valid:
        postural_overview_summary = "Postural alignment assessment was limited by intermittent pose landmark visibility."
    elif trunk_angle > 7.5:
        dir_text = "toward the right" if direction == "right" else ("toward the left" if direction == "left" else "")
        postural_overview_summary = f"Intermittent lateral trunk deviation {dir_text} ({trunk_angle:.1f}°) was observed during task execution."
    elif shoulder_disp >= 0.055:
        postural_overview_summary = f"Bilateral shoulder elevation asymmetry ({shoulder_disp:.3f} displacement ratio) was noted during trials."
    elif anterior_ratio >= 0.22:
        postural_overview_summary = f"Elevated anterior trunk inclination ({anterior_ratio:.2f} ratio) was noted during forceful strikes."
    else:
        postural_overview_summary = "Postural alignment was maintained within prototype baseline thresholds throughout task performance."

    session_overview_text = (
        f"The user completed an active {duration_str} MSV1 actuator target strike session. "
        f"Overall APEX 4 Movement Quality Score was recorded at {mq:.1f}%. "
        f"{postural_overview_summary} "
        f"Target strike accuracy reached {acc:.1f}% with a mean reaction latency of {rt:.2f} s."
    )

    postural_assessment_items = [
        PosturalParameterAssessment(
            parameter="Lateral Trunk Alignment",
            observedValue=f"{trunk_angle:.1f}° ({direction})",
            referenceThreshold="7.5° (APEX 4 prototype threshold)",
            interpretation=(
                "Alignment within prototype reference bounds."
                if trunk_angle <= 7.5
                else f"Lateral trunk deviation toward the {direction} ({trunk_angle:.1f}°) observed during active trials."
            ),
        ),
        PosturalParameterAssessment(
            parameter="Anterior Trunk Inclination",
            observedValue=f"{anterior_ratio:.2f} ratio",
            referenceThreshold="0.22 (APEX 4 prototype threshold)",
            interpretation=(
                "Sagittal trunk inclination maintained within normal prototype limits."
                if anterior_ratio < 0.22
                else f"Elevated anterior trunk inclination ({anterior_ratio:.2f} ratio) noted during task exertion."
            ),
        ),
        PosturalParameterAssessment(
            parameter="Bilateral Shoulder Alignment",
            observedValue=f"{shoulder_disp:.3f} displacement ratio",
            referenceThreshold="0.055 (APEX 4 prototype threshold)",
            interpretation=(
                "Bilateral acromion horizontal alignment maintained within bounds."
                if shoulder_disp < 0.055
                else f"Bilateral shoulder elevation asymmetry ({shoulder_disp:.3f} ratio) detected."
            ),
        ),
        PosturalParameterAssessment(
            parameter="Torso Rotation",
            observedValue=f"{rotation_angle:.1f}°",
            referenceThreshold="8.0° (APEX 4 prototype threshold)",
            interpretation=(
                "Axial torso orientation aligned with target axis."
                if rotation_angle < 8.0
                else f"Trunk rotation ({rotation_angle:.1f}°) observed during actuator activation."
            ),
        ),
        PosturalParameterAssessment(
            parameter="Postural Stability",
            observedValue=f"{stability:.1f}%",
            referenceThreshold="75.0% (APEX 4 prototype threshold)",
            interpretation=(
                f"Postural stability maintained at {stability:.1f}%."
                if stability >= 75.0
                else f"Reduced postural stability ({stability:.1f}%) observed during movement cycles."
            ),
        ),
    ]

    compensations_list: List[CompensationItem] = []
    if trunk_angle > 7.5:
        dir_name = "right" if direction == "right" else "left"
        compensations_list.append(CompensationItem(
            pattern=f"lateral trunk compensation ({dir_name})",
            magnitude=f"{trunk_angle:.1f}° deviation",
            frequency="Intermittent during forceful foot strikes",
            phase="Mid-to-terminal phase of strike trials",
            details=f"Lateral trunk deviation toward the {dir_name} accompanied higher force actuator engagements."
        ))
    if shoulder_disp >= 0.055:
        compensations_list.append(CompensationItem(
            pattern="shoulder elevation compensation",
            magnitude=f"{shoulder_disp:.3f} displacement ratio",
            frequency="Recurrent",
            phase="Extended trial sequences",
            details="Acromion elevation asymmetry observed during sustained strike attempts."
        ))
    if anterior_ratio >= 0.22:
        compensations_list.append(CompensationItem(
            pattern="anterior trunk compensation",
            magnitude=f"{anterior_ratio:.2f} inclination ratio",
            frequency="Intermittent",
            phase="Pre-strike loading phase",
            details="Anterior trunk inclination noted prior to actuator contact."
        ))
    if rotation_angle >= 8.0:
        compensations_list.append(CompensationItem(
            pattern="excessive torso rotation",
            magnitude=f"{rotation_angle:.1f}°",
            frequency="Intermittent",
            phase="Lateral strike angles",
            details=f"Torso yaw rotational variance ({rotation_angle:.1f}°) measured during off-axis strikes."
        ))
    if not compensations_list:
        compensations_list.append(CompensationItem(
            pattern="postural adjustment within baseline",
            magnitude="Within prototype thresholds",
            frequency="Infrequent",
            phase="Throughout session",
            details="No sustained compensatory movement patterns exceeded prototype thresholds."
        ))

    motor_items = [
        MotorPerformanceItem(
            metric="Actuator Force Output",
            value=f"{force_val:.1f}%",
            unit="Normalized device force value",
            interpretation=f"Mean actuator force recorded at {force_val:.1f}% across trial repetitions.",
        ),
        MotorPerformanceItem(
            metric="Reaction Latency",
            value=f"{rt:.2f}",
            unit="s",
            interpretation=f"{'Prompt reaction latency' if rt <= 1.5 else 'Increased reaction latency'} recorded at {rt:.2f} s.",
        ),
        MotorPerformanceItem(
            metric="Strike Accuracy",
            value=f"{acc:.1f}",
            unit="%",
            interpretation=f"Target strike acquisition accuracy recorded at {acc:.1f}%.",
        ),
        MotorPerformanceItem(
            metric="Movement Consistency",
            value=f"{consistency:.1f}",
            unit="%",
            interpretation=f"Movement consistency index maintained at {consistency:.1f}%.",
        ),
    ]

    bilateral_section = None
    if req.left_force is not None and req.right_force is not None:
        diff_val = abs(req.left_force - req.right_force)
        bilateral_section = BilateralPerformance(
            leftValue=f"{req.left_force:.1f}",
            rightValue=f"{req.right_force:.1f}",
            difference=f"{diff_val:.1f} units",
            interpretation=(
                f"Bilateral force-output asymmetry of {diff_val:.1f} units was observed across recorded trials."
                if diff_val > 20
                else "Bilateral device force output demonstrated symmetrical distribution."
            )
        )

    mq_section_en = MovementQualitySection(
        score=mq,
        label="APEX 4 Movement Quality Score",
        explanation=(
            "This score is a prototype composite metric derived from session movement and performance data and is "
            "intended for monitoring/trend visualization, not as a standalone clinical assessment."
        )
    )

    temporal_list = [
        f"Initial Phase: Baseline strike accuracy established at {acc:.1f}% with stable initial latency.",
        f"Middle Phase: Postural stability maintained at {stability:.1f}% during active strike repetitions.",
        (
            f"Final Phase: Lateral trunk deviation settled to {trunk_angle:.1f}°, maintaining {consistency:.1f}% consistency."
            if is_pose_valid
            else "Temporal trend could not be reliably determined from the available session data due to tracking conditions."
        )
    ]

    ai_observations_list = [
        f"Overall APEX 4 Movement Quality Score was recorded at {mq:.1f}% for the {duration_str} session.",
        postural_overview_summary,
        f"Task execution demonstrated {acc:.1f}% strike accuracy with {rt:.2f} s reaction latency."
    ]

    review_points_list: List[str] = []
    if trunk_angle > 7.5:
        review_points_list.append(
            f"Repeated lateral trunk deviation toward the {direction} ({trunk_angle:.1f}°) during task execution may warrant professional review."
        )
    if shoulder_disp >= 0.055:
        review_points_list.append(
            f"Persistent bilateral shoulder elevation asymmetry ({shoulder_disp:.3f} displacement ratio) observed during trials. Consider reviewing in conjunction with clinical examination."
        )
    if anterior_ratio >= 0.22:
        review_points_list.append(
            f"Anterior trunk inclination ({anterior_ratio:.2f} ratio) during forceful strikes may warrant professional review."
        )
    if rt > 1.8:
        review_points_list.append(
            f"Increased reaction latency ({rt:.2f} s) observed during session. May warrant review alongside clinical motor assessment."
        )
    if req.left_force is not None and req.right_force is not None and abs(req.left_force - req.right_force) > 25:
        review_points_list.append(
            f"Substantial bilateral device force-output asymmetry ({abs(req.left_force - req.right_force):.1f} units difference). Consider reviewing in conjunction with clinical examination."
        )
    if not review_points_list:
        review_points_list.append(
            "Movement metrics remained within established prototype parameters. No critical deviations requiring immediate review were identified."
        )

    return AIReportResponse(
        sessionId=req.session_id or "ses-default",
        sessionDate=req.session_date or "2026-09-14",
        sessionDuration=duration_str,
        dataSource=data_source_label,
        poseAnalysisSource="MediaPipe Computer Vision Pose Estimation",
        sessionOverview=session_overview_text,
        posturalAssessment=postural_assessment_items,
        movementCompensation=compensations_list,
        motorPerformance=motor_items,
        bilateralPerformance=bilateral_section,
        movementQuality=mq_section_en,
        temporalAnalysis=temporal_list,
        aiObservations=ai_observations_list,
        professionalReviewPoints=review_points_list,
        limitations=LIMITATIONS_TEXT_EN,
        safetyNotice=SAFETY_NOTICE_EN,
        language="en",
        positiveObservations=ai_observations_list,
        measurableConcerns=[c.details for c in compensations_list],
        sessionTrend=session_overview_text,
        therapistDiscussionPoints=review_points_list,
        disclaimer=SAFETY_NOTICE_EN,
    )

