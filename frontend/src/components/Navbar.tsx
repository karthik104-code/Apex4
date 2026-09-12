import React, { useState, useEffect } from 'react';
import { Bell, Globe, User, Activity, Menu, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { apiService } from '../services/api';
import { NotificationItem } from '../types/healthcare';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    apiService.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-surface/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-emerald flex items-center justify-center shadow-lg shadow-primary-600/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-primary-400 bg-clip-text text-transparent">
              {t('app_title')}
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary-400 block -mt-1">
              Assistive AI Platform
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-300 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-primary-400" />
            <span className="uppercase">{language}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 glass-panel rounded-xl shadow-xl py-1 z-50 border border-slate-700/80 text-xs">
              <button
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center justify-between"
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-primary-400" />}
              </button>
              <button
                onClick={() => { setLanguage('ml'); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center justify-between"
              >
                <span>മലയാളം (ML)</span>
                {language === 'ml' && <Check className="w-3.5 h-3.5 text-primary-400" />}
              </button>
              <button
                onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center justify-between"
              >
                <span>हिन्दी (HI)</span>
                {language === 'hi' && <Check className="w-3.5 h-3.5 text-primary-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-all"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl p-4 z-50 border border-slate-700/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-semibold text-sm text-slate-200">Notifications</h3>
                <span className="text-xs text-primary-400 font-medium">{unreadCount} new</span>
              </div>
              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/70 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.created_at}</span>
                    </div>
                    <p className="text-xs text-slate-300 opacity-90">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-slate-600/80">
            <User className="w-4 h-4 text-slate-200" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-slate-200 block leading-tight">{user?.full_name || 'John Doe'}</span>
            <span className="text-[10px] text-slate-400 capitalize">{user?.role || 'Patient'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
