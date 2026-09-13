import { CompensationMetrics, HardwareTelemetry, FusionScore, CompensationLevel } from '../types/rehab';

export const FUSION_CONFIG = {
  VISION_WEIGHT: 0.50,         // Weight of vision movement quality in session score
  PERFORMANCE_WEIGHT: 0.35,    // Weight of MSV1 hardware performance in session score
  STABILITY_WEIGHT: 0.15,      // Weight of baseline posture stability
  REACTION_TIME_OPTIMAL: 1.0,  // Optimal reaction time threshold (seconds)
  REACTION_TIME_SLOPE: 25,     // Score penalty per second over optimal threshold
  DISCLAIMER: 'Sensor fusion scores are rule-based analytical metrics designed for progress tracking and are not clinically validated diagnostic measurements.',
};

export interface ExtendedFusionScore extends FusionScore {
  compensationScore: number;        // 0..100% (100 = minimal compensation, 0 = severe compensation)
  compensationLevel: CompensationLevel;
  combinedInsight: string;          // Synthesized relationship between posture and hardware output
}

/**
 * Fuses Computer Vision pose compensation signals and MSV1 Hardware telemetry into unified session metrics.
 */
export function computeSensorFusionScore(
  comp: CompensationMetrics,
  telemetry: HardwareTelemetry
): ExtendedFusionScore {
  // 1. Vision Movement Quality & Compensation Score
  const leanPenalty = (comp.trunkLeanAngle || 0) * 1.5;
  const hikePenalty = (comp.shoulderHikeDisplacement || 0) * 180;
  const rotPenalty = (comp.torsoRotationAngle || 0) * 1.2;

  const totalPenalty = leanPenalty + hikePenalty + rotPenalty;

  // Movement Quality (0-100%)
  const movementQuality = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  // Compensation Score (100 = no compensation, 0 = maximum compensation)
  const compensationScore = Math.max(0, Math.min(100, Math.round(100 - totalPenalty * 1.2)));

  // Determine overall compensation level (highest level of any indicator)
  const levels: CompensationLevel[] = [
    comp.trunkLeanLevel || 'low',
    comp.shoulderHikeLevel || 'low',
    comp.torsoRotationLevel || 'low',
  ];
  
  let compensationLevel: CompensationLevel = 'low';
  if (levels.includes('high')) {
    compensationLevel = 'high';
  } else if (levels.includes('medium')) {
    compensationLevel = 'medium';
  }

  // 2. MSV1 Hardware Performance Score (Telemetry Driven)
  const rt = telemetry.reaction_time !== undefined ? telemetry.reaction_time : telemetry.reactionTime;
  const accuracy = telemetry.accuracy || 0;
  const consistency = telemetry.consistency !== undefined ? telemetry.consistency : telemetry.strikeConsistency;

  // Reaction time score: 1.0s = 100%, 2.5s = 62%
  const rtScore = Math.max(20, Math.min(100, Math.round(100 - Math.max(0, rt - FUSION_CONFIG.REACTION_TIME_OPTIMAL) * FUSION_CONFIG.REACTION_TIME_SLOPE)));
  const performanceScore = Math.round(
    accuracy * 0.4 + (consistency || 0) * 0.3 + rtScore * 0.3
  );

  // 3. Combined Session Score (Weighted Fusion)
  const stability = comp.overallStability || 85;
  const combinedSessionScore = Math.round(
    movementQuality * FUSION_CONFIG.VISION_WEIGHT +
    performanceScore * FUSION_CONFIG.PERFORMANCE_WEIGHT +
    stability * FUSION_CONFIG.STABILITY_WEIGHT
  );

  // 4. Synthesized Combined Session Insight
  let combinedInsight = '';
  if (compensationLevel === 'low' && performanceScore >= 75) {
    combinedInsight = `Optimal movement symmetry paired with high actuator precision (${performanceScore}%). Posture quality and strike accuracy are fully aligned.`;
  } else if (compensationLevel !== 'low' && performanceScore >= 75) {
    combinedInsight = `Good actuator performance (${performanceScore}%), but achieved with ${compensationLevel.toUpperCase()} body compensation. Monitor trunk/shoulder lean to prevent fatigue.`;
  } else if (compensationLevel === 'low' && performanceScore < 75) {
    combinedInsight = `Excellent posture control with LOW compensation, but reduced actuator response speed (${rt.toFixed(2)}s) or strike accuracy (${accuracy}%).`;
  } else {
    combinedInsight = `${compensationLevel.toUpperCase()} compensation detected alongside reduced strike performance (${performanceScore}%). A short rest break is recommended.`;
  }

  // Legacy summary text compatibility
  const highCompFlags: string[] = [];
  if (comp.trunkLeanLevel && comp.trunkLeanLevel !== 'low') highCompFlags.push(`Trunk Lean (${comp.trunkLeanAngle}°)`);
  if (comp.shoulderHikeLevel && comp.shoulderHikeLevel !== 'low') highCompFlags.push('Shoulder Hike');
  if (comp.torsoRotationLevel && comp.torsoRotationLevel !== 'low') highCompFlags.push(`Torso Rotation (${comp.torsoRotationAngle}°)`);

  let compensationSummary = 'Optimal movement symmetry detected.';
  if (highCompFlags.length > 0) {
    compensationSummary = `Compensatory movement observed: ${highCompFlags.join(', ')}.`;
  }

  return {
    movementQuality,
    performanceScore,
    combinedSessionScore,
    compensationSummary,
    compensationScore,
    compensationLevel,
    combinedInsight,
  };
}
