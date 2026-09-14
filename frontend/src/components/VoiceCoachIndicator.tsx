import React from 'react';
import { Volume2, VolumeX, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PostureCorrectionEvent } from '../pose/deviationDetector';

interface VoiceCoachIndicatorProps {
  isEnabled: boolean;
  isSpeaking: boolean;
  activeCorrection: PostureCorrectionEvent | null;
  onToggle: () => void;
}

export const VoiceCoachIndicator: React.FC<VoiceCoachIndicatorProps> = ({
  isEnabled,
  isSpeaking,
  activeCorrection,
  onToggle,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            !isEnabled
              ? 'bg-gray-100 text-gray-400'
              : isSpeaking
              ? 'bg-emerald-500 text-white animate-pulse'
              : activeCorrection
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {!isEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Voice Posture Coach
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                !isEnabled
                  ? 'bg-gray-100 text-gray-600'
                  : isSpeaking
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {!isEnabled ? 'MUTED' : isSpeaking ? 'SPEAKING' : 'ACTIVE'}
            </span>
          </div>

          <div className="text-xs mt-0.5 flex items-center space-x-1.5">
            {!isEnabled ? (
              <span className="text-gray-400">Advisory voice feedback disabled</span>
            ) : activeCorrection ? (
              <span className="text-amber-800 font-medium flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                {activeCorrection.instruction}
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                Posture Stable
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
          isEnabled
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
        }`}
        title={isEnabled ? 'Mute voice instructions' : 'Enable voice instructions'}
      >
        <span>{isEnabled ? 'Coach [ON]' : 'Coach [OFF]'}</span>
      </button>
    </div>
  );
};
