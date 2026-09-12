import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bot, Send, User, Sparkles, BookOpen, 
  MessageSquare, Plus, History, ChevronLeft, Menu 
} from 'lucide-react';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { VoiceController } from '../components/VoiceController';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Toast } from '../components/ui/Toast';
import { apiService } from '../services/api';
import { ChatMessage, StructuredReportResult } from '../types/healthcare';

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
}

export const AIAssistantPage: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv-101');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakText, setSpeakText] = useState<string>('');
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const convs = await apiService.getConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id);
      }
    } catch (e) {
      setErrorToast("Failed to load conversation history.");
    }
  };

  const loadMessages = async (convId: string) => {
    setIsLoading(true);
    try {
      const msgs = await apiService.getConversationMessages(convId);
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([
          {
            id: 'msg-init',
            sender: 'assistant',
            text: "Hello! I am your AI Healthcare Companion. Ask me questions about lab reports, health vitals, or medical concepts in English, Malayalam (മലയാളം), or Hindi (ഹിन्दी). How can I assist you today?",
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: [
              { source: 'WHO Clinical Guidelines 2024', snippet: 'Mild anemia can be supported with dietary iron and Vitamin C intake.' }
            ]
          }
        ]);
      }
    } catch (e) {
      setErrorToast("Unable to fetch messages.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await apiService.createNewConversation();
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([
        {
          id: 'msg-new-init',
          sender: 'assistant',
          text: "Starting a new consultation session. Ask any health-related question below.",
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setShowHistorySidebar(false);
    } catch (e) {
      setErrorToast("Could not initiate new conversation.");
    }
  };

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
      const response = await apiService.sendAssistantChat(textToSend, activeConvId, language);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources
      };
      setMessages(prev => [...prev, assistantMsg]);
      setSpeakText(response.answer);
    } catch (e) {
      setErrorToast("Error communicating with AI assistant. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What dietary steps help improve low hemoglobin?",
    "How do I prepare for a fasting blood sugar test?",
    "What questions should I ask my doctor about cholesterol?",
    "What are natural ways to boost Vitamin D absorption?"
  ];

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 overflow-hidden relative">
      {/* Toast Alert */}
      {errorToast && (
        <Toast message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}

      {/* Conversation History Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-surface/95 backdrop-blur-xl border-r border-slate-800 p-4 flex flex-col justify-between transition-transform duration-300 rounded-3xl
        ${showHistorySidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-primary-400" />
              <span>Chat History</span>
            </h3>
            <button
              onClick={() => setShowHistorySidebar(false)}
              className="md:hidden text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          <div className="space-y-1.5 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => { setActiveConvId(conv.id); setShowHistorySidebar(false); }}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center gap-2.5 ${
                  activeConvId === conv.id
                    ? 'bg-primary-600/20 border-primary-500/50 text-slate-100 font-semibold'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col space-y-3.5 overflow-hidden">
        {/* Chat Control Bar */}
        <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xs sm:text-sm text-slate-100">{t('ai_assistant')}</h2>
              <span className="text-[10px] text-primary-400 font-semibold uppercase tracking-wider block">
                Non-Diagnostic Assistive AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="ml">മലയാളം (ML)</option>
              <option value="hi">हिन्दी (HI)</option>
            </select>

            {/* Voice Controller Integration */}
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

        {/* Messages List Area */}
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

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                    <span className="font-semibold text-primary-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Trusted Clinical References:
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

          {/* AI Typing / Loading Skeleton */}
          {isLoading && (
            <div className="flex items-center gap-3 max-w-md">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center text-white">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping" />
                <span>AI Assistant is analyzing clinical guidance...</span>
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

        {/* Message Input Box */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a health question or discuss your lab results..."
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
    </div>
  );
};
