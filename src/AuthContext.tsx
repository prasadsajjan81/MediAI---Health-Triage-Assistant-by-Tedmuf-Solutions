import React, { createContext, useContext, useEffect, useState } from 'react';
// Authentication Context Provider
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigValid, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, SubscriptionPlan } from './types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigValid || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to profile changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          // Check if profile exists, if not create it
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: firebaseUser.email === 'prasadsajjan81@gmail.com' ? 'admin' : 'user',
              subscriptionStatus: 'free',
              subscriptionPlan: SubscriptionPlan.Free,
              subscriptionEndDate: null,
              freeTestsRemaining: 1,
              reportCount: 0,
              lastReportReset: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
          }

          unsubscribeProfile = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data() as UserProfile;
              console.log("AuthContext: Profile updated from Firestore:", data.uid, "Role:", data.role, "Plan:", data.subscriptionPlan);
              setProfile(data);
            }
            setLoading(false);
          }, (error) => {
            if (error.code === 'permission-denied') {
              setProfile(null);
              handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            }
            setLoading(false);
          });
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          console.error("Error setting up profile:", error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
