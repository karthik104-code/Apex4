import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '../types/healthcare';

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
    email: 'therapist@apex4.ai',
    full_name: 'Dr. Alex Vance, PT',
    role: 'patient',
    age: 38,
    gender: 'Male',
    medical_history: [],
    emergency_contact: '',
    language_preference: 'en',
  });

  const login = async (email: string, password: string) => {
    setUser({
      id: 'user-demo-101',
      email: email || 'therapist@apex4.ai',
      full_name: 'Dr. Alex Vance, PT',
      role: 'patient',
      age: 38,
      gender: 'Male',
      medical_history: [],
      emergency_contact: '',
      language_preference: 'en',
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: true, login, logout }}>
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
