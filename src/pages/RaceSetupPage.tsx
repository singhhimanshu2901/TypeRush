import React, { useState } from 'react';
import { User, RaceMode, Difficulty, Passage } from '../types';
import { PASSAGES } from '../data/passages';
import { CAR_MODELS } from '../data/cars';
import { Car, Play, Users, Bot, Target, Shield, Gauge, Zap } from 'lucide-react';

interface RaceSetupPageProps {
  user: User;
  onLaunchRace: (mode: RaceMode, difficulty: Difficulty, passage: Passage, carId: string) => void;
  onNavigateToMultiplayer: () => void;
}

export const RaceSetupPage: React.FC<RaceSetupPageProps> = ({ user, onLaunchRace, onNavigateToMultiplayer }) => {
  const [selectedMode, setSelectedMode] = useState<RaceMode>('ai');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('intermediate');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCarId, setSelectedCarId] = useState<string>(user.equippedCarId);

  // Filter passages based on difficulty and category
  const filteredPassages = PASSAGES.filter((p) => {
    const diffMatch = p.difficulty === selectedDifficulty;
    const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
    return diffMatch && catMatch;
  });

  const [selectedPassage, setSelectedPassage] = useState<Passage>(filteredPassages[0] || PASSAGES[0]);

  const modes: { id: RaceMode; title: string; desc: string; icon: any }[] = [
    { id: 'ai', title: 'AI Racing Mode', desc: 'Race against 3 AI-controlled cars with adaptive speed profiles.', icon: Bot },
    { id: 'solo', title: 'Solo Practice', desc: 'Type at your own pace with detailed WPM and error telemetry.', icon: Target },
    { id: 'multiplayer', title: 'Multiplayer Lobby', desc: 'Create or join online race rooms with real drivers.', icon: Users },
    { id: 'challenge', title: 'Practice Challenge', desc: 'Special high-accuracy mission track with XP multipliers.', icon: Shield },
  ];

  const difficulties: { id: Difficulty; title: string; expWpm: string }[] = [
    { id: 'beginner', title: 'Beginner', expWpm: '20 - 40 WPM' },
    { id: 'intermediate', title: 'Intermediate', expWpm: '40 - 70 WPM' },
    { id: 'advanced', title: 'Advanced', expWpm: '70 - 95 WPM' },
    { id: 'expert', title: 'Expert', expWpm: '100+ WPM' },
  ];

  const handleStart = () => {
    if (selectedMode === 'multiplayer') {
      onNavigateToMultiplayer();
      return;
    }
    const passageToUse = selectedPassage || filteredPassages[0] || PASSAGES[0];
    onLaunchRace(selectedMode, selectedDifficulty, passageToUse, selectedCarId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Car className="w-8 h-8 text-rose-500" /> RACE SETUP ARENA
        </h1>
        <p className="text-slate-400 text-sm font-medium">Configure your race parameters and select your vehicle.</p>
      </div>

      {/* Step 1: Select Game Mode */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>1.</span> SELECT GAME MODE
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-3 rounded-xl w-fit mb-3 ${isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-white">{m.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Difficulty */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>2.</span> SELECT TRACK DIFFICULTY
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {difficulties.map((d) => {
            const isSelected = selectedDifficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDifficulty(d.id);
                  const newFiltered = PASSAGES.filter((p) => p.difficulty === d.id);
                  if (newFiltered.length) setSelectedPassage(newFiltered[0]);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 border-rose-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-extrabold text-sm text-white">{d.title}</div>
                <div className="text-[11px] font-medium opacity-80 mt-1">{d.expWpm}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Select Passage Text */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>3.</span> SELECT TYPING PASSAGE
          </h2>
          <div className="flex gap-2">
            {['All', 'Tech', 'Racing', 'Quotes', 'Code', 'Literature'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedCategory === cat ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPassages.map((p) => {
            const isSelected = selectedPassage?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPassage(p)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-rose-500 ring-2 ring-rose-500/20 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">{p.title}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {p.category} &bull; {p.wordCount} Words
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 italic">"{p.text}"</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Choose Car Model */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>4.</span> CHOOSE YOUR RACING CAR
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CAR_MODELS.map((car) => {
            const isUnlocked = user.unlockedCars.includes(car.id);
            const isSelected = selectedCarId === car.id;
            return (
              <button
                key={car.id}
                disabled={!isUnlocked}
                onClick={() => setSelectedCarId(car.id)}
                className={`p-4 rounded-2xl border text-center transition-all relative ${
                  !isUnlocked
                    ? 'opacity-40 bg-slate-950 border-slate-900 cursor-not-allowed'
                    : isSelected
                    ? 'bg-slate-900 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">🏎️</div>
                <div className="font-bold text-xs text-white">{car.name}</div>
                <div className="text-[10px] font-semibold text-rose-400 mt-1">{car.topSpeedMph} MPH Top</div>
                {!isUnlocked && (
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-2 inline-block">
                    Unlocks L{car.unlockLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Launch Race CTA */}
      <div className="pt-4 text-center">
        <button
          onClick={handleStart}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-black text-lg px-12 py-5 rounded-2xl shadow-xl shadow-rose-600/30 hover:scale-105 transition-all"
        >
          <Play className="w-6 h-6 fill-white" /> START RACE NOW
        </button>
      </div>
    </div>
  );
};
