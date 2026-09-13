import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: 'bg-[#EAF8F1] border border-emerald-200 text-[#166534]',
    error: 'bg-[#FEE2E2] border border-red-200 text-[#EF4444]',
    info: 'bg-[#EAF2FF] border border-blue-200 text-[#2563EB]'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 text-xs sm:text-sm animate-in slide-in-from-bottom-5 ${typeStyles[type]}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#22A06B] shrink-0" /> : <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />}
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="p-1 hover:opacity-75">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
