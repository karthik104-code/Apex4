import React from 'react';
import { Cpu, Sliders } from 'lucide-react';
import { HardwareTelemetry } from '../types/rehab';

interface TelemetryPanelProps {
  telemetry: HardwareTelemetry;
  onSelectPreset?: (preset: 'normal' | 'fatigue' | 'high_compensation') => void;
  onToggleMode?: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  onSelectPreset,
  onToggleMode,
}) => {
  const isHardware = telemetry.source === 'hardware' || telemetry.hardwareConnected;

  const renderStatusBadge = () => {
    if (telemetry.connectionStatus === 'connected' || isHardware) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#EAF8F1] text-[#22A06B] border border-emerald-200 text-[10px] font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
          Hardware Connected
        </span>
      );
    }
    if (telemetry.connectionStatus === 'disconnected') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#EF4444] border border-red-200 text-[10px] font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          Hardware Disconnected
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-[#EAF2FF] text-[#2563EB] border border-blue-200 text-[10px] font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
        Demo Telemetry
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#2563EB]" />
          <h3 className="font-bold text-base text-[#111827]">APEX 4 Performance</h3>
        </div>

        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="text-[11px] text-slate-500 hover:text-[#111827] underline font-medium ml-1"
            >
              Toggle Mode
            </button>
          )}
        </div>
      </div>

      {/* Main Actuator Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Force */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Actuator Force</span>
          <div className="text-xl font-black text-[#111827]">
            {telemetry.force}<span className="text-xs font-normal text-slate-500"> %</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#2563EB]" style={{ width: `${telemetry.force}%` }} />
          </div>
        </div>

        {/* Left Force */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Left Force</span>
          <div className="text-xl font-black text-[#111827]">
            {telemetry.leftForce ?? 0}<span className="text-xs font-normal text-slate-500"> / 255</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#2563EB]" style={{ width: `${Math.min(100, ((telemetry.leftForce ?? 0) / 255) * 100)}%` }} />
          </div>
        </div>

        {/* Right Force */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Right Force</span>
          <div className="text-xl font-black text-[#111827]">
            {telemetry.rightForce ?? 0}<span className="text-xs font-normal text-slate-500"> / 255</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#22A06B]" style={{ width: `${Math.min(100, ((telemetry.rightForce ?? 0) / 255) * 100)}%` }} />
          </div>
        </div>

        {/* Rudder */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Rudder Pos</span>
          <div className="text-xl font-black text-[#111827]">
            {telemetry.rudder ?? 128}<span className="text-xs font-normal text-slate-500"> / 255</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#7C6CE7]" style={{ width: `${Math.min(100, ((telemetry.rudder ?? 128) / 255) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Derived Session Event Performance Metrics */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {/* Reaction Time */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-slate-500 font-semibold">Reaction Time</span>
          <div className="text-lg font-bold text-[#111827] mt-1">
            {telemetry.reactionTime}<span className="text-xs font-normal text-slate-500"> s</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-slate-500 font-semibold">Strike Accuracy</span>
          <div className="text-lg font-bold text-[#22A06B] mt-1">
            {telemetry.accuracy}<span className="text-xs font-normal text-slate-500"> %</span>
          </div>
        </div>

        {/* Consistency */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-slate-500 font-semibold">Consistency</span>
          <div className="text-lg font-bold text-[#2563EB] mt-1">
            {telemetry.strikeConsistency}<span className="text-xs font-normal text-slate-500"> %</span>
          </div>
        </div>
      </div>

      {/* Mode Tagging Notice */}
      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-semibold text-slate-500">Data Source:</span>
        <span className="font-mono font-bold text-[#111827]">
          {isHardware ? 'PHYSICAL SENSOR (MSV1 HARDWARE)' : 'APEX 4 DEMO TELEMETRY'}
        </span>
      </div>

      {/* Preset Switcher for Demo Operator */}
      {onSelectPreset && !isHardware && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 flex items-center gap-1 font-medium">
            <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
            Demo Presets:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectPreset('normal')}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                telemetry.profilePreset === 'normal'
                  ? 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200'
                  : 'bg-white text-slate-600 border-[#E5E7EB] hover:bg-slate-50'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => onSelectPreset('fatigue')}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                telemetry.profilePreset === 'fatigue'
                  ? 'bg-[#FEF3C7] text-[#D97706] border-amber-200'
                  : 'bg-white text-slate-600 border-[#E5E7EB] hover:bg-slate-50'
              }`}
            >
              Fatigue
            </button>
            <button
              onClick={() => onSelectPreset('high_compensation')}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                telemetry.profilePreset === 'high_compensation'
                  ? 'bg-[#FEE2E2] text-[#EF4444] border-red-200'
                  : 'bg-white text-slate-600 border-[#E5E7EB] hover:bg-slate-50'
              }`}
            >
              Compensation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
