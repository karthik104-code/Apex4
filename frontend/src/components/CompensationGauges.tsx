import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { CompensationMetrics, CompensationLevel } from '../types/rehab';

interface CompensationGaugesProps {
  metrics: CompensationMetrics;
}

export const CompensationGauges: React.FC<CompensationGaugesProps> = ({ metrics }) => {
  const getBadgeStyle = (level: CompensationLevel) => {
    switch (level) {
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'low':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          <h3 className="font-bold text-sm text-slate-100">Movement Compensation Indicators</h3>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          Webcam Vision AI
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Trunk Lean */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Trunk Lean</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getBadgeStyle(metrics.trunkLeanLevel)}`}>
              {metrics.trunkLeanLevel}
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100">
            {metrics.trunkLeanAngle}°
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                metrics.trunkLeanLevel === 'high'
                  ? 'bg-rose-500'
                  : metrics.trunkLeanLevel === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (metrics.trunkLeanAngle / 25) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Torso midline deviation</p>
        </div>

        {/* 2. Shoulder Hike */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Shoulder Hike</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getBadgeStyle(metrics.shoulderHikeLevel)}`}>
              {metrics.shoulderHikeLevel}
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100">
            {metrics.shoulderHikeDisplacement} <span className="text-xs font-normal text-slate-400">ratio</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                metrics.shoulderHikeLevel === 'high'
                  ? 'bg-rose-500'
                  : metrics.shoulderHikeLevel === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (metrics.shoulderHikeDisplacement / 0.2) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Acromion height asymmetry</p>
        </div>

        {/* 3. Torso Rotation */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Torso Rotation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getBadgeStyle(metrics.torsoRotationLevel)}`}>
              {metrics.torsoRotationLevel}
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100">
            {metrics.torsoRotationAngle}°
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                metrics.torsoRotationLevel === 'high'
                  ? 'bg-rose-500'
                  : metrics.torsoRotationLevel === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (metrics.torsoRotationAngle / 20) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Shoulder-hip angle mismatch</p>
        </div>
      </div>

      {/* Stability Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Overall Movement Stability:</span>
          <span className="font-extrabold text-emerald-400">{metrics.overallStability}%</span>
        </div>
        <div className="w-full sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${metrics.overallStability}%` }}
          />
        </div>
      </div>
    </div>
  );
};
