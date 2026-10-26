import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardPage } from '../LeaderboardPage';
import { User } from '../../types';

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  ApiService: {
    getMockLeaderboard: vi.fn(() => [
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
    ]),
    getLeaderboardFromCloud: vi.fn(),
  },
}));

import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';

const mockUser: User = {
  id: 'user-123',
  username: 'AuthenticatedDriver',
  email: 'driver@typerush.app',
  avatar: '🏎️',
  level: 5,
  xp: 1200,
  currentStreak: 3,
  longestStreak: 5,
  lastRaceDate: '2026-10-25',
  totalRaces: 10,
  totalWins: 4,
  avgWpm: 75,
  bestWpm: 92,
  avgAccuracy: 98.5,
  equippedCarId: 'car-apex-racer',
  unlockedCars: ['car-apex-racer'],
  unlockedBadges: [],
  title: 'Street Racer',
};

describe('LeaderboardPage - No Demo Flash Regression Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('never displays demo/mock entries during loading for authenticated users', async () => {
    // Mock authenticated state with pending cloud request
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentUser: { uid: 'user-123' },
      loading: false,
    });

    // Cloud fetch is pending or delayed
    (ApiService.getLeaderboardFromCloud as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              rank: 1,
              userId: 'user-456',
              username: 'CloudMaster',
              avatar: '⚡',
              level: 10,
              title: 'Pro Racer',
              bestWpm: 110,
              avgAccuracy: 99.0,
              totalWins: 20,
              totalRaces: 30,
              xp: 5000,
              equippedCarId: 'car-neon-viper',
            },
          ]);
        }, 100);
      })
    );

    render(<LeaderboardPage user={mockUser} />);

    // Expect NO demo user (e.g. TurboKing) during initial render or loading
    expect(screen.queryByText('TurboKing')).toBeNull();

    // Wait for cloud data resolution
    await waitFor(() => {
      expect(screen.getByText('CloudMaster')).toBeDefined();
    });

    // Demo entries should still not be present after cloud fetch completes
    expect(screen.queryByText('TurboKing')).toBeNull();
  });

  it('displays demo entries in guest mode when signed-out', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentUser: null,
      loading: false,
    });

    render(<LeaderboardPage user={mockUser} />);

    // In guest mode, mock entries like TurboKing SHOULD be present
    expect(screen.getByText('TurboKing')).toBeDefined();
  });

  it('renders authenticated user statistics accurately from cloud', async () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentUser: { uid: 'user-123' },
      loading: false,
    });

    (ApiService.getLeaderboardFromCloud as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        rank: 1,
        userId: 'user-123',
        username: 'AuthenticatedDriver',
        avatar: '🏎️',
        level: 5,
        title: 'Street Racer',
        bestWpm: 92,
        avgAccuracy: 98.5,
        totalWins: 4,
        totalRaces: 10,
        xp: 1200,
        equippedCarId: 'car-apex-racer',
      },
    ]);

    render(<LeaderboardPage user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('AuthenticatedDriver')).toBeDefined();
      expect(screen.getByText('92 WPM')).toBeDefined();
      expect(screen.getByText('98.5%')).toBeDefined();
      expect(screen.getByText('4 Wins')).toBeDefined();
      expect(screen.getByText(/L5/)).toBeDefined();
    });
  });

  it('renders error state gracefully when cloud fetch rejects', async () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentUser: { uid: 'user-123' },
      loading: false,
    });

    (ApiService.getLeaderboardFromCloud as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Firestore permission or network error')
    );

    render(<LeaderboardPage user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load Cloud Firestore leaderboard standings/i)).toBeDefined();
      expect(screen.getByText(/Retry Fetch/i)).toBeDefined();
    });
  });

  it('re-fetches leaderboard data when user race stats update', async () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentUser: { uid: 'user-123' },
      loading: false,
    });

    (ApiService.getLeaderboardFromCloud as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        rank: 1,
        userId: 'user-123',
        username: 'AuthenticatedDriver',
        avatar: '🏎️',
        level: 5,
        title: 'Street Racer',
        bestWpm: 92,
        avgAccuracy: 98.5,
        totalWins: 4,
        totalRaces: 10,
        xp: 1200,
        equippedCarId: 'car-apex-racer',
      },
    ]);

    const { rerender } = render(<LeaderboardPage user={mockUser} />);

    await waitFor(() => {
      expect(ApiService.getLeaderboardFromCloud).toHaveBeenCalledTimes(1);
    });

    // Rerender with updated user stats after completing a new race
    const updatedUser: User = {
      ...mockUser,
      totalRaces: 11,
      bestWpm: 98,
      xp: 1450,
    };

    rerender(<LeaderboardPage user={updatedUser} />);

    await waitFor(() => {
      expect(ApiService.getLeaderboardFromCloud).toHaveBeenCalledTimes(2);
    });
  });
});
