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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E5E7EB] p-6 space-y-6 text-[#111827] shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-[#111827] hover:bg-slate-200 transition-all border border-[#E5E7EB]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 pr-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2FF] text-[#2563EB] text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                Session Audit Record #{session.id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
              <User className="w-5 h-5 text-[#2563EB]" />
              {session.patientName} — Detailed Session Summary
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
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
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
            <span className="text-slate-500 font-medium block">Movement Quality</span>
            <span className="text-2xl font-black text-[#22A06B]">{session.fusionScore.movementQuality}%</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
            <span className="text-slate-500 font-medium block">Hardware Accuracy</span>
            <span className="text-2xl font-black text-[#2563EB]">{session.telemetry.accuracy}%</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
            <span className="text-slate-500 font-medium block">Trunk Lean Deviation</span>
            <span className="text-2xl font-black text-[#D97706]">{session.compensationMetrics.trunkLeanAngle}°</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
            <span className="text-slate-500 font-medium block">Reaction Time</span>
            <span className="text-2xl font-black text-[#7C6CE7]">{reactionTimeVal.toFixed(2)}s</span>
          </div>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pose Compensation Metrics */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
            <h4 className="font-bold text-xs text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Computer Vision Pose Metrics
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Trunk Lean Angle:</span>
                <span className="font-bold text-[#111827]">{session.compensationMetrics.trunkLeanAngle}° ({session.compensationMetrics.trunkLeanLevel.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Shoulder Hike Displacement:</span>
                <span className="font-bold text-[#111827]">{(session.compensationMetrics.shoulderHikeDisplacement * 100).toFixed(1)}% ({session.compensationMetrics.shoulderHikeLevel.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Torso Rotation Angle:</span>
                <span className="font-bold text-[#111827]">{session.compensationMetrics.torsoRotationAngle}° ({session.compensationMetrics.torsoRotationLevel.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Posture Stability:</span>
                <span className="font-bold text-[#22A06B]">{session.compensationMetrics.overallStability}%</span>
              </div>
            </div>
          </div>

          {/* APEX 4 Hardware Telemetry */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
            <h4 className="font-bold text-xs text-[#7C6CE7] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              APEX 4 Actuator Telemetry
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Actuator Force Output:</span>
                <span className="font-bold text-[#111827]">{session.telemetry.force}%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Reaction Time:</span>
                <span className="font-bold text-[#7C6CE7]">{reactionTimeVal.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Target Strike Accuracy:</span>
                <span className="font-bold text-[#22A06B]">{session.telemetry.accuracy}%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-slate-500">Strike Consistency:</span>
                <span className="font-bold text-[#D97706]">{consistencyVal}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded AI Session Report Card */}
        <div className="pt-2">
          <AIReportCard session={session} />
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button 
            variant="secondary" 
            size="md" 
            onClick={onClose}
            className="bg-white border border-[#E5E7EB] text-[#111827] hover:bg-slate-50 font-semibold rounded-lg px-4 py-2"
          >
            <span>Close Details</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
