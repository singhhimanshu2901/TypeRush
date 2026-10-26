import React, { useState, useEffect, useCallback } from 'react';
import { User, LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, Search, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';

interface LeaderboardPageProps {
  user: User;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ user }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (authLoading) {
      console.log('[RaceDiag] Leaderboard load deferred: auth is still initializing');
      return;
    }

    try {
      if (!currentUser) {
        console.log('[RaceDiag] Leaderboard loading mock data for guest mode');
        setLeaderboardData(ApiService.getMockLeaderboard());
      } else {
        console.log('[RaceDiag] Leaderboard loading cloud data for authenticated user:', currentUser.uid);
        const cloudEntries = await ApiService.getLeaderboardFromCloud();
        setLeaderboardData(cloudEntries);
      }
    } catch (err: unknown) {
      console.error('[RaceDiag] Error loading cloud standings in LeaderboardPage:', err);
      setError(
        err instanceof Error
          ? `Unable to load Cloud Firestore leaderboard standings: ${err.message}`
          : 'Unable to load Cloud Firestore leaderboard standings. Please check your connection and retry.'
      );
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, user.totalRaces, user.bestWpm, user.xp]);

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
          <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
            <span>
              {currentUser
                ? 'Rankings synchronized directly from Cloud Firestore.'
                : 'Guest Driver Mode — Showing Local Demo Standings.'}
            </span>
            {isLoading && <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />}
          </p>
        </div>

        {/* Search Input */}
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

      {/* Error Banner with Retry */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 text-sm font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
          </button>
        </div>
      )}

      {/* Leaderboard Table Container */}
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
              {/* Skeleton Rows during Authentication or Cloud Data Loading */}
              {(isLoading || authLoading) ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="w-8 h-6 bg-slate-800 rounded-lg" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="w-28 h-4 bg-slate-800 rounded" />
                          <div className="w-20 h-3 bg-slate-800/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-16 h-5 bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-12 h-5 bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-14 h-5 bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-20 h-5 bg-slate-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    {search ? 'No driver matching search criteria found.' : 'No leaderboard entries recorded yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
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

                      <td className="py-4 px-6 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            avatar={entry.avatar}
                            alt={entry.username}
                            className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0 overflow-hidden"
                            textClassName="text-xl"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white flex items-center gap-2 min-w-0">
                              <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                                {entry.username}
                              </span>
                              {isCurrentUser && (
                                <span className="shrink-0 text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase font-black">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[180px]">
                              {entry.title}
                            </p>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
