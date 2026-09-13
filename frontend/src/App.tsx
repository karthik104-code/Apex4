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
      id: 'ses-401',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 12, 2026',
      durationSeconds: 240,
      fusionScore: { movementQuality: 82, performanceScore: 84, combinedSessionScore: 83, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 12.4, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.06, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.2, torsoRotationLevel: 'low', overallStability: 81 },
      telemetry: { force: 64, reactionTime: 1.24, accuracy: 87, strikeConsistency: 82, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-301',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 10, 2026',
      durationSeconds: 240,
      fusionScore: { movementQuality: 78, performanceScore: 81, combinedSessionScore: 80, compensationSummary: 'Medium trunk lean & shoulder hike.' },
      compensationMetrics: { trunkLeanAngle: 14.1, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.07, shoulderHikeLevel: 'medium', torsoRotationAngle: 5.8, torsoRotationLevel: 'low', overallStability: 79 },
      telemetry: { force: 62, reactionTime: 1.35, accuracy: 83, strikeConsistency: 80, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-201',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 08, 2026',
      durationSeconds: 250,
      fusionScore: { movementQuality: 74, performanceScore: 78, combinedSessionScore: 76, compensationSummary: 'Medium trunk lean detected.' },
      compensationMetrics: { trunkLeanAngle: 15.8, trunkLeanLevel: 'medium', shoulderHikeDisplacement: 0.08, shoulderHikeLevel: 'medium', torsoRotationAngle: 6.4, torsoRotationLevel: 'medium', overallStability: 75 },
      telemetry: { force: 60, reactionTime: 1.48, accuracy: 81, strikeConsistency: 77, mode: 'simulated' },
      status: 'completed',
    },
    {
      id: 'ses-101',
      patientId: 'patient-01',
      patientName: 'Alex Mercer',
      date: 'Sep 06, 2026',
      durationSeconds: 220,
      fusionScore: { movementQuality: 71, performanceScore: 73, combinedSessionScore: 72, compensationSummary: 'High trunk lean on initial strikes.' },
      compensationMetrics: { trunkLeanAngle: 18.2, trunkLeanLevel: 'high', shoulderHikeDisplacement: 0.09, shoulderHikeLevel: 'medium', torsoRotationAngle: 7.1, torsoRotationLevel: 'medium', overallStability: 72 },
      telemetry: { force: 55, reactionTime: 1.62, accuracy: 76, strikeConsistency: 72, mode: 'simulated' },
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
          <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><LoadingState message="Initializing APEX 4..." /></div>}>
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
