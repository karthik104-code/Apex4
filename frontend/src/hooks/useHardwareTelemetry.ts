import { useState, useEffect, useCallback } from 'react';
import { HardwareTelemetry } from '../types/rehab';
import { hardwareBridgeClient, HardwareBridgeStatus } from '../services/hardwareBridge';

export interface UseHardwareTelemetryResult {
  telemetry: HardwareTelemetry;
  status: HardwareBridgeStatus;
  isReconnecting: boolean;
  connectHardware: (port?: string, baudRate?: number) => Promise<HardwareBridgeStatus>;
  disconnectHardware: () => Promise<HardwareBridgeStatus>;
  calibrate: (zeroLeft?: number, zeroRight?: number) => Promise<boolean>;
}

export function useHardwareTelemetry(): UseHardwareTelemetryResult {
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>(() => {
    return (
      hardwareBridgeClient.getLatestTelemetry() || {
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
      }
    );
  });

  const [status, setStatus] = useState<HardwareBridgeStatus>(() =>
    hardwareBridgeClient.getStatus()
  );

  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Subscribe to telemetry WebSocket feed
    const unsubTelemetry = hardwareBridgeClient.subscribeTelemetry((newTelemetry) => {
      setTelemetry(newTelemetry);
      setIsReconnecting(false);
    });

    // Subscribe to bridge connection status changes
    const unsubStatus = hardwareBridgeClient.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubTelemetry();
      unsubStatus();
    };
  }, []);

  const connectHardware = useCallback(async (port?: string, baudRate = 9600) => {
    return await hardwareBridgeClient.connectHardware(port, baudRate);
  }, []);

  const disconnectHardware = useCallback(async () => {
    return await hardwareBridgeClient.disconnectHardware();
  }, []);

  const calibrate = useCallback(async (zeroLeft = 0, zeroRight = 0) => {
    return await hardwareBridgeClient.calibrate(zeroLeft, zeroRight);
  }, []);

  return {
    telemetry,
    status,
    isReconnecting,
    connectHardware,
    disconnectHardware,
    calibrate,
  };
}
