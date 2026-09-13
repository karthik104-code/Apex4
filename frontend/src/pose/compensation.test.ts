import { MovementCompensationEngine, LANDMARK } from './compensation';
import { PoseLandmark } from '../types/rehab';

function createMockLandmarks(leanDx = 0, hikeDy = 0, rotationAngle = 0): PoseLandmark[] {
  const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5 }));

  const midX = 0.5 + leanDx;
  const lsY = 0.35 - hikeDy;
  const rsY = 0.35 + hikeDy;

  // Left Shoulder
  landmarks[LANDMARK.LEFT_SHOULDER] = { x: midX - 0.12, y: lsY };
  // Right Shoulder
  landmarks[LANDMARK.RIGHT_SHOULDER] = { x: midX + 0.12, y: rsY };

  // Left Hip
  landmarks[LANDMARK.LEFT_HIP] = { x: 0.5 - 0.1, y: 0.7 };
  // Right Hip with rotation angle shift
  const rotRad = (rotationAngle * Math.PI) / 180;
  landmarks[LANDMARK.RIGHT_HIP] = { x: 0.5 + 0.1, y: 0.7 + Math.sin(rotRad) * 0.1 };

  return landmarks;
}

export function runCompensationEngineTests() {
  console.log('🧪 Starting Movement Compensation Engine Unit Tests...\n');
  const engine = new MovementCompensationEngine();
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

  // Test 1: Missing / Null Landmarks
  const nullResult = engine.evaluatePose(null);
  assert(nullResult.trunk.level === 'low' && nullResult.movement_quality === 95, 'Test 1: Handle null landmarks gracefully');

  const emptyResult = engine.evaluatePose([]);
  assert(emptyResult.trunk.level === 'low', 'Test 2: Handle empty landmarks array gracefully');

  // Test 2: Normal Posture (No Compensation)
  const normalPose = createMockLandmarks(0, 0, 0);
  const normalResult = engine.evaluatePose(normalPose);
  assert(normalResult.trunk.level === 'low', 'Test 3: Normal posture trunk level is LOW');
  assert(normalResult.shoulder.level === 'low', 'Test 4: Normal posture shoulder level is LOW');
  assert(normalResult.movement_quality >= 85, 'Test 5: Normal posture movement quality >= 85%');

  // Test 3: Medium Trunk Lean Compensation (~11.3° lean angle)
  const mediumLeanPose = createMockLandmarks(0.07, 0, 0);
  const mediumResult = engine.evaluatePose(mediumLeanPose);
  assert(mediumResult.trunk.level === 'medium', 'Test 6: Medium trunk lean correctly classified as MEDIUM');
  assert(mediumResult.feedbackMessage.includes('trunk movement'), 'Test 7: Feedback includes non-alarming trunk message');

  // Test 4: High Compensation (Trunk + Shoulder Hike)
  const highCompPose = createMockLandmarks(0.22, 0.04, 12);
  const highResult = engine.evaluatePose(highCompPose);
  assert(highResult.trunk.level === 'high', 'Test 8: Extreme trunk lean classified as HIGH');
  assert(highResult.movement_quality < 70, 'Test 9: High compensation reduces movement quality < 70%');

  // Test 5: Noisy / Out-of-bounds Landmarks (Small postural tremor)
  const noisyPose = createMockLandmarks(0.015, 0.003, 1);
  noisyPose[LANDMARK.LEFT_SHOULDER].x += 0.001; // Small noise tremor
  const noisyResult = engine.evaluatePose(noisyPose);
  assert(noisyResult.movement_quality >= 80, 'Test 10: Noisy small tremors do not trigger false HIGH warnings');

  console.log(`\n📋 Test Results: ${passed} Passed, ${failed} Failed.`);
  return failed === 0;
}

// Auto-run if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('compensation.test')) {
  const success = runCompensationEngineTests();
  process.exit(success ? 0 : 1);
}
