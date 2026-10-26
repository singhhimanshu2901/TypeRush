import React, { useEffect } from 'react';
import { User, RaceResult } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Gauge, Target, RotateCcw, ArrowRight, Zap, Award, Flame, ShieldAlert } from 'lucide-react';

interface ResultPageProps {
  user: User;
  result: RaceResult;
  onRetry: () => void;
  onNavigate: (tab: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ user, result, onRetry, onNavigate }) => {
  useEffect(() => {
    if (result.finishPosition === 1) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  const isWinner = result.finishPosition === 1;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Victory Header Banner */}
      <div className={`p-8 rounded-3xl border text-center relative overflow-hidden shadow-2xl ${
        isWinner
          ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/40'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="text-6xl mb-3">{isWinner ? '🏆' : '🏁'}</div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          {isWinner ? 'FIRST PLACE VICTORY!' : `RACE COMPLETED: POSITION #${result.finishPosition}`}
        </h1>

        <p className="text-slate-400 font-medium text-sm mt-2">
          {result.passageTitle} &bull; {result.mode.toUpperCase()} MODE
        </p>

        {/* XP Earned Pill */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-sm">
          <Zap className="w-4 h-4 fill-emerald-400" /> +{result.xpEarned} XP GAINED
        </div>

        {/* Sync Error Warning if Cloud persistence failed */}
        {result.syncError && (
          <div className="mt-4 max-w-md mx-auto p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-semibold flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Saved locally. Cloud synchronization pending (offline/network issue).</span>
          </div>
        )}
      </div>

      {/* Race Telemetry Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Net WPM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NET SPEED</div>
          <div className="text-3xl font-black text-rose-500">{result.netWpm}</div>
          <div className="text-[10px] text-slate-500">Gross: {result.grossWpm} WPM</div>
        </div>

        {/* Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACCURACY</div>
          <div className="text-3xl font-black text-cyan-400">{result.accuracy}%</div>
          <div className="text-[10px] text-slate-500">{result.incorrectChars} Errors</div>
        </div>

        {/* Duration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TIME ELAPSED</div>
          <div className="text-3xl font-black text-slate-200">{result.durationSeconds}s</div>
          <div className="text-[10px] text-slate-500">{result.backspaces} Backspaces</div>
        </div>

        {/* Finish Rank */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">FINISH RANK</div>
          <div className="text-3xl font-black text-amber-400">#{result.finishPosition}</div>
          <div className="text-[10px] text-slate-500">of {result.totalParticipants} Drivers</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={onRetry}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
        >
          <RotateCcw className="w-5 h-5" /> RACE AGAIN
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base px-6 py-4 rounded-2xl transition-all"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
