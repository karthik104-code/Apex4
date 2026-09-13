import React, { useState, useEffect } from 'react';

interface ApexSplashLoaderProps {
  onComplete?: () => void;
  autoDismissMs?: number;
}

export const ApexSplashLoader: React.FC<ApexSplashLoaderProps> = ({
  onComplete,
  autoDismissMs = 1800,
}) => {
  const [stage, setStage] = useState<'enter' | 'reveal' | 'exit' | 'done'>('enter');

  useEffect(() => {
    // Stage 1: Logo & Text entrance (0 - 500ms)
    const t1 = setTimeout(() => {
      setStage('reveal');
    }, 400);

    // Stage 2: Curtain exit animation (autoDismissMs - 500ms)
    const t2 = setTimeout(() => {
      setStage('exit');
    }, autoDismissMs - 500);

    // Stage 3: Complete & unmount (autoDismissMs)
    const t3 = setTimeout(() => {
      setStage('done');
      if (onComplete) onComplete();
    }, autoDismissMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [autoDismissMs, onComplete]);

  if (stage === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F7F9F8] transition-transform duration-700 ease-in-out select-none ${
        stage === 'exit' ? '-translate-y-full opacity-90' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Background Precision Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center px-4">
        {/* APEX 4 Logo with Animated Reveal Ring */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing Outer Glow Ring */}
          <div className="absolute w-28 h-28 rounded-full bg-[#EAF2FF] border border-[#2563EB]/20 animate-ping opacity-75" />
          <div className="absolute w-24 h-24 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center" />

          {/* Logo Image */}
          <img
            src="/apex4-logo.png"
            alt="APEX 4 Logo"
            className={`w-14 h-14 object-contain relative z-10 transition-all duration-700 ease-out transform ${
              stage === 'enter' ? 'scale-75 opacity-0 rotate-[-12deg]' : 'scale-100 opacity-100 rotate-0'
            }`}
          />
        </div>

        {/* Brand Wordmark & Tagline */}
        <div
          className={`space-y-2 transition-all duration-500 delay-150 transform ${
            stage === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black tracking-tight text-[#111827]">APEX 4</span>
          </div>

          <p className="text-xs font-semibold text-[#2563EB] tracking-wider uppercase">
            Rehabilitation, reimagined.
          </p>
        </div>

        {/* Progress Bar / Scan Line */}
        <div className="w-48 h-1 bg-[#E5E7EB] rounded-full overflow-hidden relative shadow-inner mt-4">
          <div
            className="h-full bg-[#2563EB] rounded-full transition-all duration-1000 ease-out"
            style={{ width: stage === 'enter' ? '10%' : stage === 'reveal' ? '85%' : '100%' }}
          />
        </div>

        <span className="text-[10px] font-medium text-slate-400 tracking-wider">
          AI-assisted movement monitoring through play
        </span>
      </div>
    </div>
  );
};
