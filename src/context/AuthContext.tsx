import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { User } from '../types';
import { ApiService } from '../services/api';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  importLocalProgress: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync or create Firestore profile for user
  const syncFirestoreProfile = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const races = ApiService.getRaces();
        const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);
        const computedBestWpm = Math.max(data.bestWpm || 0, maxRaceWpm);

        const profile: User = {
          id: fbUser.uid,
          username: data.displayName || fbUser.displayName || 'Driver',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || data.photoURL || '🏎️',
          level: data.level || 1,
          xp: data.xp || 0,
          currentStreak: data.currentStreak || 1,
          longestStreak: data.longestStreak || 1,
          lastRaceDate: data.lastRaceDate || new Date().toISOString().split('T')[0],
          totalRaces: Math.max(data.totalRaces || 0, races.length),
          totalWins: data.wins ?? data.totalWins ?? 0,
          avgWpm: data.avgWpm || 0,
          bestWpm: computedBestWpm,
          avgAccuracy: data.avgAccuracy || 100,
          equippedCarId: data.equippedCarId || 'car-apex-racer',
          unlockedCars: data.unlockedCars || ['car-apex-racer'],
          unlockedBadges: data.unlockedBadges || [],
          title: data.title || 'Rookie Driver',
        };
        setUserProfile(profile);

        // Mirror to local storage for offline fast read
        localStorage.setItem('typerush_user', JSON.stringify(profile));

        // Sync back bestWpm if Firestore had 0
        if ((data.bestWpm || 0) < computedBestWpm) {
          await updateDoc(userRef, {
            bestWpm: computedBestWpm,
            totalRaces: profile.totalRaces,
            updatedAt: serverTimestamp(),
          });
        }

        // Update public leaderboard entry
        await setDoc(doc(db, 'leaderboards', fbUser.uid), {
          uid: fbUser.uid,
          displayName: profile.username,
          avatar: profile.avatar,
          level: profile.level,
          title: profile.title,
          bestWpm: profile.bestWpm,
          avgAccuracy: profile.avgAccuracy,
          totalWins: profile.totalWins,
          totalRaces: profile.totalRaces,
          xp: profile.xp,
          equippedCarId: profile.equippedCarId,
          updatedAt: serverTimestamp(),
        });
      } else {
        // First-time user doc creation
        const races = ApiService.getRaces();
        const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);

        const newProfile: User = {
          id: fbUser.uid,
          username: fbUser.displayName || 'Racer',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || '🏎️',
          level: 1,
          xp: 100,
          currentStreak: 1,
          longestStreak: 1,
          lastRaceDate: new Date().toISOString().split('T')[0],
          totalRaces: races.length,
          totalWins: 0,
          avgWpm: 0,
          bestWpm: maxRaceWpm,
          avgAccuracy: 100,
          equippedCarId: 'car-apex-racer',
          unlockedCars: ['car-apex-racer'],
          unlockedBadges: ['ach-first-race'],
          title: 'Rookie Driver',
        };

        await setDoc(userRef, {
          uid: fbUser.uid,
          displayName: newProfile.username,
          email: newProfile.email,
          photoURL: newProfile.avatar,
          level: newProfile.level,
          xp: newProfile.xp,
          currentStreak: newProfile.currentStreak,
          longestStreak: newProfile.longestStreak,
          lastRaceDate: newProfile.lastRaceDate,
          totalRaces: newProfile.totalRaces,
          wins: newProfile.totalWins,
          avgWpm: newProfile.avgWpm,
          bestWpm: newProfile.bestWpm,
          avgAccuracy: newProfile.avgAccuracy,
          equippedCarId: newProfile.equippedCarId,
          unlockedCars: newProfile.unlockedCars,
          unlockedBadges: newProfile.unlockedBadges,
          title: newProfile.title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, 'leaderboards', fbUser.uid), {
          uid: fbUser.uid,
          displayName: newProfile.username,
          avatar: newProfile.avatar,
          level: newProfile.level,
          title: newProfile.title,
          bestWpm: newProfile.bestWpm,
          avgAccuracy: newProfile.avgAccuracy,
          totalWins: newProfile.totalWins,
          totalRaces: newProfile.totalRaces,
          xp: newProfile.xp,
          equippedCarId: newProfile.equippedCarId,
          updatedAt: serverTimestamp(),
        });

        setUserProfile(newProfile);
        localStorage.setItem('typerush_user', JSON.stringify(newProfile));
      }
    } catch (err) {
      console.error('[Firebase Auth] Error syncing user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncFirestoreProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncFirestoreProfile(result.user);
      }
    } catch (error) {
      console.error('[Firebase Auth] Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
      localStorage.removeItem('typerush_user');
    } catch (error) {
      console.error('[Firebase Auth] Sign-Out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Safe idempotent import of existing local storage stats into Firebase account
  const importLocalProgress = async (): Promise<boolean> => {
    if (!currentUser || !userProfile) return false;

    // Check if already imported
    const importKey = `typerush_imported_${currentUser.uid}`;
    if (localStorage.getItem(importKey)) {
      console.log('[AuthContext] Local progress already imported for this user.');
      return true;
    }

    try {
      const localUser = ApiService.getUser();
      const localRaces = ApiService.getRaces();

      const mergedXp = Math.max(userProfile.xp, localUser.xp);
      const mergedLevel = Math.floor(mergedXp / 500) + 1;
      const mergedBestWpm = Math.max(userProfile.bestWpm, localUser.bestWpm);

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        xp: mergedXp,
        level: mergedLevel,
        bestWpm: mergedBestWpm,
        totalRaces: userProfile.totalRaces + localRaces.length,
        updatedAt: serverTimestamp(),
      });

      localStorage.setItem(importKey, new Date().toISOString());
      await syncFirestoreProfile(currentUser);
      return true;
    } catch (err) {
      console.error('[Firebase Auth] Error importing local progress:', err);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await syncFirestoreProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        logout,
        importLocalProgress,
        refreshProfile,
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
