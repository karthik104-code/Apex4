import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoadingState } from './components/ui/LoadingState';
import { RehabSession, BaselineCalibration } from './types/rehab';
import { createDefaultCalibration } from './pose/compensation';

// Lazy-loaded page components for MSV1 Rehabilitation Platform
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LiveSessionPage = lazy(() => import('./pages/LiveSessionPage').then(m => ({ default: m.LiveSessionPage })));
const CalibrationPage = lazy(() => import('./pages/CalibrationPage').then(m => ({ default: m.CalibrationPage })));
const TherapistDashboardPage = lazy(() => import('./pages/TherapistDashboardPage').then(m => ({ default: m.TherapistDashboardPage })));
const SessionHistoryPage = lazy(() => import('./pages/SessionHistoryPage').then(m => ({ default: m.SessionHistoryPage })));

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const [calibration, setCalibration] = useState<BaselineCalibration>(createDefaultCalibration());
  const [sessions, setSessions] = useState<RehabSession[]>([
    {
      id: 's-demo-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: '2026-09-12',
      durationSeconds: 240,
      fusionScore: {
        movementQuality: 82,
        performanceScore: 84,
        combinedSessionScore: 83,
        compensationSummary: 'Medium trunk lean detected during higher force strikes.',
      },
      compensationMetrics: {
        trunkLeanAngle: 12.4,
        trunkLeanLevel: 'medium',
        shoulderHikeDisplacement: 0.06,
        shoulderHikeLevel: 'medium',
        torsoRotationAngle: 5.2,
        torsoRotationLevel: 'low',
        overallStability: 81,
      },
      telemetry: {
        force: 64,
        reactionTime: 1.24,
        accuracy: 87,
        strikeConsistency: 82,
        mode: 'simulated',
      },
      status: 'completed',
    },
  ]);

  const handleSessionCompleted = (newSession: RehabSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><LoadingState message="Initializing MSV1 AI Platform..." /></div>}>
            <Routes>
              {/* MSV1 Navigation Routes */}
              <Route path="/" element={<ProtectedLayout><LandingPage /></ProtectedLayout>} />
              <Route
                path="/session"
                element={
                  <ProtectedLayout>
                    <LiveSessionPage
                      calibration={calibration}
                      onSessionCompleted={handleSessionCompleted}
                    />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/calibration"
                element={
                  <ProtectedLayout>
                    <CalibrationPage
                      calibration={calibration}
                      onSaveCalibration={setCalibration}
                    />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedLayout>
                    <TherapistDashboardPage sessions={sessions} />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedLayout>
                    <SessionHistoryPage sessions={sessions} />
                  </ProtectedLayout>
                }
              />

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
