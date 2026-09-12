import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bot, FileText, Calendar, Plus, 
  ArrowUpRight, AlertCircle, CheckCircle2, Activity, Sparkles, MessageSquare, Clock, X 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { apiService } from '../services/api';
import { StructuredReportResult, Appointment, HealthMetric } from '../types/healthcare';

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState<StructuredReportResult[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<HealthMetric[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Log Vitals Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [metricType, setMetricType] = useState('hemoglobin');
  const [metricValue, setMetricValue] = useState('11.0');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    apiService.getReports().then(setReports);
    apiService.getAppointments().then(setAppointments);
    apiService.getHealthMetrics().then(setVitals);
    apiService.getConversations().then(setConversations);
  }, []);

  const latestReport = reports[0];
  const upcomingApt = appointments.find(a => a.status === 'scheduled');
  const completedApt = appointments.find(a => a.status === 'completed');

  const [hemoglobinTrend, setHemoglobinTrend] = useState([
    { date: 'Jan', value: 11.5 },
    { date: 'May', value: 10.8 },
    { date: 'Sep', value: 10.2 }
  ]);

  const handleSaveVital = () => {
    const val = parseFloat(metricValue);
    if (isNaN(val)) return;

    if (metricType === 'hemoglobin') {
      setHemoglobinTrend(prev => [...prev, { date: 'Today', value: val }]);
    }
    setShowLogModal(false);
    setToastMessage(`Logged new ${metricType.toUpperCase()} reading: ${val}!`);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-surface via-slate-800/80 to-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-semibold uppercase tracking-wider border border-primary-500/30">
              Active Patient Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            {t('welcome_back')}, {user?.full_name || 'John Doe'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here is your health overview, report highlights, follow-up reminders, and AI conversations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setShowLogModal(true)}>
            <Activity className="w-4 h-4 text-primary-400" />
            <span>+ Log Vitals</span>
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/reports')}>
            <Plus className="w-4 h-4" />
            <span>Upload New Report</span>
          </Button>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* 8. Quick Actions Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect glass onClick={() => navigate('/assistant')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-200">Ask AI Assistant</h3>
              <p className="text-[10px] text-slate-400">Voice & Multilingual</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect glass onClick={() => navigate('/reports')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-200">Upload Report</h3>
              <p className="text-[10px] text-slate-400">PDF / Image OCR</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect glass onClick={() => navigate('/reports')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-200">View Reports</h3>
              <p className="text-[10px] text-slate-400">{reports.length} Reports Analyzed</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect glass onClick={() => navigate('/appointments')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-emerald/20 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-200">Appointments</h3>
              <p className="text-[10px] text-slate-400">Consultations & Reminders</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 2 & 7. Health Overview & Health Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-400 font-medium">Hemoglobin (Hb)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">10.2 <span className="text-xs font-normal text-slate-400">g/dL</span></span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">LOW</span>
          </div>
          <p className="text-[11px] text-slate-400">Ref: 12.0 - 16.5 g/dL</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-400 font-medium">Fasting Blood Glucose</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">145 <span className="text-xs font-normal text-slate-400">mg/dL</span></span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">HIGH</span>
          </div>
          <p className="text-[11px] text-slate-400">Ref: 70.0 - 99.0 mg/dL</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-400 font-medium">Total Cholesterol</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">210 <span className="text-xs font-normal text-slate-400">mg/dL</span></span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">HIGH</span>
          </div>
          <p className="text-[11px] text-slate-400">Ref: 125 - 200 mg/dL</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400 font-medium">Blood Pressure</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">120/80 <span className="text-xs font-normal text-slate-400">mmHg</span></span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">NORMAL</span>
          </div>
          <p className="text-[11px] text-slate-400">Target: &lt;120/80</p>
        </div>
      </div>

      {/* Main Dashboard Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3. Recent Medical Report & Recharts Trend */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3. Recent Medical Report Summary */}
          {latestReport ? (
            <Card glass className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-100">{latestReport.title}</h2>
                    <span className="text-xs text-slate-400">Uploaded {latestReport.upload_date}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/reports')}
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <span>Report Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2">
                <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider block">AI Patient Explanation</span>
                <p className="leading-relaxed">{latestReport.patient_explanation}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Flagged Findings</span>
                <div className="space-y-2">
                  {latestReport.key_findings.slice(0, 3).map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card glass className="text-center py-8">
              <p className="text-xs text-slate-400">No medical reports uploaded yet.</p>
            </Card>
          )}

          {/* Embedded Recharts Vitals Trend */}
          <Card glass className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-400" />
                <span>Hemoglobin (Hb) Trajectory</span>
              </h3>
              <span className="text-xs text-rose-400 font-semibold">10.2 g/dL (Low)</span>
            </div>
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hemoglobinTrend}>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[9, 13]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#f8fafc' }} />
                  <ReferenceLine y={12.0} label="Target (12.0)" stroke="#10b981" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: 4. Upcoming Appointment, 5. Follow-up Reminder, 6. Recent AI Conversations */}
        <div className="space-y-6">
          {/* 4. Upcoming Appointment */}
          <Card glass className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-emerald" />
                <span>Upcoming Appointment</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-emerald/20 text-accent-emerald uppercase">
                Scheduled
              </span>
            </div>

            {upcomingApt ? (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="font-bold text-sm text-slate-200 block">{upcomingApt.doctor_name}</span>
                <p className="text-xs text-slate-400">{upcomingApt.specialty}</p>
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-300 font-medium">
                  <span>📅 {upcomingApt.appointment_date}</span>
                  <span>⏰ {upcomingApt.time_slot}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming appointments.</p>
            )}
          </Card>

          {/* 5. Follow-up Reminders */}
          <Card glass className="space-y-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Follow-Up Reminders</span>
            </h3>

            {upcomingApt?.follow_up_date ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Iron Panel Re-Test Reminder</span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 rounded-full">{upcomingApt.follow_up_date}</span>
                </div>
                <p className="text-[11px] opacity-90">Schedule follow-up lab draw with Dr. Sarah Jenkins.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active follow-up reminders.</p>
            )}
          </Card>

          {/* 6. Recent AI Conversations */}
          <Card glass className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-400" />
                <span>Recent AI Chats</span>
              </h3>
              <button onClick={() => navigate('/assistant')} className="text-xs text-primary-400 font-semibold">
                Open Assistant
              </button>
            </div>

            <div className="space-y-2">
              {conversations.slice(0, 2).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate('/assistant')}
                  className="w-full text-left p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-all flex items-center justify-between"
                >
                  <span className="truncate pr-2">{c.title}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Log Vitals Reading Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4 text-left relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Log Vitals Reading</h3>
                <p className="text-xs text-slate-400">Record self-measured or updated lab values</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Health Parameter</label>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-primary-500"
                >
                  <option value="hemoglobin">Hemoglobin (g/dL)</option>
                  <option value="glucose">Fasting Blood Glucose (mg/dL)</option>
                  <option value="cholesterol">Total Cholesterol (mg/dL)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Value</label>
                <input
                  type="number"
                  step="0.1"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. 11.2"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="secondary" size="md" onClick={() => setShowLogModal(false)} className="w-full">
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveVital} className="w-full">
                Save Vital
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

