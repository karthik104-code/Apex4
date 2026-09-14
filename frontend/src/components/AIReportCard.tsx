import React, { useState } from 'react';
import {
  FileText,
  Activity,
  ShieldCheck,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Cpu,
  TrendingUp,
  Scale,
  Compass,
  AlertCircle
} from 'lucide-react';
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
      console.error('Failed to generate clinical AI report', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = (newLang: 'en' | 'ml') => {
    setLanguage(newLang);
    handleGenerateReport(newLang);
  };

  const isHardware = (session.telemetry.mode || '').toLowerCase().includes('hardware');
  const dataSourceLabel = isHardware ? 'REAL HARDWARE' : 'APEX 4 DEMO TELEMETRY';

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden text-[#111827]">
      {/* Top Action Header */}
      <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-wide">
                APEX 4 REHABILITATION SESSION REPORT
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                isHardware
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
              }`}>
                {dataSourceLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Objective Biomechanical Assessment & Task Performance Documentation
            </p>
          </div>
        </div>

        {/* Language Toggle & Action Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <button
              onClick={() => toggleLanguage('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => toggleLanguage('ml')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'ml'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-xs transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Session...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{report ? 'Re-Generate Assessment' : 'Generate Clinical Assessment'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Content Body */}
      {report ? (
        <div className="p-6 space-y-6 text-xs leading-relaxed">
          {/* Metadata Sub-Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-slate-700 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">Patient / Session ID:</span>
              <strong className="text-[#111827] font-semibold">{report.sessionId || session.id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Session Date:</span>
              <strong className="text-[#111827] font-semibold">{report.sessionDate || session.date}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Duration:</span>
              <strong className="text-[#111827] font-semibold">{report.sessionDuration || `${Math.round(session.durationSeconds / 60)}m`}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Pose Source:</span>
              <strong className="text-[#111827] font-semibold">MediaPipe Computer Vision</strong>
            </div>
          </div>

          {/* Section 1: Session Overview */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>1. Session Overview</span>
            </h4>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-slate-800 text-[12px] leading-relaxed">
              <p>{report.sessionOverview}</p>
            </div>
          </div>

          {/* Section 2: Postural Alignment Assessment */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>2. Postural Alignment Assessment</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-[#E5E7EB]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] uppercase text-slate-500 font-bold">
                    <th className="p-2.5">Parameter</th>
                    <th className="p-2.5">Observed Value</th>
                    <th className="p-2.5">Reference / Threshold</th>
                    <th className="p-2.5">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {report.posturalAssessment && report.posturalAssessment.length > 0 ? (
                    report.posturalAssessment.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-semibold text-slate-900">{item.parameter}</td>
                        <td className="p-2.5 font-bold text-blue-700">{item.observedValue}</td>
                        <td className="p-2.5 text-slate-500 font-mono text-[10px]">{item.referenceThreshold}</td>
                        <td className="p-2.5 text-slate-700">{item.interpretation}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-slate-500">Postural assessment recorded within baseline limits.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Movement Compensation */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>3. Movement Compensation</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.movementCompensation && report.movementCompensation.length > 0 ? (
                report.movementCompensation.map((comp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 text-xs capitalize">{comp.pattern}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {comp.magnitude}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-950/80 leading-relaxed">{comp.details}</p>
                    <div className="flex items-center gap-3 text-[10px] text-amber-800 font-medium pt-1">
                      <span><strong>Frequency:</strong> {comp.frequency}</span>
                      <span>•</span>
                      <span><strong>Phase:</strong> {comp.phase}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] text-slate-600">
                  No compensatory movements exceeded prototype thresholds.
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Motor Performance */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>4. Motor Performance</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {report.motorPerformance && report.motorPerformance.length > 0 ? (
                report.motorPerformance.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium block">{item.metric}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-lg text-slate-900">{item.value}</span>
                      <span className="text-[10px] text-slate-500">{item.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 block line-clamp-2 leading-tight">
                      {item.interpretation}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-slate-600">
                  Task metrics recorded successfully.
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Bilateral Performance (if present) */}
          {report.bilateralPerformance && (
            <div className="space-y-2">
              <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>5. Bilateral Performance</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Left Device Output</span>
                    <span className="font-bold text-sm text-slate-900">{report.bilateralPerformance.leftValue || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Right Device Output</span>
                    <span className="font-bold text-sm text-slate-900">{report.bilateralPerformance.rightValue || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Bilateral Disparity</span>
                    <span className="font-bold text-sm text-purple-700">{report.bilateralPerformance.difference || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-700 max-w-md">
                  {report.bilateralPerformance.interpretation}
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Movement Quality */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>6. Movement Quality</span>
            </h4>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                  {report.movementQuality?.score || session.fusionScore.movementQuality}%
                </div>
                <div>
                  <span className="font-bold text-emerald-950 text-xs block">
                    {report.movementQuality?.label || 'APEX 4 Movement Quality Score'}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    Composite metric derived from session trajectory and actuator telemetry.
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-900/90 max-w-lg italic">
                "{report.movementQuality?.explanation || 'This score is a prototype composite metric derived from session movement and performance data and is intended for monitoring/trend visualization, not as a standalone clinical assessment.'}"
              </p>
            </div>
          </div>

          {/* Section 7: Temporal Session Analysis */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>7. Temporal Session Analysis</span>
            </h4>
            <div className="space-y-1.5">
              {report.temporalAnalysis && report.temporalAnalysis.length > 0 ? (
                report.temporalAnalysis.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-slate-800 flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-slate-600">
                  Temporal trend could not be reliably determined from the available session data.
                </div>
              )}
            </div>
          </div>

          {/* Section 8: AI-Generated Session Observations */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>8. AI-Generated Session Observations</span>
            </h4>
            <div className="space-y-1.5">
              {(report.aiObservations || report.positiveObservations || []).map((obs, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/70 text-purple-950 flex items-start gap-2">
                  <span className="text-purple-600 font-bold shrink-0">💬</span>
                  <span className="leading-relaxed">{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: Points for Professional Review */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              <span>9. Points for Professional Review</span>
            </h4>
            <div className="space-y-1.5">
              {(report.professionalReviewPoints || report.therapistDiscussionPoints || []).map((point, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 text-indigo-950 flex items-start gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">🔍</span>
                  <span className="leading-relaxed font-medium">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 10: Limitations & Safety Disclaimer */}
          <div className="pt-4 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>10. Session Limitations</span>
              </div>
              <p className="leading-relaxed">
                {report.limitations}
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 italic">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p>
                {report.safetyNotice || 'AI-generated movement analysis for professional review. This report summarizes measurements collected during the APEX 4 prototype session. It is not a diagnosis and should not be used as a substitute for clinical examination or professional judgment.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 px-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="font-bold text-sm text-slate-900">Clinically Oriented AI Assessment Ready</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate structured rehabilitation documentation covering postural alignment, compensatory movements, motor performance, and points for professional review.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleGenerateReport(language)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs shadow-xs"
          >
            {isLoading ? 'Generating Assessment...' : 'Generate Clinical AI Report'}
          </Button>
        </div>
      )}
    </div>
  );
};

