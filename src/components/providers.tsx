'use client';

import {
    useState,
    useEffect,
    useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext, auth, type AuthContextType, type UserProfile } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { NamePromptDialog } from './auth/NamePromptDialog';


function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [promptForName, setPromptForName] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsAuthLoading(false);
      });
  
      return () => unsubscribe();
    }, []);

    useEffect(() => {
      const checkUserProfile = async () => {
        if (user) {
          setIsProfileLoading(true);
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
  
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
            setPromptForName(false);
            if (['/login', '/signup'].includes(pathname)) {
              router.replace('/chat');
            }
          } else {
            // User is authenticated but has no profile document.
            setUserProfile(null);
            setPromptForName(true);
          }
          setIsProfileLoading(false);
        } else {
          // Not authenticated
          setUserProfile(null);
          setPromptForName(false);
          setIsProfileLoading(false);
        }
      };
  
      if (!isAuthLoading) {
          checkUserProfile();
      }
    }, [user, isAuthLoading, router, pathname]);
  
    const login = useCallback(
      async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        // Effects will handle profile check and redirection.
      },
      []
    );
  
    const signup = useCallback(
      async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
        // Effects will handle profile check and redirection.
      },
      []
    );
  
    const logout = useCallback(() => {
      signOut(auth).then(() => {
        router.push('/login');
      });
    }, [router]);

    const updateProfile = useCallback(async (name: string) => {
      if (!user) return;
  
      const userDocRef = doc(db, 'users', user.uid);
      const newProfile = {
        name,
        email: user.email!,
        createdAt: serverTimestamp(),
      };
  
      await setDoc(userDocRef, newProfile);
      setUserProfile({ name, email: user.email!, createdAt: new Date() }); // Set local profile
      setPromptForName(false);
      router.replace('/chat');
    }, [user, router]);
  
    const value: AuthContextType = {
      user,
      userProfile,
      isAuthenticated: !!user,
      isLoading: isAuthLoading || isProfileLoading,
      login,
      signup,
      logout,
      updateProfile,
    };
  
    return (
      <AuthContext.Provider value={value}>
        {children}
        {promptForName && <NamePromptDialog isOpen={promptForName} onSubmit={updateProfile} />}
      </AuthContext.Provider>
    );
}


export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
