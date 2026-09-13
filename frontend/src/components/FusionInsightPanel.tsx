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
        return 'bg-[#FEE2E2] text-[#EF4444] border-red-200';
      case 'medium':
        return 'bg-[#FEF3C7] text-[#D97706] border-amber-200';
      case 'low':
      default:
        return 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200';
    }
  };

  const reactionTimeVal = telemetry.reaction_time !== undefined ? telemetry.reaction_time : telemetry.reactionTime;
  const consistencyVal = telemetry.consistency !== undefined ? telemetry.consistency : telemetry.strikeConsistency;

  return (
    <div className="space-y-4">
      {/* SECTION 1: AI MOVEMENT ANALYSIS */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
              AI Movement Analysis
            </h3>
          </div>
          <span className="text-xs font-black text-[#22A06B]">
            Quality: {fusionScore.movementQuality}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Trunk Lean</span>
            <span className="font-bold text-[#111827]">{compensation.trunkLeanAngle}°</span>
            <span className={`inline-block ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeStyle(compensation.trunkLeanLevel)}`}>
              {compensation.trunkLeanLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Shoulder Hike</span>
            <span className="font-bold text-[#111827]">{(compensation.shoulderHikeDisplacement * 100).toFixed(1)}%</span>
            <span className={`inline-block ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeStyle(compensation.shoulderHikeLevel)}`}>
              {compensation.shoulderHikeLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Torso Rotation</span>
            <span className="font-bold text-[#111827]">{compensation.torsoRotationAngle}°</span>
            <span className={`inline-block ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeStyle(compensation.torsoRotationLevel)}`}>
              {compensation.torsoRotationLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Stability</span>
            <span className="font-bold text-[#22A06B]">{compensation.overallStability}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: APEX 4 PERFORMANCE */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#7C6CE7]" />
            <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
              APEX 4 Performance
            </h3>
          </div>
          <span className="text-xs font-black text-[#2563EB]">
            Performance: {fusionScore.performanceScore}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Actuator Force</span>
            <span className="font-bold text-[#111827]">{telemetry.force}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Reaction Time</span>
            <span className="font-bold text-[#7C6CE7]">{reactionTimeVal.toFixed(2)}s</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Strike Accuracy</span>
            <span className="font-bold text-[#22A06B]">{telemetry.accuracy}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <span className="text-slate-500 block text-[10px]">Consistency</span>
            <span className="font-bold text-[#D97706]">{consistencyVal}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: COMBINED SESSION INSIGHT */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">
              Combined Session Insight
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBadgeStyle(fusionScore.compensationLevel)}`}>
              Compensation: {fusionScore.compensationLevel.toUpperCase()}
            </span>
            <span className="text-xs font-black text-[#2563EB]">
              Session Score: {fusionScore.combinedSessionScore}%
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-[#111827] leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#7C6CE7] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#111827]">{fusionScore.combinedInsight}</p>
            <p className="text-[11px] text-slate-500 mt-1">{fusionScore.compensationSummary}</p>
          </div>
        </div>

        {/* Non-clinical validation disclaimer */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{FUSION_CONFIG.DISCLAIMER}</span>
        </div>
      </div>
    </div>
  );
};
