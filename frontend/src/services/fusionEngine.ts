import { CompensationMetrics, HardwareTelemetry, FusionScore } from '../types/rehab';

export function computeSensorFusionScore(
  comp: CompensationMetrics,
  telemetry: HardwareTelemetry
): FusionScore {
  // 1. Movement Quality (Vision Driven)
  const leanPenalty = comp.trunkLeanAngle * 1.5;
  const hikePenalty = comp.shoulderHikeDisplacement * 180;
  const rotPenalty = comp.torsoRotationAngle * 1.2;

  const totalPenalty = leanPenalty + hikePenalty + rotPenalty;
  const movementQuality = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  // 2. Hardware Performance Score (Telemetry Driven)
  // Reaction time score: 1.0s or faster = 100%, 2.5s or slower = 50%
  const rtScore = Math.max(40, Math.min(100, Math.round(100 - (telemetry.reactionTime - 1.0) * 30)));
  const performanceScore = Math.round(
    telemetry.accuracy * 0.4 + telemetry.strikeConsistency * 0.3 + rtScore * 0.3
  );

  // 3. Combined Session Score (Fused)
  const combinedSessionScore = Math.round(
    movementQuality * 0.5 + performanceScore * 0.3 + comp.overallStability * 0.2
  );

  // 4. Compensation Summary Text
  const highCompFlags: string[] = [];
  if (comp.trunkLeanLevel !== 'low') highCompFlags.push(`Trunk Lean (${comp.trunkLeanAngle}°)`);
  if (comp.shoulderHikeLevel !== 'low') highCompFlags.push('Shoulder Hike');
  if (comp.torsoRotationLevel !== 'low') highCompFlags.push(`Torso Rotation (${comp.torsoRotationAngle}°)`);

  let compensationSummary = 'Optimal movement symmetry detected.';
  if (highCompFlags.length > 0) {
    compensationSummary = `Compensatory movement observed: ${highCompFlags.join(', ')}.`;
  }

  return {
    movementQuality,
    performanceScore,
    combinedSessionScore,
    compensationSummary,
  };
}
