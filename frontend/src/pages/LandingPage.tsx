import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Bot, FileText, Calendar, 
  ShieldCheck, Mic, ArrowRight, Sparkles, HeartPulse, CheckCircle2 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Header Navigation */}
      <header className="h-20 border-b border-slate-800/80 px-6 lg:px-12 flex items-center justify-between backdrop-blur-md bg-surface/40 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-primary-400 bg-clip-text text-transparent">
            AI Healthcare Companion
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2"
          >
            <span>Explore Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 lg:py-24 space-y-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-primary-400" />
            Hackathon Production Edition
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Your Personal <span className="bg-gradient-to-r from-primary-400 via-accent-emerald to-blue-400 bg-clip-text text-transparent">AI-Powered</span> Healthcare Assistant
          </h1>

          <p className="text-slate-300 text-base sm:text-xl font-normal leading-relaxed max-w-3xl mx-auto">
            Transform medical reports into clear patient guidance, ask voice queries in English, Malayalam, or Hindi, 
            track health vitals, and schedule follow-ups—all backed by non-diagnostic healthcare safety guardrails.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-accent-emerald hover:opacity-95 text-white shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-3"
            >
              <HeartPulse className="w-5 h-5 text-white animate-pulse" />
              <span>Launch Live Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold glass-panel hover:bg-slate-800/80 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-5 h-5 text-primary-400" />
              <span>Try AI Voice Assistant</span>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-primary-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Medical Report Analyzer</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload blood test PDFs or lab images. Instant OCR extraction flags high/low parameters and provides patient-friendly explanations.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-primary-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Voice & Multilingual AI</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ask questions via voice in English, Malayalam (മലയാളം), or Hindi (ഹിन्दी) and listen to natural audio responses.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-primary-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-accent-emerald/20 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Appointments & Vitals</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Schedule doctor consultations, set follow-up reminders, and visualize historical lab trends with interactive Recharts.
            </p>
          </div>
        </div>

        {/* Safety & Compliance Banner */}
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg font-bold text-amber-200">Strict Non-Diagnostic Safety Guardrails</h4>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              AI Healthcare Companion is engineered exclusively as an educational, assistive information tool. It does not replace medical doctors, issue autonomous diagnoses, or prescribe medication.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        AI Healthcare Companion • Hackathon Demo Build • Built with React, TypeScript & FastAPI
      </footer>
    </div>
  );
};
