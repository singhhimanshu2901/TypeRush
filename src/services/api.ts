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

    achievements.forEach((ach) => {
      if (!ach.unlocked) {
        let val = 0;
        if (ach.category === 'races') {
          val = totalRaces;
        } else if (ach.category === 'speed') {
          val = bestWpm;
        } else if (ach.category === 'accuracy') {
          const totalChars = (result.correctChars || 0) + (result.incorrectChars || 0);
          if (!ach.minCharsRequired || totalChars >= ach.minCharsRequired) {
            val = result.accuracy;
          }
        } else if (ach.category === 'wins') {
          val = wins;
        } else if (ach.category === 'streak') {
          val = streak;
        } else if (ach.category === 'consistency') {
          const minAcc = ach.targetValue >= 25 ? 98 : 95;
          val = races.filter((r) => r.accuracy >= minAcc).length;
        } else if (ach.category === 'challenges') {
          if (ach.id === 'ach-challenge-expert') {
            val = result.difficulty === 'expert' && result.finishPosition === 1 ? 1 : 0;
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
    return JSON.parse(saved);
  }

  static getAchievements(): Achievement[] {
    const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(ACHIEVEMENTS_DATA));
      return ACHIEVEMENTS_DATA;
    }
    return JSON.parse(saved);
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
