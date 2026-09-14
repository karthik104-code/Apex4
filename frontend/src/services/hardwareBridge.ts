import { HardwareTelemetry } from '../types/rehab';

export interface HardwareBridgeStatus {
  connected: boolean;
  pedalsConnected: boolean;
  arduinoConnected: boolean;
  port: string | null;
  mode: 'real' | 'demo';
  hidStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  arduinoStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  vendorId?: string;
  productId?: string;
}

export interface HardwareCalibrationData {
  calLeftMin: number;
  calLeftMax: number;
  calRightMin: number;
  calRightMax: number;
}

export interface HardwareDiagnosticsData {
  vendorId: string;
  productId: string;
  hidConnected: boolean;
  hidDevicesCount: number;
  arduinoConnected: boolean;
  selectedPort: string | null;
  availablePorts: string[];
  rawLeftForce: number;
  rawRightForce: number;
  rawRudder: number;
  packetsSent: number;
  lastPacketTimestamp: string | null;
}

export type TelemetryListener = (telemetry: HardwareTelemetry) => void;
export type StatusListener = (status: HardwareBridgeStatus) => void;

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    return `${window.location.origin}/api/hardware`;
  }
  return 'http://127.0.0.1:8000/api/hardware';
}

function getWsUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/hardware/ws`;
  }
  return 'ws://127.0.0.1:8000/api/hardware/ws';
}

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
    hidStatus: 'DISCONNECTED',
    arduinoStatus: 'DISCONNECTED',
    vendorId: '0x68E',
    productId: '0xF2',
  };

  private latestTelemetry: HardwareTelemetry | null = null;

  constructor() {
    this.connectWebSocket();
    // Periodic status sync
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        this.fetchStatus();
      }, 3000);
    }
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
      const res = await fetch(`${getApiBaseUrl()}/status`);
      if (res.ok) {
        const data = await res.json();
        this.updateStatus(data);
        return this.status;
      }
    } catch {
      // Backend offline -> demo status
    }
    return this.status;
  }

  public async listPorts(): Promise<string[]> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/ports`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to list COM ports:', err);
    }
    return ['COM5', 'COM4'];
  }

  public async connectHardware(port?: string, baudRate = 9600): Promise<HardwareBridgeStatus> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/connect`, {
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
      const res = await fetch(`${getApiBaseUrl()}/disconnect`, { method: 'POST' });
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

  public async getCalibration(): Promise<HardwareCalibrationData | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/calibration`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      return null;
    }
    return null;
  }

  public async setCalibration(cal: HardwareCalibrationData): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cal),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async calibrate(zeroLeft = 0, zeroRight = 0): Promise<boolean> {
    return this.setCalibration({
      calLeftMin: zeroLeft,
      calLeftMax: 255,
      calRightMin: zeroRight,
      calRightMax: 255,
    });
  }

  public async getDiagnostics(): Promise<HardwareDiagnosticsData | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/diagnostics`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      return null;
    }
    return null;
  }

  private connectWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }

    const wsUrl = getWsUrl();

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[APEX4] Hardware Bridge WebSocket connected:', wsUrl);
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
            rawLeftForce: raw.rawLeftForce ?? 0,
            rawRightForce: raw.rawRightForce ?? 0,
            rawRudder: raw.rawRudder ?? 128,
            leftForce: raw.leftForce ?? 0,
            rightForce: raw.rightForce ?? 0,
            rudder: raw.rudder ?? 128,
            hardwareConnected: raw.connected ?? false,
            pedalsConnected: raw.pedalsConnected ?? false,
            arduinoConnected: raw.arduinoConnected ?? false,
            hidStatus: raw.pedalsConnected ? 'CONNECTED' : 'DISCONNECTED',
            arduinoStatus: raw.arduinoConnected ? 'CONNECTED' : 'DISCONNECTED',
            port: raw.port ?? null,
            vendorId: raw.vendorId ?? '0x68E',
            productId: raw.productId ?? '0xF2',
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
            hidStatus: raw.pedalsConnected ? 'CONNECTED' : 'DISCONNECTED',
            arduinoStatus: raw.arduinoConnected ? 'CONNECTED' : 'DISCONNECTED',
            vendorId: raw.vendorId ?? '0x68E',
            productId: raw.productId ?? '0xF2',
          });
        } catch (err) {
          console.error('Error parsing hardware WebSocket packet:', err);
        }
      };

      socket.onclose = () => {
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        try { socket.close(); } catch (_) {}
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
      }, 3000);
    }
  }

  private updateStatus(newStatus: Partial<HardwareBridgeStatus>) {
    const updated: HardwareBridgeStatus = {
      ...this.status,
      ...newStatus,
      mode: (newStatus.pedalsConnected || newStatus.arduinoConnected) ? 'real' : (newStatus.mode || this.status.mode),
    };

    const changed =
      this.status.connected !== updated.connected ||
      this.status.pedalsConnected !== updated.pedalsConnected ||
      this.status.arduinoConnected !== updated.arduinoConnected ||
      this.status.mode !== updated.mode ||
      this.status.port !== updated.port;

    this.status = updated;
    if (changed) {
      this.statusListeners.forEach((fn) => fn({ ...this.status }));
    }
  }
}

export const hardwareBridgeClient = new APEX4HardwareBridgeClient();
