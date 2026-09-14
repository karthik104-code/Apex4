import { HardwareTelemetry } from '../types/rehab';
import { hardwareBridgeClient, HardwareBridgeStatus } from './hardwareBridge';
import { demoSimulatorAdapter } from './telemetry';

export type TelemetrySourceMode = 'REAL_HARDWARE' | 'DEMO_TELEMETRY';

export interface TelemetryManagerState {
  mode: TelemetrySourceMode;
  preset: 'normal' | 'fatigue' | 'high_compensation';
  telemetry: HardwareTelemetry;
  status: HardwareBridgeStatus;
  badgeLabel: string;
  badgeVariant: 'hardware' | 'demo' | 'offline';
}

export type TelemetryManagerListener = (state: TelemetryManagerState) => void;

class TelemetryManager {
  private mode: TelemetrySourceMode = 'DEMO_TELEMETRY';
  private preset: 'normal' | 'fatigue' | 'high_compensation' = 'normal';
  private listeners: Set<TelemetryManagerListener> = new Set();
  private status: HardwareBridgeStatus = hardwareBridgeClient.getStatus();

  private latestTelemetry: HardwareTelemetry = {
    force: 64,
    reactionTime: 1.24,
    reaction_time: 1.24,
    accuracy: 87,
    strikeConsistency: 82,
    consistency: 82,
    timestamp: new Date().toISOString(),
    mode: 'simulated',
    connectionStatus: 'simulated',
    leftForce: 0,
    rightForce: 0,
    rudder: 128,
    hardwareConnected: false,
    pedalsConnected: false,
    arduinoConnected: false,
    source: 'simulated',
  };

  constructor() {
    // Listen to hardware bridge status updates
    hardwareBridgeClient.subscribeStatus((newStatus) => {
      this.status = newStatus;
      if (newStatus.connected && this.mode !== 'REAL_HARDWARE') {
        // Auto-switch to REAL_HARDWARE if physical hardware connects
        this.mode = 'REAL_HARDWARE';
      } else if (!newStatus.connected && this.mode === 'REAL_HARDWARE') {
        // Transparent fallback to DEMO_TELEMETRY without pretending to be hardware
        this.mode = 'DEMO_TELEMETRY';
      }
      this.emitState();
    });

    // Listen to hardware bridge real-time telemetry frames
    hardwareBridgeClient.subscribeTelemetry((bridgeTel) => {
      if (this.mode === 'REAL_HARDWARE' && bridgeTel.source === 'hardware') {
        this.latestTelemetry = bridgeTel;
        this.emitState();
      }
    });

    // Dynamic simulation ticker for DEMO_TELEMETRY mode
    setInterval(async () => {
      if (this.mode === 'DEMO_TELEMETRY') {
        const demoTel = await demoSimulatorAdapter.getTelemetry();
        this.latestTelemetry = {
          force: demoTel.force,
          reactionTime: demoTel.reaction_time,
          reaction_time: demoTel.reaction_time,
          accuracy: demoTel.accuracy,
          strikeConsistency: demoTel.consistency,
          consistency: demoTel.consistency,
          timestamp: demoTel.timestamp,
          mode: 'simulated',
          connectionStatus: 'simulated',
          leftForce: 128,
          rightForce: 74,
          rudder: 120,
          hardwareConnected: false,
          pedalsConnected: false,
          arduinoConnected: false,
          source: 'simulated',
          profilePreset: this.preset,
        };
        this.emitState();
      }
    }, 500);
  }

  public getMode(): TelemetrySourceMode {
    return this.mode;
  }

  public setMode(newMode: TelemetrySourceMode) {
    this.mode = newMode;
    if (newMode === 'REAL_HARDWARE') {
      hardwareBridgeClient.connectHardware();
    }
    this.emitState();
  }

  public setPreset(preset: 'normal' | 'fatigue' | 'high_compensation') {
    this.preset = preset;
    demoSimulatorAdapter.setPreset(preset);
    this.emitState();
  }

  public getPreset() {
    return this.preset;
  }

  public getState(): TelemetryManagerState {
    let badgeLabel = '◌ APEX 4 Demo Telemetry';
    let badgeVariant: 'hardware' | 'demo' | 'offline' = 'demo';

    if (this.mode === 'REAL_HARDWARE') {
      if (this.status.connected) {
        badgeLabel = '● Hardware Connected';
        badgeVariant = 'hardware';
      } else {
        badgeLabel = '⚠ Hardware Offline (Demo Fallback)';
        badgeVariant = 'offline';
      }
    }

    return {
      mode: this.mode,
      preset: this.preset,
      telemetry: this.latestTelemetry,
      status: this.status,
      badgeLabel,
      badgeVariant,
    };
  }

  public subscribe(listener: TelemetryManagerListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitState() {
    const currentState = this.getState();
    this.listeners.forEach((fn) => fn(currentState));
  }
}

export const telemetryManager = new TelemetryManager();
