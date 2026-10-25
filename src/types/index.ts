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

export type CarCategory = 'SUV' | 'Luxury' | 'Sports' | 'Supercar' | 'Hypercar';

export interface CarGeometry {
  bodyLength: number;         // 130 - 165
  bodyHeight: number;         // 18 - 42
  groundClearance: number;    // 0 - 12
  hoodLength: number;         // 15 - 55
  cabinPosition: 'front' | 'mid' | 'rear';
  cabinLength: number;        // 35 - 70
  cabinHeight: number;        // 14 - 28
  windshieldAngle: 'steep' | 'medium' | 'sloped' | 'ultra_sloped' | 'bubble';
  roofline: 'boxy' | 'curved' | 'fastback' | 'canopy' | 'teardrop' | 'limo' | 'extreme_wedge';
  fenderStyle: 'flared' | 'squared' | 'exposed' | 'streamlined' | 'widebody';
  headlightStyle: 'vertical_led' | 'quad_projector' | 'laser_strip' | 'pop_up' | 'dual_halo' | 'split_matrix' | 'f1_pod';
  grilleStyle: 'vertical_chrome' | 'mesh_hex' | 'open_air' | 'enclosed_ev' | 'dual_kidney' | 'shark_nose' | 'none';
  frontBumperStyle: 'rugged_skid' | 'splitter' | 'canards' | 'sport_lip' | 'aero_scoop';
  sideIntakeStyle: 'none' | 'gill' | 'massive_scoop' | 'tunnel' | 'air_curtain';
  rearDiffuserStyle: 'none' | 'dual_fins' | 'carbon_race' | 'tunnel_venturi';
  spoilerStyle: 'none' | 'ducktail' | 'spoiler' | 'high_wing' | 'carbon_blade' | 'active_aero' | 'f1_wing' | 'plasma_wings' | 'roof_rack' | 'dorsal_fin' | 'buttress';
  roofAccessories: 'none' | 'light_bar' | 'roof_rack' | 'dorsal_fin' | 'roof_scoop' | 'panoramic_glass';
  wheelStyle: 'steel' | 'alloy' | 'spoke' | 'deep_dish' | 'neon_ring' | 'gold_bbs' | 'plasma_disc' | 'offroad_chunky' | 'aerodisc';
  frontWheelSize: number;     // 8 - 12.5
  rearWheelSize: number;      // 8.5 - 14
  wheelbase: number;          // 76 - 98
  frontOverhang: number;      // 15 - 32
  rearOverhang: number;       // 15 - 35
  paintFinish: 'metallic' | 'matte' | 'gloss' | 'dual_tone' | 'carbon_weave' | 'pearl';
  windowTint: 'blackout' | 'bronze' | 'cyan_laser' | 'silver_reflection' | 'clear';
}

export interface CarModel {
  id: string;
  name: string;
  category: CarCategory;
  speedClass: 'Standard' | 'Pro' | 'Hyper' | 'Legendary' | 'Mythic';
  priceXp: number;
  unlockLevel: number;
  bodyColor: string;
  stripeColor: string;
  accentColor: string;
  headlightColor?: string;
  neonGlowColor?: string;
  description: string;
  topSpeedMph: number;
  accelerationStat: number;
  handlingStat: number;
  geometry: CarGeometry;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'speed' | 'accuracy' | 'wins' | 'streak' | 'races' | 'consistency' | 'challenges' | 'legendary';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  targetValue: number;
  rewardXp: number;
  iconName: string;
  progress: number;
  unlocked: boolean;
  dateUnlocked?: string;
  minCharsRequired?: number;
  minWpmRequired?: number;
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
