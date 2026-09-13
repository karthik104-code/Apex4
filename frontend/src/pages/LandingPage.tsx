import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  PlayCircle,
  Shield,
  Zap,
  Target,
  Sparkles,
  Cpu,
  Eye,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 py-4 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative overflow-hidden py-12 px-6 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-b from-slate-900/90 via-surface to-slate-950">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span>MSV1 AI-Assisted Rehabilitation System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight max-w-4xl mx-auto leading-tight">
          AI-Assisted Rehabilitation <br />
          <span className="bg-gradient-to-r from-primary-400 via-accent-blue to-accent-emerald bg-clip-text text-transparent">
            Through Play.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Let AI monitor the repetitive movement task. Let therapists focus on the human.
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          MSV1 combines a foot-operated carrom actuator with webcam computer vision to detect compensatory movements like trunk leaning and shoulder hiking during gamified rehab.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/session')}
            className="flex items-center gap-2 shadow-xl shadow-primary-600/30"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Launch Live Demo Session</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 border-slate-700"
          >
            <span>Open Therapist Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3 Core Conceptual Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-primary-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">1. Computer Vision Pose Tracking</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Client-side MediaPipe Pose tracks 33 anatomical landmarks in real-time through standard webcams without raw video storage.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-accent-blue/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center text-accent-blue">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">2. MSV1 Hardware Telemetry</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Foot actuator sensors measure strike force, reaction time, target accuracy, and stroke consistency during gameplay.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-accent-emerald/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-accent-emerald/20 border border-accent-emerald/40 flex items-center justify-center text-accent-emerald">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">3. Sensor Fusion & AI Analytics</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Combines biomechanical compensation metrics with hardware performance to generate structured AI session reports for therapists.
          </p>
        </div>
      </div>

      {/* Clinical Disclaimer Section */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            Hackathon Research Prototype Statement
          </span>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            This prototype is designed for rehabilitation movement monitoring and research demonstration. It is not a diagnostic system and does not replace assessment or decisions by qualified healthcare professionals.
          </p>
        </div>

        <Button variant="secondary" size="md" onClick={() => navigate('/calibration')} className="whitespace-nowrap">
          <span>Postural Calibration</span>
        </Button>
      </div>
    </div>
  );
};
