import { HardwareTelemetry } from '../types/rehab';

export interface HardwareBridgeStatus {
  connected: boolean;
  pedalsConnected: boolean;
  arduinoConnected: boolean;
  port: string | null;
  mode: 'real' | 'demo';
}

export type TelemetryListener = (telemetry: HardwareTelemetry) => void;
export type StatusListener = (status: HardwareBridgeStatus) => void;

class APEX4HardwareBridgeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private telemetryListeners: Set<TelemetryListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  private status: HardwareBridgeStatus = {
    connected: false,
    pedalsConnected: false,
    arduinoConnected: false,
    port: null,
    mode: 'demo',
  };

  private latestTelemetry: HardwareTelemetry | null = null;

  constructor() {
    // Auto-connect WebSocket on initialization
    this.connectWebSocket();
  }

  public getStatus(): HardwareBridgeStatus {
    return { ...this.status };
  }

  public getLatestTelemetry(): HardwareTelemetry | null {
    return this.latestTelemetry;
  }

  public subscribeTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    if (this.latestTelemetry) {
      listener(this.latestTelemetry);
    }
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({ ...this.status });
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public async fetchStatus(): Promise<HardwareBridgeStatus> {
    try {
      const res = await fetch('/api/v1/hardware/status');
      if (res.ok) {
        const data = await res.json();
        this.updateStatus(data);
        return this.status;
      }
    } catch {
      // Endpoint offline -> demo status
    }
    this.updateStatus({
      connected: false,
      pedalsConnected: false,
      arduinoConnected: false,
      port: null,
      mode: 'demo',
    });
    return this.status;
  }

  public async connectHardware(port?: string, baudRate = 9600): Promise<HardwareBridgeStatus> {
    try {
      const res = await fetch('/api/v1/hardware/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, baudRate }),
      });
      if (res.ok) {
        const data = await res.json();
        this.updateStatus(data);
        return this.status;
      }
    } catch (err) {
      console.warn('Hardware connect request failed:', err);
    }
    return this.status;
  }

  public async disconnectHardware(): Promise<HardwareBridgeStatus> {
    try {
      const res = await fetch('/api/v1/hardware/disconnect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        this.updateStatus(data);
        return this.status;
      }
    } catch (err) {
      console.warn('Hardware disconnect request failed:', err);
    }
    return this.status;
  }

  public async calibrate(zeroLeft = 0, zeroRight = 0): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/hardware/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zeroLeft, zeroRight }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private connectWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/api/v1/hardware/ws`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('APEX 4 Hardware Bridge WebSocket connected.');
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const telemetry: HardwareTelemetry = {
            force: raw.force ?? 64,
            reactionTime: raw.reactionTime ?? 1.24,
            reaction_time: raw.reactionTime ?? 1.24,
            accuracy: raw.accuracy ?? 87,
            strikeConsistency: raw.strikeConsistency ?? 82,
            consistency: raw.strikeConsistency ?? 82,
            timestamp: raw.timestamp || new Date().toISOString(),
            mode: raw.source === 'hardware' ? 'hardware' : 'simulated',
            connectionStatus: raw.connected ? 'connected' : 'simulated',
            leftForce: raw.leftForce ?? 0,
            rightForce: raw.rightForce ?? 0,
            rudder: raw.rudder ?? 0,
            hardwareConnected: raw.connected ?? false,
            pedalsConnected: raw.pedalsConnected ?? false,
            arduinoConnected: raw.arduinoConnected ?? false,
            source: raw.source ?? 'simulated',
          };

          this.latestTelemetry = telemetry;
          this.telemetryListeners.forEach((fn) => fn(telemetry));

          this.updateStatus({
            connected: raw.connected ?? false,
            pedalsConnected: raw.pedalsConnected ?? false,
            arduinoConnected: raw.arduinoConnected ?? false,
            port: raw.port ?? null,
            mode: raw.source === 'hardware' ? 'real' : 'demo',
          });
        } catch (err) {
          console.error('Error parsing hardware WebSocket frame:', err);
        }
      };

      socket.onclose = () => {
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        socket.close();
      };

      this.ws = socket;
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connectWebSocket();
      }, 5000);
    }
  }

  private updateStatus(newStatus: HardwareBridgeStatus) {
    const changed =
      this.status.connected !== newStatus.connected ||
      this.status.pedalsConnected !== newStatus.pedalsConnected ||
      this.status.arduinoConnected !== newStatus.arduinoConnected ||
      this.status.mode !== newStatus.mode;

    this.status = newStatus;
    if (changed) {
      this.statusListeners.forEach((fn) => fn({ ...this.status }));
    }
  }
}

export const hardwareBridgeClient = new APEX4HardwareBridgeClient();
