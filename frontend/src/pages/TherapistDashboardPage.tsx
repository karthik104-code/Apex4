import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  User,
  ShieldAlert,
  ChevronRight,
  PlayCircle,
  Clock,
  Sparkles,
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
  const [activeChartMetric, setActiveChartMetric] = useState<'quality' | 'accuracy' | 'compensation' | 'reactionTime' | 'consistency'>('quality');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default fallback demo sessions if empty
  const allSessions: RehabSession[] = sessions && sessions.length > 0 ? sessions : [
    {
      id: 'ses-401',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 12, 2026',
      durationSeconds: 240,
      source: 'demo',
      fusionScore: { movementQuality: 82, performanceScore: 84, combinedSessionScore: 83, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 12.4, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.06, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.2, torsoRotationLevel: 'low', overallStability: 81 },
      telemetry: { force: 64, reactionTime: 1.24, accuracy: 87, strikeConsistency: 91, mode: 'simulated', source: 'demo' },
      status: 'completed',
    },
    {
      id: 'ses-301',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 10, 2026',
      durationSeconds: 240,
      source: 'demo',
      fusionScore: { movementQuality: 78, performanceScore: 81, combinedSessionScore: 80, compensationSummary: 'Medium trunk lean & shoulder hike.' },
      compensationMetrics: { trunkLeanAngle: 14.1, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.07, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.8, torsoRotationLevel: 'low', overallStability: 79 },
      telemetry: { force: 62, reactionTime: 1.35, accuracy: 83, strikeConsistency: 88, mode: 'simulated', source: 'demo' },
      status: 'completed',
    },
    {
      id: 'ses-201',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 08, 2026',
      durationSeconds: 250,
      source: 'demo',
      fusionScore: { movementQuality: 74, performanceScore: 78, combinedSessionScore: 76, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 15.8, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.08, shoulderHikeLevel: 'medium', torsoRotationAngle: 6.4, torsoRotationLevel: 'medium', overallStability: 75 },
      telemetry: { force: 60, reactionTime: 1.48, accuracy: 81, strikeConsistency: 85, mode: 'simulated', source: 'demo' },
      status: 'completed',
    },
    {
      id: 'ses-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 06, 2026',
      durationSeconds: 220,
      source: 'demo',
      fusionScore: { movementQuality: 71, performanceScore: 73, combinedSessionScore: 72, compensationSummary: 'High trunk lean on initial strikes.' },
      compensationMetrics: { trunkLeanAngle: 18.2, trunkLeanLevel: 'high', shoulderHikeDisplacement: 0.09, shoulderHikeLevel: 'medium', torsoRotationAngle: 7.1, torsoRotationLevel: 'medium', overallStability: 72 },
      telemetry: { force: 55, reactionTime: 1.62, accuracy: 76, strikeConsistency: 80, mode: 'simulated', source: 'demo' },
      status: 'completed',
    },
  ];

  const latestSession = allSessions[0];

  // Recharts Dataset
  const chartData = [...allSessions].reverse().map((s, i) => {
    const rt = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
    const cons = s.telemetry.strikeConsistency || s.telemetry.consistency || 88;
    return {
      name: s.date.split(',')[0] || `Session ${i + 1}`,
      movementQuality: s.fusionScore.movementQuality,
      accuracy: s.telemetry.accuracy,
      trunkLean: s.compensationMetrics.trunkLeanAngle,
      reactionTime: rt,
      consistency: cons,
    };
  });

  const latestRt = (latestSession.telemetry.reaction_time !== undefined ? latestSession.telemetry.reaction_time : latestSession.telemetry.reactionTime).toFixed(2);
  const latestConsistency = latestSession.telemetry.strikeConsistency || latestSession.telemetry.consistency || 91;
  const isLatestHardware = latestSession.source === 'hardware' || latestSession.telemetry.source === 'hardware' || latestSession.telemetry.hardwareConnected;

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Safety Banner */}
      <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs flex items-center gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0" />
        <span>
          <strong>Rehabilitation Professional Notice:</strong> AI-generated session insights are intended for clinical review and decision support. APEX 4 does not diagnose, prescribe treatment, or replace healthcare professional judgment.
        </span>
      </div>

      {/* ==================================================
          HEADER
          ================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-9 h-9 object-contain" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#111827]">APEX 4</span>
              <span className="text-slate-300">|</span>
              <h1 className="text-xl font-bold text-[#111827]">Therapist Dashboard</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                AVAILABLE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Information over decoration. Objective rehabilitation tracking & AI insights.
            </p>
          </div>
        </div>

        {/* Patient Switcher & Session Launcher */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#2563EB] shadow-xs"
          >
            <option value="Alex Mercer">Alex Mercer (Upper Limb Rehab)</option>
            <option value="Priya Sharma">Priya Sharma (Arm Traumatic Injury)</option>
          </select>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/session')}
            className="whitespace-nowrap flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Session</span>
          </Button>
        </div>
      </div>

      {/* ==================================================
          KEY METRICS ROW (Information-Dense, Clean Typography)
          ================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Latest Session */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold block">Latest Session</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
              isLatestHardware
                ? 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200'
                : 'bg-[#F8FAFC] text-slate-500 border-slate-200'
            }`}>
              {isLatestHardware ? '● Hardware' : '◌ Demo'}
            </span>
          </div>
          <div className="text-base font-bold text-[#111827] truncate">{latestSession.date}</div>
          <span className="text-[10px] text-slate-400 block">{Math.round(latestSession.durationSeconds / 60)} mins duration</span>
        </div>

        {/* 2. Movement Quality */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Movement Quality</span>
          <div className="text-2xl font-black text-[#22A06B]">{latestSession.fusionScore.movementQuality}%</div>
          <span className="text-[10px] text-[#22A06B] font-bold block">+4.2% trajectory</span>
        </div>

        {/* 3. Compensation Trend */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Trunk Lean</span>
          <div className="text-2xl font-black text-[#D97706]">{latestSession.compensationMetrics.trunkLeanAngle}°</div>
          <span className="text-[10px] text-[#D97706] font-bold block uppercase">{latestSession.compensationMetrics.trunkLeanLevel} compensation</span>
        </div>

        {/* 4. Accuracy */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Accuracy</span>
          <div className="text-2xl font-black text-[#2563EB]">{latestSession.telemetry.accuracy}%</div>
          <span className="text-[10px] text-slate-500 block">Strike precision</span>
        </div>

        {/* 5. Reaction Time */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Reaction Time</span>
          <div className="text-2xl font-black text-[#7C6CE7]">{latestRt} s</div>
          <span className="text-[10px] text-slate-500 block">Actuator response</span>
        </div>

        {/* 6. Consistency */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold block">Consistency</span>
          <div className="text-2xl font-black text-[#2563EB]">{latestConsistency}%</div>
          <span className="text-[10px] text-slate-500 block">Strike repeatability</span>
        </div>
      </div>

      {/* ==================================================
          MAIN CONTENT: Useful Trends & AI Insights
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Clean Trends Chart & Session History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trends Visualizer */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-base text-[#111827]">Session Trends & Metrics</h3>
              </div>

              {/* Clean Metric Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-[#E5E7EB] text-[11px]">
                <button
                  onClick={() => setActiveChartMetric('quality')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'quality'
                      ? 'bg-white text-[#22A06B] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Quality (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('accuracy')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'accuracy'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Accuracy (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('compensation')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'compensation'
                      ? 'bg-white text-[#D97706] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Trunk Lean (°)
                </button>
                <button
                  onClick={() => setActiveChartMetric('reactionTime')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'reactionTime'
                      ? 'bg-white text-[#7C6CE7] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Reaction (s)
                </button>
                <button
                  onClick={() => setActiveChartMetric('consistency')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'consistency'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Consistency (%)
                </button>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                  {activeChartMetric === 'quality' && (
                    <>
                      <ReferenceLine y={75} label="Target Baseline (75%)" stroke="#22A06B" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="movementQuality" name="Movement Quality (%)" stroke="#22A06B" strokeWidth={3} dot={{ r: 5 }} />
                    </>
                  )}
                  {activeChartMetric === 'accuracy' && (
                    <Line type="monotone" dataKey="accuracy" name="Strike Accuracy (%)" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                  {activeChartMetric === 'compensation' && (
                    <Line type="monotone" dataKey="trunkLean" name="Trunk Lean Angle (°)" stroke="#D97706" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                  {activeChartMetric === 'reactionTime' && (
                    <Line type="monotone" dataKey="reactionTime" name="Reaction Time (s)" stroke="#7C6CE7" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                  {activeChartMetric === 'consistency' && (
                    <Line type="monotone" dataKey="consistency" name="Consistency (%)" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session History Archive Table */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#111827]">Session History</h3>
              <span className="text-xs text-slate-500 font-medium">{allSessions.length} recorded sessions</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {allSessions.map((s) => {
                const rtVal = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
                const isHw = s.source === 'hardware' || s.telemetry.source === 'hardware' || s.telemetry.hardwareConnected;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionForDetails(s)}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#EAF2FF] border border-blue-200 flex items-center justify-center text-[#2563EB] font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111827]">{s.date}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            isHw
                              ? 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}>
                            {isHw ? '● Hardware' : '◌ Demo'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">Duration: {Math.round(s.durationSeconds / 60)} mins</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#EAF8F1] text-[#22A06B] font-bold border border-emerald-200">
                        Quality: {s.fusionScore.movementQuality}%
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#EAF2FF] text-[#2563EB] font-bold border border-blue-200">
                        Accuracy: {s.telemetry.accuracy}%
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#D97706] font-bold border border-amber-200">
                        Lean: {s.compensationMetrics.trunkLeanAngle}°
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#F2F0FF] text-[#7C6CE7] font-bold border border-purple-200">
                        RT: {rtVal.toFixed(2)}s
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Session Report */}
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
