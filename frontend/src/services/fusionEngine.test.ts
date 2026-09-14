import {
  computeSensorFusionScore,
  extractHardwareMetrics,
  extractVisionMetrics,
  setFusionModelStrategy,
  RuleBasedFusionModel,
  IFusionModelStrategy,
  SessionDataFusionResult,
  HardwareSourceMetrics,
  VisionSourceMetrics,
  FUSION_CONFIG,
} from './fusionEngine';
import { CompensationMetrics, HardwareTelemetry } from '../types/rehab';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runFusionEngineTests() {
  console.log('🧪 Starting APEX 4 Session Data Fusion Layer Unit Tests...\n');

  try {
    // Reset model strategy to default rule-based model
    setFusionModelStrategy(new RuleBasedFusionModel());

    // -------------------------------------------------------------
    // Scenario 1: Source 1 (Hardware) & Source 2 (Vision) Extraction
    // -------------------------------------------------------------
    const rawCompensation: CompensationMetrics = {
      trunkLeanAngle: 3.5,
      trunkLeanLevel: 'low',
      shoulderHikeDisplacement: 0.02,
      shoulderHikeLevel: 'low',
      torsoRotationAngle: 2.0,
      torsoRotationLevel: 'low',
      overallStability: 92,
      movementConsistency: 90,
    };

    const rawTelemetry: HardwareTelemetry = {
      leftForce: 120,
      rightForce: 110,
      rudder: 128,
      force: 75,
      reactionTime: 1.1,
      accuracy: 94,
      strikeConsistency: 88,
      mode: 'LIVE HARDWARE',
      source: 'hardware',
    };

    const hwMetrics = extractHardwareMetrics(rawTelemetry);
    assert(hwMetrics.leftForce === 120, 'Hardware metric leftForce should be 120');
    assert(hwMetrics.rightForce === 110, 'Hardware metric rightForce should be 110');
    assert(hwMetrics.rudder === 128, 'Hardware metric rudder should be 128');
    assert(hwMetrics.force === 75, 'Hardware force should be 75');
    assert(hwMetrics.reactionTime === 1.1, 'Hardware reaction time should be 1.1');
    assert(hwMetrics.accuracy === 94, 'Hardware accuracy should be 94');

    const visionMetrics = extractVisionMetrics(rawCompensation);
    assert(visionMetrics.trunkLeanAngle === 3.5, 'Vision metric trunkLeanAngle should be 3.5');
    assert(visionMetrics.shoulderHikeDisplacement === 0.02, 'Vision metric shoulderHikeDisplacement should be 0.02');
    assert(visionMetrics.torsoRotationAngle === 2.0, 'Vision metric torsoRotationAngle should be 2.0');
    assert(visionMetrics.movementStability === 92, 'Vision metric movementStability should be 92');
    assert(visionMetrics.movementConsistency === 90, 'Vision metric movementConsistency should be 90');

    console.log('  ✅ PASS: Test 1 - Data Source 1 (Hardware) and Data Source 2 (Vision) metrics correctly separated and extracted.');

    // -------------------------------------------------------------
    // Scenario 2: Structured Session Analytics Output Verification
    // -------------------------------------------------------------
    const fusion1 = computeSensorFusionScore(rawCompensation, rawTelemetry);

    assert(typeof fusion1.movementQuality === 'number', 'movementQuality must be a number');
    assert(fusion1.movementQuality >= 85, 'Good posture should yield high movement quality');

    assert(fusion1.movementCompensation !== undefined, 'movementCompensation structured object must exist');
    assert(fusion1.movementCompensation.compensationLevel === 'low', 'Compensation level should be LOW');
    assert(fusion1.movementCompensation.compensationScore >= 80, 'Compensation score should be high for good posture');

    assert(fusion1.hardwarePerformance !== undefined, 'hardwarePerformance structured object must exist');
    assert(fusion1.hardwarePerformance.leftForce === 120, 'hardwarePerformance leftForce must match source');
    assert(fusion1.hardwarePerformance.rightForce === 110, 'hardwarePerformance rightForce must match source');
    assert(fusion1.hardwarePerformance.performanceScore >= 85, 'High hardware accuracy & RT should yield high performanceScore');

    assert(fusion1.visionMetrics !== undefined, 'visionMetrics structured object must exist');
    assert(fusion1.visionMetrics.movementStability === 92, 'visionMetrics movementStability must match source');

    assert(fusion1.sessionAnalytics !== undefined, 'sessionAnalytics structured object must exist');
    assert(fusion1.sessionAnalytics.combinedSessionScore >= 85, 'Combined session score should be high');
    assert(fusion1.sessionAnalytics.rating === 'Optimal' || fusion1.sessionAnalytics.rating === 'Good', 'Session rating should be optimal/good');

    assert(fusion1.disclaimer !== undefined, 'Disclaimer must be present');
    assert(fusion1.disclaimer.includes('NOT clinically validated'), 'Disclaimer must explicitly state scores are not clinically validated medical scores');

    console.log('  ✅ PASS: Test 2 - Structured session analytics output verified (movementQuality, movementCompensation, hardwarePerformance, visionMetrics, sessionAnalytics, disclaimer).');

    // -------------------------------------------------------------
    // Scenario 3: High Compensation + Low Hardware Performance
    // -------------------------------------------------------------
    const highComp: CompensationMetrics = {
      trunkLeanAngle: 24.0,
      trunkLeanLevel: 'high',
      shoulderHikeDisplacement: 0.15,
      shoulderHikeLevel: 'high',
      torsoRotationAngle: 18.0,
      torsoRotationLevel: 'high',
      overallStability: 55,
      movementConsistency: 50,
    };

    const poorTelemetry: HardwareTelemetry = {
      leftForce: 45,
      rightForce: 30,
      rudder: 80,
      force: 35,
      reactionTime: 2.4,
      accuracy: 52,
      strikeConsistency: 48,
      mode: 'SIMULATED',
      source: 'simulated',
    };

    const fusionHighComp = computeSensorFusionScore(highComp, poorTelemetry);

    assert(fusionHighComp.movementQuality < 60, 'Movement quality should be low for high compensation');
    assert(fusionHighComp.movementCompensation.compensationLevel === 'high', 'Compensation level must be HIGH');
    assert(fusionHighComp.hardwarePerformance.performanceScore < 60, 'Hardware performance score should be low');
    assert(fusionHighComp.combinedSessionScore < 60, 'Combined session score must be low');
    assert(fusionHighComp.sessionAnalytics.rating === 'Needs Attention' || fusionHighComp.sessionAnalytics.rating === 'Moderate', 'Rating should reflect needed attention');

    console.log('  ✅ PASS: Test 3 - High compensation + poor telemetry generates appropriate warning level analytics.');

    // -------------------------------------------------------------
    // Scenario 4: Non-Medical Claim Guardrails & Forbidden Terms Check
    // -------------------------------------------------------------
    const serializedResult = JSON.stringify(fusion1) + JSON.stringify(fusionHighComp) + JSON.stringify(FUSION_CONFIG);
    assert(!serializedResult.includes('Stroke Recovery Score'), 'Forbidden term "Stroke Recovery Score" must NOT exist anywhere in output or config');
    assert(serializedResult.includes('Movement Quality'), 'Term "Movement Quality" must be present');
    assert(serializedResult.includes('Movement Compensation'), 'Term "Movement Compensation" must be present');

    console.log('  ✅ PASS: Test 4 - Medical claim guardrails satisfied. Forbidden term "Stroke Recovery Score" absent.');

    // -------------------------------------------------------------
    // Scenario 5: Future Trained Model Strategy Pluggability Test
    // -------------------------------------------------------------
    class DummyTrainedMLModel implements IFusionModelStrategy {
      name = 'APEX-ML-NeuralFusion-v2.0';
      version = '2.0.0-prototype';

      evaluate(hardware: HardwareSourceMetrics, vision: VisionSourceMetrics): SessionDataFusionResult {
        return {
          movementQualityLabel: 'Movement Quality',
          movementQuality: 99,
          movementCompensation: {
            label: 'Movement Compensation',
            compensationScore: 99,
            compensationLevel: 'low',
            summary: 'ML Model: Ideal posture detected.',
            details: {
              trunkLean: { angle: vision.trunkLeanAngle, level: 'low' },
              shoulderHike: { displacement: vision.shoulderHikeDisplacement, level: 'low' },
              torsoRotation: { angle: vision.torsoRotationAngle, level: 'low' },
            },
          },
          hardwarePerformance: {
            label: 'APEX 4 Performance',
            performanceScore: 99,
            leftForce: hardware.leftForce,
            rightForce: hardware.rightForce,
            rudder: hardware.rudder,
            force: hardware.force,
            reactionTime: hardware.reactionTime,
            accuracy: hardware.accuracy,
            strikeConsistency: hardware.strikeConsistency,
          },
          visionMetrics: vision,
          sessionAnalytics: {
            label: 'Session Analytics',
            combinedSessionScore: 99,
            rating: 'Optimal',
            insight: 'Trained ML Model predicted optimal motor synergy.',
            timestamp: new Date().toISOString(),
          },
          disclaimer: 'ML PROTOTYPE ANALYTICS: Experimental neural network prediction.',
        };
      }
    }

    const mlFusionResult = computeSensorFusionScore(rawCompensation, rawTelemetry, new DummyTrainedMLModel());
    assert(mlFusionResult.movementQuality === 99, 'Pluggable ML model evaluate output should return movementQuality = 99');
    assert(mlFusionResult.combinedInsight.includes('Trained ML Model'), 'Pluggable ML model insight should be returned seamlessly');

    console.log('  ✅ PASS: Test 5 - Model strategy pluggability verified. Seamless replacement with trained ML model demonstrated.');

    console.log('\n🎉 All 5 Session Data Fusion Layer Unit Tests Passed Successfully!\n');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runFusionEngineTests();
