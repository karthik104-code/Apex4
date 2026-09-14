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
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2FF] text-[#2563EB] text-[10px] font-semibold uppercase tracking-wider border border-blue-200">
              Session Archive
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              AVAILABLE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Patient Session History Archive</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of past APEX 4 rehabilitation sessions, pose analysis, and actuator telemetry.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="md" 
          onClick={() => navigate('/session')}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2"
        >
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
              className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EAF2FF] border border-blue-200 flex items-center justify-center text-[#2563EB] font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111827]">{s.patientName}</h3>
                    <span className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(s.durationSeconds)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-[#EAF8F1] text-[#22A06B] font-bold border border-emerald-200">
                    Quality: {s.fusionScore.movementQuality}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#EAF2FF] text-[#2563EB] font-bold border border-blue-200">
                    Accuracy: {s.telemetry.accuracy}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold border border-amber-200">
                    Lean: {s.compensationMetrics.trunkLeanAngle}° ({s.compensationMetrics.trunkLeanLevel.toUpperCase()})
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#F2F0FF] text-[#7C6CE7] font-bold border border-purple-200">
                    RT: {rt.toFixed(2)}s
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5E7EB] text-xs text-[#111827] flex flex-wrap items-center justify-between gap-3">
                <span className="text-slate-700 font-medium">{s.fusionScore.compensationSummary}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSession(s);
                  }}
                  className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 bg-[#EAF2FF] px-3 py-1 rounded-lg border border-blue-200"
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
