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
  Calendar,
  Scale,
  ArrowRightLeft,
  FileText,
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
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
  const [activeTab, setActiveTab] = useState<'review' | 'trends' | 'compare'>('review');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ses-401');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<RehabSession | null>(null);
  const [compareSessionAId, setCompareSessionAId] = useState<string>('ses-101');
  const [compareSessionBId, setCompareSessionBId] = useState<string>('ses-401');
  const [activeChartMetric, setActiveChartMetric] = useState<
    'quality' | 'lateralTrunk' | 'bilateralAsymmetry' | 'reactionLatency' | 'forceOutput' | 'accuracy'
  >('quality');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default rich historical session dataset if empty
  const allSessions: RehabSession[] = sessions && sessions.length > 0 ? sessions : [
    {
      id: 'ses-401',
      sessionId: 'ses-401',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 12, 2026',
      durationSeconds: 240,
      source: 'demo',
      fusionScore: {
        movementQuality: 84,
        performanceScore: 86,
        combinedSessionScore: 85,
        compensationSummary: 'Mild lateral trunk deviation with improved bilateral symmetry.',
      },
      compensationMetrics: {
        trunkLeanAngle: 8.2,
        trunkLeanDirection: 'right',
        trunkLeanLevel: 'medium',
        anteriorInclinationRatio: 0.07,
        shoulderHikeDisplacement: 0.04,
        shoulderHikeLevel: 'low',
        torsoRotationAngle: 4.1,
        torsoRotationLevel: 'low',
        overallStability: 86,
        movementConsistency: 88,
      },
      telemetry: {
        force: 68,
        leftForce: 135,
        rightForce: 122,
        rudder: 132,
        reactionTime: 1.14,
        reaction_time: 1.14,
        accuracy: 89,
        strikeConsistency: 90,
        consistency: 90,
        mode: 'simulated',
        source: 'demo',
      },
      status: 'completed',
    },
    {
      id: 'ses-301',
      sessionId: 'ses-301',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 10, 2026',
      durationSeconds: 240,
      source: 'demo',
      fusionScore: {
        movementQuality: 78,
        performanceScore: 81,
        combinedSessionScore: 80,
        compensationSummary: 'Moderate lateral trunk deviation & mild shoulder elevation asymmetry.',
      },
      compensationMetrics: {
        trunkLeanAngle: 12.4,
        trunkLeanDirection: 'right',
        trunkLeanLevel: 'medium',
        anteriorInclinationRatio: 0.09,
        shoulderHikeDisplacement: 0.06,
        shoulderHikeLevel: 'medium',
        torsoRotationAngle: 5.8,
        torsoRotationLevel: 'low',
        overallStability: 79,
        movementConsistency: 82,
      },
      telemetry: {
        force: 62,
        leftForce: 142,
        rightForce: 110,
        rudder: 138,
        reactionTime: 1.32,
        reaction_time: 1.32,
        accuracy: 83,
        strikeConsistency: 85,
        consistency: 85,
        mode: 'simulated',
        source: 'demo',
      },
      status: 'completed',
    },
    {
      id: 'ses-201',
      sessionId: 'ses-201',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 08, 2026',
      durationSeconds: 250,
      source: 'demo',
      fusionScore: {
        movementQuality: 74,
        performanceScore: 78,
        combinedSessionScore: 76,
        compensationSummary: 'Moderate lateral trunk deviation with left-side load cell dominance.',
      },
      compensationMetrics: {
        trunkLeanAngle: 15.8,
        trunkLeanDirection: 'right',
        trunkLeanLevel: 'medium',
        anteriorInclinationRatio: 0.11,
        shoulderHikeDisplacement: 0.08,
        shoulderHikeLevel: 'medium',
        torsoRotationAngle: 6.4,
        torsoRotationLevel: 'medium',
        overallStability: 75,
        movementConsistency: 78,
      },
      telemetry: {
        force: 58,
        leftForce: 150,
        rightForce: 98,
        rudder: 145,
        reactionTime: 1.48,
        reaction_time: 1.48,
        accuracy: 80,
        strikeConsistency: 81,
        consistency: 81,
        mode: 'simulated',
        source: 'demo',
      },
      status: 'completed',
    },
    {
      id: 'ses-101',
      sessionId: 'ses-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 06, 2026',
      durationSeconds: 220,
      source: 'demo',
      fusionScore: {
        movementQuality: 69,
        performanceScore: 72,
        combinedSessionScore: 70,
        compensationSummary: 'Marked lateral trunk deviation and significant bilateral asymmetry.',
      },
      compensationMetrics: {
        trunkLeanAngle: 19.2,
        trunkLeanDirection: 'right',
        trunkLeanLevel: 'high',
        anteriorInclinationRatio: 0.14,
        shoulderHikeDisplacement: 0.11,
        shoulderHikeLevel: 'high',
        torsoRotationAngle: 7.8,
        torsoRotationLevel: 'medium',
        overallStability: 68,
        movementConsistency: 70,
      },
      telemetry: {
        force: 52,
        leftForce: 160,
        rightForce: 85,
        rudder: 154,
        reactionTime: 1.65,
        reaction_time: 1.65,
        accuracy: 75,
        strikeConsistency: 74,
        consistency: 74,
        mode: 'simulated',
        source: 'demo',
      },
      status: 'completed',
    },
  ];

  const activeSession = allSessions.find((s) => s.id === selectedSessionId) || allSessions[0];
  const isHardwareSession = (s: RehabSession) =>
    s.source === 'hardware' || s.telemetry.source === 'hardware' || s.telemetry.hardwareConnected;

  // Compute Bilateral Asymmetry Index for a session: |L - R| / max(L, R, 1) * 100%
  const calculateAsymmetry = (s: RehabSession) => {
    const l = s.telemetry.leftForce || (s.telemetry.force ? s.telemetry.force * 1.5 : 120);
    const r = s.telemetry.rightForce || (s.telemetry.force ? s.telemetry.force * 1.2 : 100);
    const maxSide = Math.max(l, r, 1);
    return Number(((Math.abs(l - r) / maxSide) * 100).toFixed(1));
  };

  // Trajectory Dataset for Recharts
  const chartData = [...allSessions].reverse().map((s, i) => {
    const rt = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
    const asymmetry = calculateAsymmetry(s);
    return {
      name: s.date.split(',')[0] || `Session ${i + 1}`,
      sessionId: s.id,
      movementQuality: s.fusionScore.movementQuality,
      lateralTrunk: s.compensationMetrics.trunkLeanAngle,
      bilateralAsymmetry: asymmetry,
      reactionLatency: rt,
      forceOutput: s.telemetry.force,
      accuracy: s.telemetry.accuracy,
    };
  });

  // Session Comparison Sessions
  const sessionA = allSessions.find((s) => s.id === compareSessionAId) || allSessions[allSessions.length - 1];
  const sessionB = allSessions.find((s) => s.id === compareSessionBId) || allSessions[0];

  const rtA = sessionA.telemetry.reaction_time !== undefined ? sessionA.telemetry.reaction_time : sessionA.telemetry.reactionTime;
  const rtB = sessionB.telemetry.reaction_time !== undefined ? sessionB.telemetry.reaction_time : sessionB.telemetry.reactionTime;
  const asymA = calculateAsymmetry(sessionA);
  const asymB = calculateAsymmetry(sessionB);

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden pb-16 text-[#111827]">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Safety & Non-Diagnostic Guardrail Notice */}
      <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0" />
          <span>
            <strong>Rehabilitation Professional Review Interface:</strong> Displays measured biomechanical kinematics and actuator telemetry collected during APEX 4 sessions. All observations are non-diagnostic and designed for healthcare professional evaluation.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#92400E] border border-[#FDE68A] shrink-0 uppercase">
          Non-Diagnostic
        </span>
      </div>

      {/* ==================================================
          HEADER & PATIENT SWITCHER
          ================================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-9 h-9 object-contain" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#111827]">APEX 4</span>
              <span className="text-slate-300">|</span>
              <h1 className="text-xl font-bold text-[#111827]">Therapist Dashboard</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                AVAILABLE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Objective motor assessment, posture analysis, and AI session synthesis.
            </p>
          </div>
        </div>

        {/* Patient Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#2563EB] shadow-xs"
            >
              <option value="Alex Mercer">Alex Mercer (Upper/Lower Limb Rehabilitation)</option>
              <option value="Priya Sharma">Priya Sharma (Post-Traumatic Arm Rehabilitation)</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/session')}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Live Session</span>
          </Button>
        </div>
      </div>

      {/* ==================================================
          DASHBOARD VIEW MODE TABS
          ================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'review'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E5E7EB]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Session Review & Report</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'trends'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E5E7EB]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. Longitudinal Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'compare'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E5E7EB]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>3. Session Comparison</span>
        </button>
      </div>

      {/* ==================================================
          TAB 1: SESSION REVIEW & AI REPORT
          ================================================== */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Active Session Selector Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Session:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-[#E5E7EB] text-xs font-bold text-[#111827] focus:outline-none focus:border-[#2563EB]"
              >
                {allSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} — {s.id} ({s.fusionScore.movementQuality}% Quality, {isHardwareSession(s) ? 'REAL HARDWARE' : 'APEX 4 DEMO TELEMETRY'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                isHardwareSession(activeSession)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isHardwareSession(activeSession) ? '● REAL HARDWARE' : '◌ APEX 4 DEMO TELEMETRY'}
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSessionForModal(activeSession)}
                className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Audit Record</span>
              </Button>
            </div>
          </div>

          {/* Key Executive Biomechanical Measurements */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Movement Quality */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Movement Quality</span>
              <div className="text-2xl font-black text-[#22A06B]">{activeSession.fusionScore.movementQuality}%</div>
              <span className="text-[10px] text-slate-500 block">Composite Score</span>
            </div>

            {/* 2. Lateral Trunk Deviation */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Lateral Trunk Deviation</span>
              <div className="text-2xl font-black text-[#D97706]">{activeSession.compensationMetrics.trunkLeanAngle}°</div>
              <span className="text-[10px] text-[#D97706] font-bold block uppercase">{activeSession.compensationMetrics.trunkLeanLevel} compensation</span>
            </div>

            {/* 3. Shoulder Elevation Asymmetry */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Shoulder Elevation</span>
              <div className="text-2xl font-black text-[#111827]">{activeSession.compensationMetrics.shoulderHikeDisplacement}</div>
              <span className="text-[10px] text-slate-500 block">Asymmetry ratio</span>
            </div>

            {/* 4. Bilateral Force-Output Asymmetry */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Bilateral Asymmetry</span>
              <div className="text-2xl font-black text-[#2563EB]">{calculateAsymmetry(activeSession)}%</div>
              <span className="text-[10px] text-slate-500 block">Load cell disparity</span>
            </div>

            {/* 5. Reaction Latency */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Reaction Latency</span>
              <div className="text-2xl font-black text-[#7C6CE7]">
                {(activeSession.telemetry.reaction_time !== undefined ? activeSession.telemetry.reaction_time : activeSession.telemetry.reactionTime).toFixed(2)}s
              </div>
              <span className="text-[10px] text-slate-500 block">Actuator response</span>
            </div>

            {/* 6. Postural Stability */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Postural Stability</span>
              <div className="text-2xl font-black text-[#22A06B]">{activeSession.compensationMetrics.overallStability || 85}%</div>
              <span className="text-[10px] text-slate-500 block">Spatial alignment</span>
            </div>
          </div>

          {/* 2-Column Review Layout: Detailed Metrics on Left + Clinical AI Report on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 cols): Structured Biomechanical & Hardware Findings */}
            <div className="lg:col-span-5 space-y-6">
              {/* Postural Alignment Findings Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-bold text-sm text-[#111827]">Postural Alignment & Kinematics</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Lateral Trunk Deviation:</span>
                    <span className="font-bold text-[#111827]">
                      {activeSession.compensationMetrics.trunkLeanAngle}° ({activeSession.compensationMetrics.trunkLeanDirection || 'right'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Anterior Trunk Inclination:</span>
                    <span className="font-bold text-[#111827]">
                      {activeSession.compensationMetrics.anteriorInclinationRatio || 0.08} ratio
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Shoulder Elevation Asymmetry:</span>
                    <span className="font-bold text-[#111827]">
                      {activeSession.compensationMetrics.shoulderHikeDisplacement} ({activeSession.compensationMetrics.shoulderHikeLevel.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Trunk Rotation:</span>
                    <span className="font-bold text-[#111827]">
                      {activeSession.compensationMetrics.torsoRotationAngle}° ({activeSession.compensationMetrics.torsoRotationLevel.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Postural Stability Score:</span>
                    <span className="font-bold text-[#22A06B]">
                      {activeSession.compensationMetrics.overallStability || 85}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Performance & Bilateral Dynamics Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Cpu className="w-4 h-4 text-[#7C6CE7]" />
                  <h3 className="font-bold text-sm text-[#111827]">MSV1 Hardware Telemetry & Dynamics</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Force Output:</span>
                    <span className="font-bold text-[#111827]">{activeSession.telemetry.force}%</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Bilateral Force-Output Asymmetry:</span>
                    <span className="font-bold text-[#2563EB]">{calculateAsymmetry(activeSession)}%</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Left Pedal Sensor Output:</span>
                    <span className="font-bold text-[#111827]">{activeSession.telemetry.leftForce || 135} ADC</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Right Pedal Sensor Output:</span>
                    <span className="font-bold text-[#111827]">{activeSession.telemetry.rightForce || 122} ADC</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Reaction Latency:</span>
                    <span className="font-bold text-[#7C6CE7]">
                      {(activeSession.telemetry.reaction_time !== undefined ? activeSession.telemetry.reaction_time : activeSession.telemetry.reactionTime).toFixed(2)}s
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                    <span className="text-slate-600 font-medium">Target Strike Accuracy:</span>
                    <span className="font-bold text-[#22A06B]">{activeSession.telemetry.accuracy}%</span>
                  </div>
                </div>
              </div>

              {/* Professional Review Discussion Points */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-[#111827]">Professional Review Points</h3>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      Review relationship between <strong>Lateral Trunk Deviation ({activeSession.compensationMetrics.trunkLeanAngle}°)</strong> and strike accuracy.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      Evaluate <strong>Bilateral Force-Output Asymmetry ({calculateAsymmetry(activeSession)}%)</strong> across multi-trial sets.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      Observe user response to real-time voice coaching cues during terminal movement phases.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column (7 cols): Full AI Report Card */}
            <div className="lg:col-span-7 space-y-6">
              <AIReportCard session={activeSession} />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          TAB 2: LONGITUDINAL TRENDS
          ================================================== */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-[#111827]">Longitudinal Rehabilitation Trajectory</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracking motor performance, postural alignment, and bilateral balance across consecutive sessions.
                </p>
              </div>

              {/* Metric Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-[#E5E7EB] text-xs">
                <button
                  onClick={() => setActiveChartMetric('quality')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'quality'
                      ? 'bg-white text-[#22A06B] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Movement Quality (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('lateralTrunk')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'lateralTrunk'
                      ? 'bg-white text-[#D97706] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Lateral Trunk Deviation (°)
                </button>
                <button
                  onClick={() => setActiveChartMetric('bilateralAsymmetry')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'bilateralAsymmetry'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Bilateral Asymmetry (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('reactionLatency')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'reactionLatency'
                      ? 'bg-white text-[#7C6CE7] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Reaction Latency (s)
                </button>
                <button
                  onClick={() => setActiveChartMetric('forceOutput')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeChartMetric === 'forceOutput'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  Force Output (%)
                </button>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderRadius: '12px',
                      color: '#111827',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Legend />
                  {activeChartMetric === 'quality' && (
                    <>
                      <ReferenceLine y={75} label="Baseline Target (75%)" stroke="#22A06B" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="movementQuality" name="Movement Quality (%)" stroke="#22A06B" strokeWidth={3} dot={{ r: 6 }} />
                    </>
                  )}
                  {activeChartMetric === 'lateralTrunk' && (
                    <Line type="monotone" dataKey="lateralTrunk" name="Lateral Trunk Deviation (°)" stroke="#D97706" strokeWidth={3} dot={{ r: 6 }} />
                  )}
                  {activeChartMetric === 'bilateralAsymmetry' && (
                    <Line type="monotone" dataKey="bilateralAsymmetry" name="Bilateral Force-Output Asymmetry (%)" stroke="#2563EB" strokeWidth={3} dot={{ r: 6 }} />
                  )}
                  {activeChartMetric === 'reactionLatency' && (
                    <Line type="monotone" dataKey="reactionLatency" name="Reaction Latency (s)" stroke="#7C6CE7" strokeWidth={3} dot={{ r: 6 }} />
                  )}
                  {activeChartMetric === 'forceOutput' && (
                    <Line type="monotone" dataKey="forceOutput" name="Force Output (%)" stroke="#2563EB" strokeWidth={3} dot={{ r: 6 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session History Summary Table */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#111827]">Session History Audit Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Session Date</th>
                    <th className="py-2.5 px-3">Data Source</th>
                    <th className="py-2.5 px-3">Movement Quality</th>
                    <th className="py-2.5 px-3">Lateral Trunk</th>
                    <th className="py-2.5 px-3">Bilateral Asymmetry</th>
                    <th className="py-2.5 px-3">Reaction Latency</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {allSessions.map((s) => {
                    const isHw = isHardwareSession(s);
                    const rtVal = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
                    const asym = calculateAsymmetry(s);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#111827]">{s.date}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isHw
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isHw ? 'REAL HARDWARE' : 'APEX 4 DEMO TELEMETRY'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#22A06B]">{s.fusionScore.movementQuality}%</td>
                        <td className="py-3 px-3 text-[#D97706] font-bold">{s.compensationMetrics.trunkLeanAngle}°</td>
                        <td className="py-3 px-3 text-[#2563EB] font-bold">{asym}%</td>
                        <td className="py-3 px-3 text-[#7C6CE7] font-bold">{rtVal.toFixed(2)}s</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedSessionId(s.id);
                              setActiveTab('review');
                            }}
                            className="text-[#2563EB] hover:underline font-bold"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          TAB 3: SESSION COMPARISON
          ================================================== */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base text-[#111827]">Session Comparison Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare biomechanical and hardware performance between two stored sessions.
              </p>
            </div>

            {/* Session Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Baseline Session (A):</label>
                <select
                  value={compareSessionAId}
                  onChange={(e) => setCompareSessionAId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-bold text-[#111827]"
                >
                  {allSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} — {s.id} ({s.fusionScore.movementQuality}% Quality)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Comparison Session (B):</label>
                <select
                  value={compareSessionBId}
                  onChange={(e) => setCompareSessionBId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-bold text-[#111827]"
                >
                  {allSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} — {s.id} ({s.fusionScore.movementQuality}% Quality)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-3 px-4">Biomechanical / Hardware Parameter</th>
                    <th className="py-3 px-4">{sessionA.date} (Session A)</th>
                    <th className="py-3 px-4">{sessionB.date} (Session B)</th>
                    <th className="py-3 px-4 text-right">Delta ($A \rightarrow B$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Movement Quality */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#111827]">Movement Quality</td>
                    <td className="py-3 px-4">{sessionA.fusionScore.movementQuality}%</td>
                    <td className="py-3 px-4">{sessionB.fusionScore.movementQuality}%</td>
                    <td className="py-3 px-4 text-right font-bold text-[#22A06B]">
                      {sessionB.fusionScore.movementQuality - sessionA.fusionScore.movementQuality > 0 ? '+' : ''}
                      {sessionB.fusionScore.movementQuality - sessionA.fusionScore.movementQuality}%
                    </td>
                  </tr>

                  {/* Lateral Trunk Deviation */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#111827]">Lateral Trunk Deviation</td>
                    <td className="py-3 px-4">{sessionA.compensationMetrics.trunkLeanAngle}°</td>
                    <td className="py-3 px-4">{sessionB.compensationMetrics.trunkLeanAngle}°</td>
                    <td className="py-3 px-4 text-right font-bold text-[#D97706]">
                      {(sessionB.compensationMetrics.trunkLeanAngle - sessionA.compensationMetrics.trunkLeanAngle).toFixed(1)}°
                    </td>
                  </tr>

                  {/* Shoulder Elevation Asymmetry */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#111827]">Shoulder Elevation Asymmetry</td>
                    <td className="py-3 px-4">{sessionA.compensationMetrics.shoulderHikeDisplacement}</td>
                    <td className="py-3 px-4">{sessionB.compensationMetrics.shoulderHikeDisplacement}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">
                      {(sessionB.compensationMetrics.shoulderHikeDisplacement - sessionA.compensationMetrics.shoulderHikeDisplacement).toFixed(3)}
                    </td>
                  </tr>

                  {/* Bilateral Force-Output Asymmetry */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#111827]">Bilateral Force-Output Asymmetry</td>
                    <td className="py-3 px-4">{asymA}%</td>
                    <td className="py-3 px-4">{asymB}%</td>
                    <td className="py-3 px-4 text-right font-bold text-[#2563EB]">
                      {(asymB - asymA).toFixed(1)}%
                    </td>
                  </tr>

                  {/* Reaction Latency */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#111827]">Reaction Latency</td>
                    <td className="py-3 px-4">{rtA.toFixed(2)}s</td>
                    <td className="py-3 px-4">{rtB.toFixed(2)}s</td>
                    <td className="py-3 px-4 text-right font-bold text-[#7C6CE7]">
                      {(rtB - rtA).toFixed(2)}s
                    </td>
                  </tr>

                  {/* Force Output */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#111827]">Force Output</td>
                    <td className="py-3 px-4">{sessionA.telemetry.force}%</td>
                    <td className="py-3 px-4">{sessionB.telemetry.force}%</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">
                      {sessionB.telemetry.force - sessionA.telemetry.force > 0 ? '+' : ''}
                      {sessionB.telemetry.force - sessionA.telemetry.force}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      <SessionDetailsModal
        session={selectedSessionForModal}
        onClose={() => setSelectedSessionForModal(null)}
      />
    </div>
  );
};
