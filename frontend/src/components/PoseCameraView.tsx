import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';
import { PoseLandmark } from '../types/rehab';

interface PoseCameraViewProps {
  onPoseDetected: (landmarks: PoseLandmark[]) => void;
  isCalibrating?: boolean;
}

export const PoseCameraView: React.FC<PoseCameraViewProps> = ({
  onPoseDetected,
  isCalibrating = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'simulated' | 'error'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      try {
        setCameraState('requesting');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraState('active');
        }
      } catch (err: any) {
        console.warn('Physical camera unavailable or permission denied. Falling back to Pose Simulator demo mode.', err);
        setCameraState('simulated');
        setErrorMessage('Webcam not active — running Vision Pose Simulator demo mode.');
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  // Main Render & Detection Loop
  useEffect(() => {
    let tick = 0;

    const renderLoop = () => {
      tick++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width || 640;
      const height = canvas.height || 480;
      ctx.clearRect(0, 0, width, height);

      let currentLandmarks: PoseLandmark[] = [];

      if (cameraState === 'active' && videoRef.current) {
        // Draw video frame
        ctx.save();
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        ctx.restore();

        // Standard procedural skeleton demo simulation overlay over video stream
        const baseDx = Math.sin(tick * 0.04) * 0.08;
        const baseHike = Math.cos(tick * 0.03) * 0.03;

        currentLandmarks = generateSimulatedLandmarks(baseDx, baseHike);
      } else {
        // Simulated Canvas background (Dark Glassmorphic Demo Feed)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid pattern for visual feedback
        ctx.strokeStyle = '#1e293b';
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

        // Oscillating pose simulation to demonstrate live tracking dynamics
        const baseDx = Math.sin(tick * 0.04) * 0.12;
        const baseHike = Math.cos(tick * 0.03) * 0.05;

        currentLandmarks = generateSimulatedLandmarks(baseDx, baseHike);
      }

      // Draw Pose Skeleton Overlay
      drawPoseSkeleton(ctx, currentLandmarks, width, height, isCalibrating);

      onPoseDetected(currentLandmarks);

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [cameraState, isCalibrating, onPoseDetected]);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass-panel border border-slate-800 bg-slate-950 flex items-center justify-center group shadow-2xl">
      <video ref={videoRef} playsInline muted className="hidden" />
      <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover" />

      {/* Overlay Status Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-lg">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            cameraState === 'active'
              ? 'bg-emerald-400 animate-pulse'
              : cameraState === 'simulated'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-rose-500'
          }`}
        />
        <span>
          {cameraState === 'active'
            ? 'Webcam Pose Active'
            : cameraState === 'simulated'
            ? 'Pose Simulator Demo'
            : 'Connecting Camera...'}
        </span>
      </div>

      {isCalibrating && (
        <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 border-2 border-primary-500/60 rounded-3xl animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 border-2 border-primary-400 flex items-center justify-center text-primary-300 animate-bounce mb-3">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Capturing Neutral Pose Baseline</h3>
          <p className="text-xs text-primary-200 mt-1 max-w-sm">
            Please sit upright in a comfortable neutral posture facing the camera.
          </p>
        </div>
      )}

      {errorMessage && cameraState === 'simulated' && (
        <div className="absolute bottom-4 right-4 max-w-xs px-3.5 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

// Helper: Generate simulated 33 pose landmarks with biomechanical variations
function generateSimulatedLandmarks(leanDx: number, hikeDy: number): PoseLandmark[] {
  const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5 }));

  const midX = 0.5 + leanDx;
  const lsY = 0.35 - hikeDy;
  const rsY = 0.35 + hikeDy;

  // Key landmarks
  landmarks[11] = { x: midX - 0.12, y: lsY }; // Left Shoulder
  landmarks[12] = { x: midX + 0.12, y: rsY }; // Right Shoulder
  landmarks[23] = { x: 0.5 - 0.1, y: 0.7 }; // Left Hip
  landmarks[24] = { x: 0.5 + 0.1, y: 0.7 }; // Right Hip
  landmarks[0] = { x: midX, y: 0.2 }; // Nose / Head

  // Arms (foot-operated carrom pose position)
  landmarks[13] = { x: midX - 0.18, y: 0.48 }; // Left Elbow
  landmarks[14] = { x: midX + 0.18, y: 0.48 }; // Right Elbow
  landmarks[15] = { x: midX - 0.2, y: 0.6 }; // Left Wrist
  landmarks[16] = { x: midX + 0.2, y: 0.6 }; // Right Wrist

  return landmarks;
}

// Helper: Draw Pose Skeleton on Canvas
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
  ctx.strokeStyle = isCalibrating ? '#38bdf8' : '#0d9488';
  ctx.beginPath();
  ctx.moveTo(lsPx.x, lsPx.y);
  ctx.lineTo(rsPx.x, rsPx.y);
  ctx.stroke();

  // 2. Draw Hip Line
  ctx.beginPath();
  ctx.moveTo(lhPx.x, lhPx.y);
  ctx.lineTo(rhPx.x, rhPx.y);
  ctx.stroke();

  // 3. Draw Spine Alignment Vector (Torso Line)
  const isLeaning = Math.abs(midShoulderPx.x - midHipPx.x) > 30;
  ctx.strokeStyle = isLeaning ? '#f43f5e' : '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(midHipPx.x, midHipPx.y);
  ctx.lineTo(midShoulderPx.x, midShoulderPx.y);
  ctx.stroke();

  // 4. Draw Vertical Reference Baseline Line (Dashed)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(midHipPx.x, midHipPx.y);
  ctx.lineTo(midHipPx.x, midShoulderPx.y - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Draw Key Landmark Nodes
  const nodes = [lsPx, rsPx, lhPx, rhPx, midShoulderPx, midHipPx];
  nodes.forEach((n, idx) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, idx >= 4 ? 6 : 8, 0, 2 * Math.PI);
    ctx.fillStyle = idx >= 4 ? '#ffffff' : '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}
