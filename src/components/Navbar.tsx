import React, { useState } from 'react';
import { User } from '../types';
import { Trophy, Flame, Zap, Gauge, Car, Shield, User as UserIcon, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, setActiveTab }) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const activeUser = userProfile || user;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'setup', label: 'Race', icon: Car },
    { id: 'garage', label: 'Garage', icon: Zap },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'achievements', label: 'Achievements', icon: Shield },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const xpCurrentLevel = activeUser.xp % 500;
  const xpPercent = Math.min(100, Math.round((xpCurrentLevel / 500) * 100));

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
              🏎️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-wider text-white">TYPE</span>
                <span className="font-black text-xl tracking-wider text-rose-500">RUSH</span>
              </div>
              <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                Racing Typing Arena
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Driver Badge & Auth Button */}
          <div className="flex items-center gap-3">
            {/* Streak Flame */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs shadow-inner">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{activeUser.currentStreak}d Streak</span>
            </div>

            {/* Google Sign-In Trigger or Profile Badge */}
            {!currentUser ? (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-2xl transition-all text-left"
              >
                <div className="relative">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-9 h-9 rounded-xl border border-rose-500 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                      {activeUser.avatar}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-extrabold text-[9px] px-1 rounded-md border border-slate-900">
                    L{activeUser.level}
                  </span>
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-200">{activeUser.username}</span>
                    <span className="text-[10px] font-semibold text-rose-400">{activeUser.bestWpm} WPM</span>
                  </div>
                  <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-400 h-full transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav drawer */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar border-t border-slate-800/60 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};
