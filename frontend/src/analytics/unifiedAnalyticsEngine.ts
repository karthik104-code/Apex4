/**
 * APEX 4 — Unified Session Analytics Engine
 * 
 * Aggregates and combines:
 * 1. MSV1 Hardware Telemetry (Load cells, Rudder, Latency, Target hits)
 * 2. MediaPipe Movement Measurements (Joint angles, vertical displacements, spatial stability)
 * 3. Voice Posture Commander Events (Spoken instructions, resolution times)
 * 
 * Rules:
 * - Strict separation between RAW DATA, DERIVED ANALYTICS, and AI OUTPUT.
 * - Deterministic, verifiable calculations with exposed components.
 * - Explicit non-diagnostic clinical disclaimers (Zero medical claims).
 */

import {
  RawHardwareFrame,
  RawHardwareSessionSummary,
  VisionFrame,
  VisionSessionSummary,
  VoiceCorrectionEvent,
  VoiceSessionSummary,
  MovementQualityMetric,
  MovementCompensationMetric,
  PosturalStabilityMetric,
  MovementVariabilityMetric,
  MovementConsistencyMetric,
  BilateralPerformanceMetric,
  TaskPerformanceMetric,
  UnifiedDerivedAnalytics,
  AIReportOutput,
  StructuredSessionAnalysis,
} from './types';
import { CompensationLevel } from '../types/rehab';

export const ANALYTICS_CONFIG = {
  WEIGHTS: {
    VISION: 0.50,
    HARDWARE: 0.35,
    STABILITY: 0.15,
  },
  THRESHOLDS: {
    OPTIMAL_REACTION_MS: 1000,
    REACTION_SLOPE: 0.025, // Penalty per ms over optimal
    TRUNK_LEAN_MED: 8,     // Degrees
    TRUNK_LEAN_HIGH: 15,    // Degrees
    SHOULDER_HIKE_MED: 0.05,
    SHOULDER_HIKE_HIGH: 0.10,
    TORSO_ROT_MED: 10,     // Degrees
    TORSO_ROT_HIGH: 20,    // Degrees
    ASYMMETRY_MILD: 10,    // %
    ASYMMETRY_MARKED: 25,  // %
  },
  DISCLAIMER: 'PROTOTYPE ANALYTICS: Rule-based analytical metrics designed for motor rehabilitation progress tracking. NOT clinically validated medical diagnostic scores.',
};

/**
 * Helper: Calculate arithmetic mean of a number array
 */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

/**
 * Helper: Calculate sample variance of a number array
 */
export function variance(arr: number[], meanVal?: number): number {
  if (arr.length <= 1) return 0;
  const m = meanVal !== undefined ? meanVal : mean(arr);
  const sumSqDiff = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0);
  return sumSqDiff / arr.length;
}

/**
 * Helper: Calculate sample standard deviation
 */
export function standardDeviation(arr: number[], meanVal?: number): number {
  return Math.sqrt(variance(arr, meanVal));
}

export class UnifiedAnalyticsEngine {
  /**
   * Aggregates Raw Hardware Telemetry frames into summary statistics
   */
  public summarizeHardware(frames: RawHardwareFrame[]): RawHardwareSessionSummary {
    if (frames.length === 0) {
      return {
        frameCount: 0,
        meanLeftLoadCell: 0,
        meanRightLoadCell: 0,
        peakLeftLoadCell: 0,
        peakRightLoadCell: 0,
        meanRudder: 128,
        meanForce: 0,
        peakForce: 0,
        meanReactionLatencyMs: 0,
        targetHitCount: 0,
        totalTargetTrials: 0,
      };
    }

    const leftForces = frames.map((f) => f.leftLoadCell);
    const rightForces = frames.map((f) => f.rightLoadCell);
    const rudders = frames.map((f) => f.rudderDifferential);
    const forces = frames.map((f) => f.actuatorForce);
    const latencies = frames.map((f) => f.reactionLatencyMs).filter((l) => l > 0);
    const targetHits = frames.filter((f) => f.targetHit).length;

    return {
      frameCount: frames.length,
      meanLeftLoadCell: Number(mean(leftForces).toFixed(1)),
      meanRightLoadCell: Number(mean(rightForces).toFixed(1)),
      peakLeftLoadCell: Math.max(...leftForces, 0),
      peakRightLoadCell: Math.max(...rightForces, 0),
      meanRudder: Number(mean(rudders).toFixed(1)),
      meanForce: Number(mean(forces).toFixed(1)),
      peakForce: Math.max(...forces, 0),
      meanReactionLatencyMs: latencies.length > 0 ? Math.round(mean(latencies)) : 0,
      targetHitCount: targetHits,
      totalTargetTrials: frames.length,
    };
  }

  /**
   * Aggregates Computer Vision posture frames into summary statistics
   */
  public summarizeVision(frames: VisionFrame[]): VisionSessionSummary {
    if (frames.length === 0) {
      return {
        frameCount: 0,
        meanTrunkLeanDeg: 0,
        peakTrunkLeanDeg: 0,
        meanShoulderHikeDisp: 0,
        peakShoulderHikeDisp: 0,
        meanTorsoRotationDeg: 0,
        peakTorsoRotationDeg: 0,
        meanStabilityPct: 0,
        meanTrackingConfidence: 0,
        highCompensationFrameCount: 0,
      };
    }

    const leans = frames.map((f) => f.trunkLeanAngleDeg);
    const hikes = frames.map((f) => f.shoulderHikeDisplacement);
    const rotations = frames.map((f) => f.torsoRotationAngleDeg);
    const stabilities = frames.map((f) => f.posturalStabilityPct);
    const confidences = frames.map((f) => f.trackingConfidence);
    const highCompFrames = frames.filter(
      (f) => f.trunkLeanLevel === 'high' || f.shoulderHikeLevel === 'high' || f.torsoRotationLevel === 'high'
    ).length;

    return {
      frameCount: frames.length,
      meanTrunkLeanDeg: Number(mean(leans).toFixed(1)),
      peakTrunkLeanDeg: Math.max(...leans, 0),
      meanShoulderHikeDisp: Number(mean(hikes).toFixed(3)),
      peakShoulderHikeDisp: Number(Math.max(...hikes, 0).toFixed(3)),
      meanTorsoRotationDeg: Number(mean(rotations).toFixed(1)),
      peakTorsoRotationDeg: Math.max(...rotations, 0),
      meanStabilityPct: Math.round(mean(stabilities)),
      meanTrackingConfidence: Number(mean(confidences).toFixed(2)),
      highCompensationFrameCount: highCompFrames,
    };
  }

  /**
   * Summarizes Voice Posture Commander events and user compliance
   */
  public summarizeVoiceEvents(events: VoiceCorrectionEvent[]): VoiceSessionSummary {
    if (events.length === 0) {
      return {
        totalPromptsSpoken: 0,
        promptsByDeviation: {
          trunkLean: 0,
          shoulderHike: 0,
          torsoRotation: 0,
          forwardLean: 0,
        },
        resolvedCorrectionsCount: 0,
        correctionComplianceRatePct: 100,
        meanCorrectionLatencyMs: 0,
      };
    }

    const promptsByDeviation = {
      trunkLean: events.filter((e) => e.deviationType === 'trunk_lean').length,
      shoulderHike: events.filter((e) => e.deviationType === 'shoulder_hike').length,
      torsoRotation: events.filter((e) => e.deviationType === 'torso_rotation').length,
      forwardLean: events.filter((e) => e.deviationType === 'forward_lean').length,
    };

    const resolved = events.filter((e) => e.resolved);
    const latencies = resolved
      .map((e) => e.latencyToCorrectionMs || 0)
      .filter((l) => l > 0);

    const complianceRate = Math.round((resolved.length / events.length) * 100);

    return {
      totalPromptsSpoken: events.length,
      promptsByDeviation,
      resolvedCorrectionsCount: resolved.length,
      correctionComplianceRatePct: complianceRate,
      meanCorrectionLatencyMs: latencies.length > 0 ? Math.round(mean(latencies)) : 0,
    };
  }

  /**
   * 1. Movement Quality: Composite score (0..100%) with component breakdown
   */
  public computeMovementQuality(
    visionSummary: VisionSessionSummary,
    hwSummary: RawHardwareSessionSummary
  ): MovementQualityMetric {
    if (visionSummary.frameCount === 0 && hwSummary.frameCount === 0) {
      return {
        score: 0,
        rating: 'Needs Attention',
        components: {
          postureDeduction: 0,
          stabilityBonus: 0,
          motorExecutionScore: 0,
          weights: {
            visionWeight: ANALYTICS_CONFIG.WEIGHTS.VISION,
            hardwareWeight: ANALYTICS_CONFIG.WEIGHTS.HARDWARE,
            stabilityWeight: ANALYTICS_CONFIG.WEIGHTS.STABILITY,
          },
        },
      };
    }

    // Posture Deduction calculation
    const leanPenalty = visionSummary.meanTrunkLeanDeg * 1.5;
    const hikePenalty = visionSummary.meanShoulderHikeDisp * 180;
    const rotPenalty = visionSummary.meanTorsoRotationDeg * 1.2;
    const postureDeduction = Number((leanPenalty + hikePenalty + rotPenalty).toFixed(1));
    const visionBaseScore = Math.max(0, Math.min(100, Math.round(100 - postureDeduction)));

    // Motor Execution Score (accuracy & reaction latency adherence)
    const accuracy = hwSummary.totalTargetTrials > 0
      ? (hwSummary.targetHitCount / hwSummary.totalTargetTrials) * 100
      : 85;
    const rtPenalty = Math.max(0, hwSummary.meanReactionLatencyMs - ANALYTICS_CONFIG.THRESHOLDS.OPTIMAL_REACTION_MS) * ANALYTICS_CONFIG.THRESHOLDS.REACTION_SLOPE;
    const motorExecutionScore = Math.max(0, Math.min(100, Math.round(accuracy * 0.6 + Math.max(20, 100 - rtPenalty) * 0.4)));

    // Spatial Stability Bonus
    const stabilityBonus = Math.max(0, Math.min(100, visionSummary.meanStabilityPct || 85));

    // Weighted composite
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          visionBaseScore * ANALYTICS_CONFIG.WEIGHTS.VISION +
          motorExecutionScore * ANALYTICS_CONFIG.WEIGHTS.HARDWARE +
          stabilityBonus * ANALYTICS_CONFIG.WEIGHTS.STABILITY
        )
      )
    );

    let rating: 'Optimal' | 'Good' | 'Fair' | 'Needs Attention' = 'Optimal';
    if (score < 60) rating = 'Needs Attention';
    else if (score < 75) rating = 'Fair';
    else if (score < 88) rating = 'Good';

    return {
      score,
      rating,
      components: {
        postureDeduction,
        stabilityBonus,
        motorExecutionScore,
        weights: {
          visionWeight: ANALYTICS_CONFIG.WEIGHTS.VISION,
          hardwareWeight: ANALYTICS_CONFIG.WEIGHTS.HARDWARE,
          stabilityWeight: ANALYTICS_CONFIG.WEIGHTS.STABILITY,
        },
      },
    };
  }

  /**
   * 2. Movement Compensation: Degree and vector of compensatory deviations
   */
  public computeMovementCompensation(
    visionFrames: VisionFrame[],
    visionSummary: VisionSessionSummary
  ): MovementCompensationMetric {
    if (visionSummary.frameCount === 0) {
      return {
        compensationScore: 100,
        compensationLevel: 'low',
        primaryDeviation: 'none',
        summary: 'No vision frames recorded.',
        components: {
          meanTrunkLeanDeg: 0,
          meanShoulderHikeDisp: 0,
          meanTorsoRotationDeg: 0,
          highSeverityFrameRatio: 0,
        },
      };
    }

    const highCompRatio = Number((visionSummary.highCompensationFrameCount / visionSummary.frameCount).toFixed(2));
    const penalty = (visionSummary.meanTrunkLeanDeg * 1.8) + (visionSummary.meanShoulderHikeDisp * 200) + (visionSummary.meanTorsoRotationDeg * 1.4);
    const compensationScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    let compensationLevel: CompensationLevel = 'low';
    if (compensationScore < 60 || highCompRatio >= 0.25) {
      compensationLevel = 'high';
    } else if (compensationScore < 80 || highCompRatio >= 0.10) {
      compensationLevel = 'medium';
    }

    // Determine primary deviation vector
    const leanSeverity = visionSummary.meanTrunkLeanDeg / ANALYTICS_CONFIG.THRESHOLDS.TRUNK_LEAN_HIGH;
    const hikeSeverity = visionSummary.meanShoulderHikeDisp / ANALYTICS_CONFIG.THRESHOLDS.SHOULDER_HIKE_HIGH;
    const rotSeverity = visionSummary.meanTorsoRotationDeg / ANALYTICS_CONFIG.THRESHOLDS.TORSO_ROT_HIGH;

    let primaryDeviation: 'trunk_lean' | 'shoulder_hike' | 'torso_rotation' | 'none' = 'none';
    const maxSev = Math.max(leanSeverity, hikeSeverity, rotSeverity);
    if (maxSev > 0.4) {
      if (maxSev === leanSeverity) primaryDeviation = 'trunk_lean';
      else if (maxSev === hikeSeverity) primaryDeviation = 'shoulder_hike';
      else primaryDeviation = 'torso_rotation';
    }

    let summary = 'Optimal alignment maintained throughout movement cycles.';
    if (compensationLevel === 'high') {
      summary = `Marked compensatory strategy observed, primarily driven by ${primaryDeviation.replace('_', ' ')}.`;
    } else if (compensationLevel === 'medium') {
      summary = `Mild compensatory tendencies noted (${primaryDeviation.replace('_', ' ')}).`;
    }

    return {
      compensationScore,
      compensationLevel,
      primaryDeviation,
      summary,
      components: {
        meanTrunkLeanDeg: visionSummary.meanTrunkLeanDeg,
        meanShoulderHikeDisp: visionSummary.meanShoulderHikeDisp,
        meanTorsoRotationDeg: visionSummary.meanTorsoRotationDeg,
        highSeverityFrameRatio: highCompRatio,
      },
    };
  }

  /**
   * 3. Postural Stability: Variance and stability of spatial coordinates
   */
  public computePosturalStability(visionFrames: VisionFrame[]): PosturalStabilityMetric {
    if (visionFrames.length === 0) {
      return {
        stabilityScore: 0,
        swayVarianceDeg2: 0,
        stabilityRating: 'Significant Instability',
        components: {
          trunkAngleVariance: 0,
          shoulderDisplacementVariance: 0,
          baselineDeviationMean: 0,
        },
      };
    }

    const trunkAngles = visionFrames.map((f) => f.trunkLeanAngleDeg);
    const shoulderDisps = visionFrames.map((f) => f.shoulderHikeDisplacement);

    const trunkAngleVariance = Number(variance(trunkAngles).toFixed(2));
    const shoulderDisplacementVariance = Number(variance(shoulderDisps).toFixed(4));
    const baselineDeviationMean = Number(mean(trunkAngles).toFixed(2));

    // Stability score calculation: high variance decreases score
    const variancePenalty = trunkAngleVariance * 2.5 + shoulderDisplacementVariance * 500;
    const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - variancePenalty)));

    let stabilityRating: 'Stable' | 'Mild Sway' | 'Significant Instability' = 'Stable';
    if (stabilityScore < 60) stabilityRating = 'Significant Instability';
    else if (stabilityScore < 80) stabilityRating = 'Mild Sway';

    return {
      stabilityScore,
      swayVarianceDeg2: trunkAngleVariance,
      stabilityRating,
      components: {
        trunkAngleVariance,
        shoulderDisplacementVariance,
        baselineDeviationMean,
      },
    };
  }

  /**
   * 4. Movement Variability: Dispersion of force and timing across repetitions
   */
  public computeMovementVariability(
    hwFrames: RawHardwareFrame[],
    visionFrames: VisionFrame[]
  ): MovementVariabilityMetric {
    const forces = hwFrames.map((f) => f.actuatorForce);
    const latencies = hwFrames.map((f) => f.reactionLatencyMs).filter((l) => l > 0);
    const trunkAngles = visionFrames.map((f) => f.trunkLeanAngleDeg);

    const forceMean = Number(mean(forces).toFixed(1));
    const forceStdDev = Number(standardDeviation(forces, forceMean).toFixed(1));
    const forceCV = forceMean > 0 ? Number(((forceStdDev / forceMean) * 100).toFixed(1)) : 0;

    const latencyMeanMs = latencies.length > 0 ? Math.round(mean(latencies)) : 0;
    const latencyStdDevMs = latencies.length > 0 ? Math.round(standardDeviation(latencies, latencyMeanMs)) : 0;

    const postureAngleStdDevDeg = Number(standardDeviation(trunkAngles).toFixed(1));

    let variabilityRating: 'Consistent' | 'Moderate Variability' | 'High Variability' = 'Consistent';
    if (forceCV > 35 || latencyStdDevMs > 400) {
      variabilityRating = 'High Variability';
    } else if (forceCV > 18 || latencyStdDevMs > 200) {
      variabilityRating = 'Moderate Variability';
    }

    return {
      forceCoefficientOfVariation: forceCV,
      latencyStdDevMs,
      postureAngleStdDevDeg,
      variabilityRating,
      components: {
        forceMean,
        forceStdDev,
        latencyMeanMs,
        latencyStdDevMs,
      },
    };
  }

  /**
   * 5. Movement Consistency: Temporal repeatability and cycle uniformity
   */
  public computeMovementConsistency(hwFrames: RawHardwareFrame[]): MovementConsistencyMetric {
    if (hwFrames.length < 2) {
      return {
        consistencyScore: 85,
        rhythmUniformityPct: 85,
        strokeRepeatabilityPct: 85,
        components: {
          cadenceVarianceMs: 0,
          forcePeakSimilarityRatio: 1.0,
        },
      };
    }

    // Evaluate interval regularity between successive frames
    const timestamps = hwFrames.map((f) => new Date(f.timestamp).getTime());
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      const diff = timestamps[i] - timestamps[i - 1];
      if (diff > 0 && diff < 5000) {
        intervals.push(diff);
      }
    }

    const cadenceVar = intervals.length > 1 ? variance(intervals) : 0;
    const rhythmUniformity = Math.max(20, Math.min(100, Math.round(100 - Math.min(80, cadenceVar / 5000))));

    // Force peak similarity
    const forces = hwFrames.map((f) => f.actuatorForce);
    const forceStd = standardDeviation(forces);
    const forceAvg = mean(forces);
    const peakSimRatio = forceAvg > 0 ? Math.max(0, 1 - (forceStd / (forceAvg * 1.5))) : 1.0;
    const strokeRepeatability = Math.round(peakSimRatio * 100);

    const consistencyScore = Math.round(rhythmUniformity * 0.5 + strokeRepeatability * 0.5);

    return {
      consistencyScore,
      rhythmUniformityPct: rhythmUniformity,
      strokeRepeatabilityPct: strokeRepeatability,
      components: {
        cadenceVarianceMs: Math.round(cadenceVar),
        forcePeakSimilarityRatio: Number(peakSimRatio.toFixed(2)),
      },
    };
  }

  /**
   * 6. Bilateral Performance: Left vs. Right pedal/actuator balance
   */
  public computeBilateralPerformance(hwFrames: RawHardwareFrame[]): BilateralPerformanceMetric {
    if (hwFrames.length === 0) {
      return {
        asymmetryIndexPct: 0,
        dominantSide: 'symmetric',
        symmetryRating: 'Symmetric',
        components: {
          leftMeanForce: 0,
          rightMeanForce: 0,
          leftPeakForce: 0,
          rightPeakForce: 0,
          rudderCenterDeviation: 0,
        },
      };
    }

    const lefts = hwFrames.map((f) => f.leftLoadCell);
    const rights = hwFrames.map((f) => f.rightLoadCell);
    const rudders = hwFrames.map((f) => f.rudderDifferential);

    const leftMean = Number(mean(lefts).toFixed(1));
    const rightMean = Number(mean(rights).toFixed(1));
    const leftPeak = Math.max(...lefts, 0);
    const rightPeak = Math.max(...rights, 0);

    const maxSide = Math.max(leftMean, rightMean, 1);
    const asymmetryIndexPct = Number(((Math.abs(leftMean - rightMean) / maxSide) * 100).toFixed(1));

    const meanRudder = mean(rudders);
    const rudderCenterDeviation = Number((meanRudder - 128).toFixed(1));

    let dominantSide: 'left' | 'right' | 'symmetric' = 'symmetric';
    if (asymmetryIndexPct >= ANALYTICS_CONFIG.THRESHOLDS.ASYMMETRY_MILD) {
      dominantSide = leftMean > rightMean ? 'left' : 'right';
    }

    let symmetryRating: 'Symmetric' | 'Mild Asymmetry' | 'Marked Asymmetry' = 'Symmetric';
    if (asymmetryIndexPct >= ANALYTICS_CONFIG.THRESHOLDS.ASYMMETRY_MARKED) {
      symmetryRating = 'Marked Asymmetry';
    } else if (asymmetryIndexPct >= ANALYTICS_CONFIG.THRESHOLDS.ASYMMETRY_MILD) {
      symmetryRating = 'Mild Asymmetry';
    }

    return {
      asymmetryIndexPct,
      dominantSide,
      symmetryRating,
      components: {
        leftMeanForce: leftMean,
        rightMeanForce: rightMean,
        leftPeakForce: leftPeak,
        rightPeakForce: rightPeak,
        rudderCenterDeviation,
      },
    };
  }

  /**
   * 7. Task Performance: Goal achievement, accuracy, latency
   */
  public computeTaskPerformance(hwFrames: RawHardwareFrame[]): TaskPerformanceMetric {
    if (hwFrames.length === 0) {
      return {
        taskScore: 0,
        accuracyPct: 0,
        meanReactionTimeSec: 0,
        trialsCompleted: 0,
        components: {
          targetsHit: 0,
          targetsTotal: 0,
          meanLatencyMs: 0,
          fastestLatencyMs: 0,
          slowestLatencyMs: 0,
        },
      };
    }

    const hits = hwFrames.filter((f) => f.targetHit).length;
    const total = hwFrames.length;
    const accuracyPct = Math.round((hits / total) * 100);

    const latencies = hwFrames.map((f) => f.reactionLatencyMs).filter((l) => l > 0);
    const meanLatencyMs = latencies.length > 0 ? Math.round(mean(latencies)) : 1000;
    const fastestLatencyMs = latencies.length > 0 ? Math.min(...latencies) : 0;
    const slowestLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;

    const rtScore = Math.max(
      20,
      Math.min(
        100,
        Math.round(100 - Math.max(0, meanLatencyMs - ANALYTICS_CONFIG.THRESHOLDS.OPTIMAL_REACTION_MS) * ANALYTICS_CONFIG.THRESHOLDS.REACTION_SLOPE)
      )
    );
    const taskScore = Math.round(accuracyPct * 0.6 + rtScore * 0.4);

    return {
      taskScore,
      accuracyPct,
      meanReactionTimeSec: Number((meanLatencyMs / 1000).toFixed(2)),
      trialsCompleted: total,
      components: {
        targetsHit: hits,
        targetsTotal: total,
        meanLatencyMs,
        fastestLatencyMs,
        slowestLatencyMs,
      },
    };
  }

  /**
   * Synthesizes Complete Derived Analytics Bundle
   */
  public computeDerivedAnalytics(
    hwFrames: RawHardwareFrame[],
    visionFrames: VisionFrame[],
    voiceEvents: VoiceCorrectionEvent[]
  ): UnifiedDerivedAnalytics {
    const hwSummary = this.summarizeHardware(hwFrames);
    const visionSummary = this.summarizeVision(visionFrames);
    const voiceSummary = this.summarizeVoiceEvents(voiceEvents);

    const movementQuality = this.computeMovementQuality(visionSummary, hwSummary);
    const movementCompensation = this.computeMovementCompensation(visionFrames, visionSummary);
    const posturalStability = this.computePosturalStability(visionFrames);
    const movementVariability = this.computeMovementVariability(hwFrames, visionFrames);
    const movementConsistency = this.computeMovementConsistency(hwFrames);
    const bilateralPerformance = this.computeBilateralPerformance(hwFrames);
    const taskPerformance = this.computeTaskPerformance(hwFrames);

    const overallSessionScore = Math.round(
      movementQuality.score * 0.40 +
      taskPerformance.taskScore * 0.30 +
      posturalStability.stabilityScore * 0.15 +
      movementConsistency.consistencyScore * 0.15
    );

    return {
      movementQuality,
      movementCompensation,
      posturalStability,
      movementVariability,
      movementConsistency,
      bilateralPerformance,
      taskPerformance,
      voiceAnalytics: voiceSummary,
      overallSessionScore,
      disclaimer: ANALYTICS_CONFIG.DISCLAIMER,
    };
  }

  /**
   * Generates AI Output summary from the structured metrics (with strict disclaimer)
   */
  public generateAIOutput(derived: UnifiedDerivedAnalytics): AIReportOutput {
    const observations: string[] = [];
    const focusAreas: string[] = [];

    // Movement Quality & Posture
    if (derived.movementQuality.score >= 85) {
      observations.push(`High movement quality maintained (${derived.movementQuality.score}%) with steady postural alignment.`);
    } else {
      observations.push(`Movement quality scored ${derived.movementQuality.score}% with observed postural compensations.`);
    }

    // Bilateral balance
    if (derived.bilateralPerformance.asymmetryIndexPct > ANALYTICS_CONFIG.THRESHOLDS.ASYMMETRY_MILD) {
      observations.push(`Bilateral force asymmetry of ${derived.bilateralPerformance.asymmetryIndexPct}% favoring the ${derived.bilateralPerformance.dominantSide} side.`);
      focusAreas.push(`Emphasize symmetrical force distribution to reduce ${derived.bilateralPerformance.dominantSide}-dominant bias.`);
    } else {
      observations.push('Bilateral pedal load distribution remained balanced within normal thresholds.');
    }

    // Compensation vector
    if (derived.movementCompensation.compensationLevel !== 'low') {
      focusAreas.push(`Address ${derived.movementCompensation.primaryDeviation.replace('_', ' ')} during high-effort phases.`);
    }

    // Voice coaching compliance
    if (derived.voiceAnalytics.totalPromptsSpoken > 0) {
      observations.push(`User responded to real-time voice coaching with a ${derived.voiceAnalytics.correctionComplianceRatePct}% posture recovery rate.`);
    }

    const narrative = `Rehabilitation session achieved an overall performance score of ${derived.overallSessionScore}%. Movement quality registered at ${derived.movementQuality.score}% with ${derived.movementCompensation.summary}`;

    return {
      reportGenerated: true,
      generatedAt: new Date().toISOString(),
      summaryNarrative: narrative,
      keyObservations: observations,
      suggestedFocusAreas: focusAreas.length > 0 ? focusAreas : ['Maintain current movement consistency and cadence.'],
      disclaimer: ANALYTICS_CONFIG.DISCLAIMER,
    };
  }

  /**
   * Top-level pipeline: Ingests all 3 streams and produces complete StructuredSessionAnalysis
   */
  public analyzeSession(
    sessionId: string,
    startTime: string,
    endTime: string,
    dataSource: 'hardware' | 'simulated' | 'demo',
    hwFrames: RawHardwareFrame[],
    visionFrames: VisionFrame[],
    voiceEvents: VoiceCorrectionEvent[]
  ): StructuredSessionAnalysis {
    const durationSeconds = Math.max(
      0,
      Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
    );

    const rawHardware = this.summarizeHardware(hwFrames);
    const vision = this.summarizeVision(visionFrames);
    const derivedAnalytics = this.computeDerivedAnalytics(hwFrames, visionFrames, voiceEvents);
    const aiOutput = this.generateAIOutput(derivedAnalytics);

    return {
      sessionId,
      startTime,
      endTime,
      durationSeconds,
      sampleCount: Math.max(hwFrames.length, visionFrames.length),
      dataSource,
      rawHardware,
      vision,
      voiceEvents,
      derivedAnalytics,
      aiOutput,
    };
  }
}

export const unifiedAnalyticsEngine = new UnifiedAnalyticsEngine();
