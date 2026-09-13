import { HardwareTelemetry } from '../../types/rehab';

export type TelemetryMode = 'SIMULATED' | 'LIVE HARDWARE';

export interface MSV1TelemetryData {
  force: number;          // 0 - 100 (% or N)
  reaction_time: number;  // seconds (e.g. 1.24)
  accuracy: number;       // 0 - 100 (%)
  consistency: number;    // 0 - 100 (%)
  timestamp: string;      // ISO 8601 string
  mode: TelemetryMode;
  connectionStatus: 'connected' | 'disconnected' | 'simulated';
  profilePreset?: 'normal' | 'fatigue' | 'high_compensation';
}

export interface IMSV1HardwareAdapter {
  getMode(): TelemetryMode;
  getTelemetry(): Promise<MSV1TelemetryData>;
  subscribe(callback: (data: MSV1TelemetryData) => void, intervalMs?: number): () => void;
}

/**
 * Validates and sanitizes raw or untrusted telemetry data.
 * Gracefully handles malformed, partial, NaN, string-encoded, or null input payloads.
 */
export function validateTelemetryData(input: unknown): MSV1TelemetryData {
  const fallbackTimestamp = new Date().toISOString();

  if (!input || typeof input !== 'object') {
    return {
      force: 50,
      reaction_time: 1.5,
      accuracy: 75,
      consistency: 75,
      timestamp: fallbackTimestamp,
      mode: 'SIMULATED',
      connectionStatus: 'simulated',
    };
  }

  const raw = input as Record<string, any>;

  const parseBoundedNumber = (val: any, defaultVal: number, min = 0, max = 100): number => {
    if (val === null || val === undefined) return defaultVal;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num) || !isFinite(num)) return defaultVal;
    return Math.min(max, Math.max(min, Math.round(num * 100) / 100));
  };

  const force = parseBoundedNumber(raw.force, 65, 0, 100);
  
  // Accept reaction_time or reactionTime
  const rawReaction = raw.reaction_time !== undefined ? raw.reaction_time : raw.reactionTime;
  const reaction_time = parseBoundedNumber(rawReaction, 1.2, 0.1, 10.0);

  const accuracy = parseBoundedNumber(raw.accuracy, 85, 0, 100);

  // Accept consistency or strikeConsistency
  const rawConsistency = raw.consistency !== undefined ? raw.consistency : raw.strikeConsistency;
  const consistency = parseBoundedNumber(rawConsistency, 80, 0, 100);

  const rawTimestamp = typeof raw.timestamp === 'string' && raw.timestamp.trim() !== '' 
    ? raw.timestamp 
    : fallbackTimestamp;

  const mode: TelemetryMode = raw.mode === 'LIVE HARDWARE' || raw.mode === 'hardware' 
    ? 'LIVE HARDWARE' 
    : 'SIMULATED';

  const connectionStatus = mode === 'LIVE HARDWARE' 
    ? (raw.connectionStatus || 'connected') 
    : 'simulated';

  return {
    force,
    reaction_time,
    accuracy,
    consistency,
    timestamp: rawTimestamp,
    mode,
    connectionStatus,
    profilePreset: raw.profilePreset,
  };
}

/**
 * Adapter 1 — Demo Simulator Adapter
 * Produces dynamic, realistic MSV1 actuator telemetry for hackathon demonstrations.
 */
export class DemoSimulatorAdapter implements IMSV1HardwareAdapter {
  private preset: 'normal' | 'fatigue' | 'high_compensation' = 'normal';

  public setPreset(preset: 'normal' | 'fatigue' | 'high_compensation') {
    this.preset = preset;
  }

  public getPreset() {
    return this.preset;
  }

  public getMode(): TelemetryMode {
    return 'SIMULATED';
  }

  public async getTelemetry(): Promise<MSV1TelemetryData> {
    const noise = () => (Math.random() - 0.5) * 4;
    const now = new Date().toISOString();

    let force = 68;
    let reactionTime = 1.18;
    let accuracy = 89;
    let consistency = 86;

    if (this.preset === 'fatigue') {
      force = 52;
      reactionTime = 1.85;
      accuracy = 71;
      consistency = 64;
    } else if (this.preset === 'high_compensation') {
      force = 85;
      reactionTime = 1.42;
      accuracy = 68;
      consistency = 58;
    }

    return validateTelemetryData({
      force: force + noise(),
      reaction_time: reactionTime + noise() * 0.04,
      accuracy: accuracy + noise(),
      consistency: consistency + noise(),
      timestamp: now,
      mode: 'SIMULATED',
      connectionStatus: 'simulated',
      profilePreset: this.preset,
    });
  }

  public subscribe(callback: (data: MSV1TelemetryData) => void, intervalMs = 1000): () => void {
    const timer = setInterval(async () => {
      const data = await this.getTelemetry();
      callback(data);
    }, intervalMs);

    return () => clearInterval(timer);
  }
}

/**
 * Adapter 2 — Hardware Interface Adapter
 * Clean interface abstraction to receive real physical MSV1 hardware data (via HTTP REST, WebSockets, or Web Serial).
 */
export class HardwareInterfaceAdapter implements IMSV1HardwareAdapter {
  private endpoint: string;

  constructor(endpoint = '/api/v1/hardware/telemetry') {
    this.endpoint = endpoint;
  }

  public getMode(): TelemetryMode {
    return 'LIVE HARDWARE';
  }

  public async getTelemetry(): Promise<MSV1TelemetryData> {
    try {
      const response = await fetch(this.endpoint, {
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const rawJson = await response.json();
        return validateTelemetryData({
          ...rawJson,
          mode: 'LIVE HARDWARE',
          connectionStatus: 'connected',
        });
      }
    } catch {
      // Endpoint unavailable -> return disconnected status marked LIVE HARDWARE
    }

    return {
      force: 0,
      reaction_time: 0,
      accuracy: 0,
      consistency: 0,
      timestamp: new Date().toISOString(),
      mode: 'LIVE HARDWARE',
      connectionStatus: 'disconnected',
    };
  }

  public subscribe(callback: (data: MSV1TelemetryData) => void, intervalMs = 1000): () => void {
    const timer = setInterval(async () => {
      const data = await this.getTelemetry();
      callback(data);
    }, intervalMs);

    return () => clearInterval(timer);
  }
}

// Global Singleton Exports
export const demoSimulatorAdapter = new DemoSimulatorAdapter();
export const hardwareInterfaceAdapter = new HardwareInterfaceAdapter();

/**
 * Convert MSV1TelemetryData to legacy HardwareTelemetry for backwards compatibility.
 */
export function toLegacyTelemetry(data: MSV1TelemetryData): HardwareTelemetry {
  return {
    force: data.force,
    reactionTime: data.reaction_time,
    reaction_time: data.reaction_time,
    accuracy: data.accuracy,
    strikeConsistency: data.consistency,
    consistency: data.consistency,
    timestamp: data.timestamp,
    mode: data.mode === 'LIVE HARDWARE' ? 'hardware' : 'simulated',
    profilePreset: data.profilePreset,
    connectionStatus: data.connectionStatus,
  };
}
