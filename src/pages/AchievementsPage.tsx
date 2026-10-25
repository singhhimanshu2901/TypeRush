import React from 'react';
import { User, Achievement } from '../types';
import { ApiService } from '../services/api';
import { Shield, Trophy, Zap, CheckCircle2, Lock } from 'lucide-react';

interface AchievementsPageProps {
  user: User;
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ user }) => {
  const achievements = ApiService.getAchievements();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-rose-500" /> DRIVER ACHIEVEMENTS
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Unlocked {unlockedCount} of {achievements.length} Milestones
        </p>
      </div>

      {/* Achievement Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`bg-slate-900 border rounded-3xl p-6 space-y-4 transition-all shadow-xl ${
              ach.unlocked
                ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20'
                : 'border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                ach.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {ach.unlocked ? '🏆' : '🔒'}
              </div>

              <span className="font-extrabold text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                +{ach.rewardXp} XP
              </span>
            </div>

            <div>
              <h3 className="font-black text-lg text-white">{ach.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Progress</span>
                <span className={ach.unlocked ? 'text-emerald-400' : 'text-slate-400'}>
                  {ach.unlocked ? '100% Complete' : `${ach.progress}%`}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    ach.unlocked ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${ach.unlocked ? 100 : ach.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
