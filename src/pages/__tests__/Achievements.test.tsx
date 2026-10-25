import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementsPage } from '../AchievementsPage';
import { ApiService } from '../../services/api';
import { User, RaceResult } from '../../types';

const zeroRaceUser: User = {
  id: 'zero-user',
  username: 'ZeroRacer',
  email: 'zero@typerush.app',
  avatar: '🏎️',
  level: 1,
  xp: 100,
  currentStreak: 0,
  longestStreak: 0,
  lastRaceDate: null,
  totalRaces: 0,
  totalWins: 0,
  avgWpm: 0,
  bestWpm: 0,
  avgAccuracy: 100, // Default initial accuracy value
  equippedCarId: 'car-apex-racer',
  unlockedCars: ['car-apex-racer'],
  unlockedBadges: [],
  title: 'Rookie Driver',
};

const singleRaceUser: User = {
  id: 'single-user',
  username: 'SingleRacer',
  email: 'single@typerush.app',
  avatar: '🏎️',
  level: 1,
  xp: 300,
  currentStreak: 1,
  longestStreak: 1,
  lastRaceDate: '2026-10-25',
  totalRaces: 1,
  totalWins: 1,
  avgWpm: 45,
  bestWpm: 45,
  avgAccuracy: 96,
  equippedCarId: 'car-apex-racer',
  unlockedCars: ['car-apex-racer'],
  unlockedBadges: [],
  title: 'Rookie Driver',
};

const singleQualifyingRace: RaceResult = {
  id: 'race-1',
  userId: 'single-user',
  username: 'SingleRacer',
  mode: 'ai',
  difficulty: 'beginner',
  passageId: 'pass-1',
  passageTitle: 'Beginner Sprint',
  grossWpm: 48,
  netWpm: 45,
  accuracy: 96,
  durationSeconds: 25,
  correctChars: 150,
  incorrectChars: 4,
  backspaces: 2,
  finishPosition: 1,
  totalParticipants: 4,
  xpEarned: 200,
  date: '2026-10-25T12:00:00.000Z',
};

describe('Achievement Unlock Logic & Strict Condition Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. A user with zero races unlocks ZERO achievements (no false positive accuracy/streak unlocks)', () => {
    localStorage.setItem('typerush_races', JSON.stringify([]));
    const achievements = ApiService.getAchievements(zeroRaceUser);
    const unlocked = achievements.filter((a) => a.unlocked);

    expect(unlocked.length).toBe(0);
  });

  it('2. A user with one race unlocks only achievements whose conditions are genuinely satisfied', () => {
    localStorage.setItem('typerush_races', JSON.stringify([singleQualifyingRace]));
    const achievements = ApiService.getAchievements(singleRaceUser);
    const unlocked = achievements.filter((a) => a.unlocked);

    // Should unlock 1st race, 1st victory, 20/25/30/40 WPM, 90/93/95% accuracy, beginner bot
    expect(unlocked.some((a) => a.id === 'ach-first-race')).toBe(true);
    expect(unlocked.some((a) => a.id === 'ach-first-victory')).toBe(true);
    expect(unlocked.some((a) => a.id === 'ach-speed-starter')).toBe(true); // 40 WPM
    expect(unlocked.some((a) => a.id === 'ach-speed-50')).toBe(false); // 45 < 50 WPM
    expect(unlocked.some((a) => a.id === 'ach-accuracy-ace')).toBe(false); // 96% < 98%
  });

  it('3. A user below a WPM threshold does not unlock that WPM achievement', () => {
    const slowUser: User = { ...singleRaceUser, bestWpm: 35 };
    localStorage.setItem('typerush_races', JSON.stringify([{ ...singleQualifyingRace, netWpm: 35 }]));

    const achievements = ApiService.getAchievements(slowUser);
    expect(achievements.find((a) => a.id === 'ach-speed-starter')?.unlocked).toBe(false); // 40 WPM required
    expect(achievements.find((a) => a.id === 'ach-speed-30')?.unlocked).toBe(true); // 30 WPM required
  });

  it('4. Reconciles falsely awarded badges by purging badges whose conditions are not met', () => {
    const falselyAwardedUser: User = {
      ...zeroRaceUser,
      unlockedBadges: ['ach-speed-150', 'ach-acc-100-elite', 'ach-wins-100'],
    };

    localStorage.setItem('typerush_races', JSON.stringify([]));
    const achievements = ApiService.getAchievements(falselyAwardedUser);
    const unlocked = achievements.filter((a) => a.unlocked);

    // Falsely awarded badges must be cleansed
    expect(unlocked.length).toBe(0);
    expect(falselyAwardedUser.unlockedBadges).toEqual([]);
  });

  it('5. UI correctly renders total count and badge state', () => {
    localStorage.setItem('typerush_races', JSON.stringify([]));
    render(<AchievementsPage user={zeroRaceUser} />);

    expect(screen.getByText('DRIVER ACHIEVEMENTS & MILESTONES')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined(); // Unlocked 0 count
  });
});
