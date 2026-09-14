/**
 * APEX 4 — Unified Session Analytics Engine Types
 * 
 * Strict architectural separation across 5 distinct layers:
 * 1. RAW HARDWARE DATA (MSV1 Load cells, Rudder, Latency, Force)
 * 2. VISION DATA (MediaPipe joint angles, trunk lean, shoulder displacement, rotation)
 * 3. VOICE EVENTS (Posture Commander verbal prompts & correction responses)
 * 4. DERIVED ANALYTICS (Deterministic mathematical combinations with component breakdown)
 * 5. AI OUTPUT (Clinical summary report with explicit non-diagnostic disclaimers)
 */

import { CompensationLevel } from '../types/rehab';

// ============================================================================
// 1. RAW HARDWARE DATA LAYER
// ============================================================================
export interface RawHardwareFrame {
  timestamp: string;          // ISO 8601 string
  leftLoadCell: number;       // Raw pedal sensor ADC / normalized (0..255)
  rightLoadCell: number;      // Raw pedal sensor ADC / normalized (0..255)
  rudderDifferential: number; // Raw rudder balance (0..255, center = 128)
  actuatorForce: number;      // Overall actuator force percentage (0..100%)
  reactionLatencyMs: number;  // Response reaction latency in milliseconds
  targetHit: boolean;         // Whether this frame/action hit the exercise target
  source: 'hardware' | 'simulated' | 'demo';
  connected: boolean;
}

export interface RawHardwareSessionSummary {
  frameCount: number;
  meanLeftLoadCell: number;
  meanRightLoadCell: number;
  peakLeftLoadCell: number;
  peakRightLoadCell: number;
  meanRudder: number;
  meanForce: number;
  peakForce: number;
  meanReactionLatencyMs: number;
  targetHitCount: number;
  totalTargetTrials: number;
}

// ============================================================================
// 2. VISION DATA LAYER
// ============================================================================
export interface VisionFrame {
  timestamp: string;
  trunkLeanAngleDeg: number;          // Degrees deviation from vertical
  trunkLeanDirection: 'left' | 'right' | 'neutral';
  trunkLeanLevel: CompensationLevel;
  shoulderHikeDisplacement: number;    // Vertical displacement ratio (0..1)
  shoulderHikeLevel: CompensationLevel;
  torsoRotationAngleDeg: number;      // Degrees rotational mismatch
  torsoRotationLevel: CompensationLevel;
  forwardLeanDisplacement?: number;   // Anterior pitch ratio
  posturalStabilityPct: number;       // Frame stability score (0..100%)
  trackingConfidence: number;         // Landmark tracking visibility (0..1)
  poseDetected: boolean;
}

export interface VisionSessionSummary {
  frameCount: number;
  meanTrunkLeanDeg: number;
  peakTrunkLeanDeg: number;
  meanShoulderHikeDisp: number;
  peakShoulderHikeDisp: number;
  meanTorsoRotationDeg: number;
  peakTorsoRotationDeg: number;
  meanStabilityPct: number;
  meanTrackingConfidence: number;
  highCompensationFrameCount: number;
}

// ============================================================================
// 3. VOICE EVENTS LAYER
// ============================================================================
export interface VoiceCorrectionEvent {
  id: string;
  timestamp: string;
  deviationType: 'trunk_lean' | 'shoulder_hike' | 'torso_rotation' | 'forward_lean' | 'general';
  promptSpoken: string;
  triggerMagnitude: number;           // Value at trigger (e.g. degrees or ratio)
  cooldownElapsedMs: number;
  resolved: boolean;                  // Did user return to green within time window?
  latencyToCorrectionMs?: number;     // Time elapsed between voice prompt and green posture recovery
}

export interface VoiceSessionSummary {
  totalPromptsSpoken: number;
  promptsByDeviation: {
    trunkLean: number;
    shoulderHike: number;
    torsoRotation: number;
    forwardLean: number;
  };
  resolvedCorrectionsCount: number;
  correctionComplianceRatePct: number; // Percentage of prompts that achieved posture recovery
  meanCorrectionLatencyMs: number;
}

// ============================================================================
// 4. DERIVED ANALYTICS LAYER (Mathematical Composites with Component Exposure)
// ============================================================================

/**
 * Movement Quality: Overall motor execution quality (0..100%)
 */
export interface MovementQualityMetric {
  score: number;                     // 0..100%
  rating: 'Optimal' | 'Good' | 'Fair' | 'Needs Attention';
  components: {
    postureDeduction: number;        // Penalty from trunk/shoulder/torso deviations
    stabilityBonus: number;          // Contribution from spatial stability
    motorExecutionScore: number;     // Hardware smoothness & accuracy score
    weights: {
      visionWeight: number;          // Default 0.50
      hardwareWeight: number;        // Default 0.35
      stabilityWeight: number;       // Default 0.15
    };
  };
}

/**
 * Movement Compensation: Body compensation profile
 */
export interface MovementCompensationMetric {
  compensationScore: number;         // 0..100% (100 = zero compensation, 0 = extreme)
  compensationLevel: CompensationLevel;
  primaryDeviation: 'trunk_lean' | 'shoulder_hike' | 'torso_rotation' | 'none';
  summary: string;
  components: {
    meanTrunkLeanDeg: number;
    meanShoulderHikeDisp: number;
    meanTorsoRotationDeg: number;
    highSeverityFrameRatio: number;  // Ratio of frames where compensation was HIGH
  };
}

/**
 * Postural Stability: Variance and spatial stillness of posture
 */
export interface PosturalStabilityMetric {
  stabilityScore: number;            // 0..100%
  swayVarianceDeg2: number;          // Degrees squared variance of trunk sway
  stabilityRating: 'Stable' | 'Mild Sway' | 'Significant Instability';
  components: {
    trunkAngleVariance: number;
    shoulderDisplacementVariance: number;
    baselineDeviationMean: number;
  };
}

/**
 * Movement Variability: Dispersion of force and timing across repetitions
 */
export interface MovementVariabilityMetric {
  forceCoefficientOfVariation: number; // CV = (StdDev / Mean) * 100%
  latencyStdDevMs: number;            // Standard deviation of reaction times
  postureAngleStdDevDeg: number;      // Standard deviation of trunk angle
  variabilityRating: 'Consistent' | 'Moderate Variability' | 'High Variability';
  components: {
    forceMean: number;
    forceStdDev: number;
    latencyMeanMs: number;
    latencyStdDevMs: number;
  };
}

/**
 * Movement Consistency: Temporal repeatability and rhythm uniformity
 */
export interface MovementConsistencyMetric {
  consistencyScore: number;          // 0..100%
  rhythmUniformityPct: number;       // Regularity of cycle timing (0..100%)
  strokeRepeatabilityPct: number;    // Peak force similarity across cycles (0..100%)
  components: {
    cadenceVarianceMs: number;
    forcePeakSimilarityRatio: number;
  };
}

/**
 * Bilateral Performance: Left vs. Right pedal/actuator symmetry
 */
export interface BilateralPerformanceMetric {
  asymmetryIndexPct: number;         // Asymmetry formula: |L - R| / max(L, R, 1) * 100%
  dominantSide: 'left' | 'right' | 'symmetric';
  symmetryRating: 'Symmetric' | 'Mild Asymmetry' | 'Marked Asymmetry';
  components: {
    leftMeanForce: number;
    rightMeanForce: number;
    leftPeakForce: number;
    rightPeakForce: number;
    rudderCenterDeviation: number;   // Deviation from 128 (center)
  };
}

/**
 * Task Performance: Goal achievement, accuracy, latency
 */
export interface TaskPerformanceMetric {
  taskScore: number;                 // 0..100%
  accuracyPct: number;               // Target hit percentage
  meanReactionTimeSec: number;       // Latency in seconds
  trialsCompleted: number;
  components: {
    targetsHit: number;
    targetsTotal: number;
    meanLatencyMs: number;
    fastestLatencyMs: number;
    slowestLatencyMs: number;
  };
}

/**
 * Complete Derived Analytics bundle
 */
export interface UnifiedDerivedAnalytics {
  movementQuality: MovementQualityMetric;
  movementCompensation: MovementCompensationMetric;
  posturalStability: PosturalStabilityMetric;
  movementVariability: MovementVariabilityMetric;
  movementConsistency: MovementConsistencyMetric;
  bilateralPerformance: BilateralPerformanceMetric;
  taskPerformance: TaskPerformanceMetric;
  voiceAnalytics: VoiceSessionSummary;
  overallSessionScore: number;       // 0..100%
  disclaimer: string;
}

// ============================================================================
// 5. AI OUTPUT LAYER (Strictly non-diagnostic clinical summary)
// ============================================================================
export interface AIReportOutput {
  reportGenerated: boolean;
  generatedAt: string;
  summaryNarrative: string;
  keyObservations: string[];
  suggestedFocusAreas: string[];
  disclaimer: string;
}

// ============================================================================
// STRUCTURED SESSION ANALYSIS BUNDLE (Top-level aggregation)
// ============================================================================
export interface StructuredSessionAnalysis {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  sampleCount: number;
  dataSource: 'hardware' | 'simulated' | 'demo';

  // Strict Layer Separation
  rawHardware: RawHardwareSessionSummary;
  vision: VisionSessionSummary;
  voiceEvents: VoiceCorrectionEvent[];
  derivedAnalytics: UnifiedDerivedAnalytics;
  aiOutput?: AIReportOutput;
}
