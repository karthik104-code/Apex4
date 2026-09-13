import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, Clock, Activity, ArrowRight, PlayCircle } from 'lucide-react';
import { RehabSession } from '../types/rehab';
import { Button } from '../components/ui/Button';

interface SessionHistoryPageProps {
  sessions: RehabSession[];
}

export const SessionHistoryPage: React.FC<SessionHistoryPageProps> = ({ sessions }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-semibold uppercase tracking-wider border border-primary-500/30">
              Session Archive
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Patient Session History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of past MSV1 rehabilitation sessions, pose analysis, and actuator telemetry.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/session')}>
          <PlayCircle className="w-4 h-4" />
          <span>New Session</span>
        </Button>
      </div>

      <div className="space-y-4">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{s.patientName}</h3>
                  <span className="text-xs text-slate-400">
                    {s.date} • {Math.round(s.durationSeconds / 60)} mins
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  Movement Quality: {s.fusionScore.movementQuality}%
                </span>
                <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold border border-primary-500/40">
                  Accuracy: {s.telemetry.accuracy}%
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
              <span>{s.fusionScore.compensationSummary}</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1"
              >
                <span>View Dashboard Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
