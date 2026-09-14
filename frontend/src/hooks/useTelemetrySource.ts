import { useState, useEffect, useCallback } from 'react';
import {
  telemetryManager,
  TelemetryManagerState,
  TelemetrySourceMode,
} from '../services/telemetryManager';

export function useTelemetrySource(): TelemetryManagerState & {
  setMode: (mode: TelemetrySourceMode) => void;
  setPreset: (preset: 'normal' | 'fatigue' | 'high_compensation') => void;
  toggleMode: () => void;
} {
  const [state, setState] = useState<TelemetryManagerState>(() =>
    telemetryManager.getState()
  );

  useEffect(() => {
    const unsubscribe = telemetryManager.subscribe(setState);
    return () => unsubscribe();
  }, []);

  const setMode = useCallback((newMode: TelemetrySourceMode) => {
    telemetryManager.setMode(newMode);
  }, []);

  const setPreset = useCallback((preset: 'normal' | 'fatigue' | 'high_compensation') => {
    telemetryManager.setPreset(preset);
  }, []);

  const toggleMode = useCallback(() => {
    const nextMode: TelemetrySourceMode =
      state.mode === 'REAL_HARDWARE' ? 'DEMO_TELEMETRY' : 'REAL_HARDWARE';
    telemetryManager.setMode(nextMode);
  }, [state.mode]);

  return {
    ...state,
    setMode,
    setPreset,
    toggleMode,
  };
}
