import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Clock, User, Stethoscope, 
  CheckCircle, Video, MapPin, AlertCircle 
} from 'lucide-react';
import { apiService } from '../services/api';
import { Appointment } from '../types/healthcare';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Sarah Jenkins, MD');
  const [specialty, setSpecialty] = useState('Internal Medicine & Endocrinology');
  const [date, setDate] = useState('2026-09-22');
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [locationType, setLocationType] = useState<'in_person' | 'telehealth'>('in_person');
  const [notes, setNotes] = useState('Review hemoglobin & blood glucose lab findings.');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    const data = await apiService.getAppointments();
    setAppointments(data);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const newApt = await apiService.createAppointment({
      doctor_name: doctorName,
      specialty,
      appointment_date: date,
      time_slot: timeSlot,
      location_type: locationType,
      notes
    });
    setAppointments(prev => [newApt, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Doctor Appointments & Follow-ups</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Book consultations, track follow-up dates, and set health reminders.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 text-white shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.map((apt) => (
          <div key={apt.id} className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{apt.doctor_name}</h3>
                  <span className="text-xs text-slate-400 block">{apt.specialty}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                apt.status === 'scheduled' ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {apt.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-primary-400" />
                <span>{apt.appointment_date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-primary-400" />
                <span>{apt.time_slot}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 col-span-2">
                {apt.location_type === 'in_person' ? (
                  <MapPin className="w-4 h-4 text-accent-emerald" />
                ) : (
                  <Video className="w-4 h-4 text-accent-blue" />
                )}
                <span className="capitalize">{apt.location_type.replace('_', ' ')} Consultation</span>
              </div>
            </div>

            {apt.notes && (
              <p className="text-xs text-slate-400 italic bg-slate-900/30 p-3 rounded-xl">
                "{apt.notes}"
              </p>
            )}

            {apt.follow_up_date && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Follow-Up Reminder Date:</span>
                <span className="font-semibold text-primary-300">{apt.follow_up_date}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="font-bold text-lg text-slate-100">Schedule Doctor Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleBook} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Specialty</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="02:15 PM">02:15 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Consultation Type</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                >
                  <option value="in_person">In-Person Clinic Visit</option>
                  <option value="telehealth">Virtual Telehealth Video Call</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes / Reason for Visit</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-md"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
