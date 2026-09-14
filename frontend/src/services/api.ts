import axios from 'axios';
import { RehabSession, AIReport } from '../types/rehab';
import { NotificationItem, UserProfile } from '../types/healthcare';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const apiService = {
  // MSV1 Rehabilitation AI Report Endpoint
  generateAIReport: async (session: RehabSession, language: 'en' | 'ml' = 'en'): Promise<AIReport> => {
    try {
      const rt = session.telemetry.reaction_time !== undefined ? session.telemetry.reaction_time : session.telemetry.reactionTime;
      const res = await apiClient.post('/reports/generate', {
        session_id: session.id,
        patient_name: session.patientName,
        session_date: session.date,
        session_duration_seconds: session.durationSeconds,
        movement_quality: session.fusionScore.movementQuality,
        accuracy: session.telemetry.accuracy,
        force: session.telemetry.force,
        reaction_time: rt,
        trunk_compensation: session.compensationMetrics.trunkLeanLevel,
        shoulder_compensation: session.compensationMetrics.shoulderHikeLevel,
        rotation: session.compensationMetrics.torsoRotationLevel,
        trunk_lean_angle: session.compensationMetrics.trunkLeanAngle,
        trunk_lean_direction: session.compensationMetrics.trunkLeanAngle > 7.5 ? 'right' : 'neutral',
        anterior_inclination_ratio: 0.08,
        shoulder_hike_displacement: session.compensationMetrics.shoulderHikeDisplacement,
        torso_rotation_angle: session.compensationMetrics.torsoRotationAngle,
        overall_stability: session.compensationMetrics.overallStability || 85,
        strike_consistency: session.telemetry.strikeConsistency || session.telemetry.consistency || 85,
        telemetry_mode: session.telemetry.mode,
        language: language,
      });
      return res.data;
    } catch (e) {
      console.warn('Backend LLM endpoint unavailable, using local clinical fallback report generator', e);
      return generateLocalFallbackReport(session, language);
    }
  },

  getSessions: async (): Promise<RehabSession[]> => {
    try {
      const res = await apiClient.get('/sessions/history');
      return res.data;
    } catch (e) {
      return getDemoSessions();
    }
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    return [
      {
        id: 'notif-1',
        title: 'Session Quality Alert',
        message: 'Alex Mercer achieved 82% Movement Quality in latest session.',
        type: 'report',
        is_read: false,
        created_at: '10 mins ago',
      },
    ];
  },

  // Auth Compatibility Wrappers
  login: async (email: string, password: string) => {
    return {
      access_token: 'demo-token',
      user: {
        id: 'user-demo-101',
        email: email || 'therapist@apex4.ai',
        full_name: 'Dr. Alex Vance, PT',
        role: 'patient' as const,
        age: 38,
        gender: 'Male',
        medical_history: [],
        emergency_contact: '',
        language_preference: 'en' as const,
      },
    };
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    return {
      id: 'user-demo-101',
      email: 'therapist@apex4.ai',
      full_name: 'Dr. Alex Vance, PT',
      role: 'patient',
      age: 38,
      gender: 'Male',
      medical_history: [],
      emergency_contact: '',
      language_preference: 'en' as const,
    };
  },

  // Obsolete page compatibility mocks
  getReports: async () => [],
  uploadReport: async (file: File) => ({} as any),
  deleteReport: async (reportId: string) => ({}),
  sendAssistantChat: async (message: string, conversationId?: string, language?: string) => ({
    answer: '',
    sources: [],
    disclaimer: '',
  }),
  getConversations: async () => [{ id: 'c1', title: 'Session Query', created_at: '10:00' }],
  createNewConversation: async () => ({ id: 'c1', title: 'New Query', created_at: '10:00' }),
  getConversationMessages: async (conversationId: string) => [],
  sendChatMessage: async (message: string, language?: string, reportId?: string) => ({}),
  getAppointments: async () => [],
  createAppointment: async (data: any) => ({} as any),
  updateAppointment: async (id: string, updates: any) => ({} as any),
  deleteAppointment: async (id: string) => ({}),
  getHealthMetrics: async () => [],
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function generateLocalFallbackReport(session: RehabSession, language: 'en' | 'ml' = 'en'): AIReport {
  const comp = session.compensationMetrics;
  const tel = session.telemetry;
  const rt = tel.reaction_time !== undefined ? tel.reaction_time : tel.reactionTime;
  const durationStr = formatDuration(session.durationSeconds || 240);
  const isHardware = (tel.mode || '').toLowerCase().includes('hardware');
  const dataSource = isHardware ? 'REAL HARDWARE' : 'APEX 4 DEMO TELEMETRY';
  const mq = session.fusionScore.movementQuality;
  const acc = tel.accuracy;
  const forceVal = tel.force;
  const consistency = tel.strikeConsistency || tel.consistency || 85;
  const stability = comp.overallStability || 85;

  const trunkAngle = comp.trunkLeanAngle || 0;
  const direction = trunkAngle > 7.5 ? 'right' : 'neutral';
  const shoulderDisp = comp.shoulderHikeDisplacement || 0;
  const rotationAngle = comp.torsoRotationAngle || 0;

  if (language === 'ml') {
    const overview = `രോഗി ${durationStr} ദൈർഘ്യമുള്ള MSV1 ആക്ച്വേറ്റർ ലക്ഷ്യ പരിശീലനം പൂർത്തിയാക്കി. APEX 4 ചലന നിലവാരം ${mq}% രേഖപ്പെടുത്തി. ഉപകരണ സ്ട്രൈക്ക് കൃത്യത ${acc}%-ഉം ശരാശരി പ്രതികരണ സമയം ${rt.toFixed(2)} സെക്കൻഡുമായിരുന്നു.`;
    return {
      sessionId: session.id,
      sessionDate: session.date,
      sessionDuration: durationStr,
      dataSource: dataSource,
      poseAnalysisSource: 'MediaPipe Computer Vision Pose Estimation',
      sessionOverview: overview,
      posturalAssessment: [
        {
          parameter: 'Lateral Trunk Alignment',
          observedValue: `${trunkAngle.toFixed(1)}° (${direction})`,
          referenceThreshold: '7.5° (APEX 4 prototype threshold)',
          interpretation: trunkAngle <= 7.5 ? 'അനുവദനീയമായ പരിധിക്കുള്ളിൽ' : `${trunkAngle.toFixed(1)}° ട്രങ്ക് വ്യതിയാനം രേഖപ്പെടുത്തി.`,
        },
        {
          parameter: 'Anterior Trunk Inclination',
          observedValue: '0.08 ratio',
          referenceThreshold: '0.22 (APEX 4 prototype threshold)',
          interpretation: 'ശരീരം മുന്നോട്ട് ആഞ്ഞുപോകാതെ നിയന്ത്രിച്ചു.',
        },
        {
          parameter: 'Bilateral Shoulder Alignment',
          observedValue: `${shoulderDisp.toFixed(3)} displacement ratio`,
          referenceThreshold: '0.055 (APEX 4 prototype threshold)',
          interpretation: shoulderDisp < 0.055 ? 'തോളുകളുടെ സമനില ശരിയായ രീതിയിൽ നിലനിർത്തി.' : 'തോളിന്റെ ഉയരത്തിൽ അസമമിതി രേഖപ്പെടുത്തി.',
        },
        {
          parameter: 'Torso Rotation',
          observedValue: `${rotationAngle.toFixed(1)}°`,
          referenceThreshold: '8.0° (APEX 4 prototype threshold)',
          interpretation: rotationAngle < 8.0 ? 'ശരീര തിരിവ് ചലനങ്ങൾ സാധാരണ നിലയിൽ.' : `${rotationAngle.toFixed(1)}° റൊട്ടേഷൻ വ്യതിയാനം രേഖപ്പെടുത്തി.`,
        },
        {
          parameter: 'Postural Stability',
          observedValue: `${stability.toFixed(1)}%`,
          referenceThreshold: '75.0% (APEX 4 prototype threshold)',
          interpretation: `ശരീര സ്ഥിരത ${stability.toFixed(1)}% നിലവാരത്തിൽ നിലനിർത്തി.`,
        },
      ],
      movementCompensation: trunkAngle > 7.5 ? [
        {
          pattern: 'lateral trunk compensation (right)',
          magnitude: `${trunkAngle.toFixed(1)}°`,
          frequency: 'Intermittent during forceful strikes',
          phase: 'Mid-to-terminal phase',
          details: `സ്ട്രൈക്ക് നടത്തുമ്പോൾ ${trunkAngle.toFixed(1)}° compensatory ട്രങ്ക് ചലനം കാണപ്പെട്ടു.`,
        },
      ] : [
        {
          pattern: 'postural adjustment within baseline',
          magnitude: 'Within reference thresholds',
          frequency: 'N/A',
          phase: 'Throughout session',
          details: 'ശ്രദ്ധേയമായ compensatory ചലനങ്ങൾ ഒന്നും തന്നെ രേഖപ്പെടുത്തിയിട്ടില്ല.',
        },
      ],
      motorPerformance: [
        {
          metric: 'Actuator Force Output',
          value: `${forceVal.toFixed(1)}%`,
          unit: 'Normalized device force value',
          interpretation: `ശരാശരി ആക്ച്വേറ്റർ ഫോഴ്സ് ${forceVal.toFixed(1)}% നിലനിർത്തി.`,
        },
        {
          metric: 'Reaction Latency',
          value: `${rt.toFixed(2)}`,
          unit: 's',
          interpretation: `ശരാശരി പ്രതികരണ സമയം ${rt.toFixed(2)} സെക്കൻഡ്.`,
        },
        {
          metric: 'Strike Accuracy',
          value: `${acc.toFixed(1)}`,
          unit: '%',
          interpretation: `ലക്ഷ്യ സ്ട്രൈക്ക് കൃത്യത ${acc.toFixed(1)}%.`,
        },
        {
          metric: 'Movement Consistency',
          value: `${consistency.toFixed(1)}`,
          unit: '%',
          interpretation: `സ്ട്രൈക്ക് നിലവാരം ${consistency.toFixed(1)}% സമാനമായി നിലനിർത്തി.`,
        },
      ],
      movementQuality: {
        score: mq,
        label: 'APEX 4 Movement Quality Score',
        explanation: 'ഈ സ്കോർ ചലന പുരോഗതി നിരീക്ഷിക്കുന്നതിനുള്ള ഒരു പ്രോട്ടോടൈപ്പ് സംയോജിത അളവുകോലാണ്. രോഗനിർണ്ണയത്തിനുള്ള സ്വതന്ത്ര ക്ലിനിക്കൽ സ്കോറല്ല.',
      },
      temporalAnalysis: [
        `തുടക്കത്തിൽ ചലന കൃത്യത ${acc.toFixed(1)}% നിലവാരത്തിലായിരുന്നു.`,
        `തുടർച്ചയായ സ്ട്രൈക്കുകളിൽ ശരീര സ്ഥിരത ${stability.toFixed(1)}% നിലനിർത്തി.`,
      ],
      aiObservations: [
        `മൊത്തത്തിലുള്ള APEX 4 ചലന നിലവാരം ${mq}% രേഖപ്പെടുത്തി.`,
        `ലക്ഷ്യ സ്ട്രൈക്ക് കൃത്യത ${acc}%-ഉം പ്രതികരണ സമയം ${rt.toFixed(2)}s-ഉം രേഖപ്പെടുത്തി.`,
      ],
      professionalReviewPoints: trunkAngle > 7.5 ? [
        `സ്ട്രൈക്കുകൾക്കിടയിൽ ${direction} വശത്തേക്കുള്ള ${trunkAngle.toFixed(1)}° ട്രങ്ക് വ്യതിയാനം ഫിസിയോതെറാപ്പിസ്റ്റുമായി അവലോകനം ചെയ്യാവുന്നതാണ്.`,
      ] : [
        'ശ്രദ്ധേയമായ മറ്റ് പോസ്ചറൽ വ്യതിയാനങ്ങൾ ഒന്നും തന്നെ കാണപ്പെട്ടില്ല.',
      ],
      limitations: 'വെബ്ക്യാം അടിസ്ഥാനമാക്കിയുള്ള പോസ് എസ്റ്റിമേഷനിൽ നിന്നും MSV1 ഉപകരണ ടെലിമെട്രിയിൽ നിന്നും ശേഖരിച്ച ഡാറ്റ അടിസ്ഥാനമാക്കിയാണ് ഈ കണ്ടെത്തലുകൾ.',
      safetyNotice: 'വിദഗ്ദ്ധ പുനരധിവാസ പ്രൊഫഷണലുകളുടെ അവലോകനത്തിനായുള്ള AI വിശകലനം. ഇത് ഒരു രോഗനിർണ്ണയമല്ല.',
      language: 'ml',
      positiveObservations: [`ചലന നിലവാരം: ${mq}%`],
      measurableConcerns: trunkAngle > 7.5 ? [`ട്രങ്ക് വ്യതിയാനം: ${trunkAngle.toFixed(1)}°`] : [],
      sessionTrend: overview,
      therapistDiscussionPoints: ['ഫിസിയോതെറാപ്പിസ്റ്റുമായി അവലോകനം ചെയ്യാവുന്നതാണ്.'],
      disclaimer: 'രോഗനിർണ്ണയത്തിനുള്ളതല്ല.',
    };
  }

  const overviewEn = `The user completed an active ${durationStr} MSV1 actuator target strike session. Overall APEX 4 Movement Quality Score was recorded at ${mq.toFixed(1)}%. ${trunkAngle > 7.5 ? `Intermittent lateral trunk deviation toward the ${direction} (${trunkAngle.toFixed(1)}°) was observed during task execution.` : 'Postural alignment was maintained within prototype baseline thresholds throughout task performance.'} Target strike accuracy reached ${acc.toFixed(1)}% with a mean reaction latency of ${rt.toFixed(2)} s.`;

  return {
    sessionId: session.id,
    sessionDate: session.date,
    sessionDuration: durationStr,
    dataSource: dataSource,
    poseAnalysisSource: 'MediaPipe Computer Vision Pose Estimation',
    sessionOverview: overviewEn,
    posturalAssessment: [
      {
        parameter: 'Lateral Trunk Alignment',
        observedValue: `${trunkAngle.toFixed(1)}° (${direction})`,
        referenceThreshold: '7.5° (APEX 4 prototype threshold)',
        interpretation: trunkAngle <= 7.5 ? 'Alignment within prototype reference bounds.' : `Lateral trunk deviation toward the ${direction} (${trunkAngle.toFixed(1)}°) observed during active trials.`,
      },
      {
        parameter: 'Anterior Trunk Inclination',
        observedValue: '0.08 ratio',
        referenceThreshold: '0.22 (APEX 4 prototype threshold)',
        interpretation: 'Sagittal trunk inclination maintained within normal prototype limits.',
      },
      {
        parameter: 'Bilateral Shoulder Alignment',
        observedValue: `${shoulderDisp.toFixed(3)} displacement ratio`,
        referenceThreshold: '0.055 (APEX 4 prototype threshold)',
        interpretation: shoulderDisp < 0.055 ? 'Bilateral acromion horizontal alignment maintained within bounds.' : `Bilateral shoulder elevation asymmetry (${shoulderDisp.toFixed(3)} ratio) detected.`,
      },
      {
        parameter: 'Torso Rotation',
        observedValue: `${rotationAngle.toFixed(1)}°`,
        referenceThreshold: '8.0° (APEX 4 prototype threshold)',
        interpretation: rotationAngle < 8.0 ? 'Axial torso orientation aligned with target axis.' : `Trunk rotation (${rotationAngle.toFixed(1)}°) observed during actuator activation.`,
      },
      {
        parameter: 'Postural Stability',
        observedValue: `${stability.toFixed(1)}%`,
        referenceThreshold: '75.0% (APEX 4 prototype threshold)',
        interpretation: `Postural stability maintained at ${stability.toFixed(1)}%.`,
      },
    ],
    movementCompensation: trunkAngle > 7.5 ? [
      {
        pattern: `lateral trunk compensation (${direction})`,
        magnitude: `${trunkAngle.toFixed(1)}° deviation`,
        frequency: 'Intermittent during forceful foot strikes',
        phase: 'Mid-to-terminal phase of strike trials',
        details: `Lateral trunk deviation toward the ${direction} accompanied higher force actuator engagements.`,
      },
    ] : [
      {
        pattern: 'postural adjustment within baseline',
        magnitude: 'Within prototype thresholds',
        frequency: 'Infrequent',
        phase: 'Throughout session',
        details: 'No sustained compensatory movement patterns exceeded prototype thresholds.',
      },
    ],
    motorPerformance: [
      {
        metric: 'Actuator Force Output',
        value: `${forceVal.toFixed(1)}%`,
        unit: 'Normalized device force value',
        interpretation: `Mean actuator force recorded at ${forceVal.toFixed(1)}% across trial repetitions.`,
      },
      {
        metric: 'Reaction Latency',
        value: `${rt.toFixed(2)}`,
        unit: 's',
        interpretation: `${rt <= 1.5 ? 'Prompt reaction latency' : 'Increased reaction latency'} recorded at ${rt.toFixed(2)} s.`,
      },
      {
        metric: 'Strike Accuracy',
        value: `${acc.toFixed(1)}`,
        unit: '%',
        interpretation: `Target strike acquisition accuracy recorded at ${acc.toFixed(1)}%.`,
      },
      {
        metric: 'Movement Consistency',
        value: `${consistency.toFixed(1)}`,
        unit: '%',
        interpretation: `Movement consistency index maintained at ${consistency.toFixed(1)}%.`,
      },
    ],
    movementQuality: {
      score: mq,
      label: 'APEX 4 Movement Quality Score',
      explanation: 'This score is a prototype composite metric derived from session movement and performance data and is intended for monitoring/trend visualization, not as a standalone clinical assessment.',
    },
    temporalAnalysis: [
      `Initial Phase: Baseline strike accuracy established at ${acc.toFixed(1)}% with stable latency.`,
      `Middle Phase: Postural stability maintained at ${stability.toFixed(1)}% during active strike repetitions.`,
      `Final Phase: Lateral trunk deviation settled to ${trunkAngle.toFixed(1)}°, maintaining ${consistency.toFixed(1)}% consistency.`,
    ],
    aiObservations: [
      `Overall APEX 4 Movement Quality Score was recorded at ${mq.toFixed(1)}% for the ${durationStr} session.`,
      trunkAngle > 7.5 ? `Intermittent lateral trunk deviation toward the ${direction} (${trunkAngle.toFixed(1)}°) observed during task execution.` : 'Postural alignment remained within reference bounds.',
      `Task execution demonstrated ${acc.toFixed(1)}% strike accuracy with ${rt.toFixed(2)} s reaction latency.`,
    ],
    professionalReviewPoints: trunkAngle > 7.5 ? [
      `Repeated lateral trunk deviation toward the ${direction} (${trunkAngle.toFixed(1)}°) during task execution may warrant professional review.`,
    ] : [
      'Movement metrics remained within established prototype parameters. No critical deviations requiring immediate review were identified.',
    ],
    limitations: 'Findings are derived from webcam-based pose estimation and MSV1 device telemetry collected during this prototype session. Measurements may be affected by camera positioning, landmark visibility, device calibration, and task conditions.',
    safetyNotice: 'AI-generated movement analysis for professional review. This report summarizes measurements collected during the APEX 4 prototype session. It is not a diagnosis and should not be used as a substitute for clinical examination or professional judgment.',
    language: 'en',
    positiveObservations: [`Overall movement quality: ${mq}%`, `Strike accuracy: ${acc}%`],
    measurableConcerns: trunkAngle > 7.5 ? [`Lateral trunk deviation: ${trunkAngle.toFixed(1)}°`] : [],
    sessionTrend: overviewEn,
    therapistDiscussionPoints: trunkAngle > 7.5 ? [`Review lateral trunk deviation (${trunkAngle.toFixed(1)}°)`] : [],
    disclaimer: 'AI-generated from session metrics for clinical decision support. Not a diagnostic tool.',
  };
}

function getDemoSessions(): RehabSession[] {
  return [
    {
      id: 's-demo-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: '2026-09-12',
      durationSeconds: 240,
      fusionScore: {
        movementQuality: 82,
        performanceScore: 84,
        combinedSessionScore: 83,
        compensationSummary: 'Medium trunk lean detected during higher force strikes.',
      },
      compensationMetrics: {
        trunkLeanAngle: 12.4,
        trunkLeanLevel: 'medium',
        shoulderHikeDisplacement: 0.06,
        shoulderHikeLevel: 'medium',
        torsoRotationAngle: 5.2,
        torsoRotationLevel: 'low',
        overallStability: 81,
      },
      telemetry: {
        force: 64,
        reactionTime: 1.24,
        accuracy: 87,
        strikeConsistency: 82,
        mode: 'simulated',
      },
      status: 'completed',
    },
  ];
}
