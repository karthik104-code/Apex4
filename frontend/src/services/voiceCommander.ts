/**
 * APEX 4 — Voice Posture Commander Speech Layer
 * 
 * Reusable Web Speech API text-to-speech engine providing advisory posture corrections.
 * 
 * Rules:
 * - Silent on stable posture.
 * - Silent on low pose tracking confidence.
 * - Minimum cooldown between utterances (default 8 seconds).
 * - Immediate cancellation on stale utterances or state reset.
 * - No overlapping speech.
 */

export interface VoiceCommanderConfig {
  enabled: boolean;
  volume: number; // 0..1
  rate: number;   // 0.5..2
  cooldownMs: number; // milliseconds between speech
  pitch: number;
}

export const DEFAULT_VOICE_CONFIG: VoiceCommanderConfig = {
  enabled: true,
  volume: 1.0,
  rate: 0.95,
  cooldownMs: 8000,
  pitch: 1.0,
};

export class VoicePostureCommanderService {
  private config: VoiceCommanderConfig = { ...DEFAULT_VOICE_CONFIG };
  private lastSpokenTimestamp = 0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking = false;
  private listeners: Array<(isSpeaking: boolean, lastSpokenText: string | null) => void> = [];
  private lastSpokenText: string | null = null;

  constructor(config?: Partial<VoiceCommanderConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
    this.notifyListeners();
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  public setRate(rate: number): void {
    this.config.rate = Math.max(0.5, Math.min(2, rate));
  }

  public setCooldown(ms: number): void {
    this.config.cooldownMs = Math.max(2000, ms);
  }

  public canSpeak(): boolean {
    if (!this.config.enabled) return false;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    if (this.isCurrentlySpeaking) return false;

    const now = Date.now();
    return now - this.lastSpokenTimestamp >= this.config.cooldownMs;
  }

  public speak(instruction: string, force = false): boolean {
    if (!this.config.enabled) return false;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

    const now = Date.now();
    if (!force && (this.isCurrentlySpeaking || now - this.lastSpokenTimestamp < this.config.cooldownMs)) {
      return false;
    }

    try {
      // Cancel any ongoing or stuck utterances
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(instruction);
      utterance.volume = this.config.volume;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;

      // Select a clean natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Aaron'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.isCurrentlySpeaking = true;
        this.lastSpokenTimestamp = Date.now();
        this.lastSpokenText = instruction;
        this.notifyListeners();
      };

      utterance.onend = () => {
        this.isCurrentlySpeaking = false;
        this.currentUtterance = null;
        this.notifyListeners();
      };

      utterance.onerror = (e) => {
        console.warn('[Voice Commander] Speech synthesis error:', e);
        this.isCurrentlySpeaking = false;
        this.currentUtterance = null;
        this.notifyListeners();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('[Voice Commander] Could not execute TTS:', err);
      this.isCurrentlySpeaking = false;
      return false;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.isCurrentlySpeaking = false;
    this.currentUtterance = null;
    this.notifyListeners();
  }

  public subscribe(callback: (isSpeaking: boolean, lastSpokenText: string | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.isCurrentlySpeaking, this.lastSpokenText);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.isCurrentlySpeaking, this.lastSpokenText));
  }

  public getLastSpokenText(): string | null {
    return this.lastSpokenText;
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }
}

export const voiceCommander = new VoicePostureCommanderService();
