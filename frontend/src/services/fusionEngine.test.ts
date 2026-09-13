import { computeSensorFusionScore } from './fusionEngine';
import { CompensationMetrics, HardwareTelemetry } from '../types/rehab';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runFusionEngineTests() {
  console.log('🧪 Starting Vision + MSV1 Data Fusion Unit Tests...\n');

  try {
    // -------------------------------------------------------------
    // Scenario 1: Good Movement + Good Performance
    // -------------------------------------------------------------
    const goodCompensation: CompensationMetrics = {
      trunkLeanAngle: 2.1,
      trunkLeanLevel: 'low',
      shoulderHikeDisplacement: 0.01,
      shoulderHikeLevel: 'low',
      torsoRotationAngle: 1.5,
      torsoRotationLevel: 'low',
      overallStability: 95,
    };

    const goodTelemetry: HardwareTelemetry = {
      force: 68,
      reactionTime: 1.12,
      reaction_time: 1.12,
      accuracy: 92,
      strikeConsistency: 90,
      consistency: 90,
      mode: 'SIMULATED',
      profilePreset: 'normal',
    };

    const fusion1 = computeSensorFusionScore(goodCompensation, goodTelemetry);

    assert(fusion1.movementQuality >= 85, 'Good posture should yield high movement quality');
    assert(fusion1.performanceScore >= 85, 'High accuracy & fast RT should yield high performance score');
    assert(fusion1.compensationLevel === 'low', 'Overall compensation level should be LOW');
    assert(fusion1.combinedSessionScore >= 85, 'Session score should be high for optimal movement + performance');
    assert(fusion1.combinedInsight.includes('Optimal movement symmetry'), 'Insight text should highlight optimal alignment');
    console.log('  ✅ PASS: Scenario 1: Good movement + Good performance (Quality: ' + fusion1.movementQuality + '%, Performance: ' + fusion1.performanceScore + '%, Session: ' + fusion1.combinedSessionScore + '%)');

    // -------------------------------------------------------------
    // Scenario 2: High Compensation + Good Performance
    // -------------------------------------------------------------
    const highCompensation: CompensationMetrics = {
      trunkLeanAngle: 22.5,
      trunkLeanLevel: 'high',
      shoulderHikeDisplacement: 0.12,
      shoulderHikeLevel: 'high',
      torsoRotationAngle: 16.0,
      torsoRotationLevel: 'high',
      overallStability: 60,
    };

    const fusion2 = computeSensorFusionScore(highCompensation, goodTelemetry);

    assert(fusion2.movementQuality < 65, 'High lean should decrease movement quality');
    assert(fusion2.performanceScore >= 85, 'Good hardware metrics should maintain high performance score');
    assert(fusion2.compensationLevel === 'high', 'Compensation level should be HIGH');
    assert(fusion2.combinedSessionScore < fusion1.combinedSessionScore, 'Combined score should reflect high compensation penalty');
    assert(fusion2.combinedInsight.toLowerCase().includes('compensation'), 'Insight text should warn about compensatory lean');
    console.log('  ✅ PASS: Scenario 2: High compensation + Good performance (Quality: ' + fusion2.movementQuality + '%, Performance: ' + fusion2.performanceScore + '%, Session: ' + fusion2.combinedSessionScore + '%)');

    // -------------------------------------------------------------
    // Scenario 3: Good Movement + Poor Performance
    // -------------------------------------------------------------
    const poorTelemetry: HardwareTelemetry = {
      force: 42,
      reactionTime: 2.35,
      reaction_time: 2.35,
      accuracy: 58,
      strikeConsistency: 54,
      consistency: 54,
      mode: 'SIMULATED',
      profilePreset: 'fatigue',
    };

    const fusion3 = computeSensorFusionScore(goodCompensation, poorTelemetry);

    assert(fusion3.movementQuality >= 85, 'Good posture should maintain high movement quality');
    assert(fusion3.performanceScore < 65, 'Poor telemetry should yield low performance score');
    assert(fusion3.compensationLevel === 'low', 'Compensation level should remain LOW');
    assert(fusion3.combinedSessionScore < fusion1.combinedSessionScore, 'Combined score should be reduced by poor hardware output');
    assert(fusion3.combinedInsight.includes('reduced actuator response speed') || fusion3.combinedInsight.includes('LOW compensation'), 'Insight should note low compensation despite reduced speed');
    console.log('  ✅ PASS: Scenario 3: Good movement + Poor performance (Quality: ' + fusion3.movementQuality + '%, Performance: ' + fusion3.performanceScore + '%, Session: ' + fusion3.combinedSessionScore + '%)');

    // -------------------------------------------------------------
    // Scenario 4: High Compensation + Poor Performance
    // -------------------------------------------------------------
    const fusion4 = computeSensorFusionScore(highCompensation, poorTelemetry);

    assert(fusion4.movementQuality < 65, 'Movement quality should be low');
    assert(fusion4.performanceScore < 65, 'Performance score should be low');
    assert(fusion4.compensationLevel === 'high', 'Compensation level should be HIGH');
    assert(fusion4.combinedSessionScore < 60, 'Combined session score should be low');
    assert(fusion4.combinedInsight.includes('rest break recommended') || fusion4.combinedInsight.includes('HIGH compensation'), 'Insight should recommend rest break or fatigue management');
    console.log('  ✅ PASS: Scenario 4: High compensation + Poor performance (Quality: ' + fusion4.movementQuality + '%, Performance: ' + fusion4.performanceScore + '%, Session: ' + fusion4.combinedSessionScore + '%)');

    console.log('\n📋 Test Results: All 4 Fusion Engine Scenarios Passed Successfully!');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runFusionEngineTests();
