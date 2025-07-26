'use client';
import {
  createContext,
  useContext,
} from 'react';
import {
  getAuth,
  type User,
} from 'firebase/auth';
import { app } from '@/lib/firebase';

export const auth = getAuth(app);

export type UserRole = 'superadmin' | 'admin' | 'doctor';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  createdAt: any; // Can be a Firebase Timestamp
  id: string;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
