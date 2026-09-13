export interface PoseLandmark {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  z?: number;
  visibility?: number;
}

export type CompensationLevel = 'low' | 'medium' | 'high';

export interface CompensationMetrics {
  trunkLeanAngle: number; // Degrees deviation from vertical
  trunkLeanLevel: CompensationLevel;
  shoulderHikeDisplacement: number; // Normalized height asymmetry
  shoulderHikeLevel: CompensationLevel;
  torsoRotationAngle: number; // Angle mismatch between shoulders and hips
  torsoRotationLevel: CompensationLevel;
  overallStability: number; // 0..100%
}

export interface BaselineCalibration {
  midShoulderX: number;
  midShoulderY: number;
  shoulderWidth: number;
  shoulderAngle: number;
  hipAngle: number;
  timestamp: string;
  isCalibrated: boolean;
}

export type TelemetryMode = 'SIMULATED' | 'LIVE HARDWARE';

export interface HardwareTelemetry {
  force: number; // 0..100%
  reactionTime: number; // Seconds (e.g. 1.24)
  reaction_time?: number; // Alias for reactionTime
  accuracy: number; // 0..100%
  strikeConsistency: number; // 0..100%
  consistency?: number; // Alias for strikeConsistency
  timestamp?: string; // ISO 8601 string
  mode: TelemetryMode | 'simulated' | 'hardware';
  profilePreset?: 'normal' | 'fatigue' | 'high_compensation';
  connectionStatus?: 'connected' | 'disconnected' | 'simulated';
}

export interface FusionScore {
  movementQuality: number; // 0..100%
  performanceScore: number; // 0..100%
  combinedSessionScore: number; // 0..100%
  compensationSummary: string;
}

export interface AIReport {
  positiveObservations: string[];
  measurableConcerns: string[];
  sessionTrend: string;
  therapistDiscussionPoints: string[];
  disclaimer: string;
}

export interface RehabSession {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  durationSeconds: number;
  fusionScore: FusionScore;
  compensationMetrics: CompensationMetrics;
  telemetry: HardwareTelemetry;
  aiReport?: AIReport;
  status: 'completed' | 'in_progress';
}
