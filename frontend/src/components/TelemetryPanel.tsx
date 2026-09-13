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
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#2563EB]" />
          <h3 className="font-bold text-base text-[#111827]">APEX 4 Performance</h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
              telemetry.mode === 'LIVE HARDWARE' || telemetry.mode === 'hardware'
                ? telemetry.connectionStatus === 'disconnected'
                  ? 'bg-[#FEE2E2] text-[#EF4444] border-red-200'
                  : 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200'
                : 'bg-[#EAF2FF] text-[#2563EB] border-blue-200'
            }`}
          >
            {telemetry.mode === 'LIVE HARDWARE' || telemetry.mode === 'hardware'
              ? telemetry.connectionStatus === 'disconnected'
                ? 'LIVE HARDWARE (OFFLINE)'
                : 'LIVE HARDWARE'
              : 'SIMULATED TELEMETRY'}
          </span>
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="text-[11px] text-slate-500 hover:text-[#111827] underline font-medium"
            >
              Toggle API Mode
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid with Clean Typography */}
      <div className="grid grid-cols-2 gap-4">
        {/* Force */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-xs text-slate-500 font-semibold block">Actuator Force</span>
          <div className="text-2xl font-black text-[#111827]">
            {telemetry.force}<span className="text-sm font-normal text-slate-500"> %</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#2563EB]" style={{ width: `${telemetry.force}%` }} />
          </div>
        </div>

        {/* Reaction Time */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-xs text-slate-500 font-semibold block">Reaction Time</span>
          <div className="text-2xl font-black text-[#111827]">
            {telemetry.reactionTime}<span className="text-sm font-normal text-slate-500"> s</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#7C6CE7]"
              style={{ width: `${Math.max(10, Math.min(100, (3.0 - telemetry.reactionTime) * 40))}%` }}
            />
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-xs text-slate-500 font-semibold block">Accuracy</span>
          <div className="text-2xl font-black text-[#111827]">
            {telemetry.accuracy}<span className="text-sm font-normal text-slate-500"> %</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#22A06B]" style={{ width: `${telemetry.accuracy}%` }} />
          </div>
        </div>

        {/* Consistency */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <span className="text-xs text-slate-500 font-semibold block">Consistency</span>
          <div className="text-2xl font-black text-[#111827]">
            {telemetry.strikeConsistency}<span className="text-sm font-normal text-slate-500"> %</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#2563EB]" style={{ width: `${telemetry.strikeConsistency}%` }} />
          </div>
        </div>
      </div>

      {/* Preset Switcher for Demo Operator */}
      {onSelectPreset && telemetry.mode === 'simulated' && (
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 text-xs">
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
