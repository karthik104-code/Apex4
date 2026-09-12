import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('patient@healthcare.ai');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('John Doe');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await login('patient@healthcare.ai', 'demopassword');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary-500 selection:text-white">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-600/30 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center mx-auto shadow-lg shadow-primary-600/30">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            {isRegister ? 'Create Patient Account' : 'Welcome to AI Companion'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Sign up for intelligent health tracking' : 'Enter your details to access your patient portal'}
          </p>
        </div>

        {/* 1-Click Demo Shortcut */}
        <button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full py-3 rounded-2xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-300 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span>1-Click Hackathon Demo Login</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-[10px] uppercase tracking-wider text-slate-500">or sign in with email</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all"
                placeholder="patient@healthcare.ai"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-sm shadow-lg shadow-primary-600/25 transition-all flex items-center justify-center gap-2 mt-6"
          >
            <span>{isLoading ? 'Signing In...' : (isRegister ? 'Create Account' : 'Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-primary-400 transition-all"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
