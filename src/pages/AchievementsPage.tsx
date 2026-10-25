import React, { useState } from 'react';
import { User, Achievement } from '../types';
import { ApiService } from '../services/api';
import { Shield, Trophy, Award, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface AchievementsPageProps {
  user: User;
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');

  const achievements = ApiService.getAchievements();

  const categories = [
    { id: 'all', label: 'All Badges' },
    { id: 'speed', label: 'Typing Speed' },
    { id: 'accuracy', label: 'Accuracy' },
    { id: 'races', label: 'Races' },
    { id: 'wins', label: 'Wins & Streaks' },
    { id: 'consistency', label: 'Consistency' },
    { id: 'streak', label: 'Daily Streaks' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'legendary', label: 'Legendary' },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const filteredAchievements = achievements.filter((ach) => {
    const matchesCategory = selectedCategory === 'all' || ach.category === selectedCategory;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unlocked' && ach.unlocked) ||
      (activeTab === 'locked' && !ach.unlocked);
    return matchesCategory && matchesTab;
  });

  const getRarityBadge = (rarity?: string) => {
    switch (rarity) {
      case 'Mythic':
        return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 font-extrabold shadow-sm';
      case 'Legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Rare':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Uncommon':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-rose-500" /> DRIVER ACHIEVEMENTS & MILESTONES
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Unlocked <strong className="text-emerald-400">{unlockedCount}</strong> of{' '}
          <strong className="text-white">{achievements.length}</strong> Badges across 8 Categories
        </p>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        {/* Status Tab (All / Unlocked / Locked) */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'unlocked'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            onClick={() => setActiveTab('locked')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'locked'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Locked ({achievements.length - unlockedCount})
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-rose-400 border border-rose-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((ach) => (
          <div
            key={ach.id}
            className={`bg-slate-900 border rounded-3xl p-6 space-y-4 transition-all shadow-xl flex flex-col justify-between ${
              ach.unlocked
                ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20 ring-1 ring-emerald-500/20'
                : 'border-slate-800/80 opacity-80 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${getRarityBadge(
                    ach.rarity
                  )}`}
                >
                  {ach.rarity || 'Common'}
                </span>

                <span className="font-black text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> +{ach.rewardXp} XP
                </span>
              </div>

              <div className="flex items-start gap-4 pt-1">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                    ach.unlocked ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-600 border border-slate-800'
                  }`}
                >
                  {ach.unlocked ? '🏆' : '🔒'}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-base text-white truncate">{ach.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{ach.description}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Status</span>
                <span className={ach.unlocked ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
                  {ach.unlocked ? 'Unlocked' : `${ach.progress}%`}
                </span>
              </div>

              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    ach.unlocked ? 'bg-emerald-500' : 'bg-rose-500/80'
                  }`}
                  style={{ width: `${ach.unlocked ? 100 : ach.progress}%` }}
                />
              </div>

              {ach.unlocked && ach.dateUnlocked && (
                <p className="text-[10px] text-slate-500 text-right pt-0.5 font-medium">
                  Unlocked on {new Date(ach.dateUnlocked).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
