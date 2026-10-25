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

  React.useEffect(() => {
    if (user.equippedCarId) {
      setSelectedCarId(user.equippedCarId);
    }
  }, [user.equippedCarId]);

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
    onLaunchRace(selectedMode, selectedDifficulty, passageToUse, user.equippedCarId);
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

      {/* Active Equipped Car (Automatically Bounded from Garage) */}
      {(() => {
        const equippedCar = CAR_MODELS.find((c) => c.id === (user.equippedCarId || 'car-apex-racer')) || CAR_MODELS[0];
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border border-slate-700"
                style={{ backgroundColor: equippedCar.bodyColor + '30' }}
              >
                🏎️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Active Vehicle
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {equippedCar.speedClass} Class
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-white mt-1">{equippedCar.name}</h3>
                <p className="text-xs text-slate-400">
                  Top Speed: <strong className="text-rose-400">{equippedCar.topSpeedMph} MPH</strong> &bull; Acceleration: <strong className="text-cyan-400">{equippedCar.accelerationStat}%</strong>
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-right">
              <p className="font-medium">Equipped from Garage</p>
              <p className="text-[11px] text-slate-500">Races automatically use your equipped vehicle.</p>
            </div>
          </div>
        );
      })()}

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
