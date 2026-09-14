import React, { useState, useEffect } from 'react';
import { hardwareBridgeClient } from '../services/hardwareBridge';
import { HardwareTelemetry } from '../types/rehab';
import { Cpu, Activity, Settings2, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const HardwareHUDPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>({
    hardwareConnected: false,
    pedalsConnected: false,
    arduinoConnected: false,
    leftForce: 0,
    rightForce: 0,
    rudder: 0,
    force: 0,
    reactionTime: 0,
    accuracy: 0,
    strikeConsistency: 0,
    mode: 'simulated'
  });

  const [calLeftMin, setCalLeftMin] = useState(0);
  const [calLeftMax, setCalLeftMax] = useState(255);
  const [calRightMin, setCalRightMin] = useState(0);
  const [calRightMax, setCalRightMax] = useState(255);

  useEffect(() => {
    const unsubscribe = hardwareBridgeClient.subscribeTelemetry((liveData) => {
      setTelemetry(liveData as any);
    });
    return () => unsubscribe();
  }, []);

  const handleSetMin = () => {
    setCalLeftMin(telemetry.leftForce || 0);
    setCalRightMin(telemetry.rightForce || 0);
  };

  const handleSetMax = () => {
    setCalLeftMax(telemetry.leftForce || 255);
    setCalRightMax(telemetry.rightForce || 255);
  };

  const mapValue = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    if (inMax - inMin === 0) return outMin;
    const mapped = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    return Math.max(outMin, Math.min(outMax, Math.round(mapped)));
  };

  const mappedLeft = mapValue(telemetry.leftForce || 0, calLeftMin, calLeftMax, 0, 255);
  const mappedRight = mapValue(telemetry.rightForce || 0, calRightMin, calRightMax, 0, 255);
  const mappedRudder = mapValue(telemetry.rudder || 0, 0, 255, 0, 255);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">
              Hardware Diagnostics HUD
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              MAINTENANCE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Mantis Shrimp V23 raw sensor telemetry and calibration interface.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Gauges */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs flex flex-col items-center justify-center space-y-8 min-h-[400px]">
          <div className="text-center space-y-2">
            <span className="text-sm font-bold text-slate-500 tracking-widest uppercase">Force Output</span>
            <div className="text-7xl font-black text-[#111827] tracking-tighter">
              {mappedLeft}
            </div>
            <div className="w-64 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-75"
                style={{ width: `${(mappedLeft / 255) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between w-full max-w-sm px-4">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Strike (Right Pedal)</span>
              <div className="text-3xl font-bold text-slate-700 font-mono">{mappedRight}</div>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Position (Rudder)</span>
              <div className="text-3xl font-bold text-slate-700 font-mono">{mappedRudder}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 pt-6 border-t border-slate-100 w-full justify-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${telemetry.arduinoConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-semibold text-slate-600">Arduino Actuator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${telemetry.pedalsConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-semibold text-slate-600">HID Pedals</span>
            </div>
          </div>
        </div>

        {/* Calibration Protocol */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-sm text-[#111827]">Calibration Protocol</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Left Sensor Bounds</span>
                  <div className="font-mono text-sm font-semibold text-slate-700">
                    {calLeftMin} <span className="text-slate-400">→</span> {calLeftMax}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Right Sensor Bounds</span>
                  <div className="font-mono text-sm font-semibold text-slate-700">
                    {calRightMin} <span className="text-slate-400">→</span> {calRightMax}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="secondary" onClick={handleSetMin} className="flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                  Set Minimum (Rest)
                </Button>
                <Button variant="primary" onClick={handleSetMax} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                  Set Maximum (Full Load)
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-sm text-[#111827]">Raw Data Stream</h2>
            </div>
            
            <div className="space-y-2 font-mono text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span>RAW_LEFT:</span>
                <span className="font-bold text-slate-900">{telemetry.leftForce || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>RAW_RIGHT:</span>
                <span className="font-bold text-slate-900">{telemetry.rightForce || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>RAW_RUDDER:</span>
                <span className="font-bold text-slate-900">{telemetry.rudder || 0}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span>FUSION_PCT:</span>
                <span className="font-bold text-blue-600">{telemetry.force || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
