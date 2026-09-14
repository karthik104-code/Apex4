/**
 * APEX 4 — useVoicePostureCoach Hook
 * 
 * Bridges Live Pose Compensation Metrics to the Voice Posture Commander.
 * Handles persistence, cooldown, speech execution, and UI state synchronization.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { CompensationMetrics } from '../types/rehab';
import { deviationDetector, PostureCorrectionEvent } from '../pose/deviationDetector';
import { voiceCommander } from '../services/voiceCommander';

export interface UseVoicePostureCoachOptions {
  enabled?: boolean;
  isSessionActive?: boolean;
  poseConfidence?: number;
  isPoseDetected?: boolean;
}

export function useVoicePostureCoach({
  enabled = true,
  isSessionActive = false,
  poseConfidence = 0.9,
  isPoseDetected = true,
}: UseVoicePostureCoachOptions) {
  const [isVoiceCoachEnabled, setIsVoiceCoachEnabled] = useState(enabled);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<PostureCorrectionEvent | null>(null);
  const [activeCorrection, setActiveCorrection] = useState<PostureCorrectionEvent | null>(null);

  const isSessionActiveRef = useRef(isSessionActive);
  isSessionActiveRef.current = isSessionActive;

  // Sync enabled state with voice commander service
  useEffect(() => {
    voiceCommander.setEnabled(isVoiceCoachEnabled);
  }, [isVoiceCoachEnabled]);

  // Subscribe to voice synthesis events
  useEffect(() => {
    const unsubscribe = voiceCommander.subscribe((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) {
        // speech finished
      }
    });

    return () => unsubscribe();
  }, []);

  // Stop immediately if session stops or component unmounts
  useEffect(() => {
    if (!isSessionActive) {
      voiceCommander.stop();
      deviationDetector.reset();
      setActiveCorrection(null);
    }
  }, [isSessionActive]);

  // Main evaluation trigger on each new posture metric frame
  const processPostureFrame = useCallback(
    (metrics: CompensationMetrics, confidence = poseConfidence, detected = isPoseDetected) => {
      if (!isSessionActiveRef.current || !isVoiceCoachEnabled) {
        return;
      }

      // Check for confirmed deviation
      const event = deviationDetector.evaluate(metrics, confidence, detected);

      if (event) {
        setActiveCorrection(event);
        setLastCorrection(event);

        // Attempt speech with cooldown protection
        if (voiceCommander.canSpeak()) {
          voiceCommander.speak(event.instruction);
        }
      } else {
        // Posture is stable or recovering
        setActiveCorrection(null);
      }
    },
    [isVoiceCoachEnabled, poseConfidence, isPoseDetected]
  );

  const toggleVoiceCoach = () => {
    setIsVoiceCoachEnabled((prev) => {
      const next = !prev;
      if (!next) {
        voiceCommander.stop();
        deviationDetector.reset();
        setActiveCorrection(null);
      }
      return next;
    });
  };

  return {
    isVoiceCoachEnabled,
    isSpeaking,
    activeCorrection,
    lastCorrection,
    toggleVoiceCoach,
    processPostureFrame,
  };
}
