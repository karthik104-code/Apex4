import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { MedicalReportsPage } from './pages/MedicalReportsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { HealthAnalyticsPage } from './pages/HealthAnalyticsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected App Routes */}
            <Route path="/dashboard" element={<ProtectedLayout><PatientDashboard /></ProtectedLayout>} />
            <Route path="/assistant" element={<ProtectedLayout><AIAssistantPage /></ProtectedLayout>} />
            <Route path="/ai-assistant" element={<ProtectedLayout><AIAssistantPage /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><MedicalReportsPage /></ProtectedLayout>} />
            <Route path="/appointments" element={<ProtectedLayout><AppointmentsPage /></ProtectedLayout>} />
            <Route path="/analytics" element={<ProtectedLayout><HealthAnalyticsPage /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><ProfileSettingsPage /></ProtectedLayout>} />
            <Route path="/doctor-dashboard" element={<ProtectedLayout><DoctorDashboardPage /></ProtectedLayout>} />

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
