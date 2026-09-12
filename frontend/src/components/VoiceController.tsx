import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLanguage, LanguageCode } from '../context/LanguageContext';

interface VoiceControllerProps {
  onSpeechResult: (text: string) => void;
  speakText?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ onSpeechResult, speakText }) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getLangLocale = (lang: LanguageCode) => {
    switch (lang) {
      case 'ml': return 'ml-IN';
      case 'hi': return 'hi-IN';
      default: return 'en-US';
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLangLocale(language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onSpeechResult(transcript);
      }
    };

    recognition.start();
  };

  const speak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop any ongoing audio
    const cleanText = textToSpeak.replace(/[\#\*\-\`]/g, ''); // strip markdown
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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isListening ? () => setIsListening(false) : startListening}
        className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-medium ${
          isListening 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
            : 'bg-surfaceHover text-slate-200 hover:bg-primary-600/20 hover:text-primary-400 border border-slate-700/50'
        }`}
        title="Voice Dictation"
      >
        {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
        <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
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
          title="Read Aloud"
        >
          {isSpeaking ? <VolumeX className="w-4 h-4 text-primary-400" /> : <Volume2 className="w-4 h-4" />}
          <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
        </button>
      )}
    </div>
  );
};
