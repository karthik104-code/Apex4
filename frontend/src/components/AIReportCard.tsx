import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, TrendingUp, HelpCircle, ShieldAlert, Loader2, Activity, Cpu } from 'lucide-react';
import { AIReport, RehabSession } from '../types/rehab';
import { apiService } from '../services/api';
import { Button } from './ui/Button';

interface AIReportCardProps {
  session: RehabSession;
  onReportGenerated?: (report: AIReport) => void;
}

export const AIReportCard: React.FC<AIReportCardProps> = ({
  session,
  onReportGenerated,
}) => {
  const [report, setReport] = useState<AIReport | null>(session.aiReport || null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ml'>('en');

  const handleGenerateReport = async (targetLang: 'en' | 'ml' = language) => {
    setIsLoading(true);
    try {
      const generated = await apiService.generateAIReport(session, targetLang);
      setReport(generated);
      if (onReportGenerated) {
        onReportGenerated(generated);
      }
    } catch (e) {
      console.error('Failed to generate AI report', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = (newLang: 'en' | 'ml') => {
    setLanguage(newLang);
    handleGenerateReport(newLang);
  };

  const rt = session.telemetry.reaction_time !== undefined ? session.telemetry.reaction_time : session.telemetry.reactionTime;

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F2F0FF] border border-purple-200 text-[#7C6CE7]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#111827]">AI Session Insights</h3>
            <span className="text-[11px] font-semibold text-[#7C6CE7] block">
              AI-generated session insight • For rehabilitation professional review.
            </span>
          </div>
        </div>

        {/* Language Selector & Generator CTA */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-[#E5E7EB] text-xs">
            <button
              onClick={() => toggleLanguage('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'en'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-[#111827]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => toggleLanguage('ml')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'ml'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-[#111827]'
              }`}
            >
              മലയാളം
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGenerateReport(language)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{report ? 'Re-Generate AI Report' : 'Generate AI Session Report'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Body */}
      {report ? (
        <div className="space-y-4 text-xs">
          {/* Section 1: Session Summary */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              <span>Session Summary</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1 text-slate-700 leading-relaxed font-normal">
              <p>
                Session conducted on <strong>{session.date}</strong> ({Math.round(session.durationSeconds / 60)} minutes duration). Overall movement quality score achieved: <strong className="text-[#22A06B]">{session.fusionScore.movementQuality}%</strong>.
              </p>
            </div>
          </div>

          {/* Section 2: Movement Observations */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#22A06B] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Movement Observations</span>
            </h4>
            <div className="space-y-1.5">
              {report.positiveObservations.map((obs, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#EAF8F1] border border-emerald-200 text-[#166534] flex items-start gap-2">
                  <span className="shrink-0 font-bold">•</span>
                  <span>{obs}</span>
                </div>
              ))}
              {report.measurableConcerns.map((concern, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#FEF3C7] border border-amber-200 text-[#92400E] flex items-start gap-2">
                  <span className="shrink-0 font-bold">•</span>
                  <span>{concern}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Performance */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#2563EB] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#2563EB]" />
              <span>Performance</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#111827]">
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="text-[10px] text-slate-500 block">Actuator Force</span>
                <span className="font-bold text-sm">{session.telemetry.force}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="text-[10px] text-slate-500 block">Reaction Time</span>
                <span className="font-bold text-sm">{rt.toFixed(2)}s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="text-[10px] text-slate-500 block">Strike Accuracy</span>
                <span className="font-bold text-sm">{session.telemetry.accuracy}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="text-[10px] text-slate-500 block">Consistency</span>
                <span className="font-bold text-sm">{session.telemetry.strikeConsistency || 82}%</span>
              </div>
            </div>
          </div>

          {/* Section 4: Trend */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#2563EB] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Trend</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827]">
              {report.sessionTrend}
            </div>
          </div>

          {/* Section 5: Discussion Point for Therapist */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#7C6CE7] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Discussion Point for Therapist</span>
            </h4>
            <div className="space-y-1.5">
              {report.therapistDiscussionPoints.map((point, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#F2F0FF] border border-purple-200 text-[#5B46E0] flex items-start gap-2">
                  <span className="shrink-0 font-bold">💬</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Notice Label */}
          <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 italic">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              AI-generated session insight. For rehabilitation professional review. Does not diagnose, prescribe treatment, or replace clinical judgement.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 rounded-xl bg-[#F8FAFC] border border-dashed border-slate-200 space-y-3">
          <Sparkles className="w-8 h-8 text-[#7C6CE7] mx-auto opacity-70" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#111827]">No AI Session Report Generated Yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click <span className="text-[#2563EB] font-semibold">"Generate AI Session Report"</span> to analyze session summary, movement observations, performance, trend, and therapist discussion points.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
