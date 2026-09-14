import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, Clock, Activity, Cpu, Sparkles, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PoseCameraView } from '../components/PoseCameraView';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { TelemetrySourceBadge } from '../components/TelemetrySourceBadge';
import { FusionInsightPanel } from '../components/FusionInsightPanel';
import { VoiceCoachIndicator } from '../components/VoiceCoachIndicator';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import {
  PoseLandmark,
  BaselineCalibration,
  CompensationMetrics,
  HardwareTelemetry,
  RehabSession,
} from '../types/rehab';
import { calculateCompensation, calibrateBaseline } from '../pose/compensation';
import { msv1Hardware } from '../services/hardwareSimulator';
import { hardwareBridgeClient } from '../services/hardwareBridge';
import { sessionRecorder } from '../services/sessionRecorder';
import { computeSensorFusionScore, ExtendedFusionScore } from '../services/fusionEngine';
import { useVoicePostureCoach } from '../hooks/useVoicePostureCoach';

interface LiveSessionPageProps {
  calibration: BaselineCalibration;
  onSessionCompleted: (session: RehabSession) => void;
}

export const LiveSessionPage: React.FC<LiveSessionPageProps> = ({
  calibration: initialCalibration,
  onSessionCompleted,
}) => {
  const navigate = useNavigate();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calibration state inside live experience
  const [calibration, setCalibration] = useState<BaselineCalibration>(initialCalibration);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Live pose landmarks & metric state
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmark[]>([]);
  const [compensation, setCompensation] = useState<CompensationMetrics>(
    calculateCompensation([])
  );
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>(
    msv1Hardware.getSimulatedTelemetry()
  );
  const [fusionScore, setFusionScore] = useState<ExtendedFusionScore>(
    computeSensorFusionScore(compensation, telemetry)
  );

  // Voice Posture Commander Hook
  const {
    isVoiceCoachEnabled,
    isSpeaking,
    activeCorrection,
    toggleVoiceCoach,
    processPostureFrame,
  } = useVoicePostureCoach({
    enabled: true,
    isSessionActive,
    poseConfidence: currentLandmarks.length > 0 ? 0.95 : 0.0,
    isPoseDetected: currentLandmarks.length > 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to Real-Time Hardware Bridge WebSocket Telemetry
  useEffect(() => {
    const unsubscribe = hardwareBridgeClient.subscribeTelemetry((liveData) => {
      if (liveData.source === 'hardware' || liveData.hardwareConnected) {
        setTelemetry(liveData);
        setFusionScore(computeSensorFusionScore(compensation, liveData));
      }
    });

    return () => unsubscribe();
  }, [compensation]);

  // Timer effect & 1Hz structured session snapshot recording
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);

        // Fetch latest telemetry if in simulation mode
        let currentTel = telemetry;
        if (!telemetry.hardwareConnected && telemetry.mode === 'simulated') {
          currentTel = msv1Hardware.getSimulatedTelemetry();
          setTelemetry(currentTel);
          setFusionScore(computeSensorFusionScore(compensation, currentTel));
        }

        // Record structured 1Hz snapshot
        sessionRecorder.recordSnapshot(currentTel, compensation, fusionScore);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, compensation, telemetry, fusionScore]);

  // Handle live pose landmarks from Camera View
  const handlePoseDetected = (landmarks: PoseLandmark[]) => {
    setCurrentLandmarks(landmarks);
    const comp = calculateCompensation(landmarks, calibration);
    setCompensation(comp);
    const fused = computeSensorFusionScore(comp, telemetry);
    setFusionScore(fused);

    // Evaluate posture for voice coaching
    processPostureFrame(comp, landmarks.length > 0 ? 0.95 : 0.0, landmarks.length > 0);
  };

  // 1-Click Neutral Posture Calibration
  const handleCalibrate = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      const newCal = calibrateBaseline(currentLandmarks);
      setCalibration(newCal);
      setIsCalibrating(false);
      setToastMessage('Calibration complete.');
    }, 1200);
  };

  const handleStartSession = () => {
    const activeState = sessionRecorder.getRecordingState();
    const source = (telemetry.hardwareConnected || telemetry.source === 'hardware') ? 'hardware' : 'demo';

    if (activeState === 'paused') {
      sessionRecorder.resumeSession();
      setToastMessage('Session Resumed');
    } else {
      const sid = sessionRecorder.startSession(source);
      setToastMessage(`Live Rehabilitation Session Started (${source.toUpperCase()} mode, ID: ${sid.slice(0, 12)})`);
    }
    setIsSessionActive(true);
  };

  const handlePauseSession = () => {
    sessionRecorder.pauseSession();
    setIsSessionActive(false);
    setToastMessage('Session Paused');
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    const recordedData = sessionRecorder.endSession();

    const completedSession: RehabSession = {
      id: recordedData.sessionId,
      sessionId: recordedData.sessionId,
      startedAt: recordedData.startedAt,
      endedAt: recordedData.endedAt,
      source: recordedData.source,
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: new Date(recordedData.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      durationSeconds: recordedData.durationSeconds || sessionSeconds,
      fusionScore: recordedData.analytics,
      compensationMetrics: recordedData.vision,
      telemetry: recordedData.telemetry,
      recordedSessionData: recordedData,
      status: recordedData.status === 'completed' ? 'completed' : 'invalid',
    };

    onSessionCompleted(completedSession);
    setToastMessage(`Session completed (${recordedData.sampleCount || 0} measurements recorded). Navigating...`);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-[#FEE2E2] text-[#EF4444] border border-red-200';
      case 'medium':
        return 'bg-[#FEF3C7] text-[#D97706] border border-amber-200';
      case 'low':
      default:
        return 'bg-[#EAF8F1] text-[#22A06B] border border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* ==================================================
          HEADER
          ================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: APEX 4 Logo + Live Rehabilitation Title */}
        <div className="flex items-center gap-3">
          <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-8 h-8 object-contain" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#111827] tracking-tight">Live Rehabilitation</h1>
              {/* Tracking Indicator Pill */}
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8F1] text-[#22A06B] text-[11px] font-bold flex items-center gap-1.5 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
                Vision Active
              </span>
              <TelemetrySourceBadge />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Movement analysis & APEX 4 telemetry
            </p>
          </div>
        </div>

        {/* Right: Timer & Session Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timer Display */}
          <div className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-2 text-[#111827] font-mono text-xs font-bold shadow-xs">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>{formatTimer(sessionSeconds)}</span>
          </div>

          {/* Neutral Calibration Action */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCalibrate}
            disabled={isCalibrating}
            className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#2563EB] hover:bg-slate-50 font-semibold rounded-lg px-3 py-2 text-xs shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span>{isCalibrating ? 'Calibrating...' : 'Calibrate'}</span>
          </Button>

          {/* Session Play / Pause / End Buttons */}
          {!isSessionActive ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartSession}
              className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePauseSession}
              className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#111827] hover:bg-slate-50 font-semibold rounded-lg px-3.5 py-2 text-xs shadow-xs"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </Button>
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={handleEndSession}
            disabled={sessionSeconds === 0 && !isSessionActive}
            className="flex items-center gap-1.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Session</span>
          </Button>
        </div>
      </div>

      {/* ==================================================
          MAIN LAYOUT (Two-Column Desktop)
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 cols): Camera Feed (Main Focus) & Pose Overlay */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Camera Viewport */}
          <PoseCameraView
            onPoseDetected={handlePoseDetected}
            isCalibrating={isCalibrating}
            calibrationCompleted={calibration.isCalibrated}
            compensationMetrics={compensation}
            onCalibrate={handleCalibrate}
          />

          {/* Simple Calibration Banner */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span className="font-semibold text-[#111827]">
                {calibration.isCalibrated
                  ? 'Calibration complete.'
                  : 'Find your neutral position.'}
              </span>
            </div>
            <span className="text-slate-500">
              {calibration.isCalibrated
                ? `Saved neutral posture (${new Date(calibration.timestamp).toLocaleTimeString()})`
                : 'Click Calibrate in header to set baseline'}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Movement Analysis & APEX 4 Performance */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Voice Posture Coach Indicator */}
          <VoiceCoachIndicator
            isEnabled={isVoiceCoachEnabled}
            isSpeaking={isSpeaking}
            activeCorrection={activeCorrection}
            onToggle={toggleVoiceCoach}
          />

          {/* Movement Analysis Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-bold text-base text-[#111827]">Movement Analysis</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Vision AI
              </span>
            </div>

            {/* Movement Quality Score */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Movement Quality</span>
                <div className="text-3xl font-black text-[#22A06B] tracking-tight">
                  {compensation.overallStability}%
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#EAF8F1] border border-emerald-200 text-xs font-bold text-[#22A06B]">
                OPTIMAL
              </span>
            </div>

            {/* Posture Compensation Rows with Clean Typography */}
            <div className="space-y-2 text-xs">
              {/* Trunk Lean */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                <span className="font-medium text-slate-600">Trunk Lean</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111827]">{compensation.trunkLeanAngle}°</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBadgeStyle(compensation.trunkLeanLevel)}`}>
                    {compensation.trunkLeanLevel}
                  </span>
                </div>
              </div>

              {/* Shoulder Hike */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                <span className="font-medium text-slate-600">Shoulder Hike</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111827]">{compensation.shoulderHikeDisplacement}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBadgeStyle(compensation.shoulderHikeLevel)}`}>
                    {compensation.shoulderHikeLevel}
                  </span>
                </div>
              </div>

              {/* Torso Rotation */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                <span className="font-medium text-slate-600">Torso Rotation</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111827]">{compensation.torsoRotationAngle}°</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBadgeStyle(compensation.torsoRotationLevel)}`}>
                    {compensation.torsoRotationLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* APEX 4 Performance Telemetry Panel */}
          <TelemetryPanel
            telemetry={telemetry}
            onSelectPreset={(preset) => {
              msv1Hardware.setPreset(preset);
              const updated = msv1Hardware.getSimulatedTelemetry();
              setTelemetry(updated);
              setFusionScore(computeSensorFusionScore(compensation, updated));
            }}
            onToggleMode={() => {
              const current = msv1Hardware.getMode();
              const next = current === 'simulated' ? 'hardware' : 'simulated';
              msv1Hardware.setMode(next);
              const updated = msv1Hardware.getSimulatedTelemetry();
              setTelemetry(updated);
              setFusionScore(computeSensorFusionScore(compensation, updated));
            }}
          />

          {/* AI Insight Sensor Fusion Panel */}
          <FusionInsightPanel
            compensation={compensation}
            telemetry={telemetry}
            fusionScore={fusionScore}
          />
        </div>
      </div>
    </div>
  );
};
