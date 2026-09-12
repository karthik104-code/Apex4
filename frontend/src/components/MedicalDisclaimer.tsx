import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const MedicalDisclaimer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-amber-200 text-xs sm:text-sm shadow-sm backdrop-blur-sm">
      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-amber-300 block mb-0.5">{t('disclaimer_title')}</span>
        <p className="opacity-90 leading-relaxed">
          {t('disclaimer_text')}
        </p>
      </div>
    </div>
  );
};
