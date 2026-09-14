import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Square, Clock, Activity, Cpu, Sparkles, RefreshCw, 
  CheckCircle2, ShieldCheck, ArrowRight, RotateCcw, LayoutDashboard, History,
  Compass, AlertCircle, Award, Scale
} from 'lucide-react';
import { PoseCameraView } from '../components/PoseCameraView';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { TelemetrySourceBadge } from '../components/TelemetrySourceBadge';
import { FusionInsightPanel } from '../components/FusionInsightPanel';
import { VoiceCoachIndicator } from '../components/VoiceCoachIndicator';
import { AIReportCard } from '../components/AIReportCard';
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

export type SessionWorkflowStage = 'READY' | 'CALIBRATING' | 'ACTIVE' | 'PAUSED' | 'SUMMARY';

interface LiveSessionPageProps {
  calibration: BaselineCalibration;
  onSessionCompleted: (session: RehabSession) => void;
}

export const LiveSessionPage: React.FC<LiveSessionPageProps> = ({
  calibration: initialCalibration,
  onSessionCompleted,
}) => {
  const navigate = useNavigate();
  
  // Workflow State Machine: READY -> CALIBRATING -> ACTIVE / PAUSED -> SUMMARY
  const [stage, setStage] = useState<SessionWorkflowStage>('READY');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calibration state
  const [calibration, setCalibration] = useState<BaselineCalibration>(initialCalibration);
  const [calibrationCountdown, setCalibrationCountdown] = useState(3);

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

  // Completed Session Result for Summary View
  const [completedSession, setCompletedSession] = useState<RehabSession | null>(null);

  const isSessionActive = stage === 'ACTIVE';

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
    if (stage === 'ACTIVE') {
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
  }, [stage, compensation, telemetry, fusionScore]);

  // Handle live pose landmarks from Camera View
  const handlePoseDetected = (landmarks: PoseLandmark[]) => {
    setCurrentLandmarks(landmarks);
    const comp = calculateCompensation(landmarks, calibration);
    setCompensation(comp);
    const fused = computeSensorFusionScore(comp, telemetry);
    setFusionScore(fused);

    // Evaluate posture for voice coaching
    if (stage === 'ACTIVE') {
      processPostureFrame(comp, landmarks.length > 0 ? 0.95 : 0.0, landmarks.length > 0);
    }
  };

  // Step 1: Guided Neutral Posture Calibration with Countdown
  const handleStartCalibration = () => {
    setStage('CALIBRATING');
    setCalibrationCountdown(3);

    const interval = setInterval(() => {
      setCalibrationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const newCal = calibrateBaseline(currentLandmarks);
          setCalibration(newCal);
          setStage('READY');
          setToastMessage('Neutral baseline calibration established.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 2: Start / Resume Active Session
  const handleStartSession = () => {
    const activeState = sessionRecorder.getRecordingState();
    const source = (telemetry.hardwareConnected || telemetry.source === 'hardware') ? 'hardware' : 'demo';

    if (activeState === 'paused') {
      sessionRecorder.resumeSession();
      setToastMessage('Rehabilitation Session Resumed');
    } else {
      const sid = sessionRecorder.startSession(source);
      setToastMessage(`Live Rehabilitation Session Started (${source.toUpperCase()} mode)`);
    }
    setStage('ACTIVE');
  };

  // Step 3: Pause Session
  const handlePauseSession = () => {
    sessionRecorder.pauseSession();
    setStage('PAUSED');
    setToastMessage('Session Paused');
  };

  // Step 4: End Session & Transition to In-Place Summary
  const handleEndSession = () => {
    const recordedData = sessionRecorder.endSession();

    const sessionResult: RehabSession = {
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

    setCompletedSession(sessionResult);
    onSessionCompleted(sessionResult);
    setStage('SUMMARY');
    setToastMessage('Session completed. Reviewing rehabilitation summary & report.');
  };

  // Reset workflow to launch a fresh session
  const handleStartNewSession = () => {
    setSessionSeconds(0);
    setCompletedSession(null);
    setStage('READY');
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
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden pb-12">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* ==================================================
          GUIDED WORKFLOW STEPPER HEADER
          ================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Branding & Workflow Step Progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827] tracking-tight">
                  {stage === 'SUMMARY' ? 'Session Completed' : 'Live Rehabilitation Session'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AVAILABLE
                </span>
                <TelemetrySourceBadge />
              </div>
            </div>
          </div>

          {/* 3-Step Guided Workflow Progress Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              calibration.isCalibrated ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-blue-50 text-blue-700 font-bold'
            }`}>
              {calibration.isCalibrated ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>}
              <span>1. Baseline Calibration</span>
            </div>

            <span className="text-slate-300">→</span>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              stage === 'ACTIVE' || stage === 'PAUSED' ? 'bg-blue-600 text-white font-bold shadow-xs' : stage === 'SUMMARY' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-slate-100 text-slate-500'
            }`}>
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">2</span>
              <span>2. Active Rehabilitation</span>
            </div>

            <span className="text-slate-300">→</span>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              stage === 'SUMMARY' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}>
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">3</span>
              <span>3. Clinical Summary</span>
            </div>
          </div>
        </div>

        {/* Right: Live Session Controls & Timer */}
        {stage !== 'SUMMARY' && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Session Timer */}
            <div className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-2 text-[#111827] font-mono text-xs font-bold shadow-xs">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>{formatTimer(sessionSeconds)}</span>
            </div>

            {/* Calibration Trigger */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStartCalibration}
              disabled={stage === 'CALIBRATING'}
              className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#2563EB] hover:bg-slate-50 font-semibold rounded-lg px-3 py-2 text-xs shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${stage === 'CALIBRATING' ? 'animate-spin' : ''}`} />
              <span>{stage === 'CALIBRATING' ? `Calibrating (${calibrationCountdown}s)...` : 'Calibrate Baseline'}</span>
            </Button>

            {/* Play / Pause / Start Controls */}
            {stage === 'ACTIVE' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePauseSession}
                className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#111827] hover:bg-slate-50 font-semibold rounded-lg px-3.5 py-2 text-xs shadow-xs"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartSession}
                disabled={stage === 'CALIBRATING'}
                className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{stage === 'PAUSED' ? 'Resume Session' : 'Start Session'}</span>
              </Button>
            )}

            {/* End Session Button */}
            <Button
              variant="danger"
              size="sm"
              onClick={handleEndSession}
              disabled={sessionSeconds === 0 && stage !== 'ACTIVE' && stage !== 'PAUSED'}
              className="flex items-center gap-1.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Session</span>
            </Button>
          </div>
        )}

        {/* Controls when in SUMMARY stage */}
        {stage === 'SUMMARY' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartNewSession}
              className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 font-semibold rounded-lg px-3 py-2 text-xs shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Therapist Dashboard</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 font-semibold rounded-lg px-3 py-2 text-xs shadow-xs"
            >
              <History className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Session History</span>
            </Button>
          </div>
        )}
      </div>

      {/* ==================================================
          STAGE-AWARE GUIDANCE & NEXT-ACTION BANNER
          ================================================== */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${
            stage === 'ACTIVE'
              ? 'bg-red-500 animate-pulse'
              : stage === 'CALIBRATING'
              ? 'bg-amber-500 animate-spin'
              : stage === 'SUMMARY'
              ? 'bg-emerald-500'
              : 'bg-blue-500'
          }`} />
          <span className="font-bold text-[#111827]">
            {stage === 'READY' && 'Stage 1: Ready to Begin Session'}
            {stage === 'CALIBRATING' && `Stage 1: Neutral Posture Calibration (${calibrationCountdown}s)...`}
            {stage === 'ACTIVE' && 'Stage 2: Live Rehabilitation Session Active & Recording'}
            {stage === 'PAUSED' && 'Stage 2: Rehabilitation Session Paused'}
            {stage === 'SUMMARY' && 'Stage 3: Session Complete — Reviewing Clinical Assessment'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">
            {stage === 'READY' && 'Click "Calibrate Baseline" to set neutral posture, or click "Start Session" to begin.'}
            {stage === 'CALIBRATING' && 'Maintain an upright neutral seated posture facing the camera.'}
            {stage === 'ACTIVE' && 'Perform exercises on MSV1 actuator. Real-time voice coaching is active.'}
            {stage === 'PAUSED' && 'Click "Resume Session" to continue exercise or "End Session" to finalize.'}
            {stage === 'SUMMARY' && 'Review movement quality metrics, hardware dynamics, and AI report below.'}
          </span>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
          {telemetry.hardwareConnected || telemetry.source === 'hardware' ? '● Real Hardware' : '◌ Demo Mode'}
        </span>
      </div>

      {/* ==================================================
          STAGE 1 & 2: LIVE SESSION MONITORING VIEW
          ================================================== */}
      {stage !== 'SUMMARY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (7 cols): Camera Feed & Live Pose Tracking */}
          <div className="lg:col-span-7 space-y-4">
            <PoseCameraView
              onPoseDetected={handlePoseDetected}
              isCalibrating={stage === 'CALIBRATING'}
              calibrationCompleted={calibration.isCalibrated}
              compensationMetrics={compensation}
              onCalibrate={handleStartCalibration}
            />

            {/* Calibration & Neutral Alignment Status Card */}
            <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="font-semibold text-[#111827]">
                  {calibration.isCalibrated
                    ? 'Baseline Neutral Alignment Established'
                    : 'Neutral Calibration Recommended Before Active Play'}
                </span>
              </div>
              <span className="text-slate-500">
                {calibration.isCalibrated
                  ? `Saved neutral posture (${new Date(calibration.timestamp).toLocaleTimeString()})`
                  : 'Click Calibrate Baseline to align posture zero-point'}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): Live Telemetry, Voice Coach & Fusion Score */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Voice Posture Coach Indicator */}
            <VoiceCoachIndicator
              isEnabled={isVoiceCoachEnabled}
              isSpeaking={isSpeaking}
              activeCorrection={activeCorrection}
              onToggle={toggleVoiceCoach}
            />

            {/* Movement Quality & Kinematic Compensation Analysis */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#2563EB]" />
                  <h2 className="font-bold text-sm text-[#111827]">Movement Analysis</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Vision Kinematics
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

              {/* Kinematic Measurement Rows */}
              <div className="space-y-2 text-xs">
                {/* Trunk Lean */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700 block">Lateral Trunk Deviation</span>
                    <span className="text-[10px] text-slate-400 font-medium">Direction: {compensation.trunkLeanDirection || 'Neutral'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111827]">{compensation.trunkLeanAngle}°</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBadgeStyle(compensation.trunkLeanLevel)}`}>
                      {compensation.trunkLeanLevel}
                    </span>
                  </div>
                </div>

                {/* Shoulder Hike */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <span className="font-medium text-slate-700">Shoulder Elevation Asymmetry</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111827]">{compensation.shoulderHikeDisplacement}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBadgeStyle(compensation.shoulderHikeLevel)}`}>
                      {compensation.shoulderHikeLevel}
                    </span>
                  </div>
                </div>

                {/* Torso Rotation */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <span className="font-medium text-slate-700">Torso Rotation</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111827]">{compensation.torsoRotationAngle}°</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBadgeStyle(compensation.torsoRotationLevel)}`}>
                      {compensation.torsoRotationLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MSV1 Performance Telemetry Panel */}
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

            {/* Sensor Fusion Score Summary */}
            <FusionInsightPanel
              compensation={compensation}
              telemetry={telemetry}
              fusionScore={fusionScore}
            />
          </div>
        </div>
      )}

      {/* ==================================================
          STAGE 3: IN-PLACE SESSION SUMMARY & CLINICAL REPORT
          ================================================== */}
      {stage === 'SUMMARY' && completedSession && (
        <div className="space-y-6">
          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">Total Duration</span>
              <div className="text-2xl font-bold text-[#111827] mt-1 font-mono">
                {formatTimer(completedSession.durationSeconds)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Active tracking</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">Movement Quality</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {completedSession.fusionScore.movementQuality}%
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">Sustained stability</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">Reaction Latency</span>
              <div className="text-2xl font-bold text-[#2563EB] mt-1">
                {(completedSession.telemetry.reaction_time || completedSession.telemetry.reactionTime || 1.24).toFixed(2)}s
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Actuator response</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">Strike Accuracy</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {completedSession.telemetry.accuracy}%
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Target acquisition</span>
            </div>
          </div>

          {/* Full-Fidelity 10-Section Clinical AI Rehabilitation Report */}
          <AIReportCard session={completedSession} />
        </div>
      )}
    </div>
  );
};
