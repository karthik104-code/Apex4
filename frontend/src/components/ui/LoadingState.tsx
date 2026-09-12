import React from 'react';
import { Activity } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading health data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 animate-bounce">
        <Activity className="w-6 h-6 animate-spin" />
      </div>
      <span className="text-sm font-semibold text-slate-300 animate-pulse">{message}</span>
    </div>
  );
};
