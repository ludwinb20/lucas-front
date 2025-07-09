'use client';

import {
    useState,
    useEffect,
    useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    type User,
} from 'firebase/auth';
import { AuthContext, auth, type AuthContextType } from '@/hooks/useAuth';


function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsLoading(false);
      });
  
      return () => unsubscribe();
    }, []);
  
    const login = useCallback(
      async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/chat');
      },
      [router]
    );
  
    const signup = useCallback(
      async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/chat');
      },
      [router]
    );
  
    const logout = useCallback(() => {
      signOut(auth).then(() => {
        router.push('/login');
      });
    }, [router]);
  
    const value: AuthContextType = {
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    };
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
