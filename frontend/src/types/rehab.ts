export interface PoseLandmark {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  z?: number;
  visibility?: number;
}

export type CompensationLevel = 'low' | 'medium' | 'high';

export interface CompensationMetrics {
  trunkLeanAngle: number; // Degrees deviation from vertical
  trunkLeanDirection?: 'left' | 'right' | 'neutral';
  trunkLeanLevel: CompensationLevel;
  anteriorInclinationRatio?: number;
  shoulderHikeDisplacement: number; // Normalized height asymmetry
  shoulderHikeLevel: CompensationLevel;
  torsoRotationAngle: number; // Angle mismatch between shoulders and hips
  torsoRotationLevel: CompensationLevel;
  overallStability: number; // 0..100%
  movementConsistency?: number; // 0..100% (Computer vision temporal posture consistency)
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
  leftForce?: number;
  rightForce?: number;
  rudder?: number;
  hardwareConnected?: boolean;
  pedalsConnected?: boolean;
  arduinoConnected?: boolean;
  source?: 'hardware' | 'simulated' | 'demo';
}

export interface FusionScore {
  movementQuality: number; // 0..100%
  performanceScore: number; // 0..100%
  combinedSessionScore: number; // 0..100%
  compensationSummary: string;
}

export interface PosturalParameterItem {
  parameter: string;
  observedValue: string;
  referenceThreshold: string;
  interpretation: string;
}

export interface CompensationReportItem {
  pattern: string;
  magnitude: string;
  frequency: string;
  phase: string;
  details: string;
}

export interface MotorPerformanceReportItem {
  metric: string;
  value: string;
  unit: string;
  interpretation: string;
}

export interface BilateralPerformanceItem {
  leftValue?: string;
  rightValue?: string;
  difference?: string;
  interpretation: string;
}

export interface MovementQualityReportSection {
  score: number;
  label: string;
  explanation: string;
}

export interface AIReport {
  sessionId?: string;
  sessionDate?: string;
  sessionDuration?: string;
  dataSource?: string;
  poseAnalysisSource?: string;
  sessionOverview?: string;
  posturalAssessment?: PosturalParameterItem[];
  movementCompensation?: CompensationReportItem[];
  motorPerformance?: MotorPerformanceReportItem[];
  bilateralPerformance?: BilateralPerformanceItem;
  movementQuality?: MovementQualityReportSection;
  temporalAnalysis?: string[];
  aiObservations?: string[];
  professionalReviewPoints?: string[];
  limitations?: string;
  safetyNotice?: string;
  language?: string;

  // Backward compatibility fields
  sessionSummary?: string;
  movementObservations?: string[];
  performanceSummary?: {
    actuatorForce?: string;
    reactionTime?: string;
    accuracy?: string;
    consistency?: string;
    [key: string]: any;
  };
  sessionTrend?: string;
  therapistDiscussionPoints?: string[];
  positiveObservations?: string[];
  measurableConcerns?: string[];
  disclaimer?: string;
  label?: string;
  sublabel?: string;
}

export type SessionSource = 'hardware' | 'demo';

export interface RecordedSessionData {
  sessionId: string;
  startedAt: string; // ISO 8601 string
  endedAt: string;   // ISO 8601 string
  durationSeconds: number;
  telemetry: HardwareTelemetry;
  vision: CompensationMetrics;
  analytics: FusionScore | any;
  source: SessionSource;
  status: 'completed' | 'invalid';
  sampleCount?: number;
}

export interface RehabSession {
  id: string;
  sessionId?: string;
  startedAt?: string;
  endedAt?: string;
  source?: SessionSource;
  patientId: string;
  patientName: string;
  date: string;
  durationSeconds: number;
  fusionScore: FusionScore;
  compensationMetrics: CompensationMetrics;
  telemetry: HardwareTelemetry;
  recordedSessionData?: RecordedSessionData;
  aiReport?: AIReport;
  status: 'completed' | 'in_progress' | 'invalid';
}
