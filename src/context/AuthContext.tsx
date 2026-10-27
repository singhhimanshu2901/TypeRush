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
      // 1. Restore race history and telemetry subcollection from Cloud Firestore
      const races = await ApiService.fetchUserRacesFromCloud(fbUser.uid);

      const userRef = doc(db, 'users', fbUser.uid);
      const snapshot = await getDoc(userRef);

      // Guard against stale async resolution if user signed out or switched mid-flight
      if (auth.currentUser?.uid !== fbUser.uid) {
        return;
      }

      const existingLocalUser = ApiService.getUser();
      const isSameUser = existingLocalUser.id === fbUser.uid;

      if (snapshot.exists()) {
        const data = snapshot.data();

        // Calculate metrics strictly from cloud Firestore document and cloud race subcollection
        const hasNoRaces = races.length === 0;
        const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);

        const computedBestWpm = hasNoRaces ? 0 : (data.bestWpm !== undefined ? data.bestWpm : maxRaceWpm);
        const computedTotalRaces = hasNoRaces ? 0 : (data.totalRaces !== undefined ? data.totalRaces : races.length);
        const computedWins = hasNoRaces ? 0 : (data.wins ?? data.totalWins ?? races.filter((r) => r.finishPosition === 1).length);
        const computedXp = hasNoRaces ? 100 : (data.xp !== undefined ? data.xp : 100);
        const computedLevel = hasNoRaces ? 1 : (data.level !== undefined ? data.level : Math.floor(Math.max(0, computedXp) / 500) + 1);

        const computedUnlockedCars = Array.isArray(data.unlockedCars) && data.unlockedCars.length > 0
          ? data.unlockedCars
          : ['car-apex-racer'];

        const computedUnlockedBadges = hasNoRaces
          ? []
          : (Array.isArray(data.unlockedBadges) ? data.unlockedBadges : []);

        const computedAvgWpm = races.length > 0
          ? Math.round(races.reduce((acc, r) => acc + (r.netWpm || 0), 0) / races.length)
          : (hasNoRaces ? 0 : (data.avgWpm || 0));

        const computedAvgAcc = races.length > 0
          ? Math.round((races.reduce((acc, r) => acc + (r.accuracy || 0), 0) / races.length) * 10) / 10
          : (hasNoRaces ? 100 : (data.avgAccuracy || 100));

        const computedEquippedCarId = data.equippedCarId || 'car-apex-racer';

        const initialProfile: User = {
          id: fbUser.uid,
          username: data.displayName || fbUser.displayName || (isSameUser ? existingLocalUser.username : null) || 'Driver',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || data.photoURL || (isSameUser ? existingLocalUser.avatar : null) || '🏎️',
          level: computedLevel,
          xp: computedXp,
          currentStreak: data.currentStreak ?? 0,
          longestStreak: data.longestStreak ?? 0,
          lastRaceDate: data.lastRaceDate || data.lastPlayedDate || null,
          totalRaces: computedTotalRaces,
          totalWins: computedWins,
          avgWpm: computedAvgWpm,
          bestWpm: computedBestWpm,
          avgAccuracy: computedAvgAcc,
          equippedCarId: computedEquippedCarId,
          unlockedCars: computedUnlockedCars,
          unlockedBadges: computedUnlockedBadges,
          title: data.title || 'Rookie Driver',
        };

        // Evaluate achievements dynamically from restored stats and race history
        const evaluatedAchievements = ApiService.getAchievements(initialProfile);
        const resolvedUnlockedBadges = evaluatedAchievements.filter((a) => a.unlocked).map((a) => a.id);
        initialProfile.unlockedBadges = resolvedUnlockedBadges;

        // Apply authoritative XP reconciliation to fix inflated cloud/local XP
        const profile = ApiService.reconcileUserXp(initialProfile, races);

        if (auth.currentUser?.uid === fbUser.uid) {
          setUserProfile(profile);
          localStorage.setItem('typerush_user', JSON.stringify(profile));
        }

        // Sync back bestWpm and reconciled unlockedBadges/xp if Firestore differs
        const currentBadgesJson = JSON.stringify(data.unlockedBadges || []);
        const resolvedBadgesJson = JSON.stringify(resolvedUnlockedBadges);

        if (
          data.xp !== profile.xp ||
          (data.bestWpm || 0) < computedBestWpm ||
          (data.totalRaces || 0) < computedTotalRaces ||
          currentBadgesJson !== resolvedBadgesJson
        ) {
          await setDoc(
            userRef,
            {
              uid: fbUser.uid,
              xp: profile.xp,
              level: profile.level,
              bestWpm: computedBestWpm,
              avgWpm: computedAvgWpm,
              avgAccuracy: computedAvgAcc,
              totalRaces: computedTotalRaces,
              wins: computedWins,
              totalWins: computedWins,
              unlockedCars: computedUnlockedCars,
              unlockedBadges: resolvedUnlockedBadges,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // Update public leaderboard entry
        await setDoc(
          doc(db, 'leaderboards', fbUser.uid),
          {
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
          },
          { merge: true }
        );
      } else {
        // First-time user doc creation
        const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);

        const newProfile: User = {
          id: fbUser.uid,
          username: fbUser.displayName || (isSameUser ? existingLocalUser.username : null) || 'Racer',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || (isSameUser ? existingLocalUser.avatar : null) || '🏎️',
          level: Math.max(1, isSameUser ? existingLocalUser.level || 1 : 1),
          xp: Math.max(100, isSameUser ? existingLocalUser.xp || 100 : 100),
          currentStreak: Math.max(1, isSameUser ? existingLocalUser.currentStreak || 1 : 1),
          longestStreak: Math.max(1, isSameUser ? existingLocalUser.longestStreak || 1 : 1),
          lastRaceDate: (isSameUser ? existingLocalUser.lastRaceDate : null) || new Date().toISOString().split('T')[0],
          totalRaces: Math.max(races.length, isSameUser ? existingLocalUser.totalRaces || 0 : 0),
          totalWins: Math.max(
            races.filter((r) => r.finishPosition === 1).length,
            isSameUser ? existingLocalUser.totalWins || 0 : 0
          ),
          avgWpm: races.length > 0 ? Math.round(races.reduce((acc, r) => acc + (r.netWpm || 0), 0) / races.length) : (isSameUser ? existingLocalUser.avgWpm || 0 : 0),
          bestWpm: Math.max(maxRaceWpm, isSameUser ? existingLocalUser.bestWpm || 0 : 0),
          avgAccuracy: races.length > 0 ? Math.round((races.reduce((acc, r) => acc + (r.accuracy || 0), 0) / races.length) * 10) / 10 : (isSameUser ? existingLocalUser.avgAccuracy || 100 : 100),
          equippedCarId: (isSameUser ? existingLocalUser.equippedCarId : null) || 'car-apex-racer',
          unlockedCars: Array.from(new Set(['car-apex-racer', ...(isSameUser ? existingLocalUser.unlockedCars || [] : [])])),
          unlockedBadges: isSameUser && existingLocalUser.unlockedBadges.length > 0 ? existingLocalUser.unlockedBadges : ['ach-first-race'],
          title: (isSameUser ? existingLocalUser.title : null) || 'Rookie Driver',
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
          totalWins: newProfile.totalWins,
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

        if (auth.currentUser?.uid === fbUser.uid) {
          setUserProfile(newProfile);
          localStorage.setItem('typerush_user', JSON.stringify(newProfile));
        }
      }
    } catch (err) {
      console.error('[Firebase Auth] Error syncing user profile:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setCurrentUser(user);

      if (user) {
        await syncFirestoreProfile(user);
      } else {
        setUserProfile(null);
        ApiService.clearUserDataOnLogout();
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
      setCurrentUser(null);
      ApiService.clearUserDataOnLogout();
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
