import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'ml' | 'hi';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<LanguageCode, Record<string, string>> = {
  en: {
    app_title: "AI Healthcare Companion",
    dashboard: "Patient Dashboard",
    ai_assistant: "AI Assistant",
    reports: "Medical Reports",
    appointments: "Appointments",
    analytics: "Health Analytics",
    settings: "Settings",
    disclaimer_title: "Assistive Healthcare Information",
    disclaimer_text: "AI Healthcare Companion is an educational tool and NOT a doctor. Always consult a qualified physician for clinical advice.",
    welcome_back: "Welcome Back",
    quick_actions: "Quick Actions",
    upload_report: "Upload Report",
    ask_ai: "Ask AI Assistant",
    book_appointment: "Book Appointment",
    recent_reports: "Recent Reports",
    upcoming_appointments: "Upcoming Appointments",
    health_vitals: "Health Overview & Vitals"
  },
  ml: {
    app_title: "എഐ ഹെൽത്ത്കെയർ സഹായി",
    dashboard: "രോഗിയുടെ ഡാഷ്‌ബോർഡ്",
    ai_assistant: "എഐ അസിസ്റ്റന്റ്",
    reports: "മെഡിക്കൽ റിപ്പോർട്ടുകൾ",
    appointments: "അപ്പോയിന്റ്മെന്റുകൾ",
    analytics: "ആരോഗ്യ വിവരങ്ങൾ",
    settings: "ക്രമീകരണങ്ങൾ",
    disclaimer_title: "ആരോഗ്യ വിവര സഹായി",
    disclaimer_text: "ഈ എഐ സിസ്റ്റം ഒരു ഡോക്ടർക്ക് പകരമാവില്ല. മെഡിക്കൽ സംശയങ്ങൾക്ക് ഡോക്ടറെ സമീപിക്കുക.",
    welcome_back: "സ്വാഗതം",
    quick_actions: "പെട്ടെന്നുള്ള പ്രവർത്തനങ്ങൾ",
    upload_report: "റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക",
    ask_ai: "ചോദ്യം ചോദിക്കുക",
    book_appointment: "അപ്പോയിന്റ്മെന്റ് എടുക്കുക",
    recent_reports: "സമീപകാല റിപ്പോർട്ടുകൾ",
    upcoming_appointments: "അടുത്ത അപ്പോയിന്റ്മെന്റുകൾ",
    health_vitals: "ആരോഗ്യ വിറ്റലുകൾ"
  },
  hi: {
    app_title: "एआई हेल्थकेयर साथी",
    dashboard: "रोगी डैशबोर्ड",
    ai_assistant: "एआई सहायक",
    reports: "मेडिकल रिपोर्ट",
    appointments: "अपॉइंटमेंट",
    analytics: "स्वास्थ्य विश्लेषण",
    settings: "सेटिंग्स",
    disclaimer_title: "सहायक स्वास्थ्य जानकारी",
    disclaimer_text: "यह एआई प्रणाली केवल जानकारी के लिए है और डॉक्टर की सलाह का विकल्प नहीं है।",
    welcome_back: "स्वागत है",
    quick_actions: "त्वरित कार्रवाई",
    upload_report: "रिपोर्ट अपलोड करें",
    ask_ai: "एआई से पूछें",
    book_appointment: "अपॉइंटमेंट लें",
    recent_reports: "हाल की रिपोर्ट",
    upcoming_appointments: "आगामी अपॉइंटमेंट",
    health_vitals: "स्वास्थ्य विवरण"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  const t = (key: string): string => {
    return DICTIONARY[language][key] || DICTIONARY['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
