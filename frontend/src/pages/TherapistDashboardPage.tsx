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
  Clock,
  AlertCircle,
  FileText,
  PlayCircle,
  ShieldAlert,
  ChevronRight,
  Target,
  Zap,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { AIReportCard } from '../components/AIReportCard';
import { SessionDetailsModal } from '../components/SessionDetailsModal';
import { RehabSession } from '../types/rehab';

interface TherapistDashboardPageProps {
  sessions: RehabSession[];
}

export const TherapistDashboardPage: React.FC<TherapistDashboardPageProps> = ({ sessions }) => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState('Alex Mercer');
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<RehabSession | null>(null);
  const [activeChartMetric, setActiveChartMetric] = useState<'quality' | 'accuracy' | 'compensation' | 'reactionTime'>('quality');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default fallback demo sessions if list is empty
  const allSessions: RehabSession[] = sessions && sessions.length > 0 ? sessions : [
    {
      id: 'ses-401',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 12, 2026',
      durationSeconds: 240,
      fusionScore: { movementQuality: 82, performanceScore: 84, combinedSessionScore: 83, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 12.4, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.06, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.2, torsoRotationLevel: 'low', overallStability: 81 },
      telemetry: { force: 64, reactionTime: 1.24, accuracy: 87, strikeConsistency: 82, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-301',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 10, 2026',
      durationSeconds: 240,
      fusionScore: { movementQuality: 78, performanceScore: 81, combinedSessionScore: 80, compensationSummary: 'Medium trunk lean & shoulder hike.' },
      compensationMetrics: { trunkLeanAngle: 14.1, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.07, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.8, torsoRotationLevel: 'low', overallStability: 79 },
      telemetry: { force: 62, reactionTime: 1.35, accuracy: 83, strikeConsistency: 80, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-201',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 08, 2026',
      durationSeconds: 250,
      fusionScore: { movementQuality: 74, performanceScore: 78, combinedSessionScore: 76, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 15.8, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.08, shoulderHikeLevel: 'medium', torsoRotationAngle: 6.4, torsoRotationLevel: 'medium', overallStability: 75 },
      telemetry: { force: 60, reactionTime: 1.48, accuracy: 81, strikeConsistency: 77, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 06, 2026',
      durationSeconds: 220,
      fusionScore: { movementQuality: 71, performanceScore: 73, combinedSessionScore: 72, compensationSummary: 'High trunk lean on initial strikes.' },
      compensationMetrics: { trunkLeanAngle: 18.2, trunkLeanLevel: 'high', shoulderHikeDisplacement: 0.09, shoulderHikeLevel: 'medium', torsoRotationAngle: 7.1, torsoRotationLevel: 'medium', overallStability: 72 },
      telemetry: { force: 55, reactionTime: 1.62, accuracy: 76, strikeConsistency: 72, mode: 'simulated' },
      status: 'completed',
    },
  ];

  const latestSession = allSessions[0];

  // Prepare Recharts chart dataset (chronological order)
  const chartData = [...allSessions].reverse().map((s, i) => {
    const rt = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
    return {
      name: s.date.split(',')[0] || `Session ${i + 1}`,
      movementQuality: s.fusionScore.movementQuality,
      accuracy: s.telemetry.accuracy,
      trunkLean: s.compensationMetrics.trunkLeanAngle,
      reactionTime: rt,
    };
  });

  // Calculate 10-second KPI summary values
  const totalSessionsCount = allSessions.length;
  const avgTrunkLean = (allSessions.reduce((acc, s) => acc + s.compensationMetrics.trunkLeanAngle, 0) / totalSessionsCount).toFixed(1);
  const latestRt = (latestSession.telemetry.reaction_time !== undefined ? latestSession.telemetry.reaction_time : latestSession.telemetry.reactionTime).toFixed(2);

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

      {/* Header & Patient Profile Switcher */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-bold uppercase tracking-wider border border-accent-blue/30">
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

      {/* Patient Profile & 10-Second Executive Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Patient Profile Card (3 cols) */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 bg-gradient-to-b from-slate-900 to-surface">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400 font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{selectedPatient}</h3>
              <span className="text-[11px] text-slate-400">ID: PT-80291 • Age: 38</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Condition:</span>
              <span className="font-semibold text-slate-200">Upper Limb Impairment</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Actuator Mechanism:</span>
              <span className="font-semibold text-primary-400">Foot-Operated Carrom</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Quality Goal:</span>
              <span className="font-semibold text-emerald-400">≥ 75% Movement Quality</span>
            </div>
          </div>
        </div>

        {/* 10-Second Executive KPI Metric Cards (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Sessions */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1 border-l-4 border-l-accent-blue">
            <span className="text-[11px] text-slate-400 font-medium block">Total Sessions</span>
            <div className="text-2xl font-black text-slate-100">{totalSessionsCount}</div>
            <span className="text-[10px] text-slate-400 block">Completed to date</span>
          </div>

          {/* Latest Movement Quality */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1 border-l-4 border-l-emerald-500">
            <span className="text-[11px] text-slate-400 font-medium block">Latest Movement Quality</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400">{latestSession.fusionScore.movementQuality}%</span>
              <span className="text-[10px] text-emerald-400 font-bold">+4.2%</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Target threshold: 75%</span>
          </div>

          {/* Strike Accuracy */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1 border-l-4 border-l-cyan-500">
            <span className="text-[11px] text-slate-400 font-medium block">Latest Strike Accuracy</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-cyan-400">{latestSession.telemetry.accuracy}%</span>
              <span className="text-[10px] text-cyan-400 font-bold">Stable</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Actuator precision</span>
          </div>

          {/* Average Trunk Compensation */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1 border-l-4 border-l-amber-500">
            <span className="text-[11px] text-slate-400 font-medium block">Avg Trunk Lean Deviation</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400">{avgTrunkLean}°</span>
              <span className="text-[10px] text-amber-300 font-bold uppercase">MED</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Latest: {latestSession.compensationMetrics.trunkLeanAngle}°</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Interactive Charts & AI Session Report Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Useful Charts & Session History Table */}
        <div className="lg:col-span-7 space-y-6">
          {/* Useful Recharts Section */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm text-slate-100">Progress Trajectory & Metrics Over Time</h3>
              </div>

              {/* Chart Metric Selector Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-[11px]">
                <button
                  onClick={() => setActiveChartMetric('quality')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                    activeChartMetric === 'quality'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Quality (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('accuracy')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                    activeChartMetric === 'accuracy'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Accuracy (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('compensation')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                    activeChartMetric === 'compensation'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trunk Lean (°)
                </button>
                <button
                  onClick={() => setActiveChartMetric('reactionTime')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                    activeChartMetric === 'reactionTime'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Reaction (s)
                </button>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }} />
                  {activeChartMetric === 'quality' && (
                    <>
                      <ReferenceLine y={75} label="Target Quality (75%)" stroke="#10b981" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="movementQuality" name="Movement Quality (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    </>
                  )}
                  {activeChartMetric === 'accuracy' && (
                    <Line type="monotone" dataKey="accuracy" name="Strike Accuracy (%)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                  {activeChartMetric === 'compensation' && (
                    <Line type="monotone" dataKey="trunkLean" name="Trunk Lean Angle (°)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                  {activeChartMetric === 'reactionTime' && (
                    <Line type="monotone" dataKey="reactionTime" name="Reaction Time (s)" stroke="#c084fc" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session History Log Table */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100">Session History Archive</h3>
              <span className="text-xs text-slate-400">{allSessions.length} recorded sessions</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {allSessions.map((s) => {
                const rt = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionForDetails(s)}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-primary-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 block">{s.date}</span>
                        <span className="text-[11px] text-slate-400">Duration: {Math.round(s.durationSeconds / 60)} mins</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30">
                        Quality: {s.fusionScore.movementQuality}%
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30">
                        Accuracy: {s.telemetry.accuracy}%
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                        Lean: {s.compensationMetrics.trunkLeanAngle}°
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-300 font-bold border border-purple-500/30">
                        RT: {rt.toFixed(2)}s
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Generative AI Session Report Component */}
        <div className="lg:col-span-5 space-y-6">
          <AIReportCard session={latestSession} />
        </div>
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSessionForDetails}
        onClose={() => setSelectedSessionForDetails(null)}
      />
    </div>
  );
};
