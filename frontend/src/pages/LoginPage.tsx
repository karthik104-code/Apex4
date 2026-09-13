import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Building, Phone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, signup } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [role, setRole] = useState<'therapist' | 'patient'>('therapist');

  const fromRoute = (location.state as any)?.from?.pathname || '/dashboard';

  // 1-Click Demo Pre-fill
  const handleFillDemo = () => {
    setEmail('alex.mercer@apex4.ai');
    setPassword('Apex4Pass2026!');
    setFullName('Dr. Alex Mercer, PT');
    setPhone('+1 (555) 019-2831');
    setClinicName('APEX 4 Neurological Rehab Institute');
    setToastMessage('Demo login credentials pre-filled!');
  };

  // Google Sign In
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setToastMessage('Successfully authenticated with Google!');
      setTimeout(() => {
        navigate(fromRoute, { replace: true });
      }, 600);
    } catch (e) {
      setToastMessage('Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign In / Sign Up Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await login(email || 'therapist@apex4.ai', password);
        setToastMessage('Signed in successfully!');
      } else {
        if (!fullName || !email) {
          setToastMessage('Please fill in your full name and email address.');
          setIsLoading(false);
          return;
        }
        await signup({
          fullName,
          email,
          role,
          phone,
          clinicName,
          password,
        });
        setToastMessage('Account created successfully! Welcome to APEX 4.');
      }

      setTimeout(() => {
        navigate(fromRoute, { replace: true });
      }, 700);
    } catch (err) {
      setToastMessage('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-2xl tracking-tight text-[#111827]">APEX 4</span>
          </div>

          <h2 className="text-xl font-bold text-[#111827] tracking-tight">
            {mode === 'signin' ? 'Sign in to APEX 4' : 'Create your APEX 4 Account'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            AI-assisted movement monitoring through play.
          </p>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-[#111827] hover:bg-slate-50 transition-all shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.04.01 12s.45 3.8 1.26 5.42l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center text-xs">
          <div className="w-full border-t border-[#E5E7EB]" />
          <span className="bg-white px-3 text-slate-400 font-medium shrink-0">or continue with email</span>
        </div>

        {/* Sign In vs Sign Up Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-100 border border-[#E5E7EB] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`w-1/2 py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#2563EB] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[#111827]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`w-1/2 py-2 rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#2563EB] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[#111827]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Sign Up Fields: Personal Details */}
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-[#111827] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Alex Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB] text-[#111827]"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-[#111827]">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('therapist')}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                      role === 'therapist'
                        ? 'bg-[#EAF2FF] text-[#2563EB] border-blue-200'
                        : 'bg-white text-slate-600 border-[#E5E7EB]'
                    }`}
                  >
                    Physiotherapist
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                      role === 'patient'
                        ? 'bg-[#EAF8F1] text-[#22A06B] border-emerald-200'
                        : 'bg-white text-slate-600 border-[#E5E7EB]'
                    }`}
                  >
                    Patient / User
                  </button>
                </div>
              </div>

              {/* Phone & Clinic Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#111827] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Phone</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB] text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#111827] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Clinic / Hospital</span>
                  </label>
                  <input
                    type="text"
                    placeholder="APEX 4 Health Institute"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB] text-[#111827]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="therapist@apex4.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB] text-[#111827]"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="font-semibold text-[#111827] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB] text-[#111827]"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 space-y-3">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl py-3 text-xs shadow-xs flex items-center justify-center gap-2"
            >
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Quick Demo Pre-fill Button */}
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full text-center text-xs text-[#2563EB] hover:underline font-semibold py-1 block"
            >
              ⚡ 1-Click Fill Demo Credentials
            </button>
          </div>
        </form>

        {/* Safety Note */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
          <span>APEX 4 Encrypted Rehabilitation Auth</span>
        </div>
      </div>
    </div>
  );
};
