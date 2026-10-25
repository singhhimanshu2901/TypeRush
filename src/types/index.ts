export type RaceMode = 'solo' | 'ai' | 'multiplayer' | 'challenge';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastRaceDate: string | null;
  totalRaces: number;
  totalWins: number;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
  equippedCarId: string;
  unlockedCars: string[];
  unlockedBadges: string[];
  title: string;
}

export interface Passage {
  id: string;
  title: string;
  text: string;
  difficulty: Difficulty;
  category: 'Tech' | 'Quotes' | 'Racing' | 'Code' | 'Literature';
  wordCount: number;
  charCount: number;
}

export interface RaceResult {
  id: string;
  userId: string;
  username: string;
  mode: RaceMode;
  difficulty: Difficulty;
  passageId: string;
  passageTitle: string;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  durationSeconds: number;
  correctChars: number;
  incorrectChars: number;
  backspaces: number;
  finishPosition: number;
  totalParticipants: number;
  xpEarned: number;
  date: string;
}

export interface CarModel {
  id: string;
  name: string;
  speedClass: 'Standard' | 'Pro' | 'Hyper' | 'Legendary';
  priceXp: number;
  unlockLevel: number;
  bodyColor: string;
  stripeColor: string;
  accentColor: string;
  description: string;
  topSpeedMph: number;
  accelerationStat: number;
  handlingStat: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'speed' | 'accuracy' | 'wins' | 'streak' | 'races';
  targetValue: number;
  rewardXp: number;
  iconName: string;
  progress: number;
  unlocked: boolean;
  dateUnlocked?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  title: string;
  bestWpm: number;
  avgAccuracy: number;
  totalWins: number;
  totalRaces: number;
  xp: number;
  equippedCarId: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  currentProgress: number;
  rewardXp: number;
  completed: boolean;
}

export interface AIRacer {
  id: string;
  name: string;
  avatar: string;
  carId: string;
  targetWpm: number;
  variance: number; // random speed shifts
  color: string;
  currentProgress: number; // 0 to 1
  currentWpm: number;
  position: number;
}

export interface MultiplayerRoom {
  id: string;
  roomCode: string;
  hostId: string;
  passage: Passage;
  difficulty: Difficulty;
  players: {
    id: string;
    username: string;
    avatar: string;
    carId: string;
    isReady: boolean;
    progress: number;
    wpm: number;
    finishPosition?: number;
  }[];
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  startTime?: number;
}
