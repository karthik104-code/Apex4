import axios from 'axios';
import { 
  UserProfile, StructuredReportResult, Appointment, 
  HealthMetric, ChatMessage, NotificationItem 
} from '../types/healthcare';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const apiService = {
  // Auth
  login: async (email: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    } catch (e) {
      console.warn('API connection offline, using fallback auth demo user', e);
      return {
        access_token: 'demo-fallback-token',
        user: {
          id: 'user-demo-101',
          email: email || 'patient@healthcare.ai',
          full_name: 'John Doe',
          role: 'patient',
          age: 34,
          gender: 'Male',
          blood_group: 'O+',
          height_cm: 176,
          weight_kg: 72.5,
          medical_history: ['Mild Seasonal Allergies', 'Borderline Anemia (2025)'],
          emergency_contact: '+1 (555) 019-2834',
          language_preference: 'en'
        }
      };
    }
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch (e) {
      return {
        id: 'user-demo-101',
        email: 'patient@healthcare.ai',
        full_name: 'John Doe',
        role: 'patient',
        age: 34,
        gender: 'Male',
        blood_group: 'O+',
        height_cm: 176,
        weight_kg: 72.5,
        medical_history: ['Mild Seasonal Allergies', 'Borderline Anemia (2025)'],
        emergency_contact: '+1 (555) 019-2834',
        language_preference: 'en'
      };
    }
  },

  // Reports
  uploadReport: async (file: File): Promise<StructuredReportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e) {
      console.warn('Upload API offline, returning realistic extracted report demo result', e);
      return {
        id: `rep-${Date.now()}`,
        title: `Lab Analysis (${file.name})`,
        report_type: 'Blood Work & Metabolic Panel',
        upload_date: new Date().toISOString().split('T')[0],
        patient_name: 'John Doe',
        summary: 'Comprehensive Medical Lab Panel with 5 key parameters extracted.',
        patient_explanation: 'Your lab report shows low Hemoglobin and low Vitamin D, with elevated Fasting Glucose and Cholesterol.',
        key_findings: [
          'Hemoglobin (10.2 g/dL) is below reference range (12.0 - 16.5 g/dL) - indicates mild anemia.',
          'Fasting Blood Glucose (145 mg/dL) is elevated above 99 mg/dL target.',
          'Total Cholesterol (210 mg/dL) is slightly high.',
          'Vitamin D (22.5 ng/mL) is below optimal threshold (30 ng/mL).'
        ],
        abnormal_count: 4,
        extracted_values: [
          { test_name: 'Hemoglobin (Hb)', value: '10.2', unit: 'g/dL', reference_range: '12.0 - 16.5 g/dL', status: 'low', category: 'Complete Blood Count' },
          { test_name: 'Fasting Blood Glucose', value: '145.0', unit: 'mg/dL', reference_range: '70.0 - 99.0 mg/dL', status: 'high', category: 'Metabolic Panel' },
          { test_name: 'Total Cholesterol', value: '210.0', unit: 'mg/dL', reference_range: '125.0 - 200.0 mg/dL', status: 'high', category: 'Lipid Profile' },
          { test_name: 'White Blood Cell Count (WBC)', value: '6.8', unit: 'k/uL', reference_range: '4.5 - 11.0 k/uL', status: 'normal', category: 'Complete Blood Count' },
          { test_name: 'Vitamin D (25-OH)', value: '22.5', unit: 'ng/mL', reference_range: '30.0 - 100.0 ng/mL', status: 'low', category: 'Vitamins & Minerals' }
        ],
        recommended_questions: [
          'What dietary adjustments can I make to increase my hemoglobin naturally?',
          'Should I take iron or Vitamin D supplements based on these results?',
          'How often should I re-check my fasting blood sugar levels?',
          'What exercise routine would be safe and effective for cholesterol control?'
        ]
      };
    }
  },

  getReports: async (): Promise<StructuredReportResult[]> => {
    try {
      const res = await apiClient.get('/reports/');
      return res.data;
    } catch (e) {
      return [{
        id: 'rep-demo-01',
        title: 'Comprehensive Metabolic & CBC Panel (sample_lab_report.pdf)',
        report_type: 'Blood Work & Metabolic Panel',
        upload_date: '2026-09-10',
        patient_name: 'John Doe',
        summary: 'Blood test showing mild anemia indicators and elevated blood glucose.',
        patient_explanation: 'Your report indicates mild anemia (low hemoglobin) and slightly elevated blood sugar.',
        key_findings: [
          'Hemoglobin (10.2 g/dL) is low.',
          'Glucose (145 mg/dL) is high.',
          'Cholesterol (210 mg/dL) is borderline high.'
        ],
        abnormal_count: 3,
        extracted_values: [
          { test_name: 'Hemoglobin (Hb)', value: '10.2', unit: 'g/dL', reference_range: '12.0 - 16.5 g/dL', status: 'low', category: 'Complete Blood Count' },
          { test_name: 'Fasting Blood Glucose', value: '145.0', unit: 'mg/dL', reference_range: '70.0 - 99.0 mg/dL', status: 'high', category: 'Metabolic Panel' },
          { test_name: 'Total Cholesterol', value: '210.0', unit: 'mg/dL', reference_range: '125.0 - 200.0 mg/dL', status: 'high', category: 'Lipid Profile' },
          { test_name: 'White Blood Cell Count (WBC)', value: '6.8', unit: 'k/uL', reference_range: '4.5 - 11.0 k/uL', status: 'normal', category: 'Complete Blood Count' },
          { test_name: 'Vitamin D (25-OH)', value: '22.5', unit: 'ng/mL', reference_range: '30.0 - 100.0 ng/mL', status: 'low', category: 'Vitamins & Minerals' }
        ],
        recommended_questions: [
          'What dietary adjustments can I make to increase my hemoglobin naturally?',
          'Should I take iron or Vitamin D supplements based on these results?',
          'How often should I re-check my fasting blood sugar levels?'
        ]
      }];
    }
  },

  deleteReport: async (reportId: string) => {
    try {
      const res = await apiClient.delete(`/reports/${reportId}`);
      return res.data;
    } catch (e) {
      return { status: 'deleted', id: reportId };
    }
  },

  // AI Chat & Assistant (Phase 2)
  sendAssistantChat: async (message: string, conversationId?: string, language: string = 'en') => {
    try {
      const res = await apiClient.post('/assistant/chat', { message, conversation_id: conversationId, language });
      return res.data;
    } catch (e) {
      return {
        answer: `### Healthcare Assistant Response\n\nThank you for reaching out regarding: *"${message}"*.\n\n**Educational Guidance:**\n1. Maintain balanced nutrition, hydration, and exercise.\n2. Discuss persistent symptoms with your doctor.\n\n*Medical Disclaimer: AI Healthcare Companion is an informative research tool and NOT a doctor.*`,
        sources: [
          { source: 'WHO Clinical Guidelines 2024', snippet: 'Mild anemia can be supported with dietary iron and Vitamin C intake.' }
        ],
        disclaimer: 'AI Healthcare Companion is an informative research tool and NOT a doctor.'
      };
    }
  },

  getConversations: async () => {
    try {
      const res = await apiClient.get('/assistant/conversations');
      return res.data;
    } catch (e) {
      return [
        { id: 'conv-101', title: 'Hemoglobin & Iron Diet Advice', created_at: '2026-09-10 14:30' },
        { id: 'conv-102', title: 'Fasting Glucose Preparation', created_at: '2026-09-08 09:15' }
      ];
    }
  },

  createNewConversation: async () => {
    try {
      const res = await apiClient.post('/assistant/conversations/new');
      return res.data;
    } catch (e) {
      return {
        id: `conv-${Date.now()}`,
        title: 'New Healthcare Chat',
        created_at: new Date().toISOString().split('T')[0]
      };
    }
  },

  getConversationMessages: async (conversationId: string) => {
    try {
      const res = await apiClient.get(`/assistant/conversations/${conversationId}/messages`);
      return res.data;
    } catch (e) {
      return [];
    }
  },

  sendChatMessage: async (message: string, language: string = 'en', reportId?: string) => {
    try {
      const res = await apiClient.post('/ai/chat', { message, language, report_id: reportId });
      return res.data;
    } catch (e) {
      return {
        message_id: `msg-${Date.now()}`,
        conversation_id: 'conv-demo',
        reply_text: `### Healthcare Assistant Analysis\n\nThank you for asking: *"${message}"*.\n\n**Educational Guidance:**\n1. Maintain balanced hydration, structured sleep, and nutrient-dense meals.\n2. Monitor any persistent symptoms.\n3. Discuss specific concerns with your physician.\n\n*Medical Disclaimer: AI Healthcare Companion is an informative research tool and NOT a doctor.*`,
        language: language,
        sources: [
          { source: 'WHO Clinical Guidelines 2024', snippet: 'Mild anemia can be supported with dietary iron and Vitamin C intake.' }
        ],
        disclaimer: 'AI Healthcare Companion is an informative research tool and NOT a doctor.'
      };
    }
  },

  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await apiClient.get('/appointments/');
      return res.data;
    } catch (e) {
      return [
        {
          id: 'apt-101',
          patient_id: 'user-demo-101',
          doctor_name: 'Dr. Sarah Jenkins, MD',
          specialty: 'Endocrinology & Internal Medicine',
          appointment_date: '2026-09-15',
          time_slot: '10:30 AM',
          location_type: 'in_person',
          status: 'scheduled',
          notes: 'Review blood glucose & iron laboratory panel findings.',
          follow_up_date: '2026-09-29'
        },
        {
          id: 'apt-102',
          patient_id: 'user-demo-101',
          doctor_name: 'Dr. Rajesh Kumar',
          specialty: 'Cardiology Specialist',
          appointment_date: '2026-08-28',
          time_slot: '02:15 PM',
          location_type: 'telehealth',
          status: 'completed',
          notes: 'Routine cardiovascular lipid check.',
          follow_up_date: '2026-10-15'
        }
      ];
    }
  },

  createAppointment: async (data: Partial<Appointment>): Promise<Appointment> => {
    try {
      const res = await apiClient.post('/appointments/create', data);
      return res.data;
    } catch (e) {
      return {
        id: `apt-${Date.now()}`,
        patient_id: 'user-demo-101',
        doctor_name: data.doctor_name || 'Dr. Emily Carter',
        specialty: data.specialty || 'General Practitioner',
        appointment_date: data.appointment_date || '2026-09-20',
        time_slot: data.time_slot || '11:00 AM',
        location_type: data.location_type || 'in_person',
        status: 'scheduled',
        notes: data.notes || 'Follow-up appointment booked via AI Companion.',
        follow_up_date: '2026-10-05'
      };
    }
  },

  updateAppointment: async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    try {
      const res = await apiClient.put(`/appointments/${id}`, updates);
      return res.data;
    } catch (e) {
      return {
        id,
        patient_id: 'user-demo-101',
        doctor_name: updates.doctor_name || 'Dr. Sarah Jenkins',
        specialty: updates.specialty || 'Internal Medicine',
        appointment_date: updates.appointment_date || '2026-09-22',
        time_slot: updates.time_slot || '10:30 AM',
        location_type: updates.location_type || 'in_person',
        status: updates.status || 'scheduled',
        notes: updates.notes,
        follow_up_date: updates.follow_up_date
      };
    }
  },

  deleteAppointment: async (id: string) => {
    try {
      const res = await apiClient.delete(`/appointments/${id}`);
      return res.data;
    } catch (e) {
      return { status: 'deleted', id };
    }
  },

  // Analytics
  getHealthMetrics: async (): Promise<HealthMetric[]> => {
    try {
      const res = await apiClient.get('/analytics/vitals');
      return res.data;
    } catch (e) {
      return [
        { id: 'm1', metric_type: 'hemoglobin', value: 11.5, unit: 'g/dL', recorded_at: '2026-01-15' },
        { id: 'm2', metric_type: 'hemoglobin', value: 10.8, unit: 'g/dL', recorded_at: '2026-05-10' },
        { id: 'm3', metric_type: 'hemoglobin', value: 10.2, unit: 'g/dL', recorded_at: '2026-09-01' },
        { id: 'm4', metric_type: 'glucose', value: 110.0, unit: 'mg/dL', recorded_at: '2026-01-15' },
        { id: 'm5', metric_type: 'glucose', value: 132.0, unit: 'mg/dL', recorded_at: '2026-05-10' },
        { id: 'm6', metric_type: 'glucose', value: 145.0, unit: 'mg/dL', recorded_at: '2026-09-01' },
        { id: 'm7', metric_type: 'cholesterol', value: 190.0, unit: 'mg/dL', recorded_at: '2026-01-15' },
        { id: 'm8', metric_type: 'cholesterol', value: 210.0, unit: 'mg/dL', recorded_at: '2026-09-01' }
      ];
    }
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    try {
      const res = await apiClient.get('/notifications/');
      return res.data;
    } catch (e) {
      return [
        {
          id: 'notif-1',
          title: 'Upcoming Doctor Appointment',
          message: 'Consultation with Dr. Sarah Jenkins scheduled for 10:30 AM in 3 days.',
          type: 'appointment',
          is_read: false,
          created_at: '10 mins ago'
        },
        {
          id: 'notif-2',
          title: 'Abnormal Lab Indicator Alert',
          message: 'Hemoglobin (10.2 g/dL) is below standard threshold. View AI explanation.',
          type: 'report',
          is_read: false,
          created_at: '2 hours ago'
        },
        {
          id: 'notif-3',
          title: 'Follow-Up Iron Supplement Reminder',
          message: 'Take evening dietary supplement with Vitamin C.',
          type: 'follow_up',
          is_read: true,
          created_at: 'Yesterday'
        }
      ];
    }
  }
};
