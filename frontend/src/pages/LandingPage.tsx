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
  AlertTriangle,
  FileText,
  Heart,
  Globe,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 py-4 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative overflow-hidden py-14 px-6 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-b from-slate-900/90 via-surface to-slate-950 shadow-2xl">
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

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
          MSV1 combines assistive hardware, computer vision and AI-powered movement analysis to make rehabilitation practice measurable and engaging.
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Let AI monitor the repetitive movement task. Let therapists focus on clinical decisions.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/session')}
            className="flex items-center gap-2 shadow-xl shadow-primary-600/30 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <PlayCircle className="w-5 h-5 fill-current" />
            <span>Start Demo</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 border-slate-700 text-slate-200"
          >
            <span>Therapist Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Section 1: The Problem */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">The Rehabilitation Challenge</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Unmonitored Compensatory Movement in Rehab</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          During repeated motor rehabilitation exercises, patients frequently compensate for limited limb movement by using excessive trunk lean, shoulder hiking, or torso rotation. Physiotherapists cannot continuously observe every home session, creating a critical gap between clinic visits.
        </p>
      </div>

      {/* Section 2: How MSV1 Works */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Product Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">How MSV1 Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-primary-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400 font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-100">Foot-Operated Actuator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MSV1 hardware allows individuals with upper-limb impairments to participate in carrom gameplay through foot movement, recording force and reaction time.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-accent-blue/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center text-accent-blue font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-100">Webcam Pose Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard webcams track 33 anatomical landmarks, calculating trunk lean angle, shoulder hike displacement, and torso rotational mismatch in real-time.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-accent-emerald/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-accent-emerald/20 border border-accent-emerald/40 flex items-center justify-center text-accent-emerald font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-100">AI Data Fusion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fuses computer vision metrics with hardware performance telemetry to compute a Movement Quality Score and generate LLM session summaries.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: AI + Hardware */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Computer Vision AI</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Runs client-side inside the browser using MediaPipe Pose. Evaluates spine vector alignment, acromion height symmetry, and posture stability without storing raw video.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Hardware Telemetry</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Captures strike force output (0-100%), actuator reaction speed, strike accuracy, and strike consistency metrics directly from the physical or simulated MSV1 device.
          </p>
        </div>
      </div>

      {/* Section 4: Rehabilitation Monitoring & Section 5: Therapist Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Rehabilitation Monitoring</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Live gauges display trunk lean, shoulder hike, and torso rotation levels in real-time, giving immediate visual feedback to patients during gameplay.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Therapist Clinical Dashboard</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Therapists review longitudinal progress charts, compensation trends over weeks, session archives, and 1-click LLM clinical report summaries.
          </p>
        </div>
      </div>

      {/* Section 6: Future Vision */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4 bg-gradient-to-b from-slate-900 to-surface">
        <div className="flex items-center gap-2 text-primary-400">
          <Globe className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Future Clinical Vision</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Affordable Remote Tele-Rehabilitation</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          By combining low-cost assistive foot actuators with ubiquitous webcam computer vision, MSV1 paves the way for accessible, objective remote tele-rehabilitation monitoring across global communities.
        </p>
      </div>

      {/* Clinical Disclaimer Section */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            Hackathon Research Prototype Statement
          </span>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            This prototype is designed for rehabilitation movement monitoring and research demonstration. It is not a diagnostic system and does not replace assessment or clinical decisions by qualified healthcare professionals.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/session')} className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-500">
          <span>Start Demo Session</span>
        </Button>
      </div>
    </div>
  );
};
