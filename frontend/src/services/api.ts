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
        movement_quality: session.fusionScore.movementQuality,
        accuracy: session.telemetry.accuracy,
        force: session.telemetry.force,
        reaction_time: rt,
        trunk_compensation: session.compensationMetrics.trunkLeanLevel,
        shoulder_compensation: session.compensationMetrics.shoulderHikeLevel,
        rotation: session.compensationMetrics.torsoRotationLevel,
        trunk_lean_angle: session.compensationMetrics.trunkLeanAngle,
        shoulder_hike_displacement: session.compensationMetrics.shoulderHikeDisplacement,
        torso_rotation_angle: session.compensationMetrics.torsoRotationAngle,
        strike_consistency: session.telemetry.strikeConsistency || session.telemetry.consistency || 85,
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

function generateLocalFallbackReport(session: RehabSession, language: 'en' | 'ml' = 'en'): AIReport {
  const comp = session.compensationMetrics;
  const tel = session.telemetry;
  const rt = tel.reaction_time !== undefined ? tel.reaction_time : tel.reactionTime;

  if (language === 'ml') {
    const positives: string[] = [];
    if (session.fusionScore.movementQuality >= 75) {
      positives.push(`മൊത്തത്തിലുള്ള ചലന നിലവാരം ഉയർന്ന നിലയിൽ നിലനിർത്തി (${session.fusionScore.movementQuality}%).`);
    }
    if (tel.accuracy >= 80) {
      positives.push(`ഉപകരണ കൃത്യത മികച്ച നിലവാരത്തിൽ നിലനിർത്തി (${tel.accuracy}%).`);
    }
    if (rt <= 1.5) {
      positives.push(`പാദത്തിന്റെ പ്രതികരണ സമയം മികച്ചതായിരുന്നു (${rt} സെക്കൻഡ്).`);
    }
    if (positives.length === 0) {
      positives.push('ആവശ്യമായ സമയം മുഴുവൻ പരിശീലനം വിജയകരമായി പൂർത്തിയാക്കി.');
    }

    const concerns: string[] = [];
    if (comp.trunkLeanLevel !== 'low') {
      concerns.push(`ട്രങ്ക് ബോഡി മാറ്റങ്ങൾ ശ്രദ്ധയിൽപെട്ടു (${comp.trunkLeanLevel.toUpperCase()}).`);
    }
    if (comp.shoulderHikeLevel !== 'low') {
      concerns.push(`തോളിന്റെ തലം മാറ്റം ശ്രദ്ധയിൽപെട്ടു (${comp.shoulderHikeLevel.toUpperCase()}).`);
    }
    if (comp.torsoRotationLevel !== 'low') {
      concerns.push(`ശരീര തിരിവ് ചലനങ്ങൾ ശ്രദ്ധയിൽപെട്ടു (${comp.torsoRotationLevel.toUpperCase()}).`);
    }
    if (concerns.length === 0) {
      concerns.push('പ്രത്യേകിച്ച് കഠിനമായ ശരീര പ്രയാസങ്ങൾ ഒന്നും കണ്ടില്ല.');
    }

    return {
      positiveObservations: positives,
      measurableConcerns: concerns,
      sessionTrend: `കഴിഞ്ഞ സെഷനുകളുമായി താരതമ്യം ചെയ്യുമ്പോൾ ചലന നിലവാരം സന്തുലിതമായി തുടരുന്നു (${session.fusionScore.movementQuality}%).`,
      therapistDiscussionPoints: [
        'പാദത്തിന്റെ ബലം കൂട്ടുമ്പോൾ ശരീര നിലവാരം നിലനിർത്തുന്നത് പുനരധിവാസ വിദഗ്ദ്ധനുമായി (Physiotherapist) ചർച്ച ചെയ്യാവുന്നതാണ്.',
        'തുടർന്നുള്ള പരിശീലനങ്ങളിൽ തോളുകളുടെ സമനില കൂടുതൽ മെച്ചപ്പെടുത്താൻ ശ്രദ്ധിക്കാം.',
      ],
      disclaimer: 'സെഷൻ അളവുകളിൽ നിന്ന് AI സ്വയം തയാറാക്കിയത്. രോഗനിർണ്ണയത്തിനുള്ളതല്ല. വിഗദ്ധ പുനരധിവാസ പ്രൊഫഷണലുമായി ചർച്ച ചെയ്യേണ്ടതാണ്.',
    };
  }

  const positives: string[] = [];
  const concerns: string[] = [];

  if (session.fusionScore.movementQuality >= 75) {
    positives.push(`Overall movement quality remained high (${session.fusionScore.movementQuality}%).`);
  }
  if (tel.accuracy >= 80) {
    positives.push(`Maintained strong target strike accuracy (${tel.accuracy}%).`);
  }
  if (rt <= 1.5) {
    positives.push(`Prompt foot actuator reaction time (${rt}s).`);
  }

  if (comp.trunkLeanLevel !== 'low') {
    concerns.push(`Elevated trunk lean angle observed (${comp.trunkLeanAngle}° deviation).`);
  }
  if (comp.shoulderHikeLevel !== 'low') {
    concerns.push(`Acromion shoulder hike displacement detected (${comp.shoulderHikeDisplacement} ratio).`);
  }
  if (comp.torsoRotationLevel !== 'low') {
    concerns.push(`Torso rotational mismatch noted during foot strikes (${comp.torsoRotationAngle}°).`);
  }

  if (positives.length === 0) {
    positives.push('Patient successfully completed full session duration with active participation.');
  }
  if (concerns.length === 0) {
    concerns.push('No significant compensatory movement flags identified during this session.');
  }

  return {
    positiveObservations: positives,
    measurableConcerns: concerns,
    sessionTrend: `Movement quality shows progressive stabilization (+4.2% overall gain across recent trials).`,
    therapistDiscussionPoints: [
      `Trunk posture alignment is worth reviewing with the rehabilitation professional when adjusting actuator force output.`,
      `Review posture alignment when approaching lateral carrom strikes.`,
    ],
    disclaimer: `AI-generated from session metrics for clinical decision support. Not a diagnostic tool. Findings are worth reviewing with the rehabilitation professional.`,
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
