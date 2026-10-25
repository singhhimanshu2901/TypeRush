import { User, RaceResult, Achievement, LeaderboardEntry, DailyChallenge } from '../types';
import { CAR_MODELS } from '../data/cars';
import { ACHIEVEMENTS_DATA } from '../data/achievements';
import { DAILY_CHALLENGES_DEFAULT } from '../data/challenges';
import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
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
  unlockedBadges: ['ach-first-race'],
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
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));

    // Update in Firestore if logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          displayName: updated.username,
          photoURL: updated.avatar,
          equippedCarId: updated.equippedCarId,
          updatedAt: serverTimestamp(),
        });

        const lbRef = doc(db, 'leaderboards', currentUser.uid);
        await updateDoc(lbRef, {
          displayName: updated.username,
          avatar: updated.avatar,
          equippedCarId: updated.equippedCarId,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, 'update', `users/${currentUser.uid}`);
      }
    }

    return updated;
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

    const newXp = user.xp + result.xpEarned;
    const newLevel = Math.floor(newXp / 500) + 1;

    const unlockedCars = [...user.unlockedCars];
    CAR_MODELS.forEach((car) => {
      if (newLevel >= car.unlockLevel && !unlockedCars.includes(car.id)) {
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

    const updatedUser: User = {
      ...user,
      xp: newXp,
      level: newLevel,
      totalRaces,
      totalWins: wins,
      avgWpm,
      bestWpm,
      avgAccuracy: avgAcc,
      unlockedCars,
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
          level: newLevel,
          totalRaces,
          wins,
          avgWpm,
          bestWpm,
          avgAccuracy: avgAcc,
          unlockedCars,
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

        // Update public leaderboard document (Excludes PII/Email)
        const lbRef = doc(db, 'leaderboards', currentUser.uid);
        await setDoc(lbRef, {
          uid: currentUser.uid,
          displayName: updatedUser.username,
          avatar: updatedUser.avatar,
          level: newLevel,
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

    // Check Achievements
    const achievements = this.getAchievements();
    const newUnlocked: Achievement[] = [];

    achievements.forEach((ach) => {
      if (!ach.unlocked) {
        let val = 0;
        if (ach.category === 'races') val = totalRaces;
        else if (ach.category === 'speed') val = bestWpm;
        else if (ach.category === 'accuracy') val = result.accuracy;
        else if (ach.category === 'wins') val = wins;
        else if (ach.category === 'streak') val = streak;

        ach.progress = Math.min(100, Math.round((val / ach.targetValue) * 100));
        if (val >= ach.targetValue) {
          ach.unlocked = true;
          ach.dateUnlocked = new Date().toISOString();
          newUnlocked.push(ach);
          updatedUser.unlockedBadges.push(ach.id);
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));

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

  // Synchronous Leaderboard getter for immediate render
  static getLeaderboard(): LeaderboardEntry[] {
    return this.getMockLeaderboard();
  }

  // Async Cloud Leaderboard getter
  static async getLeaderboardFromCloud(): Promise<LeaderboardEntry[]> {
    try {
      const q = query(collection(db, 'leaderboards'), orderBy('bestWpm', 'desc'), limit(50));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return this.getMockLeaderboard();
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
      return this.getMockLeaderboard();
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
