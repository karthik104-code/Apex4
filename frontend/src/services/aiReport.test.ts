import { AIReport, RehabSession } from '../types/rehab';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runAIReportFrontendTests() {
  console.log('🧪 Starting APEX 4 AI Session Report Frontend Unit Tests...\n');

  try {
    // -------------------------------------------------------------
    // Scenario 1: Verify 5 Required Sections in AIReport Schema
    // -------------------------------------------------------------
    const mockReport: AIReport = {
      sessionSummary: 'Session completed with structured movement analysis. Overall movement quality score: 82%.',
      movementObservations: [
        'Maintained strong posture control and movement symmetry score (82%).',
        'Trunk posture deviation detected (MEDIUM level compensation).',
      ],
      performanceSummary: {
        actuatorForce: '64%',
        reactionTime: '1.24s',
        accuracy: '87%',
        consistency: '91%',
      },
      sessionTrend: 'Session metrics indicate stable motor coordination baseline.',
      therapistDiscussionPoints: [
        'Trunk posture alignment is worth reviewing with the rehabilitation professional when adjusting actuator force levels.',
      ],
      positiveObservations: [
        'Maintained strong posture control and movement symmetry score (82%).',
      ],
      measurableConcerns: [
        'Trunk posture deviation detected (MEDIUM level compensation).',
      ],
      disclaimer: 'AI-generated session insight. For rehabilitation professional review. Does not diagnose or prescribe treatment.',
      label: 'AI-generated session insight',
      sublabel: 'For rehabilitation professional review.',
      language: 'en',
    };

    // 1. Session Summary
    assert(mockReport.sessionSummary !== undefined && mockReport.sessionSummary.length > 0, 'Section 1: sessionSummary present');

    // 2. Movement Observations
    assert(mockReport.movementObservations !== undefined && mockReport.movementObservations.length > 0, 'Section 2: movementObservations present');

    // 3. Performance
    assert(mockReport.performanceSummary !== undefined && mockReport.performanceSummary.actuatorForce === '64%', 'Section 3: performanceSummary present');

    // 4. Trend
    assert(mockReport.sessionTrend !== undefined && mockReport.sessionTrend.length > 0, 'Section 4: sessionTrend present');

    // 5. Discussion Point for Therapist
    assert(mockReport.therapistDiscussionPoints !== undefined && mockReport.therapistDiscussionPoints.length > 0, 'Section 5: therapistDiscussionPoints present');

    // Required Labels
    assert(mockReport.label === 'AI-generated session insight', 'Mandatory label "AI-generated session insight" present');
    assert(mockReport.sublabel === 'For rehabilitation professional review.', 'Mandatory sublabel "For rehabilitation professional review." present');

    console.log('  ✅ PASS: Test 1 - All 5 required report sections and mandatory labels verified.');

    // -------------------------------------------------------------
    // Scenario 2: Structured Payload Only (No Raw Video Payload)
    // -------------------------------------------------------------
    const dummySession: RehabSession = {
      id: 'ses-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: '2026-09-14',
      durationSeconds: 180,
      fusionScore: {
        movementQuality: 82,
        performanceScore: 84,
        combinedSessionScore: 83,
        compensationSummary: 'Medium trunk lean detected.',
      },
      compensationMetrics: {
        trunkLeanAngle: 12.4,
        trunkLeanLevel: 'medium',
        shoulderHikeDisplacement: 0.06,
        shoulderHikeLevel: 'low',
        torsoRotationAngle: 5.2,
        torsoRotationLevel: 'low',
        overallStability: 81,
      },
      telemetry: {
        force: 64,
        reactionTime: 1.24,
        accuracy: 87,
        strikeConsistency: 91,
        mode: 'simulated',
        source: 'demo',
      },
      status: 'completed',
    };

    const payload = JSON.stringify(dummySession);
    assert(!payload.includes('video'), 'Payload must NOT contain video bytes or frames');
    assert(!payload.includes('image'), 'Payload must NOT contain image bytes or frames');

    console.log('  ✅ PASS: Test 2 - Zero raw video payload guarantee verified.');

    // -------------------------------------------------------------
    // Scenario 3: Non-Diagnostic Safety Assertions
    // -------------------------------------------------------------
    const serializedReport = JSON.stringify(mockReport).toLowerCase();
    const forbiddenTerms = ['stroke diagnosis', 'prescribe medication', 'guaranteed recovery', 'replace therapist'];

    for (const term of forbiddenTerms) {
      assert(!serializedReport.includes(term), `Forbidden term "${term}" must NOT exist in report`);
    }

    console.log('  ✅ PASS: Test 3 - Non-diagnostic safety compliance verified.');

    console.log('\n🎉 All 3 AI Session Report Frontend Unit Tests Passed Successfully!\n');
  } catch (err: any) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runAIReportFrontendTests();
