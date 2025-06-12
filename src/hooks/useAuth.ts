// src/hooks/useAuth.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { database } from '@/lib/firebase';

// Configuración de Firebase (debes poner tu propia configuración)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Observador del estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Limpieza al desmontar el componente
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/chat');
      return {
        success: true
      }
    } catch (err) {
      const error = err as AuthError;
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const signup = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/chat');
    } catch (err) {
      const error = err as AuthError;
      setError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      const error = err as AuthError;
      setError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return { 
    user,
    isAuthenticated: !!user,
    isLoading, 
    error,
    login, 
    signup, 
    logout 
  };
}

// Función para traducir códigos de error de Firebase a mensajes legibles
function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';
    case 'auth/user-not-found':
      return 'No se encontró una cuenta con este correo';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';
    case 'auth/invalid-credential':
      return 'Las credenciales no son inválidas';
    default:
      return 'Ocurrió un error. Por favor intenta nuevamente';
  }
}