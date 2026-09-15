import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Cpu, Camera, Volume2, Globe, Database, 
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Clock, Sliders
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { hardwareBridgeClient } from '../services/hardwareBridge';
import { voiceCommander } from '../services/voiceCommander';
import { COMPENSATORY_THRESHOLDS } from '../pose/compensation';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [hardwareStatus, setHardwareStatus] = useState({
    connected: false,
    pedalsConnected: false,
    arduinoConnected: false,
    mode: 'simulated',
  });
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [voiceCooldown, setVoiceCooldown] = useState(8);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    hardwareBridgeClient.fetchStatus().then((status) => {
      setHardwareStatus({
        connected: status.connected,
        pedalsConnected: status.pedalsConnected,
        arduinoConnected: status.arduinoConnected,
        mode: status.mode,
      });
    }).catch(() => {
      setHardwareStatus({ connected: false, pedalsConnected: false, arduinoConnected: false, mode: 'simulated' });
    });
    setVoiceEnabled(voiceCommander.isEnabled());
  }, []);

  const handleSaveVoiceSettings = () => {
    voiceCommander.setVolume(voiceVolume);
    voiceCommander.setRate(voiceRate);
    voiceCommander.setCooldown(voiceCooldown * 1000);
    voiceCommander.setEnabled(voiceEnabled);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">
              System Settings & Configuration
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              AVAILABLE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Hardware interface, audio feedback parameters, prototype thresholds, and system preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Hardware & Device Status */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#2563EB]" />
              <h2 className="font-bold text-sm text-[#111827]">Hardware & Sensor Status</h2>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              hardwareStatus.connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {hardwareStatus.connected ? 'Connected' : 'Demo Telemetry'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-medium text-slate-700">MSV1 Arduino Controller (9600 Baud)</span>
              <span className={`font-semibold ${hardwareStatus.arduinoConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                {hardwareStatus.arduinoConnected ? 'Connected (COM Port)' : 'Not Connected'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-medium text-slate-700">HID Dual Foot Pedals (0x68e / 0xf2)</span>
              <span className={`font-semibold ${hardwareStatus.pedalsConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                {hardwareStatus.pedalsConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-medium text-slate-700">Local Hardware Bridge (FastAPI WS)</span>
              <span className="font-semibold text-emerald-600">
                Active (ws://localhost:8000/api/v1/hardware/ws)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Voice Posture Commander Settings */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#2563EB]" />
              <h2 className="font-bold text-sm text-[#111827]">Voice Posture Commander</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              AVAILABLE
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">Advisory Voice Feedback</span>
                <span className="text-slate-500 text-[11px]">Real-time audio posture corrections during active session</span>
              </div>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => {
                  setVoiceEnabled(e.target.checked);
                  voiceCommander.setEnabled(e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-600">
                <span>Speech Cooldown Gate</span>
                <span>{voiceCooldown} seconds</span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                step="1"
                value={voiceCooldown}
                onChange={(e) => {
                  setVoiceCooldown(Number(e.target.value));
                  voiceCommander.setCooldown(Number(e.target.value) * 1000);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-600">
                <span>Speech Rate</span>
                <span>{voiceRate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={voiceRate}
                onChange={(e) => {
                  setVoiceRate(Number(e.target.value));
                  voiceCommander.setRate(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 3. Prototype Biomechanical Thresholds */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2563EB]" />
              <h2 className="font-bold text-sm text-[#111827]">APEX 4 Prototype Thresholds</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              READ-ONLY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium block">Trunk Lean Threshold</span>
              <span className="font-bold text-slate-900 text-sm">{COMPENSATORY_THRESHOLDS.trunkLean.medium}° Medium / {COMPENSATORY_THRESHOLDS.trunkLean.high}° High</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium block">Shoulder Elevation</span>
              <span className="font-bold text-slate-900 text-sm">{COMPENSATORY_THRESHOLDS.shoulderHike.medium} / {COMPENSATORY_THRESHOLDS.shoulderHike.high} Ratio</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium block">Torso Rotation</span>
              <span className="font-bold text-slate-900 text-sm">{COMPENSATORY_THRESHOLDS.torsoRotation.medium}° Medium / {COMPENSATORY_THRESHOLDS.torsoRotation.high}° High</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium block">Sampling Frequency</span>
              <span className="font-bold text-slate-900 text-sm">20 Hz Stream / 1 Hz Snapshot</span>
            </div>
          </div>
        </div>

        {/* 4. Future Cloud / EMR Integrations */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-sm text-[#111827]">Cloud & EMR Synchronization</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              COMING SOON
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            HL7 / FHIR clinical interoperability, centralized hospital EHR storage sync, and multi-therapist role assignment will be enabled in future enterprise releases. All prototype data remains local.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
            <span className="text-xs text-slate-400 font-medium">Enterprise Cloud EMR Sync (Phase 16)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
