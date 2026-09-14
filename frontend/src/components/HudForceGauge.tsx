import React from 'react';
import { Cpu, ShieldCheck, Activity, Compass } from 'lucide-react';
import { HardwareTelemetry } from '../types/rehab';

interface HudForceGaugeProps {
  telemetry: HardwareTelemetry;
  showRaw?: boolean;
}

const SEGMENT_COUNT = 20;

export const HudForceGauge: React.FC<HudForceGaugeProps> = ({
  telemetry,
  showRaw = true,
}) => {
  const leftVal = telemetry.leftForce ?? Math.round((telemetry.force / 100) * 255);
  const rightVal = telemetry.rightForce ?? 0;
  const rudderVal = telemetry.rudder ?? 128;

  const rawLeft = telemetry.rawLeftForce ?? leftVal;
  const rawRight = telemetry.rawRightForce ?? rightVal;
  const rawRudder = telemetry.rawRudder ?? rudderVal;

  const isReal = telemetry.source === 'hardware' || telemetry.hardwareConnected;
  const activeSegments = Math.min(SEGMENT_COUNT, Math.max(0, Math.round((leftVal / 255.0) * SEGMENT_COUNT)));

  // SVG Radial Gauge coordinates
  const radius = 95;
  const center = 120;
  const startAngle = 135; // degrees
  const sweepAngle = 270; // degrees
  const segAngle = sweepAngle / SEGMENT_COUNT;

  const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    const angle = startAngle + i * segAngle;
    const rad = (angle * Math.PI) / 180;
    const x1 = center + (radius - 12) * Math.cos(rad);
    const y1 = center + (radius - 12) * Math.sin(rad);
    const x2 = center + radius * Math.cos(rad);
    const y2 = center + radius * Math.sin(rad);
    const isActive = i < activeSegments;

    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      isActive,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col items-center justify-between relative overflow-hidden">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 tracking-tight">
          <Cpu className="w-4 h-4 text-[#2563EB]" />
          <span>MANTIS SHRIMP V1 / V23 HUD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
            telemetry.pedalsConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            HID: {telemetry.pedalsConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
            telemetry.arduinoConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            ARDUINO: {telemetry.arduinoConnected ? (telemetry.port || 'COM5') : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Main Dial Area */}
      <div className="relative w-full flex items-center justify-center my-2">
        <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible">
          {/* Outer Border Circle */}
          <circle cx={center} cy={center} r={radius + 8} fill="none" stroke="#F1F5F9" strokeWidth="2" />
          
          {/* Segments */}
          {segments.map((s) => (
            <line
              key={s.id}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={s.isActive ? '#2563EB' : '#E2E8F0'}
              strokeWidth="5"
              strokeLinecap="round"
              className="transition-colors duration-75"
            />
          ))}
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LEFT FORCE</span>
          <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">{leftVal}</span>
          <span className="text-[10px] font-semibold text-[#2563EB] mt-0.5">
            {Math.round((leftVal / 255) * 100)}% OUTPUT
          </span>
        </div>
      </div>

      {/* 3 Pods: Left Force | Right Strike | Rudder Position */}
      <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
        {/* Pod 1: Left */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">FORCE (L)</span>
          <span className="text-lg font-black text-slate-900 font-mono block">{leftVal}</span>
          {showRaw && (
            <span className="text-[9px] text-slate-400 block font-mono">Raw: {rawLeft}</span>
          )}
        </div>

        {/* Pod 2: Right / Strike */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">STRIKE (R)</span>
          <span className="text-lg font-black text-slate-900 font-mono block">{rightVal}</span>
          {showRaw && (
            <span className="text-[9px] text-slate-400 block font-mono">Raw: {rawRight}</span>
          )}
        </div>

        {/* Pod 3: Rudder / Position */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">POSITION</span>
          <span className="text-lg font-black text-slate-900 font-mono block">{rudderVal}</span>
          {showRaw && (
            <span className="text-[9px] text-slate-400 block font-mono">Raw: {rawRudder}</span>
          )}
        </div>
      </div>

      {/* Source Banner */}
      <div className="w-full mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
        <span className="font-semibold">Protocol: 0x68E:0xF2 / 9600 Baud</span>
        <span className={`font-bold ${isReal ? 'text-emerald-700' : 'text-blue-700'}`}>
          {isReal ? '● LIVE HARDWARE' : '○ DEMO SIMULATOR'}
        </span>
      </div>
    </div>
  );
};
