import {
  CompensationMetrics,
  HardwareTelemetry,
  RecordedSessionData,
  SessionSource,
} from '../types/rehab';
import { computeSensorFusionScore, ExtendedFusionScore } from './fusionEngine';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'completed' | 'invalid';

export interface SessionSnapshot {
  timestamp: string;
  telemetry: HardwareTelemetry;
  vision: CompensationMetrics;
  fusionScore: ExtendedFusionScore;
}

export class SessionRecorder {
  private state: RecordingState = 'idle';
  private sessionId: string | null = null;
  private startedAt: string | null = null;
  private endedAt: string | null = null;
  private source: SessionSource = 'demo';
  private snapshots: SessionSnapshot[] = [];
  private hardwareDisconnectOccurred: boolean = false;
  private accumulatedActiveMs: number = 0;
  private lastStateChangeTimestamp: number = 0;

  /**
   * Begins structured session recording.
   */
  startSession(source: SessionSource = 'demo', customSessionId?: string): string {
    const now = new Date();
    this.sessionId = customSessionId || `ses-${now.getTime()}`;
    this.startedAt = now.toISOString();
    this.endedAt = null;
    this.source = source;
    this.state = 'recording';
    this.snapshots = [];
    this.hardwareDisconnectOccurred = false;
    this.accumulatedActiveMs = 0;
    this.lastStateChangeTimestamp = now.getTime();
    return this.sessionId;
  }

  /**
   * Pauses active session recording.
   */
  pauseSession(): boolean {
    if (this.state !== 'recording') {
      return false;
    }
    const now = Date.now();
    this.accumulatedActiveMs += now - this.lastStateChangeTimestamp;
    this.lastStateChangeTimestamp = now;
    this.state = 'paused';
    return true;
  }

  /**
   * Resumes paused session recording.
   */
  resumeSession(): boolean {
    if (this.state !== 'paused') {
      return false;
    }
    const now = Date.now();
    this.lastStateChangeTimestamp = now;
    this.state = 'recording';
    return true;
  }

  /**
   * Accumulates a 1Hz telemetry + posture measurement snapshot.
   */
  recordSnapshot(
    telemetry: HardwareTelemetry,
    vision: CompensationMetrics,
    fusionScore?: ExtendedFusionScore
  ): boolean {
    if (this.state !== 'recording') {
      return false;
    }

    // Check for mid-session hardware disconnect
    if (this.source === 'hardware' && telemetry.hardwareConnected === false) {
      this.hardwareDisconnectOccurred = true;
    }

    const calculatedScore = fusionScore || computeSensorFusionScore(vision, telemetry);
    const snapshot: SessionSnapshot = {
      timestamp: new Date().toISOString(),
      telemetry: { ...telemetry },
      vision: { ...vision },
      fusionScore: calculatedScore,
    };

    this.snapshots.push(snapshot);
    return true;
  }

  /**
   * Ends session recording and builds structured session summary object.
   */
  endSession(): RecordedSessionData {
    const now = new Date();
    this.endedAt = now.toISOString();

    if (this.state === 'recording') {
      this.accumulatedActiveMs += now.getTime() - this.lastStateChangeTimestamp;
    }

    const durationSeconds = Math.max(0, Math.round(this.accumulatedActiveMs / 1000));

    // Handle invalid session (e.g. ended before start, or zero snapshots & duration)
    if (!this.sessionId || !this.startedAt || (this.snapshots.length === 0 && durationSeconds === 0)) {
      this.state = 'invalid';
      return {
        sessionId: this.sessionId || `ses-invalid-${Date.now()}`,
        startedAt: this.startedAt || now.toISOString(),
        endedAt: this.endedAt,
        durationSeconds: 0,
        telemetry: {
          force: 0,
          reactionTime: 0,
          accuracy: 0,
          strikeConsistency: 0,
          mode: 'simulated',
          source: this.source,
        },
        vision: {
          trunkLeanAngle: 0,
          trunkLeanLevel: 'low',
          shoulderHikeDisplacement: 0,
          shoulderHikeLevel: 'low',
          torsoRotationAngle: 0,
          torsoRotationLevel: 'low',
          overallStability: 0,
        },
        analytics: {
          movementQuality: 0,
          performanceScore: 0,
          combinedSessionScore: 0,
          compensationSummary: 'Session ended prematurely with insufficient recording data.',
        },
        source: this.source,
        status: 'invalid',
        sampleCount: 0,
      };
    }

    this.state = 'completed';

    // Compute aggregated telemetry averages across snapshots
    const sampleCount = this.snapshots.length;
    const latestSnapshot = this.snapshots[sampleCount - 1];

    let avgForce = 0;
    let avgRt = 0;
    let avgAcc = 0;
    let avgCons = 0;
    let maxLeftForce = 0;
    let maxRightForce = 0;
    let avgTrunkLean = 0;
    let avgShoulderHike = 0;
    let avgTorsoRot = 0;
    let avgStability = 0;

    if (sampleCount > 0) {
      for (const s of this.snapshots) {
        avgForce += s.telemetry.force || 0;
        avgRt += s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : (s.telemetry.reactionTime || 0);
        avgAcc += s.telemetry.accuracy || 0;
        avgCons += s.telemetry.consistency !== undefined ? s.telemetry.consistency : (s.telemetry.strikeConsistency || 0);
        maxLeftForce = Math.max(maxLeftForce, s.telemetry.leftForce || 0);
        maxRightForce = Math.max(maxRightForce, s.telemetry.rightForce || 0);

        avgTrunkLean += s.vision.trunkLeanAngle || 0;
        avgShoulderHike += s.vision.shoulderHikeDisplacement || 0;
        avgTorsoRot += s.vision.torsoRotationAngle || 0;
        avgStability += s.vision.overallStability || 0;
      }

      avgForce = Math.round(avgForce / sampleCount);
      avgRt = Number((avgRt / sampleCount).toFixed(2));
      avgAcc = Math.round(avgAcc / sampleCount);
      avgCons = Math.round(avgCons / sampleCount);
      avgTrunkLean = Number((avgTrunkLean / sampleCount).toFixed(1));
      avgShoulderHike = Number((avgShoulderHike / sampleCount).toFixed(3));
      avgTorsoRot = Number((avgTorsoRot / sampleCount).toFixed(1));
      avgStability = Math.round(avgStability / sampleCount);
    } else {
      const tel = latestSnapshot?.telemetry;
      avgForce = tel?.force || 0;
      avgRt = tel?.reactionTime || 1.2;
      avgAcc = tel?.accuracy || 85;
      avgCons = tel?.strikeConsistency || 85;
    }

    const aggregatedTelemetry: HardwareTelemetry = {
      ...latestSnapshot.telemetry,
      force: avgForce,
      reactionTime: avgRt,
      reaction_time: avgRt,
      accuracy: avgAcc,
      strikeConsistency: avgCons,
      consistency: avgCons,
      leftForce: maxLeftForce || latestSnapshot.telemetry.leftForce || 0,
      rightForce: maxRightForce || latestSnapshot.telemetry.rightForce || 0,
      rudder: latestSnapshot.telemetry.rudder !== undefined ? latestSnapshot.telemetry.rudder : 128,
      source: this.source,
      hardwareConnected: !this.hardwareDisconnectOccurred && latestSnapshot.telemetry.hardwareConnected,
    };

    const aggregatedVision: CompensationMetrics = {
      trunkLeanAngle: avgTrunkLean,
      trunkLeanLevel: latestSnapshot.vision.trunkLeanLevel || 'low',
      shoulderHikeDisplacement: avgShoulderHike,
      shoulderHikeLevel: latestSnapshot.vision.shoulderHikeLevel || 'low',
      torsoRotationAngle: avgTorsoRot,
      torsoRotationLevel: latestSnapshot.vision.torsoRotationLevel || 'low',
      overallStability: avgStability,
    };

    const finalAnalytics = computeSensorFusionScore(aggregatedVision, aggregatedTelemetry);

    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationSeconds,
      telemetry: aggregatedTelemetry,
      vision: aggregatedVision,
      analytics: finalAnalytics,
      source: this.source,
      status: 'completed',
      sampleCount,
    };
  }

  getRecordingState(): RecordingState {
    return this.state;
  }

  isHardwareDisconnected(): boolean {
    return this.hardwareDisconnectOccurred;
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

export const sessionRecorder = new SessionRecorder();
