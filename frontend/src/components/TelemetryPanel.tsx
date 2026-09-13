import React from 'react';
import { Gauge, Zap, Target, Sliders, Cpu, CheckCircle2 } from 'lucide-react';
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
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-accent-blue" />
          <h3 className="font-bold text-sm text-slate-100">MSV1 Foot Actuator Telemetry</h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
              telemetry.mode === 'hardware'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-primary-500/20 text-primary-300 border-primary-500/40'
            }`}
          >
            {telemetry.mode === 'hardware' ? 'Physical MSV1 Live' : 'MSV1 Demo Telemetry'}
          </span>
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline font-medium"
            >
              Toggle API Mode
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Force */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Actuator Force</span>
          <div className="text-xl font-extrabold text-slate-100">
            {telemetry.force} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-accent-blue transition-all" style={{ width: `${telemetry.force}%` }} />
          </div>
        </div>

        {/* Reaction Time */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Reaction Time</span>
          <div className="text-xl font-extrabold text-slate-100">
            {telemetry.reactionTime} <span className="text-xs font-normal text-slate-400">s</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-accent-purple transition-all"
              style={{ width: `${Math.max(10, Math.min(100, (3.0 - telemetry.reactionTime) * 40))}%` }}
            />
          </div>
        </div>

        {/* Target Accuracy */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Strike Accuracy</span>
          <div className="text-xl font-extrabold text-slate-100">
            {telemetry.accuracy} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${telemetry.accuracy}%` }} />
          </div>
        </div>

        {/* Strike Consistency */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Strike Consistency</span>
          <div className="text-xl font-extrabold text-slate-100">
            {telemetry.strikeConsistency} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${telemetry.strikeConsistency}%` }} />
          </div>
        </div>
      </div>

      {/* Preset Switcher for Demo Operator */}
      {onSelectPreset && telemetry.mode === 'simulated' && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sliders className="w-3.5 h-3.5 text-primary-400" />
            Demo Telemetry Presets:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectPreset('normal')}
              className={`px-3 py-1 rounded-xl font-semibold border transition-all ${
                telemetry.profilePreset === 'normal'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Normal Session
            </button>
            <button
              onClick={() => onSelectPreset('fatigue')}
              className={`px-3 py-1 rounded-xl font-semibold border transition-all ${
                telemetry.profilePreset === 'fatigue'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Fatigue Pattern
            </button>
            <button
              onClick={() => onSelectPreset('high_compensation')}
              className={`px-3 py-1 rounded-xl font-semibold border transition-all ${
                telemetry.profilePreset === 'high_compensation'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              High Compensation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
