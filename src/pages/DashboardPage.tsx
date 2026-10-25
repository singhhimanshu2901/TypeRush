import React from 'react';
import { User, RaceResult } from '../types';
import { Play, Gauge, Trophy, Flame, Target, Shield, ArrowUpRight, Award, Zap } from 'lucide-react';
import { WpmChart } from '../components/WpmChart';
import { ApiService } from '../services/api';

interface DashboardPageProps {
  user: User;
  onStartRace: () => void;
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onStartRace, onNavigate }) => {
  const races = ApiService.getRaces();
  const challenges = ApiService.getDailyChallenges();

  const winRate = user.totalRaces > 0 ? Math.round((user.totalWins / user.totalRaces) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
              {user.avatar}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white">{user.username}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-extrabold text-xs border border-rose-500/20">
                {user.title}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Driver Level {user.level} &bull; {user.xp} Total XP
            </p>
          </div>
        </div>

        <button
          onClick={onStartRace}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
        >
          <Play className="w-5 h-5 fill-white" /> LAUNCH RACE
        </button>
      </div>

      {/* Driver Telemetry Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Best WPM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">BEST SPEED</span>
            <Gauge className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-white">{user.bestWpm} <span className="text-xs font-semibold text-slate-400">WPM</span></div>
          <div className="text-[11px] text-slate-500 font-medium">Avg WPM: {user.avgWpm}</div>
        </div>

        {/* Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">ACCURACY</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">{user.avgAccuracy}%</div>
          <div className="text-[11px] text-slate-500 font-medium">Precision Rating</div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">RACE WINS</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{user.totalWins}</div>
          <div className="text-[11px] text-slate-500 font-medium">{winRate}% Win Rate ({user.totalRaces} Races)</div>
        </div>

        {/* Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">DAILY STREAK</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-white">{user.currentStreak} <span className="text-xs font-semibold text-slate-400">Days</span></div>
          <div className="text-[11px] text-slate-500 font-medium">Longest: {user.longestStreak} days</div>
        </div>
      </div>

      {/* Main Charts & Challenges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WPM Chart (Takes 2 cols) */}
        <div className="lg:col-span-2">
          <WpmChart races={races} />
        </div>

        {/* Daily Challenges Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Daily Missions
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Resets Daily</span>
          </div>

          <div className="space-y-3">
            {challenges.map((ch) => (
              <div
                key={ch.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{ch.title}</span>
                  <span className="font-bold text-rose-400">+{ch.rewardXp} XP</span>
                </div>
                <p className="text-[11px] text-slate-400">{ch.description}</p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-amber-400 h-full transition-all"
                    style={{ width: `${Math.min(100, (ch.currentProgress / ch.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Race Telemetry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-200 tracking-wide">Recent Track Telemetry</h3>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 underline"
          >
            View Full History →
          </button>
        </div>

        {races.length === 0 ? (
          <p className="text-slate-500 text-sm">No recent race telemetry. Launch your first race now!</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Passage</th>
                  <th className="py-3 px-4">Net WPM</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Finish Pos</th>
                  <th className="py-3 px-4">XP Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
                {races.slice(0, 5).map((race) => (
                  <tr key={race.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 uppercase text-xs font-bold text-slate-400">{race.mode}</td>
                    <td className="py-3 px-4">{race.passageTitle}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{race.netWpm} WPM</td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{race.accuracy}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                        race.finishPosition === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{race.finishPosition}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">+{race.xpEarned} XP</td>
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
