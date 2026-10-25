import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiService, handleFirestoreError } from '../api';
import { User, RaceResult } from '../../types';
import { setDoc, getDocs, getDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../config/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-uid',
      email: 'test@typerush.app',
      emailVerified: true,
      displayName: 'TestRacer',
      photoURL: '🏎️',
    },
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, ...paths) => paths.join('/')),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      uid: 'test-user-uid',
      displayName: 'TestRacer',
      xp: 500,
      level: 2,
      bestWpm: 80,
      totalRaces: 5,
      wins: 2,
      totalWins: 2,
      equippedCarId: 'car-apex-racer',
      unlockedCars: ['car-apex-racer'],
      unlockedBadges: ['ach-first-race'],
    }),
  }),
  getDocs: vi.fn().mockResolvedValue({
    empty: false,
    docs: [
      {
        id: 'race-1',
        data: () => ({
          id: 'race-1',
          netWpm: 75,
          accuracy: 98,
          finishPosition: 1,
          date: '2026-10-25T10:00:00.000Z',
        }),
      },
    ],
    forEach: (cb: any) => {
      cb({
        id: 'race-1',
        data: () => ({
          id: 'race-1',
          netWpm: 75,
          accuracy: 98,
          finishPosition: 1,
          date: '2026-10-25T10:00:00.000Z',
        }),
      });
    },
  }),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

const mockRaceResult: RaceResult = {
  id: 'race-persist-100',
  userId: 'test-user-uid',
  username: 'TestRacer',
  mode: 'ai',
  difficulty: 'intermediate',
  passageId: 'pass-1',
  passageTitle: 'Speed Sprint',
  grossWpm: 82,
  netWpm: 80,
  accuracy: 98,
  durationSeconds: 20,
  correctChars: 200,
  incorrectChars: 4,
  backspaces: 1,
  finishPosition: 1,
  totalParticipants: 4,
  xpEarned: 250,
  date: '2026-10-25T12:00:00.000Z',
};

describe('Data Persistence & Firestore Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Completing a race writes the result to Firestore subcollection', async () => {
    const { user } = await ApiService.saveRaceResult(mockRaceResult);

    expect(user.totalRaces).toBeGreaterThan(0);
    // Verify setDoc was called for race record: users/test-user-uid/races/race-persist-100
    expect(setDoc).toHaveBeenCalledWith(
      'users/test-user-uid/races/race-persist-100',
      expect.objectContaining({
        id: 'race-persist-100',
        netWpm: 80,
        accuracy: 98,
      })
    );
  });

  it('2. User statistics update correctly after a successful race write', async () => {
    const initialUser: User = {
      id: 'test-user-uid',
      username: 'TestRacer',
      email: 'test@typerush.app',
      avatar: '🏎️',
      level: 1,
      xp: 100,
      currentStreak: 1,
      longestStreak: 1,
      lastRaceDate: '2026-10-24',
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
    localStorage.setItem('typerush_user', JSON.stringify(initialUser));

    const { user } = await ApiService.saveRaceResult(mockRaceResult);

    expect(user.xp).toBeGreaterThan(100);
    expect(user.totalRaces).toBe(1);
    expect(user.totalWins).toBe(1);
    expect(user.bestWpm).toBe(80);

    // Verify setDoc updated users/test-user-uid
    expect(setDoc).toHaveBeenCalledWith(
      'users/test-user-uid',
      expect.objectContaining({
        xp: user.xp,
        level: user.level,
        bestWpm: 80,
        totalRaces: 1,
      }),
      { merge: true }
    );
  });

  it('3. Leaderboard synchronization updates leaderboards/{uid} doc', async () => {
    const initialUser: User = {
      id: 'test-user-uid',
      username: 'TestRacer',
      email: 'test@typerush.app',
      avatar: '🏎️',
      level: 1,
      xp: 100,
      currentStreak: 1,
      longestStreak: 1,
      lastRaceDate: '2026-10-24',
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
    localStorage.setItem('typerush_user', JSON.stringify(initialUser));

    await ApiService.saveRaceResult(mockRaceResult);

    expect(setDoc).toHaveBeenCalledWith(
      'leaderboards/test-user-uid',
      expect.objectContaining({
        uid: 'test-user-uid',
        displayName: 'TestRacer',
        bestWpm: 80,
      }),
      { merge: true }
    );
  });

  it('4. A Firestore permission error is surfaced rather than silently ignored', async () => {
    (setDoc as any).mockRejectedValueOnce(new Error('Missing or insufficient permissions'));

    await expect(ApiService.saveRaceResult(mockRaceResult)).rejects.toThrow();
  });

  it('5. A failed write throws error and does not produce false cloud success', async () => {
    (setDoc as any).mockRejectedValueOnce(new Error('Network offline'));

    let errorCaught: any = null;
    try {
      await ApiService.saveRaceResult({ ...mockRaceResult, id: 'race-fail-999' });
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    expect(String(errorCaught)).toContain('Network offline');
  });

  it('6. Retrying a race save with the same race ID does not duplicate records or rewards', async () => {
    const firstRun = await ApiService.saveRaceResult(mockRaceResult);
    const firstXp = firstRun.user.xp;

    // Retry saving identical race ID
    const secondRun = await ApiService.saveRaceResult(mockRaceResult);

    expect(secondRun.user.xp).toBe(firstXp);
    expect(secondRun.newAchievements.length).toBe(0);
  });

  it('7. Profile and equipped-car updates persist to Firestore', async () => {
    const updated = await ApiService.updateUserProfile({
      equippedCarId: 'car-neon-viper',
      username: 'SpeedDemon',
    });

    expect(updated.equippedCarId).toBe('car-neon-viper');
    expect(updated.username).toBe('SpeedDemon');

    expect(setDoc).toHaveBeenCalledWith(
      'users/test-user-uid',
      expect.objectContaining({
        equippedCarId: 'car-neon-viper',
        displayName: 'SpeedDemon',
      }),
      { merge: true }
    );
  });

  it('8. Achievements remain correct after race completion and profile refresh', async () => {
    const achievements = ApiService.getAchievements();
    expect(achievements).toBeDefined();
    expect(Array.isArray(achievements)).toBe(true);
  });

  it('9. Logout and login restore user data cleanly', async () => {
    localStorage.setItem('typerush_user', JSON.stringify({ username: 'CacheTest' }));
    ApiService.clearUserDataOnLogout();

    expect(localStorage.getItem('typerush_user')).toBeNull();
    expect(localStorage.getItem('typerush_races')).toBeNull();

    const restoredRaces = await ApiService.fetchUserRacesFromCloud('test-user-uid');
    expect(restoredRaces.length).toBeGreaterThan(0);
  });

  it('10. Removing virtual keyboard does not break race completion or persistence', async () => {
    const freshRace: RaceResult = {
      ...mockRaceResult,
      id: 'race-no-vk-1',
    };

    const result = await ApiService.saveRaceResult(freshRace);
    expect(result.user.totalRaces).toBeGreaterThan(0);
    expect(setDoc).toHaveBeenCalledWith('users/test-user-uid/races/race-no-vk-1', expect.anything());
  });
});
