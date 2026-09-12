import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle, AlertCircle, 
  Sparkles, ArrowRight, ShieldCheck, Download, Filter 
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { apiService } from '../services/api';
import { StructuredReportResult } from '../types/healthcare';

export const MedicalReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<StructuredReportResult[]>([]);
  const [selectedReport, setSelectedReport] = useState<StructuredReportResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const data = await apiService.getReports();
    setReports(data);
    if (data.length > 0 && !selectedReport) {
      setSelectedReport(data[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 25 : prev));
    }, 400);

    try {
      const result = await apiService.uploadReport(file);
      clearInterval(interval);
      setUploadProgress(100);
      setReports(prev => [result, ...prev]);
      setSelectedReport(result);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Medical Reports & Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload blood work or radiology reports for automatic OCR extraction and patient explanations.
          </p>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* Upload Dropzone */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="glass-panel p-8 rounded-3xl border-2 border-dashed border-slate-700/80 hover:border-primary-500/60 transition-all text-center space-y-4 cursor-pointer relative overflow-hidden group"
      >
        <input 
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center mx-auto text-primary-400 group-hover:scale-110 transition-all">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-bold text-base text-slate-200">Drag & Drop Medical Report (PDF or Image)</h3>
          <p className="text-xs text-slate-400 mt-1">Supports Blood Tests, Complete Blood Count (CBC), Metabolic & Lipid Panels</p>
        </div>

        {isUploading && (
          <div className="max-w-xs mx-auto space-y-2 pt-2">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 to-accent-emerald transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-primary-400 font-semibold block animate-pulse">
              Extracting lab parameters with PyMuPDF OCR...
            </span>
          </div>
        )}
      </div>

      {/* Main Analysis View */}
      {selectedReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Extracted Values & AI Explanation */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{selectedReport.title}</h2>
                  <span className="text-xs text-slate-400">Extracted on {selectedReport.upload_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                    {selectedReport.abnormal_count} Parameters Flagged
                  </span>
                </div>
              </div>

              {/* AI Explanation Box */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-primary-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  AI Patient Explanation
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedReport.patient_explanation}
                </p>
              </div>

              {/* Extracted Lab Parameters Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-200">Extracted Laboratory Values</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReport.extracted_values.map((v, i) => (
                    <div 
                      key={i} 
                      className={`p-4 rounded-2xl border space-y-1.5 ${
                        v.status === 'low' || v.status === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">{v.test_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          v.status === 'low' ? 'bg-rose-500/20 text-rose-300' :
                          v.status === 'high' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold text-slate-100">
                        {v.value} <span className="text-xs font-normal text-slate-400">{v.unit}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Ref: {v.reference_range}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Report History & Actions */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">Report History</h3>
              <div className="space-y-2">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                      selectedReport.id === r.id
                        ? 'bg-primary-600/20 border-primary-500/50 text-slate-100'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block text-slate-200 line-clamp-1">{r.title}</span>
                      <span className="text-[10px] text-slate-400">{r.upload_date}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {r.abnormal_count} Flagged
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl space-y-3 border border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">Discuss Report</h3>
              <p className="text-xs text-slate-400">
                Launch the AI Assistant with this report pre-loaded to ask follow-up questions.
              </p>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Ask AI About This Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
