import React, { useState } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';
import { User as UserIcon, Gauge, Trophy, Flame, Edit3, Save } from 'lucide-react';
import { WpmChart } from '../components/WpmChart';

interface ProfilePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);

  const races = ApiService.getRaces();

  const handleSave = () => {
    const updated = ApiService.updateUser({ username, avatar });
    onUserUpdate(updated);
    setIsEditing(false);
  };

  const avatars = ['🏎️', '⚡', '🤖', '🏁', '🔥', '🏆', '🚀', '🕶️'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Driver ID Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-slate-950 border-2 border-rose-500/40 flex items-center justify-center text-5xl shadow-inner">
              {avatar}
            </div>
            {isEditing && (
              <div className="absolute -bottom-2 -right-2 flex gap-1 bg-slate-900 border border-slate-700 p-1 rounded-xl">
                {avatars.slice(0, 4).map((av) => (
                  <button key={av} onClick={() => setAvatar(av)} className="text-sm hover:scale-125 transition-transform">
                    {av}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-950 border border-rose-500 font-black text-xl text-white px-3 py-1.5 rounded-xl outline-none"
                />
                <button
                  onClick={handleSave}
                  className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white">{user.username}</h1>
                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-rose-400 font-extrabold text-xs uppercase tracking-wider">{user.title}</p>
            <p className="text-slate-400 text-xs font-medium">Driver Level {user.level} &bull; {user.xp} Total XP</p>
          </div>
        </div>
      </div>

      {/* WPM Chart */}
      <WpmChart races={races} />

      {/* Full Race Telemetry History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="font-extrabold text-base text-slate-200">Complete Track History</h3>

        {races.length === 0 ? (
          <p className="text-slate-500 text-sm">No races completed yet.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Passage</th>
                  <th className="py-3 px-4">Net WPM</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
                {races.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 uppercase text-xs font-bold text-slate-400">{r.mode}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{r.passageTitle}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{r.netWpm} WPM</td>
                    <td className="py-3 px-4 font-bold text-cyan-400">{r.accuracy}%</td>
                    <td className="py-3 px-4 font-black text-amber-400">#{r.finishPosition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
