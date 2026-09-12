import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoadingState } from './components/ui/LoadingState';

// Lazy-loaded page components for bundle optimization
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard').then(m => ({ default: m.PatientDashboard })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const MedicalReportsPage = lazy(() => import('./pages/MedicalReportsPage').then(m => ({ default: m.MedicalReportsPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const HealthAnalyticsPage = lazy(() => import('./pages/HealthAnalyticsPage').then(m => ({ default: m.HealthAnalyticsPage })));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage').then(m => ({ default: m.ProfileSettingsPage })));
const DoctorDashboardPage = lazy(() => import('./pages/DoctorDashboardPage').then(m => ({ default: m.DoctorDashboardPage })));

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
          <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><LoadingState message="Initializing Healthcare Companion..." /></div>}>
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
          </Suspense>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
