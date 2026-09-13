import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/healthcare';

export interface SignUpDetails {
  fullName: string;
  email: string;
  role: 'therapist' | 'patient';
  phone?: string;
  clinicName?: string;
  password?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (details: SignUpDetails) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: 'user-demo-101',
  email: 'therapist@apex4.ai',
  full_name: 'Dr. Alex Vance, PT',
  role: 'patient',
  age: 38,
  gender: 'Male',
  medical_history: ['Upper Limb Rehabilitation'],
  emergency_contact: '+1 (555) 234-5678',
  language_preference: 'en',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('apex4_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USER;
      }
    }
    return DEMO_USER;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('apex4_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('apex4_user');
    }
  }, [user]);

  const login = async (email: string, _password?: string) => {
    const loggedUser: UserProfile = {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
      full_name: email ? email.split('@')[0].replace('.', ' ').toUpperCase() : DEMO_USER.full_name,
    };
    setUser(loggedUser);
  };

  const loginWithGoogle = async () => {
    const googleUser: UserProfile = {
      id: `usr-google-${Date.now()}`,
      email: 'alex.mercer.google@gmail.com',
      full_name: 'Alex Mercer (Google Auth)',
      role: 'patient',
      age: 38,
      gender: 'Male',
      medical_history: ['Rehabilitation Monitoring'],
      emergency_contact: '+1 (555) 019-2831',
      language_preference: 'en',
    };
    setUser(googleUser);
  };

  const signup = async (details: SignUpDetails) => {
    const newUser: UserProfile = {
      id: `usr-signup-${Date.now()}`,
      email: details.email,
      full_name: details.fullName,
      role: details.role === 'therapist' ? 'patient' : 'patient',
      age: 35,
      gender: 'Other',
      medical_history: details.clinicName ? [`Affiliation: ${details.clinicName}`] : [],
      emergency_contact: details.phone || '',
      language_preference: 'en',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
      }}
    >
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
