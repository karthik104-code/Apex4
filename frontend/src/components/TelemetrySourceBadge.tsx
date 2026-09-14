import React, { useState } from 'react';
import { Cpu, ChevronDown, Check, Zap, Sliders } from 'lucide-react';
import { useTelemetrySource } from '../hooks/useTelemetrySource';

export const TelemetrySourceBadge: React.FC = () => {
  const { mode, badgeLabel, badgeVariant, setMode, preset, setPreset } = useTelemetrySource();
  const [isOpen, setIsOpen] = useState(false);

  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'hardware':
        return 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200 hover:bg-emerald-100/60';
      case 'offline':
        return 'bg-[#FEF3C7] text-[#D97706] border-amber-200 hover:bg-amber-100/60';
      case 'demo':
      default:
        return 'bg-[#EAF2FF] text-[#2563EB] border-blue-200 hover:bg-blue-100/60';
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs ${getBadgeStyle()}`}
        title="Click to switch between Real Hardware and Demo Telemetry mode"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            badgeVariant === 'hardware'
              ? 'bg-[#22A06B] animate-pulse'
              : badgeVariant === 'offline'
              ? 'bg-[#F59E0B] animate-pulse'
              : 'bg-[#2563EB]'
          }`}
        />
        <span>{badgeLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-2 z-50 text-xs">
          <div className="px-3 py-2 border-b border-slate-100 font-bold text-[#111827] flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#2563EB]" />
            <span>APEX 4 Telemetry Source</span>
          </div>

          <div className="py-1 space-y-1">
            {/* Real Hardware Option */}
            <button
              onClick={() => {
                setMode('REAL_HARDWARE');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${
                mode === 'REAL_HARDWARE'
                  ? 'bg-[#EAF8F1] text-[#22A06B] font-bold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22A06B]" />
                <div>
                  <span className="block font-semibold">Real Hardware Bridge</span>
                  <span className="text-[10px] text-slate-500 font-normal">FastAPI + HID/Serial</span>
                </div>
              </div>
              {mode === 'REAL_HARDWARE' && <Check className="w-4 h-4 text-[#22A06B]" />}
            </button>

            {/* Demo Telemetry Option */}
            <button
              onClick={() => {
                setMode('DEMO_TELEMETRY');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${
                mode === 'DEMO_TELEMETRY'
                  ? 'bg-[#EAF2FF] text-[#2563EB] font-bold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <div>
                  <span className="block font-semibold">APEX 4 Demo Telemetry</span>
                  <span className="text-[10px] text-slate-500 font-normal">Smooth Realistic Simulator</span>
                </div>
              </div>
              {mode === 'DEMO_TELEMETRY' && <Check className="w-4 h-4 text-[#2563EB]" />}
            </button>
          </div>

          {/* Demo Presets Sub-Selector */}
          {mode === 'DEMO_TELEMETRY' && (
            <div className="mt-2 pt-2 border-t border-slate-100 px-2 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#2563EB]" />
                Demo Profile Preset:
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setPreset('normal')}
                  className={`py-1 rounded text-[11px] font-bold text-center border ${
                    preset === 'normal'
                      ? 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setPreset('fatigue')}
                  className={`py-1 rounded text-[11px] font-bold text-center border ${
                    preset === 'fatigue'
                      ? 'bg-[#FEF3C7] text-[#D97706] border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Fatigue
                </button>
                <button
                  onClick={() => setPreset('high_compensation')}
                  className={`py-1 rounded text-[11px] font-bold text-center border ${
                    preset === 'high_compensation'
                      ? 'bg-[#FEE2E2] text-[#EF4444] border-red-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Comp
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
