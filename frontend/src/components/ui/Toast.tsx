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
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200',
    error: 'bg-rose-500/20 border-rose-500/40 text-rose-200',
    info: 'bg-primary-500/20 border-primary-500/40 text-primary-200'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs sm:text-sm animate-in slide-in-from-bottom-5 ${typeStyles[type]}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="p-1 hover:opacity-75">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
