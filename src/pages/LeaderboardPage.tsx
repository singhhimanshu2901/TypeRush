import React, { useState, useEffect } from 'react';
import { User, LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, Search, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';

interface LeaderboardPageProps {
  user: User;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ user }) => {
  const [search, setSearch] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(() => ApiService.getLeaderboard());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCloudLeaderboard() {
      setLoading(true);
      const cloudEntries = await ApiService.getLeaderboardFromCloud();
      if (isMounted && cloudEntries.length > 0) {
        setLeaderboardData(cloudEntries);
      }
      setLoading(false);
    }
    loadCloudLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = leaderboardData.filter((entry) =>
    entry.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" /> GLOBAL DRIVERS LEADERBOARD
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <span>Rankings updated live from Cloud Firestore.</span>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">Best Speed</th>
                <th className="py-4 px-6">Accuracy</th>
                <th className="py-4 px-6">Wins</th>
                <th className="py-4 px-6">Level & XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-200">
              {filtered.map((entry) => {
                const isCurrentUser = entry.userId === user.id;
                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      isCurrentUser ? 'bg-rose-500/10 font-bold border-l-4 border-rose-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-4 px-6">
                      {entry.rank === 1 ? (
                        <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-black inline-flex items-center gap-1">
                          <Crown className="w-4 h-4 fill-amber-400" /> #1
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="p-2 rounded-xl bg-slate-300/20 text-slate-200 font-black inline-flex items-center gap-1">
                          <Medal className="w-4 h-4 text-slate-300" /> #2
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="p-2 rounded-xl bg-amber-700/20 text-amber-600 font-black inline-flex items-center gap-1">
                          <Medal className="w-4 h-4 text-amber-600" /> #3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#{entry.rank}</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl">
                          {entry.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{entry.username}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase font-black">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-normal">{entry.title}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-black text-rose-400 text-base">{entry.bestWpm} WPM</td>

                    <td className="py-4 px-6 font-bold text-cyan-400">{entry.avgAccuracy}%</td>

                    <td className="py-4 px-6 font-bold text-slate-300">{entry.totalWins} Wins</td>

                    <td className="py-4 px-6 font-bold text-amber-400">
                      L{entry.level} &bull; {entry.xp} XP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
