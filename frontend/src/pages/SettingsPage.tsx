import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Cpu, Camera, Volume2, Globe, Database, 
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Clock, Sliders,
  Zap, Compass, Activity, Terminal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { hardwareBridgeClient, HardwareDiagnosticsData, HardwareCalibrationData } from '../services/hardwareBridge';
import { voiceCommander } from '../services/voiceCommander';
import { COMPENSATORY_THRESHOLDS } from '../pose/compensation';
import { HudForceGauge } from '../components/HudForceGauge';
import { HardwareTelemetry } from '../types/rehab';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  
  // Hardware Connection & Port State
  const [hardwareStatus, setHardwareStatus] = useState({
    connected: false,
    pedalsConnected: false,
    arduinoConnected: false,
    port: null as string | null,
    mode: 'demo',
    hidStatus: 'DISCONNECTED',
    arduinoStatus: 'DISCONNECTED',
  });
  const [availablePorts, setAvailablePorts] = useState<string[]>(['COM5']);
  const [selectedPort, setSelectedPort] = useState<string>('COM5');
  const [isScanningPorts, setIsScanningPorts] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Live Telemetry Snapshot for HUD Preview
  const [liveTelemetry, setLiveTelemetry] = useState<HardwareTelemetry>({
    force: 0,
    reactionTime: 1.2,
    accuracy: 85,
    strikeConsistency: 85,
    mode: 'simulated',
    rawLeftForce: 0,
    rawRightForce: 0,
    rawRudder: 128,
    leftForce: 0,
    rightForce: 0,
    rudder: 128,
    pedalsConnected: false,
    arduinoConnected: false,
  });

  // Calibration Protocol State
  const [calibration, setCalibration] = useState<HardwareCalibrationData>({
    calLeftMin: 0,
    calLeftMax: 255,
    calRightMin: 0,
    calRightMax: 255,
  });
  const [calibrationSaved, setCalibrationSaved] = useState(false);

  // Hardware Diagnostics State
  const [diagnostics, setDiagnostics] = useState<HardwareDiagnosticsData | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Voice Settings State
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [voiceCooldown, setVoiceCooldown] = useState(8);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    // Initial fetch
    refreshHardwareStatus();
    loadPorts();
    loadCalibration();

    // Subscribe to live telemetry
    const unsubTelemetry = hardwareBridgeClient.subscribeTelemetry((tel) => {
      setLiveTelemetry(tel);
    });

    // Subscribe to status updates
    const unsubStatus = hardwareBridgeClient.subscribeStatus((st) => {
      setHardwareStatus({
        connected: st.connected,
        pedalsConnected: st.pedalsConnected,
        arduinoConnected: st.arduinoConnected,
        port: st.port,
        mode: st.mode,
        hidStatus: st.hidStatus,
        arduinoStatus: st.arduinoStatus,
      });
      if (st.port) setSelectedPort(st.port);
    });

    setVoiceEnabled(voiceCommander.isEnabled());

    const diagInterval = window.setInterval(() => {
      hardwareBridgeClient.getDiagnostics().then(setDiagnostics);
    }, 1500);

    return () => {
      unsubTelemetry();
      unsubStatus();
      window.clearInterval(diagInterval);
    };
  }, []);

  const refreshHardwareStatus = async () => {
    const status = await hardwareBridgeClient.fetchStatus();
    setHardwareStatus({
      connected: status.connected,
      pedalsConnected: status.pedalsConnected,
      arduinoConnected: status.arduinoConnected,
      port: status.port,
      mode: status.mode,
      hidStatus: status.hidStatus,
      arduinoStatus: status.arduinoStatus,
    });
  };

  const loadPorts = async () => {
    setIsScanningPorts(true);
    const ports = await hardwareBridgeClient.listPorts();
    setAvailablePorts(ports.length > 0 ? ports : ['COM5']);
    if (ports.length > 0 && !ports.includes(selectedPort)) {
      setSelectedPort(ports[0]);
    }
    setIsScanningPorts(false);
  };

  const loadCalibration = async () => {
    const cal = await hardwareBridgeClient.getCalibration();
    if (cal) setCalibration(cal);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await hardwareBridgeClient.connectHardware(selectedPort, 9600);
    await refreshHardwareStatus();
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    await hardwareBridgeClient.disconnectHardware();
    await refreshHardwareStatus();
  };

  const handleSetMinCalibration = async () => {
    const rawLeft = liveTelemetry.rawLeftForce ?? liveTelemetry.leftForce ?? 0;
    const rawRight = liveTelemetry.rawRightForce ?? liveTelemetry.rightForce ?? 0;
    const newCal: HardwareCalibrationData = {
      ...calibration,
      calLeftMin: rawLeft,
      calRightMin: rawRight,
    };
    setCalibration(newCal);
    await hardwareBridgeClient.setCalibration(newCal);
    setCalibrationSaved(true);
    setTimeout(() => setCalibrationSaved(false), 2000);
  };

  const handleSetMaxCalibration = async () => {
    const rawLeft = liveTelemetry.rawLeftForce ?? liveTelemetry.leftForce ?? 255;
    const rawRight = liveTelemetry.rawRightForce ?? liveTelemetry.rightForce ?? 255;
    const newCal: HardwareCalibrationData = {
      ...calibration,
      calLeftMax: rawLeft,
      calRightMax: rawRight,
    };
    setCalibration(newCal);
    await hardwareBridgeClient.setCalibration(newCal);
    setCalibrationSaved(true);
    setTimeout(() => setCalibrationSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">
              Hardware & System Configuration
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              AVAILABLE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Mantis Shrimp V1 / V23 hardware communication, serial COM configuration, live HUD gauges, and calibration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Hardware & Serial Port Management */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#2563EB]" />
              <h2 className="font-bold text-sm text-[#111827]">Mantis Shrimp Hardware Management</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                hardwareStatus.pedalsConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                HID: {hardwareStatus.pedalsConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                hardwareStatus.arduinoConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                ARDUINO: {hardwareStatus.arduinoConnected ? (hardwareStatus.port || 'COM5') : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Subsystem Connection Status */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <span className="font-bold text-slate-800 block">Mantis Shrimp HID Pedals</span>
                <span className="text-[11px] text-slate-500">VID: 0x68E | PID: 0xF2 (Non-blocking ~500Hz)</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                hardwareStatus.pedalsConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {hardwareStatus.pedalsConnected ? '● CONNECTED' : '○ DISCONNECTED'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <span className="font-bold text-slate-800 block">Arduino Actuator Controller</span>
                <span className="text-[11px] text-slate-500">9600 Baud | Packet: [255, Left, Right]</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                hardwareStatus.arduinoConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {hardwareStatus.arduinoConnected ? `● ${hardwareStatus.port || selectedPort}` : '○ OFFLINE'}
              </span>
            </div>
          </div>

          {/* COM Port Selection Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Arduino COM Port Assignment</span>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500"
              >
                {availablePorts.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <button
                onClick={loadPorts}
                disabled={isScanningPorts}
                className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-xs transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningPorts ? 'animate-spin' : ''}`} />
                <span>Scan Ports</span>
              </button>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                {isConnecting ? 'Connecting...' : 'Connect Port'}
              </button>
            </div>
          </div>

          {/* Diagnostic Toggle */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[#2563EB] font-bold hover:underline flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showDiagnostics ? 'Hide Hardware Diagnostics' : 'Show Hardware Diagnostics'}</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="text-slate-500 font-semibold hover:text-red-600 transition-colors"
            >
              Disconnect Handles
            </button>
          </div>

          {/* Diagnostic Output View */}
          {showDiagnostics && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 border border-slate-800">
              <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                <span>MANTIS SHRIMP DIAGNOSTIC SNAPSHOT</span>
                <span>VID: {diagnostics?.vendorId || '0x68E'} | PID: {diagnostics?.productId || '0xF2'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>HID Connected: <span className={diagnostics?.hidConnected ? 'text-emerald-400' : 'text-amber-400'}>{String(diagnostics?.hidConnected)}</span></div>
                <div>Arduino Connected: <span className={diagnostics?.arduinoConnected ? 'text-emerald-400' : 'text-amber-400'}>{String(diagnostics?.arduinoConnected)}</span></div>
                <div>Selected Port: <span className="text-blue-400">{diagnostics?.selectedPort || 'None'}</span></div>
                <div>Packets Streamed: <span className="text-blue-400">{diagnostics?.packetsSent ?? 0}</span></div>
                <div>Raw Left: <span className="text-yellow-400">{liveTelemetry.rawLeftForce ?? 0}</span></div>
                <div>Raw Right: <span className="text-yellow-400">{liveTelemetry.rawRightForce ?? 0}</span></div>
                <div>Raw Rudder: <span className="text-yellow-400">{liveTelemetry.rawRudder ?? 128}</span></div>
                <div>Mapped Force: <span className="text-cyan-400">{liveTelemetry.leftForce ?? 0}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Live HUD Force Gauge Preview & Calibration */}
        <div className="space-y-6">
          <HudForceGauge telemetry={liveTelemetry} showRaw={true} />

          {/* Calibration Protocol Panel (matching HUD) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-bold text-sm text-[#111827]">Hardware Calibration Protocol</h2>
              </div>
              {calibrationSaved && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-in fade-in">
                  CALIBRATION SAVED
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">LEFT PEDAL BOUNDS</span>
                <span className="font-mono text-sm font-bold text-slate-900 block mt-0.5">
                  {calibration.calLeftMin} - {calibration.calLeftMax}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">RIGHT PEDAL BOUNDS</span>
                <span className="font-mono text-sm font-bold text-slate-900 block mt-0.5">
                  {calibration.calRightMin} - {calibration.calRightMax}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSetMinCalibration}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all"
              >
                Set Min (Resting)
              </button>

              <button
                onClick={handleSetMaxCalibration}
                className="flex-1 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                Set Max (Full Press)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
