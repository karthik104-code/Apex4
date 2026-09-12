import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bot, Send, User, Sparkles, BookOpen, 
  HelpCircle, RefreshCw, FileText, Globe 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { VoiceController } from '../components/VoiceController';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { apiService } from '../services/api';
import { ChatMessage, StructuredReportResult } from '../types/healthcare';

export const AIAssistantPage: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "Hello! I am your AI Healthcare Companion. I can help explain your medical reports, suggest questions for your doctor, or discuss health vitals in English, Malayalam (മലയാളം), or Hindi (ഹിन्दी). How can I assist you today?",
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [
        { source: 'WHO Clinical Guidelines 2024', snippet: 'Mild anemia can be supported with dietary iron and Vitamin C intake.' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<StructuredReportResult[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [speakText, setSpeakText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.getReports().then((data) => {
      setReports(data);
      if (data.length > 0) setSelectedReportId(data[0].id);
    });

    if (location.state?.initialQuestion) {
      handleSend(location.state.initialQuestion);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage(textToSend, language, selectedReportId);
      const assistantMsg: ChatMessage = {
        id: response.message_id,
        sender: 'assistant',
        text: response.reply_text,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources
      };
      setMessages(prev => [...prev, assistantMsg]);
      setSpeakText(response.reply_text);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What dietary steps can help improve low hemoglobin?",
    "How do I prepare for a fasting blood sugar test?",
    "What questions should I ask my doctor about my cholesterol?",
    "What exercise routine is safe for metabolic health?"
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Controller Header */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-100">{t('ai_assistant')}</h2>
            <span className="text-[10px] text-primary-400 font-semibold uppercase tracking-wider block">
              Non-Diagnostic Educational Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Report Context Selector */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
            <FileText className="w-3.5 h-3.5 text-primary-400" />
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">No Report Context</option>
              {reports.map(r => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                  Context: {r.title.slice(0, 25)}...
                </option>
              ))}
            </select>
          </div>

          {/* Voice Controller */}
          <VoiceController 
            onSpeechResult={(txt) => setInputText(txt)} 
            speakText={speakText} 
          />
        </div>
      </div>

      {/* Safety Disclaimer Banner */}
      <div className="shrink-0">
        <MedicalDisclaimer />
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 glass-panel rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-4 border border-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              msg.sender === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gradient-to-tr from-primary-600 to-accent-emerald text-white'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-3 ${
              msg.sender === 'user' 
                ? 'bg-primary-600/20 text-slate-100 border border-primary-500/40 rounded-tr-none' 
                : 'bg-slate-900/80 text-slate-200 border border-slate-800 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* RAG Sources Box */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                  <span className="font-semibold text-primary-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Trusted Clinical Reference Sources:
                  </span>
                  {msg.sources.map((src, i) => (
                    <div key={i} className="pl-2 border-l-2 border-primary-500/50">
                      <span className="font-medium text-slate-300 block">{src.source}</span>
                      <p className="text-[10px] text-slate-400 italic">"{src.snippet}"</p>
                    </div>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-500 block text-right font-medium">
                {msg.created_at}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center text-white">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 animate-pulse">
              Analyzing query against medical knowledge base...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <Sparkles className="w-4 h-4 text-primary-400 shrink-0" />
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 whitespace-nowrap transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about your medical report, lab values, or health concerns..."
          className="flex-1 bg-surface border border-slate-700/80 rounded-2xl px-5 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
