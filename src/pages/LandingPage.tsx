import React, { useState } from 'react';
import { User } from '../types';
import { Play, Gauge, Trophy, Zap, ShieldCheck, Flame, Users, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';

interface LandingPageProps {
  user: User;
  onStartRace: () => void;
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, onStartRace, onNavigate }) => {
  const [demoInput, setDemoInput] = useState('');
  const demoText = 'Type fast to power your race car across the finish line!';
  const leaderboard = ApiService.getLeaderboard().slice(0, 3);

  // Calculate live WPM for mini demo
  const isDemoComplete = demoInput === demoText;
  const demoCorrect = demoInput.split('').filter((c, i) => c === demoText[i]).length;
  const demoProgress = Math.round((demoInput.length / demoText.length) * 100);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 md:p-14 text-center shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest shadow-inner">
            <Flame className="w-4 h-4 fill-rose-500 text-rose-500 animate-bounce" /> Next-Gen Gamified Typing Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
            TYPE FAST. <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">RACE HARD.</span> WIN THE TRACK.
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Transform boring typing drills into high-octane car racing. Your typing speed and accuracy power your car against AI drivers and real opponents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartRace}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
            >
              <Play className="w-5 h-5 fill-white" /> START RACING NOW
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base px-6 py-4 rounded-2xl transition-all"
            >
              <span>Driver Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Mini Demo Widget */}
        <div className="mt-12 max-w-2xl mx-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-left shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Try Quick Test</span>
            <span className="text-rose-400">{demoProgress}% Complete</span>
          </div>

          {/* Mini Track */}
          <div className="bg-slate-900 h-12 rounded-xl relative overflow-hidden border border-slate-800 flex items-center px-4">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose-500/20 to-rose-500/40 border-r-2 border-rose-500 transition-all duration-300"
              style={{ width: `${demoProgress}%` }}
            />
            <div
              className="absolute transition-all duration-200 text-xl"
              style={{ left: `calc(${Math.min(92, demoProgress)}%)` }}
            >
              🏎️
            </div>
            <div className="absolute right-3 text-xs font-bold text-slate-500">FINISH 🏁</div>
          </div>

          <div className="font-mono text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-300">
            {demoText}
          </div>

          <input
            type="text"
            value={demoInput}
            onChange={(e) => setDemoInput(e.target.value.substring(0, demoText.length))}
            placeholder="Type the text above here..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 text-white font-mono text-sm rounded-xl px-4 py-3 outline-none transition-all"
          />

          {isDemoComplete && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-between">
              <span>🎉 Excellent job! You are ready for real track competition.</span>
              <button onClick={onStartRace} className="underline hover:text-emerald-300">
                Launch Race →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xl">
            ⚡
          </div>
          <h3 className="font-extrabold text-lg text-white">Interactive 2D Racing Track</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Watch your car accelerate, drift, and activate nitro trails in real time as your typing speed increases.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl">
            🤖
          </div>
          <h3 className="font-extrabold text-lg text-white">Smart AI Opponents</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Compete against difficulty-tuned AI profiles or challenge other drivers in real-time online multiplayer.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl">
            🏆
          </div>
          <h3 className="font-extrabold text-lg text-white">Garage & XP Leveling</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Earn XP, unlock high-speed sports cars, custom color paint jobs, titles, and claim daily streak rewards.
          </p>
        </div>
      </section>

      {/* Top Drivers Showcase */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> TOP DRIVERS HALL OF FAME
            </h2>
            <p className="text-slate-400 text-sm">Real-time leaderboard leaders across all race modes.</p>
          </div>
          <button
            onClick={() => onNavigate('leaderboard')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 underline"
          >
            View Full Standings →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.map((driver) => (
            <div
              key={driver.userId}
              className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center gap-4"
            >
              <UserAvatar
                avatar={driver.avatar}
                alt={driver.username}
                className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                textClassName="text-2xl"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{driver.username}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    #{driver.rank}
                  </span>
                </div>
                <div className="text-xs font-extrabold text-rose-400">{driver.bestWpm} WPM Record</div>
                <div className="text-[11px] text-slate-500">{driver.totalWins} Wins</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
