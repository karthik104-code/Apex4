import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Clock, User, Stethoscope, 
  CheckCircle2, Video, MapPin, AlertCircle, Edit3, Trash2, Bell 
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Toast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { apiService } from '../services/api';
import { Appointment } from '../types/healthcare';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'completed'>('scheduled');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // Form states
  const [doctorName, setDoctorName] = useState('Dr. Sarah Jenkins, MD');
  const [specialty, setSpecialty] = useState('Internal Medicine & Endocrinology');
  const [date, setDate] = useState('2026-09-22');
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [locationType, setLocationType] = useState<'in_person' | 'telehealth'>('in_person');
  const [notes, setNotes] = useState('Review hemoglobin & blood glucose lab findings.');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      setAppointments(data);
    } catch (e) {
      showToast("Failed to fetch appointments.", "error");
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newApt = await apiService.createAppointment({
        doctor_name: doctorName,
        specialty,
        appointment_date: date,
        time_slot: timeSlot,
        location_type: locationType,
        notes
      });
      setAppointments(prev => [newApt, ...prev]);
      setShowCreateModal(false);
      showToast("Appointment booked successfully!", "success");
    } catch (e) {
      showToast("Could not book appointment.", "error");
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;
    try {
      const updated = await apiService.updateAppointment(selectedApt.id, {
        appointment_date: date,
        time_slot: timeSlot,
        notes
      });
      setAppointments(prev => prev.map(a => a.id === selectedApt.id ? updated : a));
      setShowEditModal(false);
      setSelectedApt(null);
      showToast("Appointment rescheduled successfully!", "success");
    } catch (e) {
      showToast("Unable to reschedule appointment.", "error");
    }
  };

  const handleCancelApt = async (aptId: string) => {
    try {
      await apiService.deleteAppointment(aptId);
      setAppointments(prev => prev.filter(a => a.id !== aptId));
      showToast("Appointment cancelled.", "success");
    } catch (e) {
      showToast("Failed to cancel appointment.", "error");
    }
  };

  const openRescheduleModal = (apt: Appointment) => {
    setSelectedApt(apt);
    setDate(apt.appointment_date);
    setTimeSlot(apt.time_slot);
    setNotes(apt.notes || '');
    setShowEditModal(true);
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'scheduled') return a.status === 'scheduled';
    if (activeTab === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Doctor Consultations & Follow-ups</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Book appointment slots, manage follow-up reminders, and reschedule visits.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </Button>
      </div>

      <MedicalDisclaimer />

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'scheduled' ? 'bg-primary-600/30 text-primary-300 border border-primary-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Upcoming ({appointments.filter(a => a.status === 'scheduled').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'completed' ? 'bg-primary-600/30 text-primary-300 border border-primary-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed ({appointments.filter(a => a.status === 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all' ? 'bg-primary-600/30 text-primary-300 border border-primary-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({appointments.length})
        </button>
      </div>

      {/* Appointments List Grid */}
      {filteredAppointments.length === 0 ? (
        <Card glass className="text-center py-12 space-y-3">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-300">No Appointments Found</h3>
          <p className="text-xs text-slate-400">Click 'Book Appointment' to schedule a consultation with a doctor.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAppointments.map((apt) => (
            <Card key={apt.id} glass className="space-y-4 hover:border-slate-700 transition-all">
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
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    Follow-Up Reminder:
                  </span>
                  <span className="font-semibold text-primary-300">{apt.follow_up_date}</span>
                </div>
              )}

              {apt.status === 'scheduled' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <Button variant="ghost" size="sm" onClick={() => openRescheduleModal(apt)}>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleCancelApt(apt.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule Doctor Appointment">
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
            <label className="text-slate-300 font-semibold block mb-1">Reason / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Confirm Booking</Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Reschedule Appointment">
        <form onSubmit={handleReschedule} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">New Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">New Time Slot</label>
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
            <label className="text-slate-300 font-semibold block mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
