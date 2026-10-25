import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'typerush_db.json');

export interface DbSchema {
  users: Record<string, any>;
  races: any[];
  achievements: Record<string, any[]>;
  multiplayerRooms: Record<string, any>;
}

const DEFAULT_DB: DbSchema = {
  users: {
    'usr-1': {
      id: 'usr-1',
      username: 'SpeedRacer',
      email: 'speedracer@typerush.app',
      avatar: '🏎️',
      level: 1,
      xp: 150,
      currentStreak: 1,
      longestStreak: 3,
      lastRaceDate: new Date().toISOString().split('T')[0],
      totalRaces: 2,
      totalWins: 1,
      avgWpm: 48,
      bestWpm: 58,
      avgAccuracy: 96.5,
      equippedCarId: 'car-apex-racer',
      unlockedCars: ['car-apex-racer'],
      unlockedBadges: ['ach-first-race'],
      title: 'Rookie Driver',
      updatedAt: new Date().toISOString(),
    },
  },
  races: [
    {
      id: 'race-init-1',
      userId: 'usr-1',
      username: 'SpeedRacer',
      mode: 'ai',
      difficulty: 'beginner',
      passageId: 'beg-1',
      passageTitle: 'Keyboard Mastery',
      grossWpm: 52,
      netWpm: 48,
      accuracy: 96.2,
      durationSeconds: 32,
      correctChars: 138,
      incorrectChars: 3,
      backspaces: 4,
      finishPosition: 1,
      totalParticipants: 4,
      xpEarned: 150,
      date: new Date().toISOString(),
    },
  ],
  achievements: {},
  multiplayerRooms: {},
};

class FileDatabase {
  private data: DbSchema;

  constructor() {
    this.data = DEFAULT_DB;
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[Database] Loaded persistent data from typerush_db.json');
      } else {
        this.saveSync();
        console.log('[Database] Initialized new persistent typerush_db.json');
      }
    } catch (err) {
      console.warn('[Database] Failed to read db file, initializing default:', err);
      this.data = DEFAULT_DB;
    }
  }

  private async save(): Promise<void> {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, DB_FILE);
    } catch (err) {
      console.error('[Database] Persistent save failed:', err);
    }
  }

  private saveSync(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Persistent saveSync failed:', err);
    }
  }

  // User Operations
  public getUser(userId: string): any | null {
    return this.data.users[userId] || null;
  }

  public async saveUser(user: any): Promise<any> {
    const existing = this.data.users[user.id] || {};
    const updated = {
      ...existing,
      ...user,
      updatedAt: new Date().toISOString(),
    };
    this.data.users[user.id] = updated;
    await this.save();
    return updated;
  }

  // Race Results Operations
  public async addRaceResult(result: any): Promise<void> {
    this.data.races.unshift(result);
    // Keep max 500 recent races
    if (this.data.races.length > 500) {
      this.data.races = this.data.races.slice(0, 500);
    }
    await this.save();
  }

  public getRacesForUser(userId: string): any[] {
    return this.data.races.filter((r) => r.userId === userId);
  }

  public getAllRaces(): any[] {
    return this.data.races;
  }

  // Leaderboard Calculations from Persistent DB
  public getLeaderboard(): any[] {
    const userMap: Record<string, any> = { ...this.data.users };

    const entries = Object.values(userMap).map((u: any) => ({
      userId: u.id,
      username: u.username,
      avatar: u.avatar,
      level: u.level,
      title: u.title,
      bestWpm: u.bestWpm || 0,
      avgAccuracy: u.avgAccuracy || 100,
      totalWins: u.totalWins || 0,
      totalRaces: u.totalRaces || 0,
      xp: u.xp || 0,
      equippedCarId: u.equippedCarId,
    }));

    // Sort by best WPM descending
    entries.sort((a, b) => b.bestWpm - a.bestWpm);

    return entries.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  }

  // Multiplayer Rooms Operations
  public getRoom(roomCode: string): any | null {
    return this.data.multiplayerRooms[roomCode] || null;
  }

  public async saveRoom(room: any): Promise<void> {
    this.data.multiplayerRooms[room.roomCode] = {
      ...room,
      lastActiveAt: new Date().toISOString(),
    };
    await this.save();
  }

  public async cleanupStaleRooms(): Promise<void> {
    const now = Date.now();
    const fifteenMins = 15 * 60 * 1000;

    Object.keys(this.data.multiplayerRooms).forEach((code) => {
      const room = this.data.multiplayerRooms[code];
      const lastActive = new Date(room.lastActiveAt || room.createdAt).getTime();
      if (now - lastActive > fifteenMins) {
        delete this.data.multiplayerRooms[code];
      }
    });

    await this.save();
  }
}

export const db = new FileDatabase();
