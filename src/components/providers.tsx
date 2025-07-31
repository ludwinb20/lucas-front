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
  
    const logout = useCallback(async () => {
      console.log('AUTH: Logging out...');
      await signOut(auth);
      
      setUser(null);
      setUserProfile(null);
      setPromptForName(false);
      
      // Ensure redirection happens after state is cleared.
      router.push('/login');
      console.log('AUTH: Logout successful.');
    }, [router]);
    
    // Effect to handle session cookie creation on auth state change
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('AUTH: onAuthStateChanged triggered. User:', user?.uid || 'null');
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
            setIsAuthLoading(false);
            console.log('AUTH: isAuthLoading set to false.');
        });
    
        return () => {
          console.log('AUTH: Cleaning up onAuthStateChanged listener.');
          unsubscribe();
        };
    }, [logout]);


    // Effect to check for user profile in Firestore
    useEffect(() => {
      const checkUserProfile = async () => {
        if (user) {
          console.log(`%cAUTH: Checking user profile for UID: ${user.uid}`, 'color: blue; font-weight: bold;');
          setIsProfileLoading(true);
          try {
            const userDocRef = doc(db, 'users', user.uid);
            console.log('AUTH: Fetching user document from Firestore...');
            const userDocSnap = await getDoc(userDocRef);
    
            if (userDocSnap.exists()) {
              console.log('%cAUTH: User profile found in Firestore.', 'color: green;');
              setUserProfile(userDocSnap.data() as UserProfile);
              setPromptForName(false);
              if (['/login', '/signup'].includes(pathname)) {
                // Redirigir según el rol del usuario
                const userRole = userDocSnap.data().role;
                if (userRole === 'doctor') {
                  console.log('AUTH: Doctor logged in, redirecting to /chat...');
                  router.replace('/chat');
                } else {
                  console.log('AUTH: Admin/Superadmin logged in, redirecting to /dashboard...');
                  router.replace('/dashboard');
                }
              }
            } else {
              console.log('%cAUTH: User profile NOT found. Prompting for name.', 'color: orange;');
              setUserProfile(null);
              setPromptForName(true);
            }
          } catch (error) {
              console.error("%cERROR: Failed to fetch user profile from Firestore.", 'color: red; font-size: 1.2em; font-weight: bold;', error);
              // Log out on error to prevent being stuck in a broken state.
              logout();
          } finally {
            console.log('AUTH: Finished profile check. isProfileLoading set to false.');
            setIsProfileLoading(false);
          }
        } else {
          console.log('AUTH: No user, resetting profile state.');
          setUserProfile(null);
          setPromptForName(false);
        }
      };
  
      if (!isAuthLoading) {
          console.log('AUTH: Auth loading finished, starting profile check.');
          checkUserProfile();
      }
    }, [user, isAuthLoading, logout, pathname, router]);
  
    const login = useCallback(
      async (email: string, password: string) => {
        console.log(`AUTH: Attempting login for ${email}...`);
        const response = await signInWithEmailAndPassword(auth, email, password);
        console.log('%cAUTH: Login successful via Firebase.', 'color: green;', response.user?.uid);
      },
      []
    );
  
    const signup = useCallback(
      async (email: string, password: string) => {
        console.log(`AUTH: Attempting signup for ${email}...`);
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('%cAUTH: Signup successful via Firebase.', 'color: green;');
      },
      []
    );

    const updateProfile = useCallback(async (name: string) => {
      if (!user) {
        console.error('%cERROR: updateProfile called without a user.', 'color: red; font-size: 1.2em; font-weight: bold;');
        return;
      }
      console.log(`AUTH: Creating profile for UID ${user.uid} with name: ${name}`);
      setIsProfileLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        const newProfileData = {
            name,
            email: user.email!,
            role: 'doctor' as const,
            createdAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfileData);
        console.log('%cAUTH: Profile successfully saved to Firestore.', 'color: green;');
        
        const localProfile: UserProfile = {
            name,
            email: user.email!,
            role: 'doctor',
            createdAt: new Date(),
        };
        
        setUserProfile(localProfile); 
        setPromptForName(false);
        // Los doctores van a chat, otros roles van a dashboard
        router.replace('/chat');
      } catch (error) {
        console.error("%cERROR: Failed to update user profile.", 'color: red; font-size: 1.2em; font-weight: bold;', error);
        logout();
      } finally {
        console.log('AUTH: Finished creating profile. isProfileLoading set to false.');
        setIsProfileLoading(false);
      }
    }, [user, router, logout]);
  
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
