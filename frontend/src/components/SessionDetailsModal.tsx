import React from 'react';
import { X, Calendar, Clock, Activity, Cpu, Sparkles, User, ShieldAlert, ChevronRight } from 'lucide-react';
import { RehabSession } from '../types/rehab';
import { AIReportCard } from './AIReportCard';
import { Button } from './ui/Button';

interface SessionDetailsModalProps {
  session: RehabSession | null;
  onClose: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const reactionTimeVal = session.telemetry.reaction_time !== undefined 
    ? session.telemetry.reaction_time 
    : session.telemetry.reactionTime;

  const consistencyVal = session.telemetry.consistency !== undefined 
    ? session.telemetry.consistency 
    : session.telemetry.strikeConsistency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-6 bg-slate-900 text-slate-100 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 pr-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold uppercase tracking-wider border border-primary-500/30">
                Session Audit Record #{session.id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-blue" />
              {session.patientName} — Detailed Session Summary
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {session.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDuration(session.durationSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">Movement Quality</span>
            <span className="text-2xl font-black text-emerald-400">{session.fusionScore.movementQuality}%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">Hardware Accuracy</span>
            <span className="text-2xl font-black text-cyan-400">{session.telemetry.accuracy}%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">Trunk Lean Deviation</span>
            <span className="text-2xl font-black text-amber-400">{session.compensationMetrics.trunkLeanAngle}°</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">Reaction Time</span>
            <span className="text-2xl font-black text-purple-300">{reactionTimeVal.toFixed(2)}s</span>
          </div>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pose Compensation Metrics */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Computer Vision Pose Metrics
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Trunk Lean Angle:</span>
                <span className="font-bold text-slate-200">{session.compensationMetrics.trunkLeanAngle}° ({session.compensationMetrics.trunkLeanLevel.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Shoulder Hike Displacement:</span>
                <span className="font-bold text-slate-200">{(session.compensationMetrics.shoulderHikeDisplacement * 100).toFixed(1)}% ({session.compensationMetrics.shoulderHikeLevel.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Torso Rotation Angle:</span>
                <span className="font-bold text-slate-200">{session.compensationMetrics.torsoRotationAngle}° ({session.compensationMetrics.torsoRotationLevel.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Posture Stability:</span>
                <span className="font-bold text-teal-300">{session.compensationMetrics.overallStability}%</span>
              </div>
            </div>
          </div>

          {/* MSV1 Hardware Telemetry */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-accent-purple uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              MSV1 Actuator Telemetry
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Actuator Force Output:</span>
                <span className="font-bold text-slate-200">{session.telemetry.force}%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Reaction Time:</span>
                <span className="font-bold text-purple-300">{reactionTimeVal.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Target Strike Accuracy:</span>
                <span className="font-bold text-emerald-300">{session.telemetry.accuracy}%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80">
                <span className="text-slate-400">Strike Consistency:</span>
                <span className="font-bold text-amber-300">{consistencyVal}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded AI Session Report Card */}
        <div className="pt-2">
          <AIReportCard session={session} />
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="secondary" size="md" onClick={onClose}>
            <span>Close Details</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
