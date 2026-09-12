export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  age?: number;
  gender?: string;
  blood_group?: string;
  height_cm?: number;
  weight_kg?: number;
  medical_history?: string[];
  emergency_contact?: string;
  language_preference?: 'en' | 'ml' | 'hi';
}

export interface ReportValue {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
  category?: string;
}

export interface StructuredReportResult {
  id: string;
  title: string;
  report_type: string;
  upload_date: string;
  patient_name: string;
  summary: string;
  patient_explanation: string;
  key_findings: string[];
  abnormal_count: number;
  extracted_values: ReportValue[];
  recommended_questions: string[];
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  time_slot: string;
  location_type: 'in_person' | 'telehealth';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  follow_up_date?: string;
}

export interface HealthMetric {
  id: string;
  metric_type: 'hemoglobin' | 'glucose' | 'cholesterol' | 'blood_pressure_sys' | 'blood_pressure_dia';
  value: number;
  unit: string;
  recorded_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  created_at: string;
  sources?: Array<{ source: string; snippet: string }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'follow_up' | 'report' | 'AI_tip';
  is_read: boolean;
  created_at: string;
}
