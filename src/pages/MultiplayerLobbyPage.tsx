import React, { useState, useEffect } from 'react';
import { User, MultiplayerRoom, Passage, RaceMode, Difficulty } from '../types';
import { Users, Plus, ArrowRight, CheckCircle2, Play, LogOut, RefreshCw } from 'lucide-react';

interface MultiplayerLobbyPageProps {
  user: User;
  onStartMultiplayerRace: (mode: RaceMode, difficulty: Difficulty, passage: Passage, carId: string) => void;
}

export const MultiplayerLobbyPage: React.FC<MultiplayerLobbyPageProps> = ({ user, onStartMultiplayerRace }) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll room updates every 2 seconds when in an active room
  useEffect(() => {
    if (!activeRoom) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/multiplayer/rooms/${activeRoom.roomCode}`);
        if (res.ok) {
          const updatedRoom = await res.json();
          setActiveRoom(updatedRoom);
        }
      } catch {
        // Keep current active room state if network poll drops
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRoom]);

  const handleCreateRoom = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/multiplayer/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUsername: user.username }),
      });
      if (res.ok) {
        const room = await res.json();
        setActiveRoom(room);
      } else {
        throw new Error('Failed to create room on server');
      }
    } catch {
      // Offline fallback
      setActiveRoom({
        id: 'RUSH1',
        roomCode: 'RUSH1',
        hostId: user.username,
        passage: {
          id: 'int-1',
          title: 'Full Throttle Coding',
          text: 'Modern software engineering demands clear logical thinking coupled with rapid typing speed.',
          difficulty: 'intermediate',
          category: 'Code',
          wordCount: 16,
          charCount: 105,
        },
        difficulty: 'intermediate',
        players: [
          {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            carId: user.equippedCarId,
            isReady: true,
            progress: 0,
            wpm: 0,
          },
          {
            id: 'bot-peer',
            username: 'TurboSpeedster',
            avatar: '⚡',
            carId: 'car-neon-viper',
            isReady: true,
            progress: 0,
            wpm: 0,
          },
        ],
        status: 'waiting',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/multiplayer/rooms/${roomCodeInput.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      if (res.ok) {
        const room = await res.json();
        setActiveRoom(room);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || 'Room not found or full');
      }
    } catch {
      // Mock join fallback
      setActiveRoom({
        id: roomCodeInput.toUpperCase(),
        roomCode: roomCodeInput.toUpperCase(),
        hostId: 'TrackMaster',
        passage: {
          id: 'int-2',
          title: 'Formula One Aerodynamics',
          text: 'In high performance racing, downforce pushes tires firmly against the asphalt.',
          difficulty: 'intermediate',
          category: 'Racing',
          wordCount: 12,
          charCount: 82,
        },
        difficulty: 'intermediate',
        players: [
          {
            id: 'host',
            username: 'TrackMaster',
            avatar: '🏎️',
            carId: 'car-apex-racer',
            isReady: true,
            progress: 0,
            wpm: 0,
          },
          {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            carId: user.equippedCarId,
            isReady: true,
            progress: 0,
            wpm: 0,
          },
        ],
        status: 'waiting',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setRoomCodeInput('');
  };

  const handleLaunchMultiplayer = () => {
    if (!activeRoom) return;
    onStartMultiplayerRace('multiplayer', activeRoom.difficulty, activeRoom.passage, user.equippedCarId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-rose-500" /> MULTIPLAYER RACING LOBBY
        </h1>
        <p className="text-slate-400 text-sm font-medium">Race head-to-head in synchronized online lobbies.</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold text-center">
          {errorMessage}
        </div>
      )}

      {!activeRoom ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl font-bold">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="font-extrabold text-xl text-white">Create New Race Room</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a unique room code and invite fellow typists to join your custom race session.
            </p>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-600/30 transition-all"
            >
              {loading ? 'Creating...' : 'CREATE ROOM'}
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl font-bold">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h2 className="font-extrabold text-xl text-white">Join Existing Lobby</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter an existing 5-character room code to join an active race lobby.
            </p>

            <input
              type="text"
              placeholder="ENTER ROOM CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-white font-mono font-bold text-center text-lg rounded-2xl p-3 outline-none uppercase"
            />

            <button
              onClick={handleJoinRoom}
              disabled={loading || !roomCodeInput.trim()}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl transition-all"
            >
              JOIN ROOM
            </button>
          </div>
        </div>
      ) : (
        /* Active Room View */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">ROOM CODE</span>
              <div className="text-3xl font-black text-rose-500 tracking-wider font-mono">{activeRoom.roomCode}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase">PASSAGE</span>
              <div className="text-sm font-bold text-white">{activeRoom.passage.title}</div>
            </div>
          </div>

          {/* Joined Players */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                DRIVERS IN LOBBY ({activeRoom.players.length}/4)
              </h3>
              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Live Polling Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeRoom.players.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <div className="font-bold text-sm text-white">{p.username}</div>
                      <div className="text-[10px] text-slate-500">Ready to Race</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handleLeaveRoom}
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Leave Lobby
            </button>

            <button
              onClick={handleLaunchMultiplayer}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-base px-10 py-4 rounded-2xl shadow-xl shadow-rose-600/30 transition-all"
            >
              <Play className="w-5 h-5 fill-white" /> START MULTIPLAYER RACE NOW
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
