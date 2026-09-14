import { SessionRecorder } from './sessionRecorder';
import { CompensationMetrics, HardwareTelemetry } from '../types/rehab';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runSessionRecorderTests() {
  console.log('🧪 Starting APEX 4 Session Recorder Unit Tests...\n');

  try {
    // -------------------------------------------------------------
    // Scenario 1: Start Session Recording & Source Tagging ('demo')
    // -------------------------------------------------------------
    const recorder = new SessionRecorder();
    const sid = recorder.startSession('demo');

    assert(sid.startsWith('ses-'), 'Session ID should start with "ses-"');
    assert(recorder.getRecordingState() === 'recording', 'Recording state should be "recording" after startSession');
    assert(recorder.getSnapshotCount() === 0, 'Initial snapshot count should be 0');

    console.log('  ✅ PASS: Test 1 - Session recording initialized cleanly in DEMO mode.');

    // -------------------------------------------------------------
    // Scenario 2: Snapshot Accumulation (1Hz structured metrics)
    // -------------------------------------------------------------
    const dummyTelemetry: HardwareTelemetry = {
      force: 70,
      reactionTime: 1.15,
      accuracy: 92,
      strikeConsistency: 88,
      mode: 'simulated',
      source: 'simulated',
      hardwareConnected: false,
    };

    const dummyVision: CompensationMetrics = {
      trunkLeanAngle: 3.0,
      trunkLeanLevel: 'low',
      shoulderHikeDisplacement: 0.02,
      shoulderHikeLevel: 'low',
      torsoRotationAngle: 2.0,
      torsoRotationLevel: 'low',
      overallStability: 90,
    };

    recorder.recordSnapshot(dummyTelemetry, dummyVision);
    recorder.recordSnapshot(dummyTelemetry, dummyVision);

    assert(recorder.getSnapshotCount() === 2, 'Snapshot count should be 2 after recording 2 snapshots');

    console.log('  ✅ PASS: Test 2 - Structured measurements snapshot accumulation verified.');

    // -------------------------------------------------------------
    // Scenario 3: Pause & Resume Session Recording Lifecycle
    // -------------------------------------------------------------
    const paused = recorder.pauseSession();
    assert(paused === true, 'pauseSession() should return true when state is recording');
    assert(recorder.getRecordingState() === 'paused', 'Recording state should be "paused"');

    // Recording snapshot while paused should be rejected
    const snapshotResult = recorder.recordSnapshot(dummyTelemetry, dummyVision);
    assert(snapshotResult === false, 'recordSnapshot should return false while session is paused');
    assert(recorder.getSnapshotCount() === 2, 'Snapshot count should not increase while paused');

    const resumed = recorder.resumeSession();
    assert(resumed === true, 'resumeSession() should return true when state is paused');
    assert(recorder.getRecordingState() === 'recording', 'Recording state should be "recording" after resume');

    recorder.recordSnapshot(dummyTelemetry, dummyVision);
    assert(recorder.getSnapshotCount() === 3, 'Snapshot count should be 3 after recording post-resume snapshot');

    console.log('  ✅ PASS: Test 3 - Pause & Resume lifecycle state management verified.');

    // -------------------------------------------------------------
    // Scenario 4: End Session & Structured Session Object Generation
    // -------------------------------------------------------------
    const sessionSummary = recorder.endSession();

    assert(sessionSummary.sessionId === sid, 'Summary sessionId must match started sessionId');
    assert(typeof sessionSummary.startedAt === 'string' && sessionSummary.startedAt.length > 0, 'startedAt ISO string must exist');
    assert(typeof sessionSummary.endedAt === 'string' && sessionSummary.endedAt.length > 0, 'endedAt ISO string must exist');
    assert(sessionSummary.source === 'demo', 'Session source must be "demo"');
    assert(sessionSummary.status === 'completed', 'Session status must be "completed"');
    assert(sessionSummary.sampleCount === 3, 'Sample count in summary should equal 3');
    assert(sessionSummary.telemetry !== undefined, 'Summary telemetry must be present');
    assert(sessionSummary.vision !== undefined, 'Summary vision metrics must be present');
    assert(sessionSummary.analytics !== undefined, 'Summary fused analytics must be present');
    assert(sessionSummary.analytics.movementQuality >= 80, 'Aggregated movement quality should be high');

    console.log('  ✅ PASS: Test 4 - Structured session summary object generation verified.');

    // -------------------------------------------------------------
    // Scenario 5: Hardware Disconnect Mid-Session Handling
    // -------------------------------------------------------------
    const hwRecorder = new SessionRecorder();
    const hwSid = hwRecorder.startSession('hardware');

    const connectedTel: HardwareTelemetry = {
      force: 80,
      reactionTime: 1.0,
      accuracy: 95,
      strikeConsistency: 90,
      mode: 'hardware',
      source: 'hardware',
      hardwareConnected: true,
      leftForce: 150,
      rightForce: 140,
      rudder: 128,
    };

    hwRecorder.recordSnapshot(connectedTel, dummyVision);
    assert(hwRecorder.isHardwareDisconnected() === false, 'Hardware should be marked as connected initially');

    // Simulate hardware disconnect mid-session
    const disconnectedTel: HardwareTelemetry = {
      ...connectedTel,
      hardwareConnected: false,
    };

    hwRecorder.recordSnapshot(disconnectedTel, dummyVision);
    assert(hwRecorder.isHardwareDisconnected() === true, 'Hardware disconnect should be recorded without crashing');

    const hwSummary = hwRecorder.endSession();
    assert(hwSummary.source === 'hardware', 'Session source should remain tagged as "hardware"');
    assert(hwSummary.telemetry.hardwareConnected === false, 'Ended session telemetry should reflect hardware disconnect event');
    assert(hwSummary.status === 'completed', 'Session summary should remain complete without corrupting data');

    console.log('  ✅ PASS: Test 5 - Mid-session hardware disconnect handled gracefully.');

    // -------------------------------------------------------------
    // Scenario 6: Invalid Session Handling (Unstarted / Zero Duration)
    // -------------------------------------------------------------
    const invalidRecorder = new SessionRecorder();
    const invalidSummary = invalidRecorder.endSession();

    assert(invalidSummary.status === 'invalid', 'Unstarted session summary status must be "invalid"');
    assert(invalidSummary.durationSeconds === 0, 'Invalid session duration should be 0');

    console.log('  ✅ PASS: Test 6 - Invalid / zero-duration session handling verified.');

    console.log('\n🎉 All 6 Session Recorder Unit Tests Passed Successfully!\n');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runSessionRecorderTests();
