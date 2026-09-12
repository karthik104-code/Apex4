import React, { useState } from 'react';
import { Stethoscope, User, Calendar, FileText, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';

export const DoctorDashboardPage: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [patients, setPatients] = useState([
    {
      id: 'p1',
      name: 'John Doe',
      age: 34,
      gender: 'Male',
      reason: 'Review blood glucose (145 mg/dL) & anemia panel.',
      status: 'Awaiting Consultation',
      flagged: 'Hemoglobin 10.2 LOW, Glucose 145 HIGH',
      time: '10:30 AM Today',
      doctorNotes: ''
    },
    {
      id: 'p2',
      name: 'Emma Watson',
      age: 29,
      gender: 'Female',
      reason: 'Thyroid function test (TSH 5.2 uIU/mL).',
      status: 'Reviewed',
      flagged: 'TSH Elevated',
      time: '02:00 PM Tomorrow',
      doctorNotes: 'Prescribed follow-up TSH panel in 6 weeks.'
    }
  ]);

  const handleApprove = (id: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved by Physician' } : p));
    setToastMessage("Lab review approved by Physician!");
  };

  const handleAddNote = (id: string) => {
    const note = prompt("Enter Physician Clinical Note for Patient:");
    if (note) {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, doctorNotes: note } : p));
      setToastMessage("Saved Physician Clinical Note!");
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                p.status.includes('Approved') 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
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
              {p.doctorNotes && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-300 space-y-1 mt-2">
                  <span className="font-bold block text-[11px] text-slate-400 uppercase">Physician Clinical Notes:</span>
                  <p>{p.doctorNotes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddNote(p.id)}
                className="flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                <span>Add Physician Note</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(p.id)}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Preliminary Lab Review</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

