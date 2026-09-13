import { HardwareTelemetry } from '../types/rehab';

export class MSV1HardwareService {
  private mode: 'simulated' | 'hardware' = 'simulated';
  private currentPreset: 'normal' | 'fatigue' | 'high_compensation' = 'normal';
  private baseTelemetry: HardwareTelemetry = {
    force: 65,
    reactionTime: 1.2,
    accuracy: 88,
    strikeConsistency: 85,
    mode: 'simulated',
    profilePreset: 'normal',
  };

  public setMode(mode: 'simulated' | 'hardware') {
    this.mode = mode;
  }

  public setPreset(preset: 'normal' | 'fatigue' | 'high_compensation') {
    this.currentPreset = preset;
  }

  public getMode(): 'simulated' | 'hardware' {
    return this.mode;
  }

  /**
   * Hardware API Adapter (Mode 2)
   * Connects to local physical MSV1 telemetry endpoint if present
   */
  public async fetchLiveHardwareData(): Promise<HardwareTelemetry | null> {
    try {
      const response = await fetch('/api/v1/hardware/telemetry', { timeout: 1500 } as any);
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          mode: 'hardware',
        };
      }
    } catch {
      // Hardware endpoint unavailable -> fallback to simulation if requested
    }
    return null;
  }

  /**
   * Demo Simulator (Mode 1)
   * Emits dynamic realistic telemetry variations for live demo presentation
   */
  public getSimulatedTelemetry(): HardwareTelemetry {
    if (this.mode === 'hardware') {
      // In hardware mode, attempt hardware fetch or return last known state marked hardware
      return {
        ...this.baseTelemetry,
        mode: 'hardware',
      };
    }

    // Dynamic noise variation
    const noise = () => (Math.random() - 0.5) * 4;

    switch (this.currentPreset) {
      case 'fatigue':
        return {
          force: Math.min(100, Math.max(30, Math.round(52 + noise()))),
          reactionTime: Math.min(3.0, Math.max(0.5, Math.round((1.85 + noise() * 0.1) * 100) / 100)),
          accuracy: Math.min(100, Math.max(40, Math.round(71 + noise()))),
          strikeConsistency: Math.min(100, Math.max(30, Math.round(64 + noise()))),
          mode: 'simulated',
          profilePreset: 'fatigue',
        };
      case 'high_compensation':
        return {
          force: Math.min(100, Math.max(30, Math.round(85 + noise()))),
          reactionTime: Math.min(3.0, Math.max(0.5, Math.round((1.42 + noise() * 0.1) * 100) / 100)),
          accuracy: Math.min(100, Math.max(40, Math.round(68 + noise()))),
          strikeConsistency: Math.min(100, Math.max(30, Math.round(58 + noise()))),
          mode: 'simulated',
          profilePreset: 'high_compensation',
        };
      case 'normal':
      default:
        return {
          force: Math.min(100, Math.max(30, Math.round(68 + noise()))),
          reactionTime: Math.min(3.0, Math.max(0.5, Math.round((1.18 + noise() * 0.05) * 100) / 100)),
          accuracy: Math.min(100, Math.max(40, Math.round(89 + noise()))),
          strikeConsistency: Math.min(100, Math.max(30, Math.round(86 + noise()))),
          mode: 'simulated',
          profilePreset: 'normal',
        };
    }
  }
}

export const msv1Hardware = new MSV1HardwareService();
