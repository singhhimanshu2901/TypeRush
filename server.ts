import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { PASSAGES } from './src/data/passages';
import { db } from './src/server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple In-Memory Rate Limiter Middleware
const requestCounts: Record<string, { count: number; resetTime: number }> = {};

const rateLimiter = (maxRequests: number, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!requestCounts[ip] || now > requestCounts[ip].resetTime) {
      requestCounts[ip] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    requestCounts[ip].count += 1;
    if (requestCounts[ip].count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
  };
};

// Periodic Room Cleanup (Every 5 Minutes)
setInterval(() => {
  db.cleanupStaleRooms();
}, 5 * 60 * 1000);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), db: 'persistent' });
});

app.get('/api/passages', (req, res) => {
  const { difficulty } = req.query;
  if (difficulty && typeof difficulty === 'string') {
    const filtered = PASSAGES.filter((p) => p.difficulty === difficulty);
    return res.json(filtered.length ? filtered : PASSAGES);
  }
  res.json(PASSAGES);
});

// Verified Race Submission & Database Recording Endpoint
app.post('/api/races/submit', rateLimiter(20, 60000), async (req, res) => {
  try {
    const {
      userId,
      username,
      mode,
      difficulty,
      passageId,
      passageTitle,
      totalChars,
      correctChars,
      incorrectChars,
      backspaces,
      durationSeconds,
      finishPosition,
      totalParticipants,
    } = req.body;

    if (!userId || typeof totalChars !== 'number' || typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      return res.status(400).json({ error: 'Invalid or missing race parameters' });
    }

    // Bounds check to prevent absurd fraud (e.g. 500 WPM or 0.1 second race)
    if (durationSeconds < 2 || totalChars > 2000) {
      return res.status(422).json({ error: 'Race metrics failed integrity verification' });
    }

    const minutes = durationSeconds / 60;
    const grossWpm = Math.round((totalChars / 5) / minutes);
    const netWpm = Math.max(0, Math.round(((correctChars - incorrectChars) / 5) / minutes));
    const accuracy = totalChars > 0 ? Math.min(100, Math.max(0, Math.round(((correctChars / totalChars) * 100) * 10) / 10)) : 100;

    let baseXP = netWpm * 2.5;
    if (accuracy >= 98) baseXP += 60;
    else if (accuracy >= 95) baseXP += 30;

    if (finishPosition === 1) baseXP += 120;
    else if (finishPosition === 2) baseXP += 60;
    else if (finishPosition === 3) baseXP += 30;

    const diffMult = difficulty === 'expert' ? 1.5 : difficulty === 'advanced' ? 1.2 : 1.0;
    const xpEarned = Math.round(baseXP * diffMult);

    const raceRecord = {
      id: `race-${Date.now()}`,
      userId,
      username: username || 'Driver',
      mode: mode || 'ai',
      difficulty: difficulty || 'intermediate',
      passageId: passageId || 'beg-1',
      passageTitle: passageTitle || 'Race Passage',
      grossWpm,
      netWpm,
      accuracy,
      durationSeconds,
      correctChars,
      incorrectChars,
      backspaces: backspaces || 0,
      finishPosition: finishPosition || 1,
      totalParticipants: totalParticipants || 4,
      xpEarned,
      date: new Date().toISOString(),
    };

    await db.addRaceResult(raceRecord);

    // Update user stats in DB
    const currentUser = db.getUser(userId) || {
      id: userId,
      username: username || 'Driver',
      email: `${userId}@typerush.app`,
      avatar: '🏎️',
      level: 1,
      xp: 0,
      currentStreak: 1,
      longestStreak: 1,
      totalRaces: 0,
      totalWins: 0,
      avgWpm: netWpm,
      bestWpm: netWpm,
      avgAccuracy: accuracy,
      equippedCarId: 'car-apex-racer',
      unlockedCars: ['car-apex-racer'],
      unlockedBadges: [],
      title: 'Rookie Driver',
    };

    const userRaces = db.getRacesForUser(userId);
    const totalRaces = userRaces.length;
    const wins = userRaces.filter((r) => r.finishPosition === 1).length;
    const avgWpm = Math.round(userRaces.reduce((acc, r) => acc + r.netWpm, 0) / totalRaces);
    const bestWpm = Math.max(currentUser.bestWpm || 0, netWpm);
    const avgAcc = Math.round((userRaces.reduce((acc, r) => acc + r.accuracy, 0) / totalRaces) * 10) / 10;

    const newXp = (currentUser.xp || 0) + xpEarned;
    const newLevel = Math.floor(newXp / 500) + 1;

    const updatedUser = await db.saveUser({
      ...currentUser,
      xp: newXp,
      level: newLevel,
      totalRaces,
      totalWins: wins,
      avgWpm,
      bestWpm,
      avgAccuracy: avgAcc,
    });

    res.json({
      success: true,
      raceRecord,
      updatedUser,
    });
  } catch (err) {
    console.error('Error submitting race result:', err);
    res.status(500).json({ error: 'Server error processing race result' });
  }
});

// Persistent User Profile Sync Endpoint
app.post('/api/user/sync', rateLimiter(30, 60000), async (req, res) => {
  const { user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'Invalid user payload' });
  }

  const saved = await db.saveUser(user);
  res.json({ success: true, user: saved });
});

app.get('/api/user/:userId', (req, res) => {
  const user = db.getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Leaderboard Endpoint from Persistent DB
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = db.getLeaderboard();
  res.json(leaderboard);
});

// Persistent Multiplayer Room Operations
app.post('/api/multiplayer/rooms', rateLimiter(10, 60000), async (req, res) => {
  const { hostUsername, difficulty = 'intermediate' } = req.body;
  const sanitizedUsername = typeof hostUsername === 'string' && hostUsername.trim() ? hostUsername.trim().substring(0, 20) : 'Driver';
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  const filteredPassages = PASSAGES.filter((p) => p.difficulty === difficulty);
  const passage = filteredPassages[Math.floor(Math.random() * filteredPassages.length)] || PASSAGES[0];

  const room = {
    id: roomCode,
    roomCode,
    hostId: sanitizedUsername,
    passage,
    difficulty,
    players: [
      {
        id: sanitizedUsername,
        username: sanitizedUsername,
        avatar: '🏎️',
        carId: 'car-apex-racer',
        isReady: true,
        progress: 0,
        wpm: 0,
      },
    ],
    status: 'waiting',
    createdAt: new Date().toISOString(),
  };

  await db.saveRoom(room);
  res.json(room);
});

app.get('/api/multiplayer/rooms/:roomCode', (req, res) => {
  const room = db.getRoom(req.params.roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.post('/api/multiplayer/rooms/:roomCode/join', rateLimiter(20, 60000), async (req, res) => {
  const { username } = req.body;
  const sanitizedUsername = typeof username === 'string' && username.trim() ? username.trim().substring(0, 20) : 'GuestDriver';

  const room = db.getRoom(req.params.roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  if (room.players.length >= 4) {
    return res.status(400).json({ error: 'Room is full' });
  }

  if (!room.players.find((p: any) => p.username === sanitizedUsername)) {
    room.players.push({
      id: sanitizedUsername,
      username: sanitizedUsername,
      avatar: '🔥',
      carId: 'car-neon-viper',
      isReady: true,
      progress: 0,
      wpm: 0,
    });
    await db.saveRoom(room);
  }

  res.json(room);
});

app.post('/api/multiplayer/rooms/:roomCode/progress', async (req, res) => {
  const { username, progress, wpm } = req.body;
  const room = db.getRoom(req.params.roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const player = room.players.find((p: any) => p.username === username);
  if (player) {
    player.progress = Math.min(1.0, Math.max(0, Number(progress) || 0));
    player.wpm = Math.max(0, Number(wpm) || 0);
    await db.saveRoom(room);
  }

  res.json(room);
});

// Production static or Vite Dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[TypeRush Persistent Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
