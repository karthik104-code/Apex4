import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, Clock, Activity, ArrowRight, PlayCircle, Eye, Cpu, ChevronRight } from 'lucide-react';
import { RehabSession } from '../types/rehab';
import { Button } from '../components/ui/Button';
import { SessionDetailsModal } from '../components/SessionDetailsModal';

interface SessionHistoryPageProps {
  sessions: RehabSession[];
}

export const SessionHistoryPage: React.FC<SessionHistoryPageProps> = ({ sessions }) => {
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<RehabSession | null>(null);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-semibold uppercase tracking-wider border border-primary-500/30">
              Session Archive
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Patient Session History Archive</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of past MSV1 rehabilitation sessions, pose analysis, and actuator telemetry.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/session')}>
          <PlayCircle className="w-4 h-4" />
          <span>Launch New Session</span>
        </Button>
      </div>

      {/* Session List */}
      <div className="space-y-4">
        {sessions.map((s) => {
          const rt = s.telemetry.reaction_time !== undefined ? s.telemetry.reaction_time : s.telemetry.reactionTime;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedSession(s)}
              className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 hover:border-primary-500/50 hover:bg-slate-900/90 transition-all cursor-pointer"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{s.patientName}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(s.durationSeconds)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    Quality: {s.fusionScore.movementQuality}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    Accuracy: {s.telemetry.accuracy}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    Lean: {s.compensationMetrics.trunkLeanAngle}° ({s.compensationMetrics.trunkLeanLevel.toUpperCase()})
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                    RT: {rt.toFixed(2)}s
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
                <span className="text-slate-300 font-medium">{s.fusionScore.compensationSummary}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSession(s);
                  }}
                  className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 bg-primary-500/10 px-3 py-1 rounded-xl border border-primary-500/30"
                >
                  <span>View Details & AI Report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
};
