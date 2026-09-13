import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, TrendingUp, HelpCircle, ShieldAlert, Globe, Loader2 } from 'lucide-react';
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
      console.error('Failed to generate report', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = (newLang: 'en' | 'ml') => {
    setLanguage(newLang);
    handleGenerateReport(newLang);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 bg-gradient-to-b from-slate-900/95 via-surface to-slate-950">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-primary-500/10 border border-primary-500/30 text-primary-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">AI Rehabilitation Session Report</h3>
            <span className="text-[11px] text-slate-400 font-medium block">
              AI-generated from session metrics
            </span>
          </div>
        </div>

        {/* Language Switcher & Generator CTA */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => toggleLanguage('en')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                language === 'en'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => toggleLanguage('ml')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                language === 'ml'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              മലയാളം
            </button>
          </div>

          {/* Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGenerateReport(language)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-accent-purple hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{report ? 'Re-Generate Report' : 'Generate AI Session Report'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Body */}
      {report ? (
        <div className="space-y-4">
          {/* Positive Observations (What went well) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {language === 'ml' ? 'അനുകൂല കണ്ടെത്തലുകൾ (Positive Observations)' : 'Positive Observations'}
            </h4>
            <div className="space-y-1.5 pl-2">
              {report.positiveObservations.map((obs, idx) => (
                <div key={idx} className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
                  <span className="shrink-0 text-emerald-400 font-bold">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observations & Compensation Flags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {language === 'ml' ? 'നിരീക്ഷണങ്ങൾ (Session Observations)' : 'Session Observations'}
            </h4>
            <div className="space-y-1.5 pl-2">
              {report.measurableConcerns.map((concern, idx) => (
                <div key={idx} className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                  <span className="shrink-0 text-amber-400 font-bold">•</span>
                  <span>{concern}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Trend */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              {language === 'ml' ? 'ട്രെൻഡ് (Session Trend)' : 'Session Progress Trend'}
            </h4>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200">
              {report.sessionTrend}
            </div>
          </div>

          {/* Therapist Discussion Points */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              {language === 'ml' ? 'ചർച്ച ചെയ്യാവുന്ന കാര്യങ്ങൾ (Therapist Discussion Points)' : 'Therapist Discussion Points'}
            </h4>
            <div className="space-y-1.5 pl-2">
              {report.therapistDiscussionPoints.map((point, idx) => (
                <div key={idx} className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
                  <span className="shrink-0 text-purple-400 font-bold">💬</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Prototype Disclaimer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400 italic">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{report.disclaimer}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 space-y-3">
          <Sparkles className="w-8 h-8 text-primary-400 mx-auto opacity-70" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">No AI Report Generated Yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click <span className="text-primary-300 font-semibold">"Generate AI Session Report"</span> to analyze movement quality, MSV1 force telemetry, and compensation trends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
