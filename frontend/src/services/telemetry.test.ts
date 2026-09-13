import {
  DemoSimulatorAdapter,
  HardwareInterfaceAdapter,
  validateTelemetryData,
  MSV1TelemetryData,
} from './telemetry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTelemetryTests() {
  console.log('🧪 Starting MSV1 Hardware Telemetry Unit Tests...\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Test Demo Simulator Independently
    // -------------------------------------------------------------
    const simulator = new DemoSimulatorAdapter();
    assert(simulator.getMode() === 'SIMULATED', 'Simulator mode should be SIMULATED');

    const data1 = await simulator.getTelemetry();
    assert(typeof data1.force === 'number' && data1.force >= 0 && data1.force <= 100, 'Force should be a valid percentage');
    assert(typeof data1.reaction_time === 'number' && data1.reaction_time > 0, 'Reaction time should be positive number');
    assert(typeof data1.accuracy === 'number' && data1.accuracy >= 0 && data1.accuracy <= 100, 'Accuracy should be valid percentage');
    assert(typeof data1.consistency === 'number' && data1.consistency >= 0 && data1.consistency <= 100, 'Consistency should be valid percentage');
    assert(typeof data1.timestamp === 'string' && data1.timestamp.length > 0, 'Timestamp should be non-empty string');
    assert(data1.mode === 'SIMULATED', 'Data mode should be SIMULATED');
    console.log('  ✅ PASS: Test 1: Test simulator independently & verify structured fields');

    // -------------------------------------------------------------
    // Test 2: Dynamic Value Changes Over Time
    // -------------------------------------------------------------
    const data2 = await simulator.getTelemetry();
    assert(data1.timestamp !== data2.timestamp || data1.force !== data2.force || data1.reaction_time !== data2.reaction_time, 'Simulator should emit dynamic updating values');
    console.log('  ✅ PASS: Test 2: Dynamic telemetry variations over time');

    // -------------------------------------------------------------
    // Test 3: Demo Telemetry Presets (Fatigue & High Compensation)
    // -------------------------------------------------------------
    simulator.setPreset('fatigue');
    const fatigueData = await simulator.getTelemetry();
    assert(fatigueData.reaction_time > 1.4, 'Fatigue preset should yield higher reaction times');

    simulator.setPreset('high_compensation');
    const compData = await simulator.getTelemetry();
    assert(compData.force > 70, 'High compensation preset should reflect elevated actuator force');
    console.log('  ✅ PASS: Test 3: Simulator profile presets change telemetry baseline');

    // -------------------------------------------------------------
    // Test 4: Hardware Interface Abstraction (Mode Distinction)
    // -------------------------------------------------------------
    const hwAdapter = new HardwareInterfaceAdapter();
    assert(hwAdapter.getMode() === 'LIVE HARDWARE', 'Hardware adapter mode should be LIVE HARDWARE');

    const hwData = await hwAdapter.getTelemetry();
    assert(hwData.mode === 'LIVE HARDWARE', 'Hardware data should be marked LIVE HARDWARE');
    console.log('  ✅ PASS: Test 4: Hardware interface adapter returns LIVE HARDWARE mode');

    // -------------------------------------------------------------
    // Test 5: Valid Telemetry Schema Matching Target Format
    // -------------------------------------------------------------
    const sampleInput = {
      force: 64,
      reaction_time: 1.24,
      accuracy: 87,
      consistency: 91,
      timestamp: '2026-09-13T15:23:08Z',
      mode: 'SIMULATED',
    };
    const validatedSample = validateTelemetryData(sampleInput);
    assert(validatedSample.force === 64, 'Force should match');
    assert(validatedSample.reaction_time === 1.24, 'Reaction time should match');
    assert(validatedSample.accuracy === 87, 'Accuracy should match');
    assert(validatedSample.consistency === 91, 'Consistency should match');
    assert(validatedSample.timestamp === '2026-09-13T15:23:08Z', 'Timestamp should match');
    console.log('  ✅ PASS: Test 5: Standard structured data schema validated');

    // -------------------------------------------------------------
    // Test 6: Test Malformed Telemetry Handling
    // -------------------------------------------------------------
    const malformedInput = {
      force: 'invalid_string',
      reaction_time: -5.0,
      accuracy: NaN,
      consistency: 150, // out of bounds
      timestamp: 12345, // invalid type
    };
    const sanitizedMalformed = validateTelemetryData(malformedInput);
    assert(typeof sanitizedMalformed.force === 'number' && !isNaN(sanitizedMalformed.force), 'Malformed force sanitized');
    assert(sanitizedMalformed.reaction_time >= 0.1, 'Negative reaction_time capped at valid minimum');
    assert(!isNaN(sanitizedMalformed.accuracy), 'NaN accuracy replaced with default fallback');
    assert(sanitizedMalformed.consistency <= 100, 'Out-of-bounds consistency capped at 100%');
    assert(typeof sanitizedMalformed.timestamp === 'string', 'Malformed timestamp converted to ISO fallback string');
    console.log('  ✅ PASS: Test 6: Malformed telemetry gracefully sanitized without crashing');

    // -------------------------------------------------------------
    // Test 7: Test Missing Telemetry Handling (Null/Undefined Input)
    // -------------------------------------------------------------
    const nullValidated = validateTelemetryData(null);
    assert(nullValidated.force === 50, 'Null telemetry returns safe force default');
    assert(nullValidated.reaction_time === 1.5, 'Null telemetry returns safe reaction_time default');
    assert(nullValidated.mode === 'SIMULATED', 'Null telemetry defaults to SIMULATED mode');

    const emptyObjValidated = validateTelemetryData({});
    assert(emptyObjValidated.accuracy === 85, 'Empty object returns safe accuracy default');
    console.log('  ✅ PASS: Test 7: Missing/Null telemetry input handled safely with default fallbacks');

    // -------------------------------------------------------------
    // Test 8: Test Telemetry Field Aliases (camelCase vs snake_case)
    // -------------------------------------------------------------
    const camelCaseInput = {
      force: 70,
      reactionTime: 1.15,
      accuracy: 92,
      strikeConsistency: 88,
    };
    const camelValidated = validateTelemetryData(camelCaseInput);
    assert(camelValidated.reaction_time === 1.15, 'reactionTime mapped to reaction_time');
    assert(camelValidated.consistency === 88, 'strikeConsistency mapped to consistency');
    console.log('  ✅ PASS: Test 8: Legacy field names (reactionTime, strikeConsistency) correctly mapped');

    console.log('\n📋 Test Results: All 8 Telemetry Tests Passed Successfully!');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runTelemetryTests();
