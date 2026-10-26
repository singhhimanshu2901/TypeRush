import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiService } from '../../services/api';
import { RaceResult, User } from '../../types';

// Mock Firebase
vi.mock('../../config/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123', email: 'test@typerush.app' } },
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

describe('Race Completion Flow & Result Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Completing a race finalizes result and returns updated user and new achievements', async () => {
    const raceResult: RaceResult = {
      id: 'race-complete-1',
      userId: 'test-user-123',
      username: 'FastDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'passage-1',
      passageTitle: 'Speed Testing',
      grossWpm: 75,
      netWpm: 72,
      accuracy: 98,
      durationSeconds: 20,
      correctChars: 120,
      incorrectChars: 2,
      backspaces: 1,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 250,
      date: new Date().toISOString(),
    };

    const res = await ApiService.saveRaceResult(raceResult);
    expect(res.user).toBeDefined();
    expect(res.user.xp).toBeGreaterThan(100);
    expect(res.user.totalRaces).toBe(1);

    const savedRaces = ApiService.getRaces();
    expect(savedRaces).toHaveLength(1);
    expect(savedRaces[0].id).toBe('race-complete-1');
  });

  it('2. The completion handler runs only once per race ID (Deduplication)', async () => {
    const raceResult: RaceResult = {
      id: 'race-dedup-100',
      userId: 'test-user-123',
      username: 'FastDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'passage-1',
      passageTitle: 'Speed Testing',
      grossWpm: 75,
      netWpm: 72,
      accuracy: 98,
      durationSeconds: 20,
      correctChars: 120,
      incorrectChars: 2,
      backspaces: 1,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 250,
      date: new Date().toISOString(),
    };

    const firstSave = await ApiService.saveRaceResult(raceResult);
    const secondSave = await ApiService.saveRaceResult(raceResult);

    expect(firstSave.user.xp).toBe(secondSave.user.xp);
    const savedRaces = ApiService.getRaces();
    expect(savedRaces.filter((r) => r.id === 'race-dedup-100')).toHaveLength(1);
  });

  it('3. Valid result is still returned with syncError warning flag when cloud write fails', async () => {
    const { setDoc } = await import('firebase/firestore');
    vi.mocked(setDoc).mockRejectedValueOnce(new Error('Network offline or Firestore unavailable'));

    const raceResult: RaceResult = {
      id: 'race-cloud-fail-1',
      userId: 'test-user-123',
      username: 'FastDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'passage-1',
      passageTitle: 'Speed Testing',
      grossWpm: 75,
      netWpm: 72,
      accuracy: 98,
      durationSeconds: 20,
      correctChars: 120,
      incorrectChars: 2,
      backspaces: 1,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 250,
      date: new Date().toISOString(),
    };

    const res = await ApiService.saveRaceResult(raceResult);
    expect(res.user).toBeDefined();
    expect(raceResult.syncError).toBe(true);

    // Verify local persistence succeeded despite cloud write failure
    const savedRaces = ApiService.getRaces();
    expect(savedRaces).toHaveLength(1);
    expect(savedRaces[0].id).toBe('race-cloud-fail-1');
  });

  it('4. Retrying a failed save does not award duplicate XP', async () => {
    const raceResult: RaceResult = {
      id: 'race-retry-1',
      userId: 'test-user-123',
      username: 'FastDriver',
      mode: 'ai',
      difficulty: 'intermediate',
      passageId: 'passage-1',
      passageTitle: 'Speed Testing',
      grossWpm: 75,
      netWpm: 72,
      accuracy: 98,
      durationSeconds: 20,
      correctChars: 120,
      incorrectChars: 2,
      backspaces: 1,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 250,
      date: new Date().toISOString(),
    };

    const res1 = await ApiService.saveRaceResult(raceResult);
    const xpAfterFirst = res1.user.xp;

    const res2 = await ApiService.saveRaceResult(raceResult);
    expect(res2.user.xp).toBe(xpAfterFirst);
  });

  it('5. Result statistics accurately reflect final race telemetry', async () => {
    const raceResult: RaceResult = {
      id: 'race-stats-check',
      userId: 'test-user-123',
      username: 'FastDriver',
      mode: 'ai',
      difficulty: 'expert',
      passageId: 'passage-tech',
      passageTitle: 'Complex Code Passage',
      grossWpm: 110,
      netWpm: 105,
      accuracy: 99.5,
      durationSeconds: 15,
      correctChars: 220,
      incorrectChars: 1,
      backspaces: 0,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 350,
      date: new Date().toISOString(),
    };

    await ApiService.saveRaceResult(raceResult);
    const races = ApiService.getRaces();
    const saved = races.find((r) => r.id === 'race-stats-check');

    expect(saved).toBeDefined();
    expect(saved?.netWpm).toBe(105);
    expect(saved?.accuracy).toBe(99.5);
    expect(saved?.durationSeconds).toBe(15);
    expect(saved?.finishPosition).toBe(1);
    expect(saved?.xpEarned).toBe(350);
  });
});
