import { CompensationMetrics, HardwareTelemetry, FusionScore, CompensationLevel } from '../types/rehab';

export const FUSION_CONFIG = {
  VISION_WEIGHT: 0.50,         // Weight of vision movement quality in session score
  PERFORMANCE_WEIGHT: 0.35,    // Weight of hardware performance in session score
  STABILITY_WEIGHT: 0.15,      // Weight of baseline posture stability
  REACTION_TIME_OPTIMAL: 1.0,  // Optimal reaction time threshold (seconds)
  REACTION_TIME_SLOPE: 25,     // Score penalty per second over optimal threshold
  LABELS: {
    MOVEMENT_QUALITY: 'Movement Quality',
    MOVEMENT_COMPENSATION: 'Movement Compensation',
    MOVEMENT_ANALYSIS: 'Movement Analysis',
    SESSION_ANALYTICS: 'Session Analytics',
  },
  DISCLAIMER: 'PROTOTYPE ANALYTICS: Sensor fusion scores are rule-based analytical metrics designed for progress tracking and performance evaluation. They are NOT clinically validated diagnostic medical scores.',
};

// ============================================================================
// DATA SOURCE 1 — HARDWARE TELEMETRY
// ============================================================================
export interface HardwareSourceMetrics {
  leftForce: number;          // Left pedal sensor output (0..255 or normalized)
  rightForce: number;         // Right pedal sensor output (0..255 or normalized)
  rudder: number;             // Differential balance output (0..255, center=128)
  force: number;              // Overall actuator force output percentage (0..100%)
  reactionTime: number;       // Response latency in seconds (e.g. 1.12s)
  accuracy: number;           // Target hit accuracy percentage (0..100%)
  strikeConsistency: number;  // Actuator output consistency percentage (0..100%)
}

// ============================================================================
// DATA SOURCE 2 — COMPUTER VISION METRICS
// ============================================================================
export interface VisionSourceMetrics {
  trunkLeanAngle: number;           // Lateral trunk deviation in degrees
  trunkLeanLevel: CompensationLevel;
  shoulderHikeDisplacement: number; // Vertical shoulder asymmetry ratio (0..1)
  shoulderHikeLevel: CompensationLevel;
  torsoRotationAngle: number;       // Rotational mismatch between shoulders & hips
  torsoRotationLevel: CompensationLevel;
  movementStability: number;        // Spatial posture stability (0..100%)
  movementConsistency: number;      // Temporal posture consistency (0..100%)
}

// ============================================================================
// STRUCTURED SESSION FUSION ANALYTICS
// ============================================================================
export interface MovementCompensationAnalytics {
  label?: string;                    // 'Movement Compensation'
  compensationScore: number;         // 0..100% (100 = minimal compensation, 0 = severe)
  compensationLevel: CompensationLevel;
  summary: string;
  details: {
    trunkLean: { angle: number; level: CompensationLevel };
    shoulderHike: { displacement: number; level: CompensationLevel };
    torsoRotation: { angle: number; level: CompensationLevel };
  };
}

export interface HardwarePerformanceAnalytics {
  label?: string;                    // 'APEX 4 Performance'
  performanceScore: number;         // 0..100%
  leftForce: number;
  rightForce: number;
  rudder: number;
  force: number;
  reactionTime: number;
  accuracy: number;
  strikeConsistency: number;
}

export interface SessionAnalytics {
  label?: string;                    // 'Session Analytics'
  combinedSessionScore: number;     // 0..100%
  rating: 'Optimal' | 'Good' | 'Moderate' | 'Needs Attention';
  insight: string;
  timestamp: string;
}

export interface SessionDataFusionResult {
  movementQualityLabel: string;      // 'Movement Quality'
  movementQuality: number;           // 0..100%
  movementCompensation: MovementCompensationAnalytics;
  hardwarePerformance: HardwarePerformanceAnalytics;
  visionMetrics: VisionSourceMetrics;
  sessionAnalytics: SessionAnalytics;
  disclaimer: string;
}

// Extended interface for backward-compatibility with UI components
export interface ExtendedFusionScore extends FusionScore {
  compensationScore: number;        // 0..100%
  compensationLevel: CompensationLevel;
  combinedInsight: string;          // Synthesized relationship between posture and hardware output
  movementCompensation: MovementCompensationAnalytics;
  hardwarePerformance: HardwarePerformanceAnalytics;
  visionMetrics: VisionSourceMetrics;
  sessionAnalytics: SessionAnalytics;
  disclaimer: string;
}

// ============================================================================
// MODEL PLUGABILITY INTERFACE
// ============================================================================
export interface IFusionModelStrategy {
  name: string;
  version: string;
  evaluate(hardware: HardwareSourceMetrics, vision: VisionSourceMetrics): SessionDataFusionResult;
}

/**
 * Transparent Rule-Based Fusion Model Implementation.
 * Easy to replace with an ML-based trained model in the future.
 */
export class RuleBasedFusionModel implements IFusionModelStrategy {
  name = 'APEX-RuleBased-Fusion-v1.0';
  version = '1.0.0';

  evaluate(hardware: HardwareSourceMetrics, vision: VisionSourceMetrics): SessionDataFusionResult {
    // 1. Movement Quality & Compensation Calculation (Vision-driven)
    const leanPenalty = (vision.trunkLeanAngle || 0) * 1.5;
    const hikePenalty = (vision.shoulderHikeDisplacement || 0) * 180;
    const rotPenalty = (vision.torsoRotationAngle || 0) * 1.2;
    const totalPenalty = leanPenalty + hikePenalty + rotPenalty;

    const movementQuality = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));
    const compensationScore = Math.max(0, Math.min(100, Math.round(100 - totalPenalty * 1.2)));

    const levels: CompensationLevel[] = [
      vision.trunkLeanLevel || 'low',
      vision.shoulderHikeLevel || 'low',
      vision.torsoRotationLevel || 'low',
    ];

    let compensationLevel: CompensationLevel = 'low';
    if (levels.includes('high')) {
      compensationLevel = 'high';
    } else if (levels.includes('medium')) {
      compensationLevel = 'medium';
    }

    const highCompFlags: string[] = [];
    if (vision.trunkLeanLevel && vision.trunkLeanLevel !== 'low') {
      highCompFlags.push(`Trunk Lean (${vision.trunkLeanAngle}°)`);
    }
    if (vision.shoulderHikeLevel && vision.shoulderHikeLevel !== 'low') {
      highCompFlags.push('Shoulder Hike');
    }
    if (vision.torsoRotationLevel && vision.torsoRotationLevel !== 'low') {
      highCompFlags.push(`Torso Rotation (${vision.torsoRotationAngle}°)`);
    }

    const summary = highCompFlags.length > 0
      ? `Compensatory movement observed: ${highCompFlags.join(', ')}.`
      : 'Optimal movement symmetry detected.';

    const movementCompensation: MovementCompensationAnalytics = {
      label: FUSION_CONFIG.LABELS.MOVEMENT_COMPENSATION,
      compensationScore,
      compensationLevel,
      summary,
      details: {
        trunkLean: { angle: vision.trunkLeanAngle, level: vision.trunkLeanLevel },
        shoulderHike: { displacement: vision.shoulderHikeDisplacement, level: vision.shoulderHikeLevel },
        torsoRotation: { angle: vision.torsoRotationAngle, level: vision.torsoRotationLevel },
      },
    };

    // 2. Hardware Performance Calculation (Telemetry-driven)
    const rt = hardware.reactionTime || 1.0;
    const rtScore = Math.max(
      20,
      Math.min(
        100,
        Math.round(100 - Math.max(0, rt - FUSION_CONFIG.REACTION_TIME_OPTIMAL) * FUSION_CONFIG.REACTION_TIME_SLOPE)
      )
    );
    const performanceScore = Math.round(
      (hardware.accuracy || 0) * 0.4 +
      (hardware.strikeConsistency || 0) * 0.3 +
      rtScore * 0.3
    );

    const hardwarePerformance: HardwarePerformanceAnalytics = {
      label: 'APEX 4 Performance',
      performanceScore,
      leftForce: hardware.leftForce || 0,
      rightForce: hardware.rightForce || 0,
      rudder: hardware.rudder || 128,
      force: hardware.force || 0,
      reactionTime: rt,
      accuracy: hardware.accuracy || 0,
      strikeConsistency: hardware.strikeConsistency || 0,
    };

    // 3. Combined Session Analytics
    const stability = vision.movementStability || 85;
    const combinedSessionScore = Math.round(
      movementQuality * FUSION_CONFIG.VISION_WEIGHT +
      performanceScore * FUSION_CONFIG.PERFORMANCE_WEIGHT +
      stability * FUSION_CONFIG.STABILITY_WEIGHT
    );

    let rating: 'Optimal' | 'Good' | 'Moderate' | 'Needs Attention' = 'Optimal';
    if (combinedSessionScore < 60) rating = 'Needs Attention';
    else if (combinedSessionScore < 75) rating = 'Moderate';
    else if (combinedSessionScore < 88) rating = 'Good';

    let insight = '';
    if (compensationLevel === 'low' && performanceScore >= 75) {
      insight = `Optimal movement symmetry paired with high actuator precision (${performanceScore}%). Posture quality and strike accuracy are fully aligned.`;
    } else if (compensationLevel !== 'low' && performanceScore >= 75) {
      insight = `Good actuator performance (${performanceScore}%), but achieved with ${compensationLevel.toUpperCase()} body compensation. Monitor trunk/shoulder lean to prevent fatigue.`;
    } else if (compensationLevel === 'low' && performanceScore < 75) {
      insight = `Excellent posture control with LOW compensation, but reduced actuator response speed (${rt.toFixed(2)}s) or strike accuracy (${hardware.accuracy}%).`;
    } else {
      insight = `${compensationLevel.toUpperCase()} compensation detected alongside reduced strike performance (${performanceScore}%). A short rest break is recommended.`;
    }

    const sessionAnalytics: SessionAnalytics = {
      label: FUSION_CONFIG.LABELS.SESSION_ANALYTICS,
      combinedSessionScore,
      rating,
      insight,
      timestamp: new Date().toISOString(),
    };

    return {
      movementQualityLabel: FUSION_CONFIG.LABELS.MOVEMENT_QUALITY,
      movementQuality,
      movementCompensation,
      hardwarePerformance,
      visionMetrics: vision,
      sessionAnalytics,
      disclaimer: FUSION_CONFIG.DISCLAIMER,
    };
  }
}

// Singleton default model instance (pluggable)
let currentFusionModel: IFusionModelStrategy = new RuleBasedFusionModel();

export function setFusionModelStrategy(model: IFusionModelStrategy) {
  currentFusionModel = model;
}

export function getFusionModelStrategy(): IFusionModelStrategy {
  return currentFusionModel;
}

/**
 * Extracts Source 1 Hardware metrics from raw telemetry object.
 */
export function extractHardwareMetrics(telemetry: HardwareTelemetry): HardwareSourceMetrics {
  const reactionTime = telemetry.reaction_time !== undefined ? telemetry.reaction_time : (telemetry.reactionTime || 1.2);
  const strikeConsistency = telemetry.consistency !== undefined ? telemetry.consistency : (telemetry.strikeConsistency || 85);

  return {
    leftForce: telemetry.leftForce || 0,
    rightForce: telemetry.rightForce || 0,
    rudder: telemetry.rudder !== undefined ? telemetry.rudder : 128,
    force: telemetry.force || 0,
    reactionTime,
    accuracy: telemetry.accuracy || 0,
    strikeConsistency,
  };
}

/**
 * Extracts Source 2 Computer Vision metrics from raw compensation object.
 */
export function extractVisionMetrics(comp: CompensationMetrics): VisionSourceMetrics {
  return {
    trunkLeanAngle: comp.trunkLeanAngle || 0,
    trunkLeanLevel: comp.trunkLeanLevel || 'low',
    shoulderHikeDisplacement: comp.shoulderHikeDisplacement || 0,
    shoulderHikeLevel: comp.shoulderHikeLevel || 'low',
    torsoRotationAngle: comp.torsoRotationAngle || 0,
    torsoRotationLevel: comp.torsoRotationLevel || 'low',
    movementStability: comp.overallStability || 85,
    movementConsistency: comp.movementConsistency !== undefined ? comp.movementConsistency : (comp.overallStability || 85),
  };
}

/**
 * Main Sensor Fusion Pipeline function.
 * Fuses Source 1 (Hardware Telemetry) and Source 2 (Computer Vision Metrics).
 */
export function computeSensorFusionScore(
  comp: CompensationMetrics,
  telemetry: HardwareTelemetry,
  modelStrategy?: IFusionModelStrategy
): ExtendedFusionScore {
  const hardware = extractHardwareMetrics(telemetry);
  const vision = extractVisionMetrics(comp);

  const model = modelStrategy || currentFusionModel;
  const result = model.evaluate(hardware, vision);

  return {
    movementQuality: result.movementQuality,
    performanceScore: result.hardwarePerformance.performanceScore,
    combinedSessionScore: result.sessionAnalytics.combinedSessionScore,
    compensationSummary: result.movementCompensation.summary,
    compensationScore: result.movementCompensation.compensationScore,
    compensationLevel: result.movementCompensation.compensationLevel,
    combinedInsight: result.sessionAnalytics.insight,
    movementCompensation: result.movementCompensation,
    hardwarePerformance: result.hardwarePerformance,
    visionMetrics: result.visionMetrics,
    sessionAnalytics: result.sessionAnalytics,
    disclaimer: result.disclaimer,
  };
}
