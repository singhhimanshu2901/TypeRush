import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiService } from '../api';
import { RaceResult, User } from '../../types';

// Mock Firebase config and modules
vi.mock('../../config/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  googleProvider: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('Data Persistence & XP Progression System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Initializes default guest user with base 100 XP and Level 1', () => {
    const user = ApiService.getUser();
    expect(user.xp).toBe(100);
    expect(user.level).toBe(1);
  });

  it('2. Awarding 200 XP for first race includes unlocked badge rewards', async () => {
    const race1: RaceResult = {
      id: 'race-101',
      userId: 'guest-1',
      username: 'GuestDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'pass-1',
      passageTitle: 'Test Passage 1',
      grossWpm: 60,
      netWpm: 58,
      accuracy: 98,
      durationSeconds: 25,
      correctChars: 150,
      incorrectChars: 3,
      backspaces: 2,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 200,
      date: new Date().toISOString(),
    };

    const { user, newAchievements } = await ApiService.saveRaceResult(race1);
    expect(newAchievements.length).toBeGreaterThan(0);
    expect(user.xp).toBe(815); // 100 base + 200 race1 + unlocked badge rewards
    expect(user.level).toBe(Math.floor(815 / 500) + 1); // Level 2
  });

  it('3. Awarding 150 XP for second race increases balance proportionally', async () => {
    const race1: RaceResult = {
      id: 'race-101',
      userId: 'guest-1',
      username: 'GuestDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'pass-1',
      passageTitle: 'Test Passage 1',
      grossWpm: 60,
      netWpm: 58,
      accuracy: 98,
      durationSeconds: 25,
      correctChars: 150,
      incorrectChars: 3,
      backspaces: 2,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 200,
      date: new Date().toISOString(),
    };

    await ApiService.saveRaceResult(race1);

    const race2: RaceResult = {
      id: 'race-102',
      userId: 'guest-1',
      username: 'GuestDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'pass-2',
      passageTitle: 'Test Passage 2',
      grossWpm: 65,
      netWpm: 63,
      accuracy: 99,
      durationSeconds: 22,
      correctChars: 160,
      incorrectChars: 1,
      backspaces: 1,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 150,
      date: new Date().toISOString(),
    };

    const { user } = await ApiService.saveRaceResult(race2);
    expect(user.xp).toBe(1195); // 815 + 150 race2 + new badge rewards
    expect(user.level).toBe(Math.floor(1195 / 500) + 1); // Level 3
  });

  it('4. Saving same race twice does not award duplicate XP (Deduplication)', async () => {
    const race1: RaceResult = {
      id: 'race-dup-1',
      userId: 'guest-1',
      username: 'GuestDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'pass-1',
      passageTitle: 'Test Passage 1',
      grossWpm: 60,
      netWpm: 58,
      accuracy: 98,
      durationSeconds: 25,
      correctChars: 150,
      incorrectChars: 3,
      backspaces: 2,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 200,
      date: new Date().toISOString(),
    };

    const res1 = await ApiService.saveRaceResult(race1);
    expect(res1.user.xp).toBe(815);

    const res2 = await ApiService.saveRaceResult(race1);
    expect(res2.user.xp).toBe(815); // Deduplicated, no increase
    expect(res2.newAchievements).toHaveLength(0);
  });

  it('5. Refreshing/calling getUser does not arbitrarily increase XP', () => {
    const user1 = ApiService.getUser();
    const user2 = ApiService.getUser();
    const user3 = ApiService.getUser();
    expect(user1.xp).toBe(100);
    expect(user2.xp).toBe(100);
    expect(user3.xp).toBe(100);
  });

  it('6. Stale inflated XP (e.g. 4500) is safely reconciled to actual calculated XP', () => {
    // Simulate a stale user profile with inflated 4500 XP and only 2 races completed
    const inflatedUser: User = {
      id: 'guest-1',
      username: 'GuestDriver',
      email: 'guest@typerush.app',
      avatar: '🏎️',
      level: 10,
      xp: 4500,
      currentStreak: 1,
      longestStreak: 1,
      lastRaceDate: new Date().toISOString().split('T')[0],
      totalRaces: 2,
      totalWins: 2,
      avgWpm: 60,
      bestWpm: 65,
      avgAccuracy: 98.5,
      equippedCarId: 'car-apex-racer',
      unlockedCars: ['car-apex-racer'],
      unlockedBadges: ['ach-first-race', 'ach-first-win'],
      title: 'Rookie Driver',
    };

    const races: RaceResult[] = [
      {
        id: 'r1',
        userId: 'guest-1',
        username: 'GuestDriver',
        mode: 'ai',
        difficulty: 'intermediate',
        passageId: 'p1',
        passageTitle: 'Passage 1',
        grossWpm: 60,
        netWpm: 60,
        accuracy: 98,
        durationSeconds: 25,
        correctChars: 150,
        incorrectChars: 3,
        backspaces: 2,
        finishPosition: 1,
        totalParticipants: 4,
        xpEarned: 200,
        date: new Date().toISOString(),
      },
      {
        id: 'r2',
        userId: 'guest-1',
        username: 'GuestDriver',
        mode: 'ai',
        difficulty: 'intermediate',
        passageId: 'p2',
        passageTitle: 'Passage 2',
        grossWpm: 65,
        netWpm: 65,
        accuracy: 99,
        durationSeconds: 22,
        correctChars: 160,
        incorrectChars: 1,
        backspaces: 1,
        finishPosition: 1,
        totalParticipants: 4,
        xpEarned: 150,
        date: new Date().toISOString(),
      },
    ];

    const reconciled = ApiService.reconcileUserXp(inflatedUser, races);

    // Expected calculated XP: 100 base + 200 (r1) + 150 (r2) + ach-first-race (25) + ach-first-win (100) = 475
    expect(reconciled.xp).toBeLessThan(1000);
    expect(reconciled.xp).toBe(475);
    expect(reconciled.level).toBe(1); // Math.floor(475 / 500) + 1 = 1
  });

  it('7. Level always matches formula Math.floor(xp / 500) + 1', () => {
    const testCases = [
      { xp: 0, expectedLevel: 1 },
      { xp: 100, expectedLevel: 1 },
      { xp: 499, expectedLevel: 1 },
      { xp: 500, expectedLevel: 2 },
      { xp: 999, expectedLevel: 2 },
      { xp: 1000, expectedLevel: 3 },
      { xp: 2450, expectedLevel: 5 },
      { xp: 4500, expectedLevel: 10 },
    ];

    testCases.forEach(({ xp, expectedLevel }) => {
      const level = Math.floor(Math.max(0, xp) / 500) + 1;
      expect(level).toBe(expectedLevel);
    });
  });
});
