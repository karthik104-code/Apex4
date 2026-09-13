import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, Play, Shield, Info, ArrowRight } from 'lucide-react';
import { PoseCameraView } from '../components/PoseCameraView';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { PoseLandmark, BaselineCalibration } from '../types/rehab';
import { calibrateBaseline, createDefaultCalibration } from '../pose/compensation';

interface CalibrationPageProps {
  onSaveCalibration: (cal: BaselineCalibration) => void;
  calibration: BaselineCalibration;
}

export const CalibrationPage: React.FC<CalibrationPageProps> = ({
  onSaveCalibration,
  calibration,
}) => {
  const navigate = useNavigate();
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmark[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const newCal = calibrateBaseline(currentLandmarks);
      onSaveCalibration(newCal);
      setIsCapturing(false);
      setToastMessage('Neutral posture baseline captured successfully!');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-semibold uppercase tracking-wider border border-primary-500/30">
              Session Preparation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Neutral Posture Calibration</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Establish a baseline posture to eliminate camera angle bias before starting your MSV1 session.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/session')}
          disabled={!calibration.isCalibrated}
          className="whitespace-nowrap flex items-center gap-2"
        >
          <span>Proceed to Live Session</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Camera Calibration Feed */}
        <div className="lg:col-span-2 space-y-4">
          <PoseCameraView onPoseDetected={setCurrentLandmarks} isCalibrating={isCapturing} />

          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  calibration.isCalibrated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs text-slate-300 font-medium">
                {calibration.isCalibrated
                  ? `Baseline Active (Saved at ${new Date(calibration.timestamp).toLocaleTimeString()})`
                  : 'No Baseline Calibration Saved Yet'}
              </span>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCapture}
              disabled={isCapturing}
              className="flex items-center gap-2 border-primary-500/40 text-primary-300 hover:bg-primary-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
              <span>{isCapturing ? 'Capturing...' : 'Capture Baseline'}</span>
            </Button>
          </div>
        </div>

        {/* Right 1 Col: Instructions & Baseline Values */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-400" />
              <span>Calibration Guidelines</span>
            </h3>

            <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
              <li className="leading-relaxed">
                Sit in a comfortable, upright neutral position facing the camera.
              </li>
              <li className="leading-relaxed">
                Position your feet on the MSV1 actuator controls.
              </li>
              <li className="leading-relaxed">
                Keep shoulders relaxed without leaning forward or sideways.
              </li>
              <li className="leading-relaxed">
                Click <strong>Capture Baseline</strong> and hold position for 1 second.
              </li>
            </ol>
          </div>

          {/* Current Saved Baseline Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
              Stored Neutral Parameters
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Mid-Shoulder Center:</span>
                <span className="font-mono text-slate-200">
                  X: {calibration.midShoulderX.toFixed(2)}, Y: {calibration.midShoulderY.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Shoulder Width Ratio:</span>
                <span className="font-mono text-slate-200">{calibration.shoulderWidth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Baseline Shoulder Angle:</span>
                <span className="font-mono text-slate-200">{calibration.shoulderAngle.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
