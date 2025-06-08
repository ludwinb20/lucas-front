// src/hooks/useAuth.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_KEY = 'intellichat_auth_status';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();

  useEffect(() => {
    // This effect runs only on the client after hydration
    try {
      const authStatus = localStorage.getItem(AUTH_KEY);
      setIsAuthenticated(authStatus === 'true');
    } catch (error) {
      // Handle potential localStorage access errors (e.g., in private browsing mode)
      console.error("Error accessing localStorage:", error);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, validate email and password
    localStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
    router.push('/chat');
  }, [router]);

  const signup = useCallback(async (email?: string, password?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, create user
    localStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
    router.push('/chat');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  return { isAuthenticated, isLoading, login, signup, logout };
}
