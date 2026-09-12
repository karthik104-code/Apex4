import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while communicating with the health services.',
  onRetry
}) => {
  return (
    <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 bg-rose-500/5 text-center space-y-4 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-base text-rose-200">{title}</h3>
        <p className="text-xs text-rose-300/80 mt-1">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mx-auto">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
};
