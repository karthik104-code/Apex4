import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Globe, User, Activity, Menu, Check, AlertTriangle, PhoneCall, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { apiService } from '../services/api';
import { NotificationItem } from '../types/healthcare';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);

  useEffect(() => {
    apiService.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-[#111827]">
              APEX 4
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#2563EB] block -mt-0.5">
              Rehabilitation, reimagined.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* SOS Emergency Button */}
        <button
          onClick={() => setShowSOSModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEE2E2] hover:bg-[#FCA5A5]/30 border border-[#FECACA] text-[#EF4444] text-xs font-bold transition-all"
          title="Emergency Medical Assistance"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
          <span>SOS</span>
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E7EB] text-xs font-medium text-[#111827] transition-all shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="uppercase">{language}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-1 z-50 border border-[#E5E7EB] text-xs">
              <button
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-[#111827]"
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
              </button>
              <button
                onClick={() => { setLanguage('ml'); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-[#111827]"
              >
                <span>മലയാളം (ML)</span>
                {language === 'ml' && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
              </button>
              <button
                onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-[#111827]"
              >
                <span>हिन्दी (HI)</span>
                {language === 'hi' && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#111827] transition-all shadow-xs"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl p-4 z-50 border border-[#E5E7EB]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-[#111827]">Notifications</h3>
                <span className="text-xs text-[#2563EB] font-medium">{unreadCount} new</span>
              </div>
              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#111827]">{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.created_at}</span>
                    </div>
                    <p className="text-xs text-slate-600">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Auth Link */}
        <div
          onClick={() => navigate('/login')}
          className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
          title="Account Login / User Profile"
        >
          <div className="w-8 h-8 rounded-full bg-[#EAF2FF] border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-[#111827] block leading-tight">{user?.full_name || 'Dr. Alex Mercer'}</span>
            <span className="text-[10px] text-[#2563EB] font-bold capitalize">Sign In / Account</span>
          </div>
        </div>
      </div>

      {/* SOS Emergency Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowSOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Emergency Medical Support</h3>
                <p className="text-xs text-[#EF4444]">If you are experiencing severe symptoms, act immediately.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <p className="font-semibold text-[#EF4444]">⚠️ Call Emergency Services if experiencing:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Severe chest pain or difficulty breathing</li>
                <li>Sudden numbness or loss of consciousness</li>
                <li>Uncontrolled bleeding or severe trauma</li>
              </ul>
            </div>

            <div className="space-y-2">
              <a
                href="tel:911"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#EF4444] hover:bg-red-600 text-white font-bold text-sm transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call National Emergency Services (911 / 108)</span>
              </a>
              <button
                onClick={() => setShowSOSModal(false)}
                className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all"
              >
                Close Warning Window
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

