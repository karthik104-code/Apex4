/**
 * APEX 4 — Unified Analytics Engine Comprehensive Unit Test Suite
 * 
 * Validates:
 * 1. Strict separation between RAW DATA, VISION, VOICE, DERIVED ANALYTICS, and AI OUTPUT.
 * 2. Mathematical correctness of all 7 derived analytics metrics.
 * 3. Exposure of underlying component measurements.
 * 4. Non-diagnostic disclaimer presence (Zero medical claims).
 * 5. Edge cases: Empty streams, asymmetric loading, high compensation, voice compliance.
 */

import {
  UnifiedAnalyticsEngine,
  unifiedAnalyticsEngine,
  mean,
  variance,
  standardDeviation,
  ANALYTICS_CONFIG,
} from './unifiedAnalyticsEngine';
import {
  RawHardwareFrame,
  VisionFrame,
  VoiceCorrectionEvent,
  StructuredSessionAnalysis,
} from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runAnalyticsEngineTests() {
  console.log('🧪 Starting APEX 4 Unified Analytics Engine Unit Tests...\n');

  try {
    const engine = new UnifiedAnalyticsEngine();

    // ========================================================================
    // 1. Math Utility Helpers
    // ========================================================================
    const numbers = [10, 20, 30, 40, 50];
    assert(mean(numbers) === 30, 'Mean of [10, 20, 30, 40, 50] should be 30');
    assert(variance([10, 10, 10]) === 0, 'Variance of identical numbers should be 0');
    assert(standardDeviation([10, 10, 10]) === 0, 'StdDev of identical numbers should be 0');
    console.log('  ✅ PASS: Test 1 - Math statistical helpers (mean, variance, stdDev) verified.');

    // ========================================================================
    // 2. Layer 1: Raw Hardware Data Summarization
    // ========================================================================
    const sampleHwFrames: RawHardwareFrame[] = [
      {
        timestamp: '2026-09-14T10:00:00.000Z',
        leftLoadCell: 120,
        rightLoadCell: 110,
        rudderDifferential: 128,
        actuatorForce: 70,
        reactionLatencyMs: 950,
        targetHit: true,
        source: 'hardware',
        connected: true,
      },
      {
        timestamp: '2026-09-14T10:00:01.000Z',
        leftLoadCell: 130,
        rightLoadCell: 115,
        rudderDifferential: 132,
        actuatorForce: 75,
        reactionLatencyMs: 1050,
        targetHit: true,
        source: 'hardware',
        connected: true,
      },
      {
        timestamp: '2026-09-14T10:00:02.000Z',
        leftLoadCell: 140,
        rightLoadCell: 105,
        rudderDifferential: 136,
        actuatorForce: 80,
        reactionLatencyMs: 1100,
        targetHit: false,
        source: 'hardware',
        connected: true,
      },
    ];

    const hwSummary = engine.summarizeHardware(sampleHwFrames);
    assert(hwSummary.frameCount === 3, 'Frame count should be 3');
    assert(hwSummary.meanLeftLoadCell === 130, 'Mean left load cell should be 130');
    assert(hwSummary.meanRightLoadCell === 110, 'Mean right load cell should be 110');
    assert(hwSummary.peakLeftLoadCell === 140, 'Peak left load cell should be 140');
    assert(hwSummary.peakRightLoadCell === 115, 'Peak right load cell should be 115');
    assert(hwSummary.meanForce === 75, 'Mean force should be 75');
    assert(hwSummary.peakForce === 80, 'Peak force should be 80');
    assert(hwSummary.meanReactionLatencyMs === 1033, 'Mean reaction latency should be 1033ms');
    assert(hwSummary.targetHitCount === 2, 'Target hits should be 2');
    assert(hwSummary.totalTargetTrials === 3, 'Total target trials should be 3');
    console.log('  ✅ PASS: Test 2 - Raw Hardware summary statistics calculated correctly.');

    // ========================================================================
    // 3. Layer 2: Vision Data Summarization
    // ========================================================================
    const sampleVisionFrames: VisionFrame[] = [
      {
        timestamp: '2026-09-14T10:00:00.000Z',
        trunkLeanAngleDeg: 3.0,
        trunkLeanDirection: 'left',
        trunkLeanLevel: 'low',
        shoulderHikeDisplacement: 0.02,
        shoulderHikeLevel: 'low',
        torsoRotationAngleDeg: 2.0,
        torsoRotationLevel: 'low',
        posturalStabilityPct: 92,
        trackingConfidence: 0.95,
        poseDetected: true,
      },
      {
        timestamp: '2026-09-14T10:00:01.000Z',
        trunkLeanAngleDeg: 4.0,
        trunkLeanDirection: 'left',
        trunkLeanLevel: 'low',
        shoulderHikeDisplacement: 0.03,
        shoulderHikeLevel: 'low',
        torsoRotationAngleDeg: 3.0,
        torsoRotationLevel: 'low',
        posturalStabilityPct: 90,
        trackingConfidence: 0.96,
        poseDetected: true,
      },
      {
        timestamp: '2026-09-14T10:00:02.000Z',
        trunkLeanAngleDeg: 5.0,
        trunkLeanDirection: 'left',
        trunkLeanLevel: 'low',
        shoulderHikeDisplacement: 0.04,
        shoulderHikeLevel: 'low',
        torsoRotationAngleDeg: 4.0,
        torsoRotationLevel: 'low',
        posturalStabilityPct: 88,
        trackingConfidence: 0.94,
        poseDetected: true,
      },
    ];

    const visionSummary = engine.summarizeVision(sampleVisionFrames);
    assert(visionSummary.frameCount === 3, 'Vision frame count should be 3');
    assert(visionSummary.meanTrunkLeanDeg === 4.0, 'Mean trunk lean should be 4.0°');
    assert(visionSummary.peakTrunkLeanDeg === 5.0, 'Peak trunk lean should be 5.0°');
    assert(visionSummary.meanShoulderHikeDisp === 0.03, 'Mean shoulder hike displacement should be 0.03');
    assert(visionSummary.meanTorsoRotationDeg === 3.0, 'Mean torso rotation should be 3.0°');
    assert(visionSummary.meanStabilityPct === 90, 'Mean stability percentage should be 90%');
    assert(visionSummary.highCompensationFrameCount === 0, 'High compensation frame count should be 0');
    console.log('  ✅ PASS: Test 3 - Vision measurement summary statistics calculated correctly.');

    // ========================================================================
    // 4. Layer 3: Voice Events Summarization & Compliance
    // ========================================================================
    const sampleVoiceEvents: VoiceCorrectionEvent[] = [
      {
        id: 'v-1',
        timestamp: '2026-09-14T10:00:01.000Z',
        deviationType: 'trunk_lean',
        promptSpoken: 'Sit upright',
        triggerMagnitude: 16.5,
        cooldownElapsedMs: 8200,
        resolved: true,
        latencyToCorrectionMs: 1400,
      },
      {
        id: 'v-2',
        timestamp: '2026-09-14T10:00:10.000Z',
        deviationType: 'shoulder_hike',
        promptSpoken: 'Level your shoulders',
        triggerMagnitude: 0.12,
        cooldownElapsedMs: 9000,
        resolved: true,
        latencyToCorrectionMs: 1800,
      },
      {
        id: 'v-3',
        timestamp: '2026-09-14T10:00:20.000Z',
        deviationType: 'trunk_lean',
        promptSpoken: 'Sit upright',
        triggerMagnitude: 17.0,
        cooldownElapsedMs: 10000,
        resolved: false,
      },
    ];

    const voiceSummary = engine.summarizeVoiceEvents(sampleVoiceEvents);
    assert(voiceSummary.totalPromptsSpoken === 3, 'Total prompts spoken should be 3');
    assert(voiceSummary.promptsByDeviation.trunkLean === 2, 'Trunk lean prompts count should be 2');
    assert(voiceSummary.promptsByDeviation.shoulderHike === 1, 'Shoulder hike prompts count should be 1');
    assert(voiceSummary.resolvedCorrectionsCount === 2, 'Resolved count should be 2');
    assert(voiceSummary.correctionComplianceRatePct === 67, 'Compliance rate should be 67% (2/3)');
    assert(voiceSummary.meanCorrectionLatencyMs === 1600, 'Mean correction latency should be (1400 + 1800) / 2 = 1600ms');
    console.log('  ✅ PASS: Test 4 - Voice correction events & compliance rate calculated correctly.');

    // ========================================================================
    // 5. Layer 4: Derived Analytics Calculations & Component Measurement Exposures
    // ========================================================================

    // 5.1 Movement Quality
    const mq = engine.computeMovementQuality(visionSummary, hwSummary);
    assert(mq.score >= 80, 'Movement Quality score should be >= 80 for optimal session');
    assert(mq.rating === 'Optimal' || mq.rating === 'Good', 'Rating should be Optimal or Good');
    assert(typeof mq.components.postureDeduction === 'number', 'postureDeduction component must be exposed');
    assert(typeof mq.components.stabilityBonus === 'number', 'stabilityBonus component must be exposed');
    assert(typeof mq.components.motorExecutionScore === 'number', 'motorExecutionScore component must be exposed');
    assert(mq.components.weights.visionWeight === 0.5, 'Vision weight component must be 0.5');

    // 5.2 Movement Compensation
    const mc = engine.computeMovementCompensation(sampleVisionFrames, visionSummary);
    assert(mc.compensationLevel === 'low', 'Compensation level should be low');
    assert(mc.compensationScore >= 80, 'Compensation score should be high');
    assert(mc.components.meanTrunkLeanDeg === 4.0, 'Component meanTrunkLeanDeg must be 4.0');
    assert(mc.components.meanShoulderHikeDisp === 0.03, 'Component meanShoulderHikeDisp must be 0.03');

    // 5.3 Postural Stability
    const ps = engine.computePosturalStability(sampleVisionFrames);
    assert(ps.stabilityScore >= 80, 'Postural stability score should be high');
    assert(ps.stabilityRating === 'Stable', 'Stability rating should be Stable');
    assert(typeof ps.components.trunkAngleVariance === 'number', 'trunkAngleVariance component must be exposed');
    assert(typeof ps.components.shoulderDisplacementVariance === 'number', 'shoulderDisplacementVariance component must be exposed');

    // 5.4 Movement Variability
    const mv = engine.computeMovementVariability(sampleHwFrames, sampleVisionFrames);
    assert(mv.forceCoefficientOfVariation > 0, 'Force CV should be positive');
    assert(mv.variabilityRating === 'Consistent' || mv.variabilityRating === 'Moderate Variability', 'Variability rating verified');
    assert(typeof mv.components.forceMean === 'number', 'forceMean component must be exposed');
    assert(typeof mv.components.forceStdDev === 'number', 'forceStdDev component must be exposed');
    assert(typeof mv.components.latencyMeanMs === 'number', 'latencyMeanMs component must be exposed');

    // 5.5 Movement Consistency
    const mcons = engine.computeMovementConsistency(sampleHwFrames);
    assert(mcons.consistencyScore > 0, 'Consistency score should be > 0');
    assert(typeof mcons.components.cadenceVarianceMs === 'number', 'cadenceVarianceMs component must be exposed');
    assert(typeof mcons.components.forcePeakSimilarityRatio === 'number', 'forcePeakSimilarityRatio component must be exposed');

    // 5.6 Bilateral Performance
    const bp = engine.computeBilateralPerformance(sampleHwFrames);
    // Left mean: 130, Right mean: 110 => Asymmetry: |130 - 110| / 130 * 100% = 15.38% -> 15.4%
    assert(bp.asymmetryIndexPct === 15.4, 'Asymmetry index should be exactly 15.4%');
    assert(bp.dominantSide === 'left', 'Dominant side should be left');
    assert(bp.symmetryRating === 'Mild Asymmetry', 'Symmetry rating should be Mild Asymmetry');
    assert(bp.components.leftMeanForce === 130, 'leftMeanForce component must be 130');
    assert(bp.components.rightMeanForce === 110, 'rightMeanForce component must be 110');
    assert(bp.components.leftPeakForce === 140, 'leftPeakForce component must be 140');
    assert(bp.components.rightPeakForce === 115, 'rightPeakForce component must be 115');

    // 5.7 Task Performance
    const tp = engine.computeTaskPerformance(sampleHwFrames);
    assert(tp.accuracyPct === 67, 'Accuracy should be 67% (2/3)');
    assert(tp.meanReactionTimeSec === 1.03, 'Mean RT should be 1.03s');
    assert(tp.components.targetsHit === 2, 'targetsHit component must be 2');
    assert(tp.components.targetsTotal === 3, 'targetsTotal component must be 3');
    assert(tp.components.fastestLatencyMs === 950, 'fastestLatencyMs component must be 950');
    assert(tp.components.slowestLatencyMs === 1100, 'slowestLatencyMs component must be 1100');

    console.log('  ✅ PASS: Test 5 - All 7 Derived Analytics metrics and their component measurements calculated and exposed.');

    // ========================================================================
    // 6. Complete Session Analysis Pipeline & Layer Separation
    // ========================================================================
    const fullAnalysis: StructuredSessionAnalysis = engine.analyzeSession(
      'ses-test-101',
      '2026-09-14T10:00:00.000Z',
      '2026-09-14T10:00:30.000Z',
      'hardware',
      sampleHwFrames,
      sampleVisionFrames,
      sampleVoiceEvents
    );

    assert(fullAnalysis.sessionId === 'ses-test-101', 'Session ID must match');
    assert(fullAnalysis.durationSeconds === 30, 'Duration should be 30 seconds');
    assert(fullAnalysis.rawHardware !== undefined, 'Raw hardware layer must be present');
    assert(fullAnalysis.vision !== undefined, 'Vision layer must be present');
    assert(fullAnalysis.voiceEvents !== undefined, 'Voice events layer must be present');
    assert(fullAnalysis.derivedAnalytics !== undefined, 'Derived analytics layer must be present');
    assert(fullAnalysis.aiOutput !== undefined, 'AI Output layer must be present');
    assert(fullAnalysis.aiOutput!.reportGenerated === true, 'AI Report generated flag must be true');

    // Non-medical claim validation
    const serializedAnalysis = JSON.stringify(fullAnalysis);
    assert(serializedAnalysis.includes('NOT clinically validated'), 'Disclaimer stating not clinically validated must be present');
    assert(!serializedAnalysis.includes('Stroke Recovery Score'), 'Forbidden marketing/diagnostic score names must not appear');

    console.log('  ✅ PASS: Test 6 - Full end-to-end analyzeSession pipeline with strict layer separation and non-diagnostic disclaimers.');

    // ========================================================================
    // 7. Edge Cases: High Compensation & Severe Asymmetry
    // ========================================================================
    const severeCompVision: VisionFrame[] = [
      {
        timestamp: '2026-09-14T10:00:00.000Z',
        trunkLeanAngleDeg: 25.0,
        trunkLeanDirection: 'right',
        trunkLeanLevel: 'high',
        shoulderHikeDisplacement: 0.18,
        shoulderHikeLevel: 'high',
        torsoRotationAngleDeg: 22.0,
        torsoRotationLevel: 'high',
        posturalStabilityPct: 45,
        trackingConfidence: 0.95,
        poseDetected: true,
      },
    ];

    const asymmetricHw: RawHardwareFrame[] = [
      {
        timestamp: '2026-09-14T10:00:00.000Z',
        leftLoadCell: 200,
        rightLoadCell: 20,
        rudderDifferential: 180,
        actuatorForce: 50,
        reactionLatencyMs: 2200,
        targetHit: false,
        source: 'hardware',
        connected: true,
      },
    ];

    const severeVisionSummary = engine.summarizeVision(severeCompVision);
    const severeHwSummary = engine.summarizeHardware(asymmetricHw);
    const severeCompensation = engine.computeMovementCompensation(severeCompVision, severeVisionSummary);
    const severeBilateral = engine.computeBilateralPerformance(asymmetricHw);
    const severeQuality = engine.computeMovementQuality(severeVisionSummary, severeHwSummary);

    assert(severeCompensation.compensationLevel === 'high', 'Severe posture must yield HIGH compensation level');
    assert(severeCompensation.compensationScore < 50, 'Severe compensation score must be < 50');
    assert(severeBilateral.symmetryRating === 'Marked Asymmetry', 'Symmetry rating must be Marked Asymmetry');
    assert(severeBilateral.asymmetryIndexPct === 90, 'Asymmetry index should be |200-20|/200 * 100 = 90%');
    assert(severeQuality.score < 50, 'Movement Quality score must be < 50');
    assert(severeQuality.rating === 'Needs Attention', 'Rating must be Needs Attention');

    console.log('  ✅ PASS: Test 7 - Edge case: High compensation and marked asymmetry evaluated accurately.');

    // ========================================================================
    // 8. Edge Cases: Empty Stream Graceful Handling
    // ========================================================================
    const emptyAnalysis = engine.analyzeSession(
      'ses-empty',
      '2026-09-14T10:00:00.000Z',
      '2026-09-14T10:00:00.000Z',
      'demo',
      [],
      [],
      []
    );

    assert(emptyAnalysis.rawHardware.frameCount === 0, 'Empty hardware frame count should be 0');
    assert(emptyAnalysis.vision.frameCount === 0, 'Empty vision frame count should be 0');
    assert(emptyAnalysis.voiceEvents.length === 0, 'Empty voice events count should be 0');
    assert(emptyAnalysis.derivedAnalytics.bilateralPerformance.asymmetryIndexPct === 0, 'Empty asymmetry should be 0');
    assert(emptyAnalysis.derivedAnalytics.disclaimer.includes('NOT clinically validated'), 'Empty analysis must still contain disclaimer');

    console.log('  ✅ PASS: Test 8 - Edge case: Empty input streams handled gracefully without crashes.');

    console.log('\n🎉 All 8 APEX 4 Unified Analytics Engine Unit Tests Passed Successfully!\n');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runAnalyticsEngineTests();
