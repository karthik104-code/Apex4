import { PostureDeviationDetector } from './deviationDetector';
import { CompensationMetrics } from '../types/rehab';

export function runDeviationDetectorTests() {
  console.log('🧪 Starting APEX 4 Posture Deviation Detector & Priority Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const baseStableMetrics: CompensationMetrics = {
    trunkLeanAngle: 2.1,
    trunkLeanDirection: 'neutral',
    trunkLeanLevel: 'low',
    anteriorInclinationRatio: 0.05,
    shoulderHikeDisplacement: 0.02,
    shoulderHikeLevel: 'low',
    torsoRotationAngle: 2.0,
    torsoRotationLevel: 'low',
    overallStability: 95,
  };

  const detector = new PostureDeviationDetector({
    persistenceMs: 0, // instantaneous for sync testing
    minPoseConfidence: 0.55,
    trunkLeanThresholdDeg: 7.5,
    shoulderHikeThreshold: 0.055,
    anteriorRatioThreshold: 0.22,
    torsoRotationThresholdDeg: 8.0,
  });

  // Test 1: Stable Posture
  const stableEvent = detector.evaluate(baseStableMetrics, 0.95, true);
  assert(stableEvent === null, 'Test 1: Stable posture produces null event (silent)');

  // Test 2: Low Pose Confidence
  const lowConfMetrics: CompensationMetrics = {
    ...baseStableMetrics,
    trunkLeanAngle: 14.5,
    trunkLeanDirection: 'left',
    trunkLeanLevel: 'high',
  };
  const lowConfEvent = detector.evaluate(lowConfMetrics, 0.40, true);
  assert(lowConfEvent === null, 'Test 2: Low confidence produces null event (silent)');

  // Test 3: Lean Left (instruction adjust right)
  const leftDeviated: CompensationMetrics = {
    ...baseStableMetrics,
    trunkLeanAngle: 12.0,
    trunkLeanDirection: 'left',
    trunkLeanLevel: 'medium',
  };
  detector.reset();
  const leftEvent = detector.evaluate(leftDeviated, 0.95, true);
  assert(leftEvent !== null && leftEvent.instruction === 'Please adjust slightly to the right.', 'Test 3: Lean left prompts adjust right');

  // Test 4: Lean Right (instruction adjust left)
  const rightDeviated: CompensationMetrics = {
    ...baseStableMetrics,
    trunkLeanAngle: 13.5,
    trunkLeanDirection: 'right',
    trunkLeanLevel: 'medium',
  };
  detector.reset();
  const rightEvent = detector.evaluate(rightDeviated, 0.95, true);
  assert(rightEvent !== null && rightEvent.instruction === 'Please adjust slightly to the left.', 'Test 4: Lean right prompts adjust left');

  // Test 5: Forward Lean (instruction sit upright)
  const forwardDeviated: CompensationMetrics = {
    ...baseStableMetrics,
    anteriorInclinationRatio: 0.28,
  };
  detector.reset();
  const forwardEvent = detector.evaluate(forwardDeviated, 0.95, true);
  assert(forwardEvent !== null && forwardEvent.instruction === 'Please sit a little more upright.', 'Test 5: Forward lean prompts sit upright');

  // Test 6: Shoulder Asymmetry (instruction level shoulders)
  const shoulderDeviated: CompensationMetrics = {
    ...baseStableMetrics,
    shoulderHikeDisplacement: 0.08,
    shoulderHikeLevel: 'medium',
  };
  detector.reset();
  const shoulderEvent = detector.evaluate(shoulderDeviated, 0.95, true);
  assert(shoulderEvent !== null && shoulderEvent.instruction === 'Please level your shoulders.', 'Test 6: Shoulder asymmetry prompts level shoulders');

  // Test 7: Torso Rotation (instruction face forward)
  const rotationDeviated: CompensationMetrics = {
    ...baseStableMetrics,
    torsoRotationAngle: 11.2,
    torsoRotationLevel: 'medium',
  };
  detector.reset();
  const rotationEvent = detector.evaluate(rotationDeviated, 0.95, true);
  assert(rotationEvent !== null && rotationEvent.instruction === 'Please face forward.', 'Test 7: Torso rotation prompts face forward');

  // Test 8: Priority Arbitration (Lateral lean > Shoulder hike)
  const multiDeviated: CompensationMetrics = {
    ...baseStableMetrics,
    trunkLeanAngle: 12.0,
    trunkLeanDirection: 'left',
    shoulderHikeDisplacement: 0.09,
    torsoRotationAngle: 14.0,
  };
  detector.reset();
  const multiEvent = detector.evaluate(multiDeviated, 0.95, true);
  assert(multiEvent !== null && multiEvent.type === 'LEAN_LEFT', 'Test 8: Priority arbiter selects lateral lean over shoulder hike');

  console.log(`\n🏁 Completed Deviation Detector Tests: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}
