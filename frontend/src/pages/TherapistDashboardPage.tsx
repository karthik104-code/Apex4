import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  Award,
  Sparkles,
  TrendingUp,
  User,
  Calendar,
  AlertCircle,
  FileText,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { RehabSession, AIReport } from '../types/rehab';
import { apiService } from '../services/api';

interface TherapistDashboardPageProps {
  sessions: RehabSession[];
}

export const TherapistDashboardPage: React.FC<TherapistDashboardPageProps> = ({ sessions }) => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState('Alex Mercer');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const latestSession = sessions[0] || {
    id: 's-demo-101',
    patientName: 'Alex Mercer',
    date: '2026-09-12',
    durationSeconds: 240,
    fusionScore: { movementQuality: 82, performanceScore: 84, combinedSessionScore: 83, compensationSummary: 'Medium trunk lean detected.' },
    compensationMetrics: { trunkLeanAngle: 12.4, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.06, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.2, torsoRotationLevel: 'low', overallStability: 81 },
    telemetry: { force: 64, reactionTime: 1.24, accuracy: 87, strikeConsistency: 82, mode: 'simulated' }
  };

  // Time series trend data for Recharts
  const trendData = [
    { date: 'Session 1', movementQuality: 71, trunkLean: 18.2, accuracy: 76 },
    { date: 'Session 2', movementQuality: 74, trunkLean: 15.8, accuracy: 81 },
    { date: 'Session 3', movementQuality: 78, trunkLean: 14.1, accuracy: 83 },
    { date: 'Session 4', movementQuality: 82, trunkLean: 12.4, accuracy: 87 },
  ];

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await apiService.generateAIReport(latestSession);
      setAiReport(report);
      setToastMessage('Generated AI Clinical Session Report!');
    } catch {
      setToastMessage('Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Clinical Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Clinical Decision Support Notice:</strong> MSV1 is designed for rehabilitation movement monitoring and research demonstration. It is not a diagnostic system and does not replace clinical decisions by qualified healthcare professionals.
        </span>
      </div>

      {/* Header & Patient Switcher */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-semibold uppercase tracking-wider border border-accent-blue/30">
              Therapist Clinical Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Rehabilitation Monitoring Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review movement quality trends, compensation metrics, and AI session summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-primary-500"
          >
            <option value="Alex Mercer">Alex Mercer (Upper Limb Rehab)</option>
            <option value="Priya Sharma">Priya Sharma (Arm Traumatic Injury)</option>
          </select>

          <Button variant="primary" size="md" onClick={() => navigate('/session')} className="whitespace-nowrap">
            <PlayCircle className="w-4 h-4" />
            <span>Launch Live Session</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-primary-500 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Movement Quality Score</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">{latestSession.fusionScore.movementQuality}%</span>
            <span className="text-xs text-emerald-400 font-bold">+4.2% vs last</span>
          </div>
          <p className="text-[11px] text-slate-400">Target threshold: 75%</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Primary Compensation</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-amber-300 truncate">Trunk Lean ({latestSession.compensationMetrics.trunkLeanAngle}°)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">MED</span>
          </div>
          <p className="text-[11px] text-slate-400">Baseline deviation: 12.4°</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Actuator Strike Accuracy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">{latestSession.telemetry.accuracy}%</span>
            <span className="text-xs text-emerald-400 font-bold">Stable</span>
          </div>
          <p className="text-[11px] text-slate-400">Foot actuator precision</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-accent-purple space-y-1">
          <span className="text-xs text-slate-400 font-medium">Reaction Time</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">{latestSession.telemetry.reactionTime}s</span>
            <span className="text-xs text-emerald-400 font-bold">-0.15s faster</span>
          </div>
          <p className="text-[11px] text-slate-400">Target: &lt;1.5s</p>
        </div>
      </div>

      {/* Main Grid: Recharts & AI Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recharts Movement Quality & Compensation Trajectory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm text-slate-100">Movement Quality & Trunk Lean Progress</h3>
              </div>
              <span className="text-xs text-slate-400">4 Sessions Evaluated</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }} />
                  <ReferenceLine y={75} label="Target Quality (75%)" stroke="#10b981" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="movementQuality" name="Movement Quality (%)" stroke="#0d9488" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="trunkLean" name="Trunk Lean Angle (°)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Session History Log */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
            <h3 className="font-bold text-sm text-slate-100">Session History Log</h3>
            <div className="space-y-2 text-xs">
              {trendData.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold">
                      #{4 - idx}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">{s.date}</span>
                      <span className="text-slate-400">Duration: 4 mins</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 font-bold">Quality: {s.movementQuality}%</span>
                    <span className="text-amber-400 font-medium">Lean: {s.trunkLean}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: AI Session Report Generator */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800 bg-gradient-to-b from-slate-900 to-surface">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm text-slate-100">AI Clinical Session Report</h3>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="w-full flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              <span>{isGeneratingReport ? 'Analyzing Session Data...' : 'Generate AI Session Report'}</span>
            </Button>

            {aiReport ? (
              <div className="space-y-4 pt-2 border-t border-slate-800 text-xs text-slate-300">
                {/* Positive Observations */}
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider text-[11px]">
                    Positive Observations
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {aiReport.positiveObservations.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                {/* Measurable Concerns */}
                <div className="space-y-1.5">
                  <span className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[11px]">
                    Measurable Concerns
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {aiReport.measurableConcerns.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Session Trend */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-400 block text-[11px]">Session Trend:</span>
                  <p>{aiReport.sessionTrend}</p>
                </div>

                {/* Discussion Point */}
                <div className="p-3 rounded-xl bg-primary-950/30 border border-primary-500/30 text-primary-200 space-y-1">
                  <span className="font-semibold block text-[11px] uppercase">Suggested Discussion Point:</span>
                  <p>{aiReport.therapistDiscussionPoints[0]}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Click <strong>Generate AI Session Report</strong> to transform vision and telemetry metrics into natural language insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
