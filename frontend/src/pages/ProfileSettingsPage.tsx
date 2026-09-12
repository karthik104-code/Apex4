import React, { useState } from 'react';
import { User, Globe, Shield, Phone, Heart, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';

export const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [fullName, setFullName] = useState(user?.full_name || 'John Doe');
  const [age, setAge] = useState(user?.age || 34);
  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || 'O+');
  const [height, setHeight] = useState(user?.height_cm || 176);
  const [weight, setWeight] = useState(user?.weight_kg || 72.5);
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || '+1 (555) 019-2834');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">Patient Profile & Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal healthcare profile, vitals metrics, and language preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-400" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-400" />
            <span>Language & Audio Settings</span>
          </h2>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5">System Interface Language</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  language === 'en' ? 'bg-primary-600/30 border-primary-500 text-primary-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                English (US)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ml')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  language === 'ml' ? 'bg-primary-600/30 border-primary-500 text-primary-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                മലയാളം (ML)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  language === 'hi' ? 'bg-primary-600/30 border-primary-500 text-primary-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                हिन्दी (HI)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse">
              ✓ Profile settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
