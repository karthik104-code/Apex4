import { PoseLandmark, CompensationLevel, BaselineCalibration } from '../types/rehab';

export interface SegmentCompensation {
  value: number;
  level: CompensationLevel;
  label: string;
  direction?: 'left' | 'right' | 'neutral';
}

export interface CompensationEngineOutput {
  trunk: SegmentCompensation;
  shoulder: SegmentCompensation;
  rotation: SegmentCompensation;
  anteriorInclinationRatio?: number;
  movement_quality: number; // 0..100%
  stability: number; // 0..100%
  feedbackMessage: string;
}

/**
 * Standard MediaPipe Pose Landmark Indices:
 * 11: LEFT_SHOULDER
 * 12: RIGHT_SHOULDER
 * 23: LEFT_HIP
 * 24: RIGHT_HIP
 */
export const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

/**
 * Configurable Threshold Constants for Biomechanical Compensation
 * (Easily adjustable or replaceable by a trained ML classifier)
 */
export const COMPENSATORY_THRESHOLDS = {
  trunkLean: { medium: 8.0, high: 18.0 }, // Degrees deviation from vertical
  shoulderHike: { medium: 0.05, high: 0.12 }, // Acromion height ratio
  torsoRotation: { medium: 6.0, high: 15.0 }, // Degrees rotational mismatch
};

function classifyLevel(value: number, thresholds: { medium: number; high: number }): CompensationLevel {
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
}

export class MovementCompensationEngine {
  private thresholds = COMPENSATORY_THRESHOLDS;

  /**
   * Evaluate pose landmarks against baseline and threshold rules
   */
  public evaluatePose(
    landmarks: PoseLandmark[] | null | undefined,
    baseline?: BaselineCalibration
  ): CompensationEngineOutput {
    // Edge Case: Missing or incomplete landmarks
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 25) {
      return this.createDefaultOutput('Pose tracking initializing...');
    }

    const ls = landmarks[LANDMARK.LEFT_SHOULDER];
    const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
    const lh = landmarks[LANDMARK.LEFT_HIP];
    const rh = landmarks[LANDMARK.RIGHT_HIP];

    // Edge Case: Missing required shoulder/hip joints
    if (!ls || !rs || !lh || !rh || typeof ls.x !== 'number' || typeof rs.x !== 'number') {
      return this.createDefaultOutput('Waiting for complete pose visibility...');
    }

    // 1. Trunk Lean Calculation: Angle of spine mid-line relative to vertical axis
    const midShoulderX = (ls.x + rs.x) / 2;
    const midShoulderY = (ls.y + rs.y) / 2;
    const midHipX = (lh.x + rh.x) / 2;
    const midHipY = (lh.y + rh.y) / 2;

    const dx = midShoulderX - midHipX;
    const dy = midHipY - midShoulderY;

    // Determine direction: dx > 0 means leaning towards right, dx < 0 means leaning towards left
    let trunkDirection: 'left' | 'right' | 'neutral' = 'neutral';
    if (Math.abs(dx) > 0.02) {
      trunkDirection = dx > 0 ? 'right' : 'left';
    }

    let rawTrunkAngle = (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;

    if (baseline && baseline.isCalibrated) {
      const baseDx = baseline.midShoulderX - midHipX;
      const baseAngle = (Math.atan2(Math.abs(baseDx), Math.abs(dy)) * 180) / Math.PI;
      rawTrunkAngle = Math.abs(rawTrunkAngle - baseAngle);
    }

    const trunkValue = Math.min(Math.round(rawTrunkAngle * 10) / 10, 45);
    const trunkLevel = classifyLevel(trunkValue, this.thresholds.trunkLean);

    // Anterior inclination: approximate from vertical trunk compression or depth
    const baselineDist = baseline?.isCalibrated ? Math.abs(baseline.midShoulderY - midHipY) : 0.45;
    const currentDist = Math.abs(midShoulderY - midHipY);
    const anteriorRatio = Math.max(0, Math.min(1.0, Math.round(Math.max(0, baselineDist - currentDist) / (baselineDist || 0.45) * 100) / 100));

    // 2. Shoulder Hike Calculation: Height asymmetry ratio normalized by shoulder width
    const shoulderWidth = Math.hypot(rs.x - ls.x, rs.y - ls.y) || 0.2;
    const rawHike = Math.abs(ls.y - rs.y) / shoulderWidth;
    const shoulderValue = Math.min(Math.round(rawHike * 100) / 100, 0.5);
    const shoulderLevel = classifyLevel(shoulderValue, this.thresholds.shoulderHike);

    // 3. Torso Rotation Calculation: Angle mismatch between shoulder vector and hip vector
    const sAngle = (Math.atan2(rs.y - ls.y, rs.x - ls.x) * 180) / Math.PI;
    const hAngle = (Math.atan2(rh.y - lh.y, rh.x - lh.x) * 180) / Math.PI;
    let rotationDiff = Math.abs(sAngle - hAngle);
    if (rotationDiff > 180) rotationDiff = 360 - rotationDiff;

    if (baseline && baseline.isCalibrated) {
      const baseRot = Math.abs(baseline.shoulderAngle - baseline.hipAngle);
      rotationDiff = Math.abs(rotationDiff - baseRot);
    }

    const rotationValue = Math.min(Math.round(rotationDiff * 10) / 10, 45);
    const rotationLevel = classifyLevel(rotationValue, this.thresholds.torsoRotation);

    // 4. Movement Quality & Stability Scores
    const totalPenalty = trunkValue * 1.5 + shoulderValue * 180 + rotationValue * 1.2;
    const movement_quality = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));
    const stability = Math.max(20, Math.min(100, Math.round(100 - (trunkValue * 1.2 + shoulderValue * 150))));

    // 5. Non-Alarming Patient Feedback Message
    let feedbackMessage = 'Optimal postural alignment maintained.';
    if (trunkLevel === 'high') {
      feedbackMessage = 'Significant trunk movement detected. Support core posture.';
    } else if (trunkLevel === 'medium') {
      feedbackMessage = 'Additional trunk movement detected.';
    } else if (shoulderLevel !== 'low') {
      feedbackMessage = 'Slight shoulder elevation noted. Keep shoulders relaxed.';
    } else if (rotationLevel !== 'low') {
      feedbackMessage = 'Torso rotation detected during foot strike.';
    }

    return {
      trunk: { value: trunkValue, level: trunkLevel, label: 'Trunk Lean', direction: trunkDirection },
      shoulder: { value: shoulderValue, level: shoulderLevel, label: 'Shoulder Hike' },
      rotation: { value: rotationValue, level: rotationLevel, label: 'Torso Rotation' },
      anteriorInclinationRatio: anteriorRatio,
      movement_quality,
      stability,
      feedbackMessage,
    };
  }

  private createDefaultOutput(msg: string): CompensationEngineOutput {
    return {
      trunk: { value: 0, level: 'low', label: 'Trunk Lean', direction: 'neutral' },
      shoulder: { value: 0, level: 'low', label: 'Shoulder Hike' },
      rotation: { value: 0, level: 'low', label: 'Torso Rotation' },
      anteriorInclinationRatio: 0,
      movement_quality: 95,
      stability: 95,
      feedbackMessage: msg,
    };
  }
}

export const compensationEngine = new MovementCompensationEngine();

// Legacy backward compatibility helpers
export function createDefaultCalibration(): BaselineCalibration {
  return {
    midShoulderX: 0.5,
    midShoulderY: 0.35,
    shoulderWidth: 0.25,
    shoulderAngle: 0,
    hipAngle: 0,
    timestamp: new Date().toISOString(),
    isCalibrated: false,
  };
}

export function calibrateBaseline(landmarks: PoseLandmark[]): BaselineCalibration {
  if (!landmarks || landmarks.length < 25) return createDefaultCalibration();

  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[LANDMARK.LEFT_HIP];
  const rh = landmarks[LANDMARK.RIGHT_HIP];

  if (!ls || !rs || !lh || !rh) return createDefaultCalibration();

  const midShoulderX = (ls.x + rs.x) / 2;
  const midShoulderY = (ls.y + rs.y) / 2;
  const shoulderWidth = Math.hypot(rs.x - ls.x, rs.y - ls.y);
  const shoulderAngle = (Math.atan2(rs.y - ls.y, rs.x - ls.x) * 180) / Math.PI;
  const hipAngle = (Math.atan2(rh.y - lh.y, rh.x - lh.x) * 180) / Math.PI;

  return {
    midShoulderX,
    midShoulderY,
    shoulderWidth: Math.max(shoulderWidth, 0.01),
    shoulderAngle,
    hipAngle,
    timestamp: new Date().toISOString(),
    isCalibrated: true,
  };
}

export function calculateCompensation(landmarks: PoseLandmark[], baseline?: BaselineCalibration) {
  const out = compensationEngine.evaluatePose(landmarks, baseline);
  return {
    trunkLeanAngle: out.trunk.value,
    trunkLeanDirection: out.trunk.direction || 'neutral',
    trunkLeanLevel: out.trunk.level,
    anteriorInclinationRatio: out.anteriorInclinationRatio || 0,
    shoulderHikeDisplacement: out.shoulder.value,
    shoulderHikeLevel: out.shoulder.level,
    torsoRotationAngle: out.rotation.value,
    torsoRotationLevel: out.rotation.level,
    overallStability: out.stability,
  };
}
