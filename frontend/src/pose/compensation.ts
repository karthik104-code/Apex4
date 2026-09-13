import { PoseLandmark, CompensationMetrics, BaselineCalibration, CompensationLevel } from '../types/rehab';

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

// Thresholds for classification
export const CONFIG_THRESHOLDS = {
  trunkLean: { medium: 8, high: 18 },
  shoulderHike: { medium: 0.05, high: 0.12 },
  torsoRotation: { medium: 6, high: 15 },
};

function getLevel(val: number, thresholds: { medium: number; high: number }): CompensationLevel {
  if (val >= thresholds.high) return 'high';
  if (val >= thresholds.medium) return 'medium';
  return 'low';
}

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
  if (!landmarks || landmarks.length < 25) {
    return createDefaultCalibration();
  }

  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[LANDMARK.LEFT_HIP];
  const rh = landmarks[LANDMARK.RIGHT_HIP];

  if (!ls || !rs || !lh || !rh) {
    return createDefaultCalibration();
  }

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

export function calculateCompensation(
  landmarks: PoseLandmark[],
  baseline?: BaselineCalibration
): CompensationMetrics {
  // Default values if no landmarks detected
  if (!landmarks || landmarks.length < 25) {
    return {
      trunkLeanAngle: 0,
      trunkLeanLevel: 'low',
      shoulderHikeDisplacement: 0,
      shoulderHikeLevel: 'low',
      torsoRotationAngle: 0,
      torsoRotationLevel: 'low',
      overallStability: 95,
    };
  }

  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[LANDMARK.LEFT_HIP];
  const rh = landmarks[LANDMARK.RIGHT_HIP];

  if (!ls || !rs || !lh || !rh) {
    return {
      trunkLeanAngle: 0,
      trunkLeanLevel: 'low',
      shoulderHikeDisplacement: 0,
      shoulderHikeLevel: 'low',
      torsoRotationAngle: 0,
      torsoRotationLevel: 'low',
      overallStability: 90,
    };
  }

  // 1. Trunk Lean: Angle of spine mid-line relative to vertical axis
  const midShoulderX = (ls.x + rs.x) / 2;
  const midShoulderY = (ls.y + rs.y) / 2;
  const midHipX = (lh.x + rh.x) / 2;
  const midHipY = (lh.y + rh.y) / 2;

  const dx = midShoulderX - midHipX;
  const dy = midHipY - midShoulderY; // positive upwards

  let rawTrunkAngle = (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;

  // Subtract baseline offset if calibrated
  if (baseline && baseline.isCalibrated) {
    const baseDx = baseline.midShoulderX - midHipX;
    const baseAngle = (Math.atan2(Math.abs(baseDx), Math.abs(dy)) * 180) / Math.PI;
    rawTrunkAngle = Math.abs(rawTrunkAngle - baseAngle);
  }

  const trunkLeanAngle = Math.min(Math.round(rawTrunkAngle * 10) / 10, 45);

  // 2. Shoulder Hike: Height difference between shoulders normalized by shoulder width
  const shoulderWidth = Math.hypot(rs.x - ls.x, rs.y - ls.y) || 0.2;
  const rawHike = Math.abs(ls.y - rs.y) / shoulderWidth;
  const shoulderHikeDisplacement = Math.min(Math.round(rawHike * 100) / 100, 0.5);

  // 3. Torso Rotation: Angle mismatch between shoulder vector and hip vector
  const sAngle = (Math.atan2(rs.y - ls.y, rs.x - ls.x) * 180) / Math.PI;
  const hAngle = (Math.atan2(rh.y - lh.y, rh.x - lh.x) * 180) / Math.PI;
  let rotationDiff = Math.abs(sAngle - hAngle);
  if (rotationDiff > 180) rotationDiff = 360 - rotationDiff;

  if (baseline && baseline.isCalibrated) {
    const baseRot = Math.abs(baseline.shoulderAngle - baseline.hipAngle);
    rotationDiff = Math.abs(rotationDiff - baseRot);
  }

  const torsoRotationAngle = Math.min(Math.round(rotationDiff * 10) / 10, 45);

  // 4. Overall Stability score (higher is better)
  const stabilityPenalties = trunkLeanAngle * 1.2 + shoulderHikeDisplacement * 150 + torsoRotationAngle * 1.5;
  const overallStability = Math.max(Math.min(Math.round(100 - stabilityPenalties), 100), 20);

  return {
    trunkLeanAngle,
    trunkLeanLevel: getLevel(trunkLeanAngle, CONFIG_THRESHOLDS.trunkLean),
    shoulderHikeDisplacement,
    shoulderHikeLevel: getLevel(shoulderHikeDisplacement, CONFIG_THRESHOLDS.shoulderHike),
    torsoRotationAngle,
    torsoRotationLevel: getLevel(torsoRotationAngle, CONFIG_THRESHOLDS.torsoRotation),
    overallStability,
  };
}
