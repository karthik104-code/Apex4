import React from 'react';
import { Eye, Cpu, Layers, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { CompensationMetrics, HardwareTelemetry } from '../types/rehab';
import { ExtendedFusionScore, FUSION_CONFIG } from '../services/fusionEngine';

interface FusionInsightPanelProps {
  compensation: CompensationMetrics;
  telemetry: HardwareTelemetry;
  fusionScore: ExtendedFusionScore;
}

export const FusionInsightPanel: React.FC<FusionInsightPanelProps> = ({
  compensation,
  telemetry,
  fusionScore,
}) => {
  const getBadgeStyle = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'low':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const reactionTimeVal = telemetry.reaction_time !== undefined ? telemetry.reaction_time : telemetry.reactionTime;
  const consistencyVal = telemetry.consistency !== undefined ? telemetry.consistency : telemetry.strikeConsistency;

  return (
    <div className="space-y-4">
      {/* SECTION 1: AI MOVEMENT ANALYSIS */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent-blue" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              AI Movement Analysis
            </h3>
          </div>
          <span className="text-xs font-black text-emerald-400">
            Quality: {fusionScore.movementQuality}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Trunk Lean</span>
            <span className="font-bold text-slate-200">{compensation.trunkLeanAngle}°</span>
            <span className={`inline-block ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeStyle(compensation.trunkLeanLevel)}`}>
              {compensation.trunkLeanLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Shoulder Hike</span>
            <span className="font-bold text-slate-200">{(compensation.shoulderHikeDisplacement * 100).toFixed(1)}%</span>
            <span className={`inline-block ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeStyle(compensation.shoulderHikeLevel)}`}>
              {compensation.shoulderHikeLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Torso Rotation</span>
            <span className="font-bold text-slate-200">{compensation.torsoRotationAngle}°</span>
            <span className={`inline-block ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeStyle(compensation.torsoRotationLevel)}`}>
              {compensation.torsoRotationLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Stability</span>
            <span className="font-bold text-teal-300">{compensation.overallStability}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: MSV1 PERFORMANCE */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent-purple" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              MSV1 Performance
            </h3>
          </div>
          <span className="text-xs font-black text-cyan-400">
            Performance: {fusionScore.performanceScore}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Actuator Force</span>
            <span className="font-bold text-slate-200">{telemetry.force}%</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Reaction Time</span>
            <span className="font-bold text-purple-300">{reactionTimeVal.toFixed(2)}s</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Strike Accuracy</span>
            <span className="font-bold text-emerald-300">{telemetry.accuracy}%</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Consistency</span>
            <span className="font-bold text-amber-300">{consistencyVal}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: COMBINED SESSION INSIGHT */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 bg-gradient-to-br from-slate-900 via-surface to-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              Combined Session Insight
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBadgeStyle(fusionScore.compensationLevel)}`}>
              Compensation: {fusionScore.compensationLevel.toUpperCase()}
            </span>
            <span className="text-xs font-black text-primary-400">
              Session Score: {fusionScore.combinedSessionScore}%
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-100">{fusionScore.combinedInsight}</p>
            <p className="text-[11px] text-slate-400 mt-1">{fusionScore.compensationSummary}</p>
          </div>
        </div>

        {/* Non-clinical validation disclaimer */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{FUSION_CONFIG.DISCLAIMER}</span>
        </div>
      </div>
    </div>
  );
};
