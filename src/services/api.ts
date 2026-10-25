import { User, RaceResult, Achievement, LeaderboardEntry, DailyChallenge } from '../types';
import { CAR_MODELS } from '../data/cars';
import { ACHIEVEMENTS_DATA } from '../data/achievements';
import { DAILY_CHALLENGES_DEFAULT } from '../data/challenges';
import { db, auth } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USER: 'typerush_user',
  RACES: 'typerush_races',
  ACHIEVEMENTS: 'typerush_achievements',
  CHALLENGES: 'typerush_challenges',
};

function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Operation Error:', JSON.stringify(errInfo));
}

// Initial default fallback user for guest mode
const DEFAULT_GUEST_USER: User = {
  id: 'guest-1',
  username: 'GuestDriver',
  email: 'guest@typerush.app',
  avatar: '🏎️',
  level: 1,
  xp: 100,
  currentStreak: 1,
  longestStreak: 1,
  lastRaceDate: new Date().toISOString().split('T')[0],
  totalRaces: 0,
  totalWins: 0,
  avgWpm: 0,
  bestWpm: 0,
  avgAccuracy: 100,
  equippedCarId: 'car-apex-racer',
  unlockedCars: ['car-apex-racer'],
  unlockedBadges: [],
  title: 'Rookie Driver',
};

export class ApiService {
  static getUser(): User {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    let user: User = saved ? JSON.parse(saved) : { ...DEFAULT_GUEST_USER };

    const races = this.getRaces();
    if (races.length > 0) {
      const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);
      if (maxRaceWpm > (user.bestWpm || 0)) {
        user.bestWpm = maxRaceWpm;
        user.totalRaces = Math.max(user.totalRaces || 0, races.length);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
    }
    return user;
  }

  static async updateUserProfile(updates: Partial<User>): Promise<User> {
    const current = this.getUser();
    const updated = { ...current, ...updates };

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // 1. Synchronize Firebase Auth User profile (displayName & photoURL)
        const authUpdates: { displayName?: string; photoURL?: string } = {};
        if (updates.username !== undefined) authUpdates.displayName = updates.username;
        if (updates.avatar !== undefined) authUpdates.photoURL = updates.avatar;

        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(currentUser, authUpdates);
        }

        // 2. Update Firestore user doc with merge: true (preserves existing fields and complies with rules)
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            displayName: updated.username,
            photoURL: updated.avatar,
            equippedCarId: updated.equippedCarId,
            unlockedCars: updated.unlockedCars,
            unlockedBadges: updated.unlockedBadges,
            xp: updated.xp ?? 0,
            level: updated.level ?? 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 3. Update public leaderboard entry
        const lbRef = doc(db, 'leaderboards', currentUser.uid);
        await setDoc(
          lbRef,
          {
            uid: currentUser.uid,
            displayName: updated.username,
            avatar: updated.avatar,
            equippedCarId: updated.equippedCarId,
            level: updated.level ?? 1,
            title: updated.title ?? 'Rookie Driver',
            bestWpm: updated.bestWpm ?? 0,
            avgAccuracy: updated.avgAccuracy ?? 100,
            totalWins: updated.totalWins ?? 0,
            totalRaces: updated.totalRaces ?? 0,
            xp: updated.xp ?? 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, 'update', `users/${currentUser.uid}`);
        throw err;
      }
    }

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  }

  // Alias for compatibility
  static async updateUser(updates: Partial<User>): Promise<User> {
    return this.updateUserProfile(updates);
  }

  // Reset Stats feature
  static async resetUserStats(): Promise<User> {
    const current = this.getUser();
    const resetUser: User = {
      ...current,
      level: 1,
      xp: 100,
      currentStreak: 0,
      longestStreak: 0,
      lastRaceDate: null,
      totalRaces: 0,
      totalWins: 0,
      avgWpm: 0,
      bestWpm: 0,
      avgAccuracy: 100,
      equippedCarId: 'car-apex-racer',
      unlockedCars: ['car-apex-racer'],
      unlockedBadges: [],
      title: 'Rookie Driver',
    };

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // 1. Reset Firestore user doc
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            level: 1,
            xp: 100,
            currentStreak: 0,
            longestStreak: 0,
            lastRaceDate: null,
            totalRaces: 0,
            wins: 0,
            avgWpm: 0,
            bestWpm: 0,
            avgAccuracy: 100,
            equippedCarId: 'car-apex-racer',
            unlockedCars: ['car-apex-racer'],
            unlockedBadges: [],
            title: 'Rookie Driver',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 2. Reset public leaderboard doc
        const lbRef = doc(db, 'leaderboards', currentUser.uid);
        await setDoc(
          lbRef,
          {
            uid: currentUser.uid,
            displayName: resetUser.username,
            avatar: resetUser.avatar,
            level: 1,
            title: 'Rookie Driver',
            bestWpm: 0,
            avgAccuracy: 100,
            totalWins: 0,
            totalRaces: 0,
            xp: 100,
            equippedCarId: 'car-apex-racer',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 3. Clear user's race records in subcollection
        const racesSubcollRef = collection(db, 'users', currentUser.uid, 'races');
        const raceDocsSnap = await getDocs(racesSubcollRef);
        if (!raceDocsSnap.empty) {
          await Promise.all(raceDocsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)));
        }
      } catch (err) {
        handleFirestoreError(err, 'reset', `users/${currentUser.uid}`);
        throw err;
      }
    }

    // Reset Local Storage Caches
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(resetUser));
    localStorage.setItem(STORAGE_KEYS.RACES, JSON.stringify([]));
    localStorage.setItem(
      STORAGE_KEYS.ACHIEVEMENTS,
      JSON.stringify(
        ACHIEVEMENTS_DATA.map((ach) => ({
          ...ach,
          progress: 0,
          unlocked: false,
          dateUnlocked: undefined,
        }))
      )
    );
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DAILY_CHALLENGES_DEFAULT));

    return resetUser;
  }

  // Safely clear cached user data on logout
  static clearUserDataOnLogout(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.RACES);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('typerush_imported_')) {
        localStorage.removeItem(key);
      }
    });
  }

  static async saveRaceResult(result: RaceResult): Promise<{ user: User; newAchievements: Achievement[] }> {
    const currentUser = auth.currentUser;
    let user = this.getUser();

    // Deduplication check: Do not re-process if result.id is already recorded
    const races = this.getRaces();
    if (races.some((r) => r.id === result.id)) {
      console.warn(`[ApiService] Race ${result.id} already processed. Skipping duplicate save.`);
      return { user, newAchievements: [] };
    }

    // Verify race result metrics via server endpoint first
    try {
      const verifyRes = await fetch('/api/races/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalChars: result.correctChars + result.incorrectChars,
          correctChars: result.correctChars,
          errors: result.incorrectChars,
          durationSeconds: result.durationSeconds,
          position: result.finishPosition,
          difficulty: result.difficulty,
        }),
      });

      if (verifyRes.ok) {
        const verified = await verifyRes.json();
        result.grossWpm = verified.grossWpm;
        result.netWpm = verified.netWpm;
        result.accuracy = verified.accuracy;
        result.xpEarned = verified.verifiedXp;
      }
    } catch {
      // Offline calculation fallback active
    }

    // Calculate updated metrics
    races.unshift(result);
    localStorage.setItem(STORAGE_KEYS.RACES, JSON.stringify(races));

    const totalRaces = races.length;
    const wins = races.filter((r) => r.finishPosition === 1).length;
    const avgWpm = Math.round(races.reduce((acc, r) => acc + (r.netWpm || 0), 0) / totalRaces);
    const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);
    const bestWpm = Math.max(user.bestWpm || 0, maxRaceWpm, result.netWpm || 0);
    const avgAcc = Math.round((races.reduce((acc, r) => acc + (r.accuracy || 0), 0) / totalRaces) * 10) / 10;

    let newXp = user.xp + result.xpEarned;
    const newLevel = Math.floor(newXp / 500) + 1;

    const unlockedCars = [...user.unlockedCars];
    CAR_MODELS.forEach((car) => {
      if (newLevel >= car.unlockLevel && newXp >= car.priceXp && !unlockedCars.includes(car.id)) {
        unlockedCars.push(car.id);
      }
    });

    let title = user.title;
    if (newLevel >= 12) title = 'Racing Champion';
    else if (newLevel >= 8) title = 'Pro Racer';
    else if (newLevel >= 5) title = 'Speed Driver';
    else if (newLevel >= 3) title = 'Street Racer';

    const today = new Date().toISOString().split('T')[0];
    let streak = user.currentStreak;
    if (user.lastRaceDate !== today) {
      if (user.lastRaceDate) {
        const last = new Date(user.lastRaceDate);
        const curr = new Date(today);
        const diffDays = Math.floor((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) streak += 1;
        else if (diffDays > 1) streak = 1;
      } else {
        streak = 1;
      }
    }

    // Check Achievements
    const achievements = this.getAchievements();
    const newUnlocked: Achievement[] = [];
    const unlockedBadges = [...user.unlockedBadges];

    // Compute current win streak from recent races
    let currentWinStreak = 0;
    for (const r of races) {
      if (r.finishPosition === 1) currentWinStreak++;
      else break;
    }

    achievements.forEach((ach) => {
      if (!ach.unlocked) {
        let val = 0;
        if (ach.category === 'races') {
          val = totalRaces;
        } else if (ach.category === 'speed') {
          val = bestWpm;
        } else if (ach.category === 'accuracy') {
          const totalChars = (result.correctChars || 0) + (result.incorrectChars || 0);
          const charsOk = !ach.minCharsRequired || totalChars >= ach.minCharsRequired;
          const wpmOk = !ach.minWpmRequired || result.netWpm >= ach.minWpmRequired;
          if (charsOk && wpmOk) {
            val = result.accuracy;
          }
        } else if (ach.category === 'wins') {
          if (ach.id.startsWith('ach-win-streak')) {
            val = currentWinStreak;
          } else {
            val = wins;
          }
        } else if (ach.category === 'streak') {
          val = Math.max(streak, user.longestStreak || 0);
        } else if (ach.category === 'consistency') {
          if (ach.id === 'ach-zero-typo-3' || ach.id === 'ach-zero-typo-10') {
            val = races.filter((r) => (r.incorrectChars || 0) === 0 || r.accuracy === 100).length;
          } else if (ach.id === 'ach-low-error-burst') {
            const totalChars = (result.correctChars || 0) + (result.incorrectChars || 0);
            val = (result.incorrectChars || 0) === 0 && totalChars >= 200 ? 1 : 0;
          } else if (ach.id === 'ach-high-speed-low-error') {
            val = result.netWpm >= 60 && result.accuracy >= 99 ? 1 : 0;
          } else {
            const targetAcc = ach.targetValue >= 25 ? 98 : ach.targetValue >= 15 ? 96 : 95;
            val = races.filter((r) => r.accuracy >= targetAcc).length;
          }
        } else if (ach.category === 'challenges') {
          if (ach.id === 'ach-challenge-beginner-bot') {
            val = result.difficulty === 'beginner' && result.finishPosition === 1 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-inter-bot') {
            val = result.difficulty === 'intermediate' && result.finishPosition === 1 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-adv-bot') {
            val = result.difficulty === 'advanced' && result.finishPosition === 1 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-expert') {
            val = result.difficulty === 'expert' && result.finishPosition === 1 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-code') {
            val = (result.passageTitle?.toLowerCase().includes('code') || result.accuracy >= 95) ? 1 : 0;
          } else if (ach.id === 'ach-challenge-literature') {
            val = result.accuracy >= 95 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-long') {
            const totalChars = (result.correctChars || 0) + (result.incorrectChars || 0);
            val = totalChars >= 300 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-sprint') {
            val = result.durationSeconds > 0 && result.durationSeconds <= 20 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-night') {
            const hour = new Date().getHours();
            val = hour >= 22 || hour <= 4 ? 1 : 0;
          } else if (ach.id === 'ach-challenge-morning') {
            const hour = new Date().getHours();
            val = hour >= 5 && hour <= 9 ? 1 : 0;
          }
        } else if (ach.category === 'legendary') {
          if (ach.id.startsWith('ach-level')) {
            val = newLevel;
          } else if (ach.id.startsWith('ach-collector')) {
            val = unlockedCars.length;
          } else if (ach.id === 'ach-legend-badge-master') {
            val = unlockedBadges.length;
          }
        }

        ach.progress = Math.min(100, Math.round((val / ach.targetValue) * 100));
        if (val >= ach.targetValue) {
          ach.unlocked = true;
          ach.dateUnlocked = new Date().toISOString();
          newUnlocked.push(ach);
          if (!unlockedBadges.includes(ach.id)) {
            unlockedBadges.push(ach.id);
            newXp += ach.rewardXp; // Award achievement reward XP exactly once
          }
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));

    const finalLevel = Math.floor(newXp / 500) + 1;

    const updatedUser: User = {
      ...user,
      xp: newXp,
      level: finalLevel,
      totalRaces,
      totalWins: wins,
      avgWpm,
      bestWpm,
      avgAccuracy: avgAcc,
      unlockedCars,
      unlockedBadges,
      title,
      currentStreak: streak,
      longestStreak: Math.max(user.longestStreak, streak),
      lastRaceDate: today,
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    // Write to Firestore if authenticated
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          xp: newXp,
          level: finalLevel,
          totalRaces,
          wins,
          avgWpm,
          bestWpm,
          avgAccuracy: avgAcc,
          unlockedCars,
          unlockedBadges,
          title,
          currentStreak: streak,
          longestStreak: Math.max(user.longestStreak, streak),
          lastPlayedDate: today,
          updatedAt: serverTimestamp(),
        });

        // Save race to subcollection using deterministic race ID
        const raceRef = doc(db, 'users', currentUser.uid, 'races', result.id);
        await setDoc(raceRef, {
          ...result,
          completedAt: serverTimestamp(),
        });

        // Update public leaderboard document
        const lbRef = doc(db, 'leaderboards', currentUser.uid);
        await setDoc(lbRef, {
          uid: currentUser.uid,
          displayName: updatedUser.username,
          avatar: updatedUser.avatar,
          level: finalLevel,
          title,
          bestWpm,
          avgAccuracy: avgAcc,
          totalWins: wins,
          totalRaces,
          xp: newXp,
          equippedCarId: updatedUser.equippedCarId,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, 'write', `users/${currentUser.uid}/races/${result.id}`);
      }
    }

    return { user: updatedUser, newAchievements: newUnlocked };
  }

  static getRaces(): RaceResult[] {
    const saved = localStorage.getItem(STORAGE_KEYS.RACES);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  // Restore race history and telemetry subcollection from Cloud Firestore for authenticated user
  static async fetchUserRacesFromCloud(uid: string): Promise<RaceResult[]> {
    if (!uid) return this.getRaces();

    try {
      const racesSubcollRef = collection(db, 'users', uid, 'races');
      const snap = await getDocs(racesSubcollRef);

      if (snap.empty) {
        localStorage.setItem(STORAGE_KEYS.RACES, JSON.stringify([]));
        return [];
      }

      const races: RaceResult[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        let dateStr = new Date().toISOString();
        if (data.date) {
          dateStr = data.date;
        } else if (data.completedAt?.toDate) {
          dateStr = data.completedAt.toDate().toISOString();
        }

        races.push({
          id: data.id || docSnap.id,
          userId: data.userId || uid,
          username: data.username || 'Racer',
          mode: data.mode || 'ai',
          difficulty: data.difficulty || 'intermediate',
          passageId: data.passageId || '',
          passageTitle: data.passageTitle || 'Passage',
          grossWpm: data.grossWpm ?? 0,
          netWpm: data.netWpm ?? 0,
          accuracy: data.accuracy ?? 100,
          durationSeconds: data.durationSeconds ?? 0,
          correctChars: data.correctChars ?? 0,
          incorrectChars: data.incorrectChars ?? 0,
          backspaces: data.backspaces ?? 0,
          finishPosition: data.finishPosition ?? 1,
          totalParticipants: data.totalParticipants ?? 4,
          xpEarned: data.xpEarned ?? 0,
          date: dateStr,
        });
      });

      // Sort by date descending (most recent first)
      races.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      localStorage.setItem(STORAGE_KEYS.RACES, JSON.stringify(races));
      return races;
    } catch (err) {
      handleFirestoreError(err, 'list', `users/${uid}/races`);
      return this.getRaces();
    }
  }

  static getAchievements(passedUser?: User): Achievement[] {
    const user = passedUser || this.getUser();
    const races = this.getRaces();
    const savedStr = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    let saved: Achievement[] = savedStr ? JSON.parse(savedStr) : [];
    const savedMap = new Map<string, Achievement>(saved.map((a) => [a.id, a]));

    const hasCompletedRaces = (user.totalRaces || 0) > 0 || races.length > 0;
    const verifiedUnlockedSet = new Set<string>();

    // Win streak calculation from race history
    let currentWinStreak = 0;
    for (const r of races) {
      if (r.finishPosition === 1) currentWinStreak++;
      else break;
    }

    // First Pass: Evaluate strict metric conditions for all categories
    const merged: Achievement[] = ACHIEVEMENTS_DATA.map((def) => {
      const existing = savedMap.get(def.id);
      let isUnlocked = false;
      let val = 0;

      if (def.category === 'races') {
        val = Math.max(user.totalRaces || 0, races.length);
        if (val >= def.targetValue && def.targetValue > 0) {
          isUnlocked = true;
        }
      } else if (def.category === 'speed') {
        if (hasCompletedRaces) {
          const maxRaceWpm = races.reduce((max, r) => Math.max(max, r.netWpm || 0), 0);
          val = Math.max(user.bestWpm || 0, maxRaceWpm);
          if (val >= def.targetValue && def.targetValue > 0) {
            isUnlocked = true;
          }
        }
      } else if (def.category === 'accuracy') {
        if (hasCompletedRaces) {
          const minChars = def.minCharsRequired || 0;
          const minWpm = def.minWpmRequired || 0;

          const qualifyingRaces = races.filter((r) => {
            const totalChars = (r.correctChars || 0) + (r.incorrectChars || 0);
            const charsOk = totalChars >= minChars;
            const wpmOk = (r.netWpm || 0) >= minWpm;
            const accOk = (r.accuracy || 0) >= def.targetValue;
            const backspaceOk = def.id !== 'ach-acc-no-backspace' || (r.backspaces || 0) === 0;
            return charsOk && wpmOk && accOk && backspaceOk;
          });

          if (qualifyingRaces.length > 0) {
            val = def.targetValue;
            isUnlocked = true;
          } else {
            const bestQualifyingAcc = races.reduce((best, r) => {
              const totalChars = (r.correctChars || 0) + (r.incorrectChars || 0);
              const charsOk = totalChars >= minChars;
              const wpmOk = (r.netWpm || 0) >= minWpm;
              if (charsOk && wpmOk) {
                return Math.max(best, r.accuracy || 0);
              }
              return best;
            }, 0);
            val = bestQualifyingAcc;
          }
        }
      } else if (def.category === 'wins') {
        if (hasCompletedRaces) {
          if (def.id.startsWith('ach-win-streak')) {
            val = currentWinStreak;
          } else {
            val = Math.max(user.totalWins || 0, races.filter((r) => r.finishPosition === 1).length);
          }
          if (val >= def.targetValue && def.targetValue > 0) {
            isUnlocked = true;
          }
        }
      } else if (def.category === 'streak') {
        if (hasCompletedRaces) {
          val = Math.max(user.currentStreak || 0, user.longestStreak || 0);
          if (val >= def.targetValue && def.targetValue > 0) {
            isUnlocked = true;
          }
        }
      } else if (def.category === 'consistency') {
        if (hasCompletedRaces) {
          if (def.id === 'ach-zero-typo-3' || def.id === 'ach-zero-typo-10') {
            val = races.filter((r) => (r.incorrectChars || 0) === 0 && (r.correctChars || 0) > 0).length;
          } else if (def.id === 'ach-low-error-burst') {
            val = races.some((r) => (r.incorrectChars || 0) === 0 && (r.correctChars || 0) >= 200) ? 1 : 0;
          } else if (def.id === 'ach-high-speed-low-error') {
            val = races.some((r) => (r.netWpm || 0) >= 60 && (r.accuracy || 0) >= 99) ? 1 : 0;
          } else {
            const targetAcc = def.targetValue >= 25 ? 98 : def.targetValue >= 15 ? 96 : 95;
            val = races.filter((r) => (r.accuracy || 0) >= targetAcc).length;
          }
          if (val >= def.targetValue && def.targetValue > 0) {
            isUnlocked = true;
          }
        }
      } else if (def.category === 'challenges') {
        if (hasCompletedRaces) {
          if (def.id === 'ach-challenge-beginner-bot') {
            val = races.some((r) => r.difficulty === 'beginner' && r.finishPosition === 1) ? 1 : 0;
          } else if (def.id === 'ach-challenge-inter-bot') {
            val = races.some((r) => r.difficulty === 'intermediate' && r.finishPosition === 1) ? 1 : 0;
          } else if (def.id === 'ach-challenge-adv-bot') {
            val = races.some((r) => r.difficulty === 'advanced' && r.finishPosition === 1) ? 1 : 0;
          } else if (def.id === 'ach-challenge-expert') {
            val = races.some((r) => r.difficulty === 'expert' && r.finishPosition === 1) ? 1 : 0;
          } else if (def.id === 'ach-challenge-code') {
            val = races.some((r) => r.passageTitle?.toLowerCase().includes('code') && (r.accuracy || 0) >= 95) ? 1 : 0;
          } else if (def.id === 'ach-challenge-literature') {
            val = races.some((r) => r.passageTitle?.toLowerCase().includes('literature') && (r.accuracy || 0) >= 95) ? 1 : 0;
          } else if (def.id === 'ach-challenge-long') {
            val = races.some((r) => (r.correctChars || 0) + (r.incorrectChars || 0) >= 300) ? 1 : 0;
          } else if (def.id === 'ach-challenge-sprint') {
            val = races.some((r) => r.durationSeconds > 0 && r.durationSeconds <= 20 && r.finishPosition === 1) ? 1 : 0;
          } else if (def.id === 'ach-challenge-night') {
            val = races.some((r) => {
              const h = new Date(r.date).getHours();
              return h >= 22 || h <= 4;
            }) ? 1 : 0;
          } else if (def.id === 'ach-challenge-morning') {
            val = races.some((r) => {
              const h = new Date(r.date).getHours();
              return h >= 5 && h <= 9;
            }) ? 1 : 0;
          }
          if (val >= def.targetValue && def.targetValue > 0) {
            isUnlocked = true;
          }
        }
      } else if (def.category === 'legendary') {
        if (def.id.startsWith('ach-level')) {
          val = user.level || 1;
        } else if (def.id.startsWith('ach-collector')) {
          val = user.unlockedCars?.length || 1;
        }
        if (val >= def.targetValue && def.targetValue > 0) {
          isUnlocked = true;
        }
      }

      if (isUnlocked) {
        verifiedUnlockedSet.add(def.id);
      }

      const progress = isUnlocked
        ? 100
        : Math.min(99, Math.round((val / (def.targetValue || 1)) * 100));

      return {
        ...def,
        progress: isUnlocked ? 100 : Math.max(0, progress),
        unlocked: isUnlocked,
        dateUnlocked: isUnlocked ? (existing?.dateUnlocked || user.lastRaceDate || new Date().toISOString()) : undefined,
      };
    });

    // Second Pass: Check badge master legendary achievement using verified unlocked count
    const badgeMasterDef = merged.find((a) => a.id === 'ach-legend-badge-master');
    if (badgeMasterDef) {
      const otherUnlockedCount = verifiedUnlockedSet.has('ach-legend-badge-master')
        ? verifiedUnlockedSet.size - 1
        : verifiedUnlockedSet.size;
      if (otherUnlockedCount >= badgeMasterDef.targetValue) {
        badgeMasterDef.unlocked = true;
        badgeMasterDef.progress = 100;
        verifiedUnlockedSet.add('ach-legend-badge-master');
      } else {
        badgeMasterDef.unlocked = false;
        badgeMasterDef.progress = Math.min(99, Math.round((otherUnlockedCount / badgeMasterDef.targetValue) * 100));
        verifiedUnlockedSet.delete('ach-legend-badge-master');
      }
    }

    // Reconcile profile unlockedBadges array to match verified set
    const updatedUnlockedBadges = Array.from(verifiedUnlockedSet);
    user.unlockedBadges = updatedUnlockedBadges;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(merged));

    return merged;
  }

  static getDailyChallenges(): DailyChallenge[] {
    const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DAILY_CHALLENGES_DEFAULT));
      return DAILY_CHALLENGES_DEFAULT;
    }
    return JSON.parse(saved);
  }

  // Synchronous Leaderboard getter for guest mode
  static getLeaderboard(): LeaderboardEntry[] {
    return this.getMockLeaderboard();
  }

  // Async Cloud Leaderboard getter
  static async getLeaderboardFromCloud(): Promise<LeaderboardEntry[]> {
    try {
      const q = query(collection(db, 'leaderboards'), orderBy('bestWpm', 'desc'), limit(50));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return [];
      }

      const entries: LeaderboardEntry[] = [];
      let rank = 1;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          rank: rank++,
          userId: docSnap.id,
          username: data.displayName || 'Driver',
          avatar: data.avatar || '🏎️',
          level: data.level || 1,
          title: data.title || 'Rookie Driver',
          bestWpm: data.bestWpm || 0,
          avgAccuracy: data.avgAccuracy || 100,
          totalWins: data.totalWins || 0,
          totalRaces: data.totalRaces || 0,
          xp: data.xp || 0,
          equippedCarId: data.equippedCarId || 'car-apex-racer',
        });
      });

      return entries;
    } catch (err) {
      handleFirestoreError(err, 'list', 'leaderboards');
      throw err;
    }
  }

  static getMockLeaderboard(): LeaderboardEntry[] {
    const user = this.getUser();
    return [
      {
        rank: 1,
        userId: 'top-1',
        username: 'TurboKing',
        avatar: '🏎️',
        level: 24,
        title: 'Racing Champion',
        bestWpm: 124,
        avgAccuracy: 98.9,
        totalWins: 142,
        totalRaces: 180,
        xp: 12400,
        equippedCarId: 'car-formula-type1',
      },
      {
        rank: 2,
        userId: 'top-2',
        username: 'CyberTypist',
        avatar: '⚡',
        level: 19,
        title: 'Pro Racer',
        bestWpm: 112,
        avgAccuracy: 98.2,
        totalWins: 98,
        totalRaces: 130,
        xp: 9500,
        equippedCarId: 'car-phantom-gt',
      },
      {
        rank: 3,
        userId: 'top-3',
        username: 'VelocityQueen',
        avatar: '🏁',
        level: 16,
        title: 'Pro Racer',
        bestWpm: 104,
        avgAccuracy: 97.8,
        totalWins: 76,
        totalRaces: 110,
        xp: 8100,
        equippedCarId: 'car-cyber-speedster',
      },
      {
        rank: 4,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        title: user.title,
        bestWpm: user.bestWpm,
        avgAccuracy: user.avgAccuracy,
        totalWins: user.totalWins,
        totalRaces: user.totalRaces,
        xp: user.xp,
        equippedCarId: user.equippedCarId,
      },
    ];
  }
}
