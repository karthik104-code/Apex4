import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/healthcare';
import { apiService } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>({
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
  });

  const login = async (email: string, password: string) => {
    const res = await apiService.login(email, password);
    setUser(res.user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
