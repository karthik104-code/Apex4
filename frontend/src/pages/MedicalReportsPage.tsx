import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, HelpCircle, 
  Sparkles, ArrowRight, Trash2, Calendar, FileCheck, ShieldAlert,
  Download, PlayCircle
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Toast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import { StructuredReportResult } from '../types/healthcare';

export const MedicalReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<StructuredReportResult[]>([]);
  const [selectedReport, setSelectedReport] = useState<StructuredReportResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await apiService.getReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (e) {
      showToast("Unable to load report history.", "error");
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'png', 'jpg', 'jpeg'];
    if (!ext || !validExts.includes(ext)) {
      showToast("Invalid file format. Please upload a PDF, PNG, JPG, or JPEG file.", "error");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size exceeds 10MB limit.", "error");
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 20 : prev));
    }, 300);

    try {
      const result = await apiService.uploadReport(file);
      clearInterval(interval);
      setUploadProgress(100);
      setReports(prev => [result, ...prev]);
      setSelectedReport(result);
      showToast(`Successfully extracted ${result.extracted_values.length} lab parameters from ${file.name}!`, "success");
    } catch (e) {
      showToast("Failed to process document. Please try another file.", "error");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const handleLoadSampleReport = async () => {
    setIsUploading(true);
    setUploadProgress(30);
    setTimeout(async () => {
      const sampleBlob = new Blob(["Sample Medical Blood Test PDF Data - Hemoglobin: 10.2 g/dL, Glucose: 145 mg/dL"], { type: "application/pdf" });
      const sampleFile = new File([sampleBlob], "sample_blood_work_panel_2026.pdf", { type: "application/pdf" });
      setUploadProgress(80);
      const result = await apiService.uploadReport(sampleFile);
      setUploadProgress(100);
      setReports(prev => [result, ...prev]);
      setSelectedReport(result);
      setIsUploading(false);
      setUploadProgress(0);
      showToast("Loaded 1-Click Sample Lab Report for instant testing!", "success");
    }, 600);
  };

  const handleExportSummary = () => {
    if (!selectedReport) return;
    const jsonStr = JSON.stringify(selectedReport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical_report_summary_${selectedReport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported structured medical report summary!", "success");
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await apiService.deleteReport(reportId);
      const updated = reports.filter(r => r.id !== reportId);
      setReports(updated);
      if (selectedReport?.id === reportId) {
        setSelectedReport(updated[0] || null);
      }
      showToast("Report deleted successfully.", "success");
    } catch (e) {
      showToast("Could not delete report.", "error");
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
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Medical Report Intelligence</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload PDF, PNG, JPG, or JPEG laboratory documents for automated parameter extraction and AI explanations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadSampleReport}
            className="whitespace-nowrap flex items-center gap-2 border-primary-500/40 text-primary-300 hover:bg-primary-500/20"
          >
            <PlayCircle className="w-4 h-4 text-primary-400" />
            <span>Load Demo Sample Report</span>
          </Button>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* Drag & Drop Upload Zone */}
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
          <h3 className="font-bold text-base text-slate-200">Drag & Drop Medical Document or Click to Browse</h3>
          <p className="text-xs text-slate-400 mt-1">Supported formats: PDF, PNG, JPG, JPEG (Max size: 10MB)</p>
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
              Running PyMuPDF OCR & Structured Data Extraction...
            </span>
          </div>
        )}
      </div>

      {/* Main Analysis View */}
      {selectedReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Report Overview & Extracted Values */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-800">
              {/* Report Header Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary-400" />
                    <h2 className="text-lg font-bold text-slate-100">{selectedReport.title}</h2>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">Uploaded {selectedReport.upload_date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                    {selectedReport.abnormal_count} Parameters Flagged
                  </span>
                  <button
                    onClick={handleExportSummary}
                    className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-medium"
                    title="Export Report Summary"
                  >
                    <Download className="w-4 h-4 text-primary-400" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* REPORT OVERVIEW SUMMARY BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Report Type</span>
                  <span className="font-bold text-slate-200">{selectedReport.report_type}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Tests Analyzed</span>
                  <span className="font-bold text-slate-200">{selectedReport.extracted_values.length} Parameters</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Processing Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                </div>
              </div>

              {/* AI EXPLANATION SECTION */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-primary-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  Patient-Friendly AI Explanation
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedReport.patient_explanation}
                </p>

                {/* Key Findings List */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-200 block">What This Report Contains:</span>
                  {selectedReport.key_findings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXTRACTED RESULTS TABLE / CARDS */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-200">Extracted Test Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReport.extracted_values.map((v, i) => (
                    <div 
                      key={i} 
                      className={`p-4 rounded-2xl border space-y-1.5 ${
                        v.status === 'low' || v.status === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : v.status === 'unknown'
                          ? 'bg-slate-800/40 border-slate-700'
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">{v.test_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          v.status === 'low' ? 'bg-rose-500/20 text-rose-300' :
                          v.status === 'high' ? 'bg-amber-500/20 text-amber-300' :
                          v.status === 'unknown' ? 'bg-slate-700 text-slate-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold text-slate-100">
                        {v.value} <span className="text-xs font-normal text-slate-400">{v.unit}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Reference: {v.reference_range}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: History & Doctor Questions */}
          <div className="space-y-6">
            {/* Suggested Doctor Questions */}
            <div className="glass-panel p-6 rounded-3xl space-y-3 border border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary-400" />
                <span>Questions for Your Doctor</span>
              </h3>
              <div className="space-y-2">
                {selectedReport.recommended_questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => navigate('/assistant')}
                    className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/assistant')}
                className="w-full mt-2"
              >
                <span>Ask AI Companion About Report</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Report History List */}
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">Report History</h3>
              <div className="space-y-2">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                      selectedReport.id === r.id
                        ? 'bg-primary-600/20 border-primary-500/50 text-slate-100 font-semibold'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block text-slate-200 truncate">{r.title}</span>
                      <span className="text-[10px] text-slate-400">{r.upload_date}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                      {r.abnormal_count} Flagged
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

