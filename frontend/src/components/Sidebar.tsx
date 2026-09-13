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
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 bottom-0 z-50
        w-64 bg-white border-r border-[#E5E7EB]
        flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shadow-xs
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <img src="/apex4-logo.png" alt="APEX 4 Logo" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-bold text-sm text-[#111827] tracking-tight block">APEX 4</span>
              <span className="text-[10px] text-slate-500 font-medium">Rehabilitation, reimagined.</span>
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
                    flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all
                    ${isActive 
                      ? 'bg-[#EAF2FF] text-[#2563EB] font-semibold border border-blue-200' 
                      : 'text-slate-600 hover:text-[#111827] hover:bg-slate-50'}
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-600 hover:text-[#EF4444] hover:bg-[#FEE2E2] transition-all font-medium text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
