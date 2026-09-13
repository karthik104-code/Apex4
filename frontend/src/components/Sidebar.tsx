import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, PlayCircle, RefreshCw, LayoutDashboard, History, Activity, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/session', label: 'Live Rehabilitation', icon: PlayCircle },
    { path: '/calibration', label: 'Postural Calibration', icon: RefreshCw },
    { path: '/dashboard', label: 'Therapist Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'Session Archive', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 bottom-0 z-50
        w-64 bg-surface/90 backdrop-blur-xl border-r border-slate-800/80
        flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600/30 border border-primary-500/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 tracking-tight block">MSV1 Platform</span>
              <span className="text-[10px] text-slate-400 font-medium">Rehab Through Play</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all
                    ${isActive 
                      ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30 shadow-md shadow-primary-900/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all font-medium text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
