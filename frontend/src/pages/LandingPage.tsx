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
  ArrowDown,
  Layers,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#111827] font-sans -mt-4 -mx-4 sm:-mx-6">
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-base tracking-tight text-[#111827]">APEX 4</span>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <button onClick={() => scrollToSection('product')} className="hover:text-[#2563EB] transition-colors">
              Product
            </button>
            <button onClick={() => scrollToSection('ai-analysis')} className="hover:text-[#2563EB] transition-colors">
              AI Analysis
            </button>
            <button onClick={() => scrollToSection('therapists')} className="hover:text-[#2563EB] transition-colors">
              For Therapists
            </button>
            <button onClick={() => scrollToSection('technology')} className="hover:text-[#2563EB] transition-colors">
              Technology
            </button>
          </div>

          {/* Right CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/session')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg px-4 py-2 text-xs shadow-xs"
          >
            Start Demo
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 space-y-24 py-12">
        {/* 2. HERO SECTION */}
        <section className="text-center space-y-8 py-12 sm:py-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2FF] text-[#2563EB] border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <span>APEX 4</span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-7xl font-black text-[#111827] tracking-tight leading-[1.1]">
              Rehabilitation, <br />
              <span className="text-[#2563EB]">reimagined.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-700 font-semibold max-w-2xl mx-auto leading-relaxed">
              AI-assisted movement monitoring through play.
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            APEX 4 combines assistive foot-actuator hardware, computer vision and AI-powered movement analysis to make rehabilitation practice measurable and engaging.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/session')}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-7 py-3.5 rounded-lg shadow-sm text-sm"
            >
              <PlayCircle className="w-5 h-5 fill-current" />
              <span>Start a session</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => scrollToSection('product')}
              className="flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#111827] hover:bg-slate-50 font-semibold px-6 py-3.5 rounded-lg shadow-xs text-sm"
            >
              <span>Explore APEX 4</span>
              <ArrowDown className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </section>

        {/* 3. PROBLEM SECTION */}
        <section className="bg-white p-8 sm:p-12 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#EF4444] block">
            The Rehabilitation Challenge
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Rehabilitation needs more than repetition.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Rehabilitation exercises are repetitive, but movement quality can be difficult to monitor continuously. Without real-time objective biomechanical feedback, patients frequently adopt compensatory movements such as excessive trunk lean or shoulder hiking during home practice.
          </p>
        </section>

        {/* 4. PRODUCT SECTION */}
        <section id="product" className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Unified Platform</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
              One system. Movement, performance, insight.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Component 1: APEX 4 Hardware */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#111827]">APEX 4 Hardware</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Assistive foot-operated actuator allowing individuals with limb impairments to participate in carrom gameplay while recording force, reaction time, and strike consistency.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider pt-2 block">
                Actuator Telemetry →
              </span>
            </div>

            {/* Component 2: Computer Vision */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#111827]">Computer Vision</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Browser-based MediaPipe tracking analyzes 33 anatomical landmarks in real-time to compute trunk lean, shoulder hike displacement, and torso rotation.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider pt-2 block">
                33 Pose Landmarks →
              </span>
            </div>

            {/* Component 3: AI Insights */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between hover:border-purple-300 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#F2F0FF] border border-purple-200 flex items-center justify-center text-[#7C6CE7]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#111827]">AI Insights</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Data fusion algorithm combines vision and hardware metrics into a unified Movement Quality Score and LLM session summaries for therapists.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#7C6CE7] uppercase tracking-wider pt-2 block">
                Generative AI Reports →
              </span>
            </div>
          </div>
        </section>

        {/* 5. AI SECTION */}
        <section id="ai-analysis" className="bg-white p-8 sm:p-12 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C6CE7]">Automation & Intelligence</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
              Let AI handle the repetitive work.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              AI continuously analyzes session metrics so the rehabilitation professional can focus on the person.
            </p>
          </div>

          {/* Flow Diagram: Observe -> Measure -> Understand */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto text-center">
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EAF2FF] text-[#2563EB] font-black text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-lg text-[#111827]">Observe</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Client-side webcam tracking monitors body position without raw video recording.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EAF2FF] text-[#2563EB] font-black text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-lg text-[#111827]">Measure</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Biomechanical algorithms measure trunk lean, shoulder hike, and actuator output.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#F2F0FF] text-[#7C6CE7] font-black text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-lg text-[#7C6CE7]">Understand</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                LLM generates structured clinical session summaries and progress trends.
              </p>
            </div>
          </div>
        </section>

        {/* 6. LIVE SESSION PREVIEW */}
        <section id="technology" className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#22A06B]">Real-Time Interface</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
              Live Rehabilitation Interface
            </h2>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Camera & Skeleton Mock (7 cols) */}
              <div className="lg:col-span-7 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-4 aspect-video flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center z-10">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-bold text-[#22A06B] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
                    Camera Feed: Active (MediaPipe Pose)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-mono font-bold text-[#111827]">
                    03:45
                  </span>
                </div>

                {/* Vector Graphic Skeleton Illustration */}
                <div className="my-auto text-center space-y-2 py-8">
                  <div className="w-16 h-16 rounded-full bg-[#EAF2FF] border-2 border-[#2563EB] mx-auto flex items-center justify-center text-[#2563EB] font-bold text-xs">
                    POSE
                  </div>
                  <span className="text-xs text-slate-500 font-mono block">33 Anatomical Skeleton Landmarks Active</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium z-10">
                  <span>Spine Alignment: 12.4°</span>
                  <span>Shoulder Hike: 6%</span>
                  <span>Torso Rotation: 5.2°</span>
                </div>
              </div>

              {/* Gauges & Telemetry Mock (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Movement Quality Card */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Movement Quality Score</span>
                    <span className="text-xs font-bold text-[#22A06B]">GOOD</span>
                  </div>
                  <div className="text-3xl font-black text-[#22A06B]">82%</div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#22A06B] w-[82%]" />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] text-slate-500 block">Trunk Lean</span>
                    <span className="font-bold text-[#111827]">12.4° (MED)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] text-slate-500 block">Shoulder Movement</span>
                    <span className="font-bold text-[#111827]">6% (MED)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] text-slate-500 block">Actuator Force</span>
                    <span className="font-bold text-[#2563EB]">64%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] text-slate-500 block">Strike Accuracy</span>
                    <span className="font-bold text-[#22A06B]">87%</span>
                  </div>
                </div>

                {/* Reaction Time */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Actuator Reaction Time:</span>
                  <span className="font-bold text-[#7C6CE7]">1.24s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. THERAPIST SECTION */}
        <section id="therapists" className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Therapist Portal</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
              More insight between sessions.
            </h2>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Dashboard Trends Preview (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-[#111827]">Movement Quality Trajectory</h3>
                    <span className="text-xs text-[#22A06B] font-bold">+4.2% Trend</span>
                  </div>
                  <div className="h-40 bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-end justify-between gap-2">
                    <div className="w-1/4 bg-[#22A06B]/20 border-t-2 border-[#22A06B] h-[65%] rounded-t flex items-end justify-center pb-1 text-[10px] font-bold text-[#22A06B]">71%</div>
                    <div className="w-1/4 bg-[#22A06B]/30 border-t-2 border-[#22A06B] h-[72%] rounded-t flex items-end justify-center pb-1 text-[10px] font-bold text-[#22A06B]">74%</div>
                    <div className="w-1/4 bg-[#22A06B]/40 border-t-2 border-[#22A06B] h-[78%] rounded-t flex items-end justify-center pb-1 text-[10px] font-bold text-[#22A06B]">78%</div>
                    <div className="w-1/4 bg-[#22A06B] h-[82%] rounded-t flex items-end justify-center pb-1 text-[10px] font-bold text-white">82%</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs">
                  <span className="font-bold text-[#111827] block">Recent Completed Sessions</span>
                  <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB]">
                    <span className="text-slate-600">Sep 12, 2026 • Alex Mercer</span>
                    <span className="font-bold text-[#22A06B]">Quality: 82% | Accuracy: 87%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB]">
                    <span className="text-slate-600">Sep 10, 2026 • Alex Mercer</span>
                    <span className="font-bold text-[#22A06B]">Quality: 78% | Accuracy: 83%</span>
                  </div>
                </div>
              </div>

              {/* AI Generated Observations Preview (5 cols) */}
              <div className="lg:col-span-5 p-6 rounded-xl bg-[#F2F0FF] border border-purple-200 space-y-4">
                <div className="flex items-center gap-2 text-[#7C6CE7]">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-[#111827]">AI Clinical Summary</h3>
                </div>

                <div className="space-y-2 text-xs text-[#5B46E0]">
                  <div className="p-3 rounded-lg bg-white border border-purple-100 font-medium">
                    "Patient demonstrated consistent foot actuator strike force (64%) with moderate trunk lean (12.4°) during late session fatigue."
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-purple-100 font-medium">
                    "Suggested discussion: Review spinal posture posture alignment during extended gameplay."
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-[#7C6CE7] hover:bg-[#6858D0] text-white font-bold rounded-lg py-2 text-xs"
                >
                  View Full Therapist Portal
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FINAL CTA */}
        <section className="bg-white p-12 rounded-2xl border border-[#E5E7EB] shadow-xs text-center space-y-6 max-w-3xl mx-auto">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black text-[#111827] tracking-tight">
              Make every session measurable.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Start monitoring movement quality, actuator performance, and generative AI reporting today.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/session')}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-8 py-3.5 rounded-lg shadow-sm text-sm"
          >
            <PlayCircle className="w-5 h-5 fill-current" />
            <span>Start a session</span>
          </Button>
        </section>
      </div>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] mt-16 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-8 h-8 object-contain" />
              <span className="font-extrabold text-base text-[#111827] tracking-tight">APEX 4</span>
            </div>
            <p className="text-xs font-semibold text-[#2563EB]">
              Rehabilitation, reimagined.
            </p>
            <p className="text-xs text-slate-500">
              AI-assisted movement monitoring through play.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} APEX 4 HealthTech Prototype. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

