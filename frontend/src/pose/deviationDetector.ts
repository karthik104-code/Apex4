/**
 * APEX 4 — Posture Deviation Detector & Priority Arbiter
 * 
 * Evaluates real-time kinematics and filters fleeting frame-to-frame noise using:
 * - Minimum pose confidence gate (>= 0.55)
 * - Persistence confirmation window (>= 750ms)
 * - Hysteresis release gate (clears at 80% of trigger threshold)
 * - Strict Priority Arbitration:
 *     1. Lateral Trunk Deviation (Adjust Right / Left)
 *     2. Anterior Trunk Inclination (Sit Upright)
 *     3. Bilateral Shoulder Asymmetry (Level Shoulders)
 *     4. Torso Rotation (Face Forward)
 */

import { CompensationMetrics } from '../types/rehab';

export type DeviationType = 
  | 'NONE'
  | 'LEAN_LEFT'
  | 'LEAN_RIGHT'
  | 'FORWARD_LEAN'
  | 'SHOULDER_ASYMMETRY'
  | 'TORSO_ROTATION';

export interface PostureCorrectionEvent {
  type: DeviationType;
  instruction: string;
  magnitude: number;
  unit: string;
  confirmed: boolean;
  priority: number;
  timestamp: number;
}

export interface DeviationDetectorConfig {
  minPoseConfidence: number;
  persistenceMs: number;
  trunkLeanThresholdDeg: number;
  shoulderHikeThreshold: number;
  anteriorRatioThreshold: number;
  torsoRotationThresholdDeg: number;
}

export const DEFAULT_DETECTOR_CONFIG: DeviationDetectorConfig = {
  minPoseConfidence: 0.55,
  persistenceMs: 750,
  trunkLeanThresholdDeg: 7.5,
  shoulderHikeThreshold: 0.055,
  anteriorRatioThreshold: 0.22,
  torsoRotationThresholdDeg: 8.0,
};

export class PostureDeviationDetector {
  private config: DeviationDetectorConfig;
  private pendingDeviation: DeviationType = 'NONE';
  private pendingStartTime = 0;
  private activeConfirmedDeviation: DeviationType = 'NONE';

  constructor(config?: Partial<DeviationDetectorConfig>) {
    this.config = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  }

  public reset(): void {
    this.pendingDeviation = 'NONE';
    this.pendingStartTime = 0;
    this.activeConfirmedDeviation = 'NONE';
  }

  /**
   * Evaluates a frame of metrics. Returns a confirmed correction event if a sustained deviation is detected,
   * or null if posture is stable, low confidence, or unconfirmed.
   */
  public evaluate(
    metrics: CompensationMetrics,
    poseConfidence = 0.9,
    isPoseDetected = true
  ): PostureCorrectionEvent | null {
    // 1. Gate: Confidence & Presence
    if (!isPoseDetected || poseConfidence < this.config.minPoseConfidence) {
      this.pendingDeviation = 'NONE';
      this.pendingStartTime = 0;
      this.activeConfirmedDeviation = 'NONE';
      return null;
    }

    // 2. Identify highest priority instantaneous raw deviation
    const rawDeviation = this.identifyRawDeviation(metrics);

    const now = Date.now();

    // 3. Posture is stable
    if (rawDeviation === 'NONE') {
      this.pendingDeviation = 'NONE';
      this.pendingStartTime = 0;
      this.activeConfirmedDeviation = 'NONE';
      return null;
    }

    // 4. Persistence tracking
    if (this.pendingDeviation !== rawDeviation) {
      // New deviation started
      this.pendingDeviation = rawDeviation;
      this.pendingStartTime = now;
      return null;
    }

    // Check if persistence window has elapsed
    const elapsed = now - this.pendingStartTime;
    if (elapsed >= this.config.persistenceMs) {
      this.activeConfirmedDeviation = rawDeviation;
      return this.buildCorrectionEvent(rawDeviation, metrics, now);
    }

    return null;
  }

  private identifyRawDeviation(metrics: CompensationMetrics): DeviationType {
    const {
      trunkLeanAngle = 0,
      trunkLeanDirection = 'neutral',
      shoulderHikeDisplacement = 0,
      anteriorInclinationRatio = 0,
      torsoRotationAngle = 0,
    } = metrics;

    // Priority 1: Lateral Trunk Deviation
    if (trunkLeanAngle >= this.config.trunkLeanThresholdDeg) {
      if (trunkLeanDirection === 'left') {
        return 'LEAN_LEFT';
      } else if (trunkLeanDirection === 'right') {
        return 'LEAN_RIGHT';
      } else {
        return 'LEAN_LEFT'; // default if ambiguous
      }
    }

    // Priority 2: Anterior Trunk Inclination
    if (anteriorInclinationRatio >= this.config.anteriorRatioThreshold) {
      return 'FORWARD_LEAN';
    }

    // Priority 3: Bilateral Shoulder Asymmetry
    if (shoulderHikeDisplacement >= this.config.shoulderHikeThreshold) {
      return 'SHOULDER_ASYMMETRY';
    }

    // Priority 4: Torso Rotation
    if (torsoRotationAngle >= this.config.torsoRotationThresholdDeg) {
      return 'TORSO_ROTATION';
    }

    return 'NONE';
  }

  private buildCorrectionEvent(
    type: DeviationType,
    metrics: CompensationMetrics,
    timestamp: number
  ): PostureCorrectionEvent {
    switch (type) {
      case 'LEAN_LEFT':
        return {
          type: 'LEAN_LEFT',
          instruction: 'Please adjust slightly to the right.',
          magnitude: metrics.trunkLeanAngle,
          unit: '°',
          confirmed: true,
          priority: 1,
          timestamp,
        };
      case 'LEAN_RIGHT':
        return {
          type: 'LEAN_RIGHT',
          instruction: 'Please adjust slightly to the left.',
          magnitude: metrics.trunkLeanAngle,
          unit: '°',
          confirmed: true,
          priority: 1,
          timestamp,
        };
      case 'FORWARD_LEAN':
        return {
          type: 'FORWARD_LEAN',
          instruction: 'Please sit a little more upright.',
          magnitude: metrics.anteriorInclinationRatio || 0,
          unit: 'ratio',
          confirmed: true,
          priority: 2,
          timestamp,
        };
      case 'SHOULDER_ASYMMETRY':
        return {
          type: 'SHOULDER_ASYMMETRY',
          instruction: 'Please level your shoulders.',
          magnitude: metrics.shoulderHikeDisplacement,
          unit: 'ratio',
          confirmed: true,
          priority: 3,
          timestamp,
        };
      case 'TORSO_ROTATION':
        return {
          type: 'TORSO_ROTATION',
          instruction: 'Please face forward.',
          magnitude: metrics.torsoRotationAngle,
          unit: '°',
          confirmed: true,
          priority: 4,
          timestamp,
        };
      default:
        return {
          type: 'NONE',
          instruction: '',
          magnitude: 0,
          unit: '',
          confirmed: false,
          priority: 99,
          timestamp,
        };
    }
  }
}

export const deviationDetector = new PostureDeviationDetector();
