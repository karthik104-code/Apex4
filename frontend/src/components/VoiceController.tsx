import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Square, AlertTriangle } from 'lucide-react';
import { useLanguage, LanguageCode } from '../context/LanguageContext';

interface VoiceControllerProps {
  onSpeechResult: (text: string) => void;
  speakText?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ onSpeechResult, speakText }) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const getLangLocale = (lang: LanguageCode) => {
    switch (lang) {
      case 'ml': return 'ml-IN';
      case 'hi': return 'hi-IN';
      default: return 'en-US';
    }
  };

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported by your current browser. Please try Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getLangLocale(language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage("Microphone access was denied. Please allow microphone permissions in browser settings.");
        } else if (event.error === 'no-speech') {
          setErrorMessage("No speech detected. Please speak clearly into your microphone.");
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onSpeechResult(transcript);
        }
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (e) {
      setErrorMessage("Unable to access microphone input.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsListening(false);
  };

  const speak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const cleanText = textToSpeak.replace(/[\#\*\-\`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLangLocale(language);
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (speakText) {
      speak(speakText);
    }
  }, [speakText]);

  return (
    <div className="flex items-center gap-2 relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-medium ${
          isListening 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
            : 'bg-surfaceHover text-slate-200 hover:bg-primary-600/20 hover:text-primary-400 border border-slate-700/50'
        }`}
        title={isListening ? "Stop Voice Input" : "Start Voice Input"}
      >
        {isListening ? (
          <>
            <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Stop Recording</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-primary-400" />
            <span>Voice Input ({language.toUpperCase()})</span>
          </>
        )}
      </button>

      {speakText && (
        <button
          type="button"
          onClick={isSpeaking ? stopSpeaking : () => speak(speakText)}
          className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-medium ${
            isSpeaking 
              ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 animate-pulse' 
              : 'bg-surfaceHover text-slate-200 hover:bg-primary-600/20 hover:text-primary-400 border border-slate-700/50'
          }`}
          title="Read Audio Aloud"
        >
          {isSpeaking ? <VolumeX className="w-4 h-4 text-primary-400" /> : <Volume2 className="w-4 h-4" />}
          <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
        </button>
      )}

      {errorMessage && (
        <div className="absolute top-12 left-0 z-50 glass-panel p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs flex items-center gap-2 max-w-xs shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
};
