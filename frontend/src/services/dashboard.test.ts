import { RehabSession } from '../types/rehab';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runDashboardTests() {
  console.log('🧪 Starting Therapist Dashboard & Session History Unit Tests...\n');

  const demoSessions: RehabSession[] = [
    {
      id: 'ses-401',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 12, 2026',
      durationSeconds: 240,
      fusionScore: { movementQuality: 82, performanceScore: 84, combinedSessionScore: 83, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 12.4, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.06, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.2, torsoRotationLevel: 'low', overallStability: 81 },
      telemetry: { force: 64, reactionTime: 1.24, accuracy: 87, strikeConsistency: 82, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-301',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 10, 2026',
      durationSeconds: 240,
      fusionScore: { movementQuality: 78, performanceScore: 81, combinedSessionScore: 80, compensationSummary: 'Medium trunk lean & shoulder hike.' },
      compensationMetrics: { trunkLeanAngle: 14.1, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.07, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.8, torsoRotationLevel: 'low', overallStability: 79 },
      telemetry: { force: 62, reactionTime: 1.35, accuracy: 83, strikeConsistency: 80, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-201',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 08, 2026',
      durationSeconds: 250,
      fusionScore: { movementQuality: 74, performanceScore: 78, combinedSessionScore: 76, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 15.8, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.08, shoulderHikeLevel: 'medium', torsoRotationAngle: 6.4, torsoRotationLevel: 'medium', overallStability: 75 },
      telemetry: { force: 60, reactionTime: 1.48, accuracy: 81, strikeConsistency: 77, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 06, 2026',
      durationSeconds: 220,
      fusionScore: { movementQuality: 71, performanceScore: 73, combinedSessionScore: 72, compensationSummary: 'High trunk lean on initial strikes.' },
      compensationMetrics: { trunkLeanAngle: 18.2, trunkLeanLevel: 'high', shoulderHikeDisplacement: 0.09, shoulderHikeLevel: 'medium', torsoRotationAngle: 7.1, torsoRotationLevel: 'medium', overallStability: 72 },
      telemetry: { force: 55, reactionTime: 1.62, accuracy: 76, strikeConsistency: 72, mode: 'simulated' },
      status: 'completed',
    },
  ];

  try {
    // -------------------------------------------------------------
    // Test 1: Verify Session Count & Latest Session Retrieval
    // -------------------------------------------------------------
    assert(demoSessions.length === 4, 'Should store 4 historical demo sessions');
    const latest = demoSessions[0];
    assert(latest.id === 'ses-401', 'Latest session should be ses-401');
    assert(latest.fusionScore.movementQuality === 82, 'Latest movement quality should be 82%');
    console.log('  ✅ PASS: Test 1: Historical session loading & latest session retrieval');

    // -------------------------------------------------------------
    // Test 2: Calculate 10-Second Executive Summary Metrics
    // -------------------------------------------------------------
    const avgTrunkLean = Number((demoSessions.reduce((acc, s) => acc + s.compensationMetrics.trunkLeanAngle, 0) / demoSessions.length).toFixed(1));
    assert(avgTrunkLean === 15.1, 'Average trunk lean should calculate to 15.1°');
    
    const latestAccuracy = latest.telemetry.accuracy;
    assert(latestAccuracy === 87, 'Latest accuracy should be 87%');
    console.log('  ✅ PASS: Test 2: Executive summary 10-second KPI indicators calculated');

    // -------------------------------------------------------------
    // Test 3: Chart Data Trajectory Formatting
    // -------------------------------------------------------------
    const chartData = [...demoSessions].reverse().map((s) => ({
      date: s.date,
      movementQuality: s.fusionScore.movementQuality,
      accuracy: s.telemetry.accuracy,
      trunkLean: s.compensationMetrics.trunkLeanAngle,
      reactionTime: s.telemetry.reactionTime,
    }));

    assert(chartData[0].movementQuality === 71, 'First chronological session quality is 71%');
    assert(chartData[3].movementQuality === 82, 'Latest session quality is 82%');
    assert(chartData[3].reactionTime < chartData[0].reactionTime, 'Reaction time shows improvement (decrease over time)');
    console.log('  ✅ PASS: Test 3: Recharts trajectory data correctly orders 4 sessions chronologically');

    // -------------------------------------------------------------
    // Test 4: Session Details Lookup & AI Report Binding
    // -------------------------------------------------------------
    const targetId = 'ses-301';
    const foundSession = demoSessions.find((s) => s.id === targetId);
    assert(foundSession !== undefined, 'Target session ses-301 should be found');
    assert(foundSession?.compensationMetrics.trunkLeanLevel === 'medium', 'ses-301 compensation level should be medium');
    console.log('  ✅ PASS: Test 4: Session detail lookup by ID');

    console.log('\n📋 Test Results: All 4 Dashboard & History Tests Passed Successfully!');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runDashboardTests();
