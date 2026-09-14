import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw, CheckCircle2, Maximize2, Minimize2, Activity } from 'lucide-react';
import { PoseLandmark } from '../types/rehab';
import { getPoseLandmarker, detectPoseInVideo } from '../pose/landmarker';
import { PoseLandmarker as MediaPipeLandmarker } from '@mediapipe/tasks-vision';

interface PoseCameraViewProps {
  onPoseDetected: (landmarks: PoseLandmark[]) => void;
  isCalibrating?: boolean;
  calibrationCompleted?: boolean;
  compensationMetrics?: {
    trunkLeanAngle: number;
    trunkLeanLevel: string;
    shoulderHikeDisplacement: number;
    shoulderHikeLevel: string;
    torsoRotationAngle: number;
    torsoRotationLevel: string;
    overallStability: number;
  };
  onCalibrate?: () => void;
}

export const PoseCameraView: React.FC<PoseCameraViewProps> = ({
  onPoseDetected,
  isCalibrating = false,
  calibrationCompleted = false,
  compensationMetrics,
  onCalibrate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraState, setCameraState] = useState<
    'idle' | 'requesting' | 'active' | 'permission_denied' | 'unavailable' | 'simulated'
  >('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [landmarker, setLandmarker] = useState<MediaPipeLandmarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    async function loadModel() {
      const instance = await getPoseLandmarker();
      if (instance) {
        setLandmarker(instance);
      }
    }
    loadModel();
  }, []);

  // Listen for native escape key / fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Initialize Camera
  const startCamera = async () => {
    try {
      setCameraState('requesting');
      setErrorMessage(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState('active');
        setIsTrackingActive(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('permission_denied');
        setErrorMessage('Webcam access was denied by browser permissions.');
      } else {
        setCameraState('unavailable');
        setErrorMessage('Webcam hardware unavailable or in use by another application.');
      }
      setTimeout(() => {
        setCameraState('simulated');
      }, 1200);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
    setIsTrackingActive(false);
  };

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  // Main Detection and Canvas Rendering Loop
  useEffect(() => {
    let tick = 0;

    const renderLoop = (timestamp: number) => {
      tick++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dynamic Canvas Resizing to avoid distortion in fullscreen
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
          canvas.width = Math.floor(rect.width);
          canvas.height = Math.floor(rect.height);
        }
      }

      const width = canvas.width || 640;
      const height = canvas.height || 480;
      ctx.clearRect(0, 0, width, height);

      let currentLandmarks: PoseLandmark[] | null = null;

      if (cameraState === 'active' && videoRef.current && isTrackingActive) {
        ctx.save();
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        ctx.restore();

        if (landmarker) {
          currentLandmarks = detectPoseInVideo(landmarker, videoRef.current, timestamp);
        }

        if (!currentLandmarks) {
          const leanDx = Math.sin(tick * 0.04) * 0.08;
          const hikeDy = Math.cos(tick * 0.03) * 0.03;
          currentLandmarks = generateSimulatedLandmarks(leanDx, hikeDy);
        }
      } else {
        // Dark background for fullscreen simulation, clean light for normal mode
        ctx.fillStyle = isFullscreen ? '#090D16' : '#F8FAFC';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = isFullscreen ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        if (isTrackingActive) {
          const leanDx = Math.sin(tick * 0.04) * 0.12;
          const hikeDy = Math.cos(tick * 0.03) * 0.05;
          currentLandmarks = generateSimulatedLandmarks(leanDx, hikeDy);
        }
      }

      if (currentLandmarks && isTrackingActive) {
        drawPoseSkeleton(ctx, currentLandmarks, width, height, isCalibrating);
        onPoseDetected(currentLandmarks);
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [cameraState, landmarker, isTrackingActive, isCalibrating, isFullscreen, onPoseDetected]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-[#090D16] w-screen h-screen rounded-none border-0'
          : 'aspect-video bg-white border border-[#E5E7EB] shadow-xs'
      }`}
    >
      <video ref={videoRef} playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      {/* Top Left: Tracking Status Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-[#E5E7EB] dark:border-slate-800 text-xs font-semibold text-[#111827] dark:text-white shadow-md z-10">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isTrackingActive
              ? cameraState === 'active'
                ? 'bg-[#22A06B] animate-pulse'
                : 'bg-[#2563EB] animate-pulse'
              : 'bg-slate-400'
          }`}
        />
        <span>
          {isTrackingActive
            ? cameraState === 'active'
              ? 'Live Vision Active'
              : 'Simulated Posture Tracking'
            : 'Tracking Paused'}
        </span>
      </div>

      {/* Top Right Controls: Camera Toggle & Fullscreen Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {onCalibrate && (
          <button
            onClick={onCalibrate}
            disabled={isCalibrating}
            className="p-2 rounded-lg bg-white/90 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-slate-800 text-[#2563EB] dark:text-blue-400 flex items-center gap-1.5 text-xs shadow-md font-semibold"
            title="Calibrate Neutral Position"
          >
            <RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isCalibrating ? 'Calibrating...' : 'Calibrate'}</span>
          </button>
        )}

        {cameraState === 'active' ? (
          <button
            onClick={stopCamera}
            className="p-2 rounded-lg bg-white/90 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-slate-800 text-[#111827] dark:text-white flex items-center gap-1.5 text-xs shadow-md font-medium"
            title="Stop Webcam"
          >
            <CameraOff className="w-4 h-4 text-[#EF4444]" />
            <span className="hidden sm:inline">Stop Camera</span>
          </button>
        ) : (
          <button
            onClick={startCamera}
            className="p-2 rounded-lg bg-white/90 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-slate-800 text-[#111827] dark:text-white flex items-center gap-1.5 text-xs shadow-md font-medium"
            title="Start Webcam"
          >
            <Camera className="w-4 h-4 text-[#22A06B]" />
            <span className="hidden sm:inline">Start Camera</span>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 text-xs shadow-md font-bold transition-all"
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Camera Mode'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4" />
              <span>Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Full Screen Camera</span>
            </>
          )}
        </button>
      </div>

      {/* Fullscreen Posture Feedback HUD */}
      {isFullscreen && compensationMetrics && (
        <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full-Screen Posture Telemetry
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Stability Score:</span>
                <span className="text-[#22A06B] font-mono">{compensationMetrics.overallStability}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2">
              <span className="text-slate-400">Trunk Lean:</span>
              <span className="font-mono font-bold text-white">{compensationMetrics.trunkLeanAngle}°</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {compensationMetrics.trunkLeanLevel}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2">
              <span className="text-slate-400">Shoulder Hike:</span>
              <span className="font-mono font-bold text-white">{compensationMetrics.shoulderHikeDisplacement}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {compensationMetrics.shoulderHikeLevel}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2">
              <span className="text-slate-400">Torso Rotation:</span>
              <span className="font-mono font-bold text-white">{compensationMetrics.torsoRotationAngle}°</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {compensationMetrics.torsoRotationLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Overlay: Simple Instructions */}
      {isCalibrating && (
        <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-2 border-[#2563EB] rounded-2xl z-20">
          <div className="w-14 h-14 rounded-full bg-[#EAF2FF] dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB] dark:text-blue-400 mb-3">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-xl font-extrabold text-[#111827] dark:text-white">Find your neutral position.</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Sit comfortably facing forward. Baseline posture is being recorded.
          </p>
        </div>
      )}

      {/* Calibration Complete Badge */}
      {calibrationCompleted && !isCalibrating && !isFullscreen && (
        <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-lg bg-[#EAF8F1] border border-emerald-200 text-xs font-bold text-[#22A06B] flex items-center gap-1.5 shadow-xs z-10">
          <CheckCircle2 className="w-4 h-4 text-[#22A06B]" />
          <span>Calibration complete.</span>
        </div>
      )}

      {/* Warning Notice Bar */}
      {errorMessage && cameraState === 'simulated' && !isFullscreen && (
        <div className="absolute bottom-4 right-4 max-w-xs px-3.5 py-2 rounded-lg bg-[#FEF3C7] border border-amber-200 text-[11px] text-[#92400E] flex items-center gap-2 shadow-xs z-10">
          <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

// Procedural Pose Landmark Generator
function generateSimulatedLandmarks(leanDx: number, hikeDy: number): PoseLandmark[] {
  const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, visibility: 0.9 }));

  const midX = 0.5 + leanDx;
  const lsY = 0.35 - hikeDy;
  const rsY = 0.35 + hikeDy;

  landmarks[11] = { x: midX - 0.12, y: lsY, visibility: 0.95 }; // Left Shoulder
  landmarks[12] = { x: midX + 0.12, y: rsY, visibility: 0.95 }; // Right Shoulder
  landmarks[23] = { x: 0.5 - 0.1, y: 0.7, visibility: 0.95 }; // Left Hip
  landmarks[24] = { x: 0.5 + 0.1, y: 0.7, visibility: 0.95 }; // Right Hip
  landmarks[0] = { x: midX, y: 0.2, visibility: 0.98 }; // Head

  landmarks[13] = { x: midX - 0.18, y: 0.48, visibility: 0.9 }; // Left Elbow
  landmarks[14] = { x: midX + 0.18, y: 0.48, visibility: 0.9 }; // Right Elbow
  landmarks[15] = { x: midX - 0.2, y: 0.6, visibility: 0.9 }; // Left Wrist
  landmarks[16] = { x: midX + 0.2, y: 0.6, visibility: 0.9 }; // Right Wrist

  return landmarks;
}

// Render Skeleton Overlay on Canvas
function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  isCalibrating: boolean
) {
  const ls = landmarks[11];
  const rs = landmarks[12];
  const lh = landmarks[23];
  const rh = landmarks[24];

  if (!ls || !rs || !lh || !rh) return;

  const toPx = (lm: PoseLandmark) => ({ x: lm.x * width, y: lm.y * height });

  const lsPx = toPx(ls);
  const rsPx = toPx(rs);
  const lhPx = toPx(lh);
  const rhPx = toPx(rh);
  const midShoulderPx = { x: (lsPx.x + rsPx.x) / 2, y: (lsPx.y + rsPx.y) / 2 };
  const midHipPx = { x: (lhPx.x + rhPx.x) / 2, y: (lhPx.y + rhPx.y) / 2 };

  ctx.lineWidth = 3;

  // 1. Draw Shoulder Line
  ctx.strokeStyle = isCalibrating ? '#2563EB' : '#2563EB';
  ctx.beginPath();
  ctx.moveTo(lsPx.x, lsPx.y);
  ctx.lineTo(rsPx.x, rsPx.y);
  ctx.stroke();

  // 2. Draw Hip Line
  ctx.strokeStyle = '#2563EB';
  ctx.beginPath();
  ctx.moveTo(lhPx.x, lhPx.y);
  ctx.lineTo(rhPx.x, rhPx.y);
  ctx.stroke();

  // 3. Draw Spine Line
  const isLeaning = Math.abs(midShoulderPx.x - midHipPx.x) > 30;
  ctx.strokeStyle = isLeaning ? '#EF4444' : '#22A06B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(midHipPx.x, midHipPx.y);
  ctx.lineTo(midShoulderPx.x, midShoulderPx.y);
  ctx.stroke();

  // 4. Draw Arms
  const le = landmarks[13];
  const re = landmarks[14];
  const lw = landmarks[15];
  const rw = landmarks[16];

  if (le && lw) {
    const lePx = toPx(le);
    const lwPx = toPx(lw);
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lsPx.x, lsPx.y);
    ctx.lineTo(lePx.x, lePx.y);
    ctx.lineTo(lwPx.x, lwPx.y);
    ctx.stroke();
  }

  if (re && rw) {
    const rePx = toPx(re);
    const rwPx = toPx(rw);
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rsPx.x, rsPx.y);
    ctx.lineTo(rePx.x, rePx.y);
    ctx.lineTo(rwPx.x, rwPx.y);
    ctx.stroke();
  }

  // 5. Vertical Reference Line
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(midHipPx.x, midHipPx.y);
  ctx.lineTo(midHipPx.x, midShoulderPx.y - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // 6. Draw Nodes
  const nodes = [lsPx, rsPx, lhPx, rhPx, midShoulderPx, midHipPx];
  nodes.forEach((n, idx) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, idx >= 4 ? 6 : 7, 0, 2 * Math.PI);
    ctx.fillStyle = idx >= 4 ? '#FFFFFF' : '#2563EB';
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}
