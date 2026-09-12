import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bot, FileText, Calendar, Plus, 
  ArrowUpRight, AlertCircle, CheckCircle2, Activity, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { apiService } from '../services/api';
import { StructuredReportResult, Appointment, HealthMetric } from '../types/healthcare';

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState<StructuredReportResult[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<HealthMetric[]>([]);

  useEffect(() => {
    apiService.getReports().then(setReports);
    apiService.getAppointments().then(setAppointments);
    apiService.getHealthMetrics().then(setVitals);
  }, []);

  const latestReport = reports[0];
  const upcomingApt = appointments.find(a => a.status === 'scheduled');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-surface via-slate-800/80 to-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-semibold uppercase tracking-wider border border-primary-500/30">
              Active Patient Profile
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            {t('welcome_back')}, {user?.full_name || 'John Doe'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here is your health overview, lab report highlights, and upcoming appointments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 text-white shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Report</span>
          </button>
        </div>
      </div>

      {/* Safety Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/reports')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-all">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Upload Report</h3>
            <p className="text-xs text-slate-400">PDF / Image Extraction</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/ai-assistant')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue group-hover:scale-110 transition-all">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Ask AI Assistant</h3>
            <p className="text-xs text-slate-400">Voice & Multi-language</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/appointments')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-emerald/20 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald group-hover:scale-110 transition-all">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Book Doctor</h3>
            <p className="text-xs text-slate-400">Schedule Consultations</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/analytics')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple group-hover:scale-110 transition-all">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Health Analytics</h3>
            <p className="text-xs text-slate-400">Lab Trends & Graphs</p>
          </div>
        </div>
      </div>

      {/* Health Vitals Summary Row */}
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

      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Latest Report & AI Findings */}
        <div className="lg:col-span-2 space-y-6">
          {latestReport && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-700/80">
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
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2">
                <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider block">AI Patient Explanation</span>
                <p className="leading-relaxed">{latestReport.patient_explanation}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Key Laboratory Findings ({latestReport.abnormal_count} Flagged)</span>
                <div className="space-y-2">
                  {latestReport.key_findings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Upcoming Appointment & Recommended Questions */}
        <div className="space-y-6">
          {/* Upcoming Doctor Appointment Card */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-700/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-emerald" />
                <span>Upcoming Appointment</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-emerald/20 text-accent-emerald uppercase">
                Confirmed
              </span>
            </div>

            {upcomingApt ? (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{upcomingApt.doctor_name}</span>
                </div>
                <p className="text-xs text-slate-400">{upcomingApt.specialty}</p>
                <div className="flex items-center gap-3 pt-2 text-xs text-slate-300 font-medium">
                  <span>📅 {upcomingApt.appointment_date}</span>
                  <span>⏰ {upcomingApt.time_slot}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming appointments scheduled.</p>
            )}

            <button
              onClick={() => navigate('/appointments')}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Manage Appointments
            </button>
          </div>

          {/* Suggested Questions for Doctor */}
          {latestReport && (
            <div className="glass-panel p-6 rounded-3xl space-y-3 border border-slate-700/80">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary-400" />
                <span>Questions for Your Doctor</span>
              </h3>
              <div className="space-y-2">
                {latestReport.recommended_questions.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => navigate('/ai-assistant', { state: { initialQuestion: q } })}
                    className="w-full text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span className="line-clamp-2">{q}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
