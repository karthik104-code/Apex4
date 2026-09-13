import { HardwareTelemetry } from '../types/rehab';
import {
  demoSimulatorAdapter,
  hardwareInterfaceAdapter,
  toLegacyTelemetry,
  validateTelemetryData,
  MSV1TelemetryData,
} from './telemetry';

export class MSV1HardwareService {
  private mode: 'simulated' | 'hardware' = 'simulated';

  public setMode(mode: 'simulated' | 'hardware') {
    this.mode = mode;
  }

  public setPreset(preset: 'normal' | 'fatigue' | 'high_compensation') {
    demoSimulatorAdapter.setPreset(preset);
  }

  public getMode(): 'simulated' | 'hardware' {
    return this.mode;
  }

  public async fetchLiveHardwareData(): Promise<HardwareTelemetry | null> {
    const data = await hardwareInterfaceAdapter.getTelemetry();
    if (data.connectionStatus === 'disconnected') {
      return null;
    }
    return toLegacyTelemetry(data);
  }

  public getSimulatedTelemetry(): HardwareTelemetry {
    if (this.mode === 'hardware') {
      return {
        force: 0,
        reactionTime: 0,
        accuracy: 0,
        strikeConsistency: 0,
        mode: 'hardware',
        connectionStatus: 'disconnected',
      };
    }

    // Synchronous snapshot from simulator
    const preset = demoSimulatorAdapter.getPreset();
    const noise = () => (Math.random() - 0.5) * 4;
    let force = 68;
    let reactionTime = 1.18;
    let accuracy = 89;
    let consistency = 86;

    if (preset === 'fatigue') {
      force = 52;
      reactionTime = 1.85;
      accuracy = 71;
      consistency = 64;
    } else if (preset === 'high_compensation') {
      force = 85;
      reactionTime = 1.42;
      accuracy = 68;
      consistency = 58;
    }

    const validated = validateTelemetryData({
      force: force + noise(),
      reaction_time: reactionTime + noise() * 0.04,
      accuracy: accuracy + noise(),
      consistency: consistency + noise(),
      timestamp: new Date().toISOString(),
      mode: 'SIMULATED',
      profilePreset: preset,
    });

    return toLegacyTelemetry(validated);
  }
}

export const msv1Hardware = new MSV1HardwareService();
export * from './telemetry';

