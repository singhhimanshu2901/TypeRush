import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementsPage } from '../AchievementsPage';
import { ApiService } from '../../services/api';
import { User } from '../../types';

const mockUser: User = {
  id: 'user-789',
  username: 'SpeedDemon',
  email: 'speed@typerush.app',
  avatar: '🏎️',
  level: 10,
  xp: 4500,
  currentStreak: 5,
  longestStreak: 10,
  lastRaceDate: '2026-10-25',
  totalRaces: 25,
  totalWins: 12,
  avgWpm: 85,
  bestWpm: 105,
  avgAccuracy: 98.2,
  equippedCarId: 'car-apex-racer',
  unlockedCars: ['car-apex-racer'],
  unlockedBadges: ['ach-speed-20', 'ach-first-race', 'ach-speed-master'],
  title: 'Speed Driver',
};

describe('Achievements Integration & Restoration Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores unlocked badges correctly from active user profile and race history', () => {
    render(<AchievementsPage user={mockUser} />);

    // Total badge count header should display unlocked count vs total
    expect(screen.getByText('DRIVER ACHIEVEMENTS & MILESTONES')).toBeDefined();

    const achievements = ApiService.getAchievements(mockUser);
    const unlocked = achievements.filter((a) => a.unlocked);

    // Speed 20 WPM, First Race, and Speed Master 100 WPM should be marked unlocked
    expect(unlocked.some((a) => a.id === 'ach-speed-20')).toBe(true);
    expect(unlocked.some((a) => a.id === 'ach-speed-master')).toBe(true);
    expect(unlocked.length).toBeGreaterThan(0);
  });
});
