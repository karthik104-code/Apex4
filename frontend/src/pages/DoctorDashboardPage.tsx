import React, { useState } from 'react';
import { Stethoscope, User, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const DoctorDashboardPage: React.FC = () => {
  const [patients] = useState([
    {
      id: 'p1',
      name: 'John Doe',
      age: 34,
      gender: 'Male',
      reason: 'Review blood glucose (145 mg/dL) & anemia panel.',
      status: 'Awaiting Consultation',
      flagged: 'Hemoglobin 10.2 LOW, Glucose 145 HIGH',
      time: '10:30 AM Today'
    },
    {
      id: 'p2',
      name: 'Emma Watson',
      age: 29,
      gender: 'Female',
      reason: 'Thyroid function test (TSH 5.2 uIU/mL).',
      status: 'Reviewed',
      flagged: 'TSH Elevated',
      time: '02:00 PM Tomorrow'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-semibold uppercase border border-accent-blue/30">
              Clinical Doctor Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Physician Overview & Patient Queue</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review patient lab extraction summaries, AI preliminary reports, and consultation queue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {patients.map((p) => (
          <div key={p.id} className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{p.name} ({p.age}y / {p.gender})</h3>
                  <span className="text-xs text-slate-400">{p.time}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                {p.status}
              </span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="font-semibold text-slate-400 block">Consultation Reason:</span>
              <p>{p.reason}</p>
              <div className="flex items-center gap-2 text-rose-300 font-semibold pt-1">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>AI Extracted Lab Flags: {p.flagged}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
