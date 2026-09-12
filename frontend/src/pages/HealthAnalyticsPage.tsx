import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceLine, BarChart, Bar, Legend 
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/api';
import { HealthMetric } from '../types/healthcare';

export const HealthAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    apiService.getHealthMetrics().then(setMetrics);
  }, []);

  const hemoglobinData = [
    { date: 'Jan 2026', value: 11.5, target: 12.0 },
    { date: 'May 2026', value: 10.8, target: 12.0 },
    { date: 'Sep 2026', value: 10.2, target: 12.0 },
  ];

  const glucoseData = [
    { date: 'Jan 2026', value: 110, limit: 99 },
    { date: 'May 2026', value: 132, limit: 99 },
    { date: 'Sep 2026', value: 145, limit: 99 },
  ];

  const cholesterolData = [
    { date: 'Jan 2026', value: 190, maxNormal: 200 },
    { date: 'Sep 2026', value: 210, maxNormal: 200 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Health Analytics & Vitals Trends</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical trajectory of your blood laboratory findings and vital parameters over time.
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hemoglobin Trend */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100">Hemoglobin (Hb) Trajectory</h3>
              <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                Declining trend - Currently Below 12.0 g/dL Target
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300">g/dL</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hemoglobinData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis domain={[9, 14]} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }}
                />
                <ReferenceLine y={12.0} label="Min Target (12.0)" stroke="#10b981" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fasting Glucose Trend */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100">Fasting Blood Glucose Trend</h3>
              <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                Elevated trend - Above 99 mg/dL Threshold
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300">mg/dL</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={glucoseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 160]} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }}
                />
                <ReferenceLine y={99} label="Normal Limit (99)" stroke="#10b981" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Total Cholesterol Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100">Total Cholesterol Comparison</h3>
              <span className="text-xs text-slate-400 font-medium">Comparing historical lab results vs 200 mg/dL upper threshold</span>
            </div>
            <span className="text-xs font-bold text-slate-300">mg/dL</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cholesterolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis domain={[100, 250]} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={40} />
                <Bar dataKey="maxNormal" fill="#334155" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
