import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, Sparkles, Activity, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { PoseCameraView } from '../components/PoseCameraView';
import { CompensationGauges } from '../components/CompensationGauges';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import {
  PoseLandmark,
  BaselineCalibration,
  CompensationMetrics,
  HardwareTelemetry,
  FusionScore,
  RehabSession,
} from '../types/rehab';
import { calculateCompensation, createDefaultCalibration } from '../pose/compensation';
import { msv1Hardware } from '../services/hardwareSimulator';
import { computeSensorFusionScore } from '../services/fusionEngine';

interface LiveSessionPageProps {
  calibration: BaselineCalibration;
  onSessionCompleted: (session: RehabSession) => void;
}

export const LiveSessionPage: React.FC<LiveSessionPageProps> = ({
  calibration,
  onSessionCompleted,
}) => {
  const navigate = useNavigate();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time dynamic states
  const [compensation, setCompensation] = useState<CompensationMetrics>(
    calculateCompensation([])
  );
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>(
    msv1Hardware.getSimulatedTelemetry()
  );
  const [fusionScore, setFusionScore] = useState<FusionScore>(
    computeSensorFusionScore(compensation, telemetry)
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
        // Refresh telemetry on interval
        const latestTel = msv1Hardware.getSimulatedTelemetry();
        setTelemetry(latestTel);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive]);

  // Handle live pose landmarks from Camera View
  const handlePoseDetected = (landmarks: PoseLandmark[]) => {
    const comp = calculateCompensation(landmarks, calibration);
    setCompensation(comp);

    const fused = computeSensorFusionScore(comp, telemetry);
    setFusionScore(fused);
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    setToastMessage('MSV1 Rehabilitation Monitoring Session Started!');
  };

  const handlePauseSession = () => {
    setIsSessionActive(false);
    setToastMessage('Session Paused');
  };

  const handleEndSession = () => {
    setIsSessionActive(false);

    const completedSession: RehabSession = {
      id: `ses-${Date.now()}`,
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      durationSeconds: sessionSeconds || 180,
      fusionScore,
      compensationMetrics: compensation,
      telemetry,
      status: 'completed',
    };

    onSessionCompleted(completedSession);
    setToastMessage('Session saved. Generating AI Clinical Report...');
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/30">
              Live Monitoring System
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Patient: Alex Mercer (Upper Limb Rehab)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Live AI Rehabilitation Session</h1>
        </div>

        {/* Timer & Session Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-200 font-mono text-sm">
            <Clock className="w-4 h-4 text-primary-400" />
            <span>{formatTimer(sessionSeconds)}</span>
          </div>

          {!isSessionActive ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleStartSession}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Session</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handlePauseSession}
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </Button>
          )}

          <Button
            variant="danger"
            size="md"
            onClick={handleEndSession}
            disabled={sessionSeconds === 0 && !isSessionActive}
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>End & Analyze Session</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Camera Feed & Live Gauges */}
        <div className="lg:col-span-8 space-y-6">
          <PoseCameraView onPoseDetected={handlePoseDetected} />
          <CompensationGauges metrics={compensation} />
        </div>

        {/* Right Column (4 cols): Fused Score Card & Telemetry Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Real-time Fused Movement Quality Score Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 bg-gradient-to-b from-slate-900/90 to-surface">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Sensor Fusion Engine
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Real-Time
              </span>
            </div>

            <div className="text-center py-3 border-y border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Movement Quality Score
              </span>
              <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {fusionScore.movementQuality}%
              </div>
              <p className="text-xs text-slate-300 font-medium pt-1">
                {fusionScore.compensationSummary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-slate-400 block text-[11px]">Hardware Score</span>
                <span className="font-bold text-slate-200 text-base">{fusionScore.performanceScore}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-slate-400 block text-[11px]">Combined Index</span>
                <span className="font-bold text-primary-400 text-base">{fusionScore.combinedSessionScore}%</span>
              </div>
            </div>
          </div>

          {/* MSV1 Hardware Telemetry */}
          <TelemetryPanel
            telemetry={telemetry}
            onSelectPreset={(preset) => {
              msv1Hardware.setPreset(preset);
              const updated = msv1Hardware.getSimulatedTelemetry();
              setTelemetry(updated);
            }}
            onToggleMode={() => {
              const current = msv1Hardware.getMode();
              const next = current === 'simulated' ? 'hardware' : 'simulated';
              msv1Hardware.setMode(next);
              setTelemetry(msv1Hardware.getSimulatedTelemetry());
            }}
          />
        </div>
      </div>
    </div>
  );
};
