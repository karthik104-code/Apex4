import React from 'react';
import { Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CompensationMetrics, CompensationLevel } from '../types/rehab';

interface CompensationGaugesProps {
  metrics: CompensationMetrics;
}

export const CompensationGauges: React.FC<CompensationGaugesProps> = ({ metrics }) => {
  const getBadgeStyle = (level: CompensationLevel) => {
    switch (level) {
      case 'high':
        return 'bg-[#FEE2E2] text-[#EF4444] border border-red-200';
      case 'medium':
        return 'bg-[#FEF3C7] text-[#D97706] border border-amber-200';
      case 'low':
      default:
        return 'bg-[#EAF8F1] text-[#22A06B] border border-emerald-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#2563EB]" />
          <h3 className="font-bold text-base text-[#111827]">Movement Analysis</h3>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Webcam Vision AI
        </span>
      </div>

      {/* Primary Metric: Movement Quality */}
      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Movement Quality</span>
          <span className="text-3xl font-black text-[#22A06B] tracking-tight">
            {metrics.overallStability}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8F1] border border-emerald-200 text-xs font-bold text-[#22A06B]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>OPTIMAL</span>
        </div>
      </div>

      {/* Postural Compensation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Trunk Lean */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Trunk Lean</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getBadgeStyle(metrics.trunkLeanLevel)}`}>
              {metrics.trunkLeanLevel}
            </span>
          </div>
          <div className="text-2xl font-black text-[#111827]">
            {metrics.trunkLeanAngle}°
          </div>
          <p className="text-[11px] text-slate-500">Torso midline deviation</p>
        </div>

        {/* 2. Shoulder Hike */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Shoulder Hike</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getBadgeStyle(metrics.shoulderHikeLevel)}`}>
              {metrics.shoulderHikeLevel}
            </span>
          </div>
          <div className="text-2xl font-black text-[#111827]">
            {metrics.shoulderHikeDisplacement} <span className="text-xs font-normal text-slate-500">ratio</span>
          </div>
          <p className="text-[11px] text-slate-500">Shoulder line asymmetry</p>
        </div>

        {/* 3. Torso Rotation */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Torso Rotation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getBadgeStyle(metrics.torsoRotationLevel)}`}>
              {metrics.torsoRotationLevel}
            </span>
          </div>
          <div className="text-2xl font-black text-[#111827]">
            {metrics.torsoRotationAngle}°
          </div>
          <p className="text-[11px] text-slate-500">Shoulder-hip angle mismatch</p>
        </div>
      </div>
    </div>
  );
};
