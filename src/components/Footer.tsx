import React from 'react';
import { Keyboard, Flag, Shield, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏎️</span>
          <span className="font-bold text-slate-200">TypeRush</span>
          <span className="text-slate-600">|</span>
          <span>Gamified Typing & Racing Platform</span>
        </div>

        <div className="flex items-center gap-6 text-slate-500">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-rose-500" />
            <span>Standard WPM Formula: (Chars / 5) / Min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-amber-500" />
            <span>Realtime AI & Multiplayer Racing</span>
          </div>
        </div>

        <p className="text-slate-600 text-[11px]">
          &copy; {new Date().getFullYear()} TypeRush Arena. Built for competitive typists.
        </p>
      </div>
    </footer>
  );
};
