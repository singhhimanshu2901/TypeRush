import React, { useState } from 'react';
import { User, CarModel } from '../types';
import { CAR_MODELS } from '../data/cars';
import { ApiService } from '../services/api';
import { CarGraphic } from '../components/CarGraphic';
import { Zap, CheckCircle, Lock, Sparkles, Gauge, Flame, ShieldCheck, Compass, Eye, ChevronRight, Grid } from 'lucide-react';

interface GaragePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => Promise<void> | void;
}

export const GaragePage: React.FC<GaragePageProps> = ({ user, onUserUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showComparisonView, setShowComparisonView] = useState<boolean>(false);
  
  // Find currently equipped car or fallback
  const initialCar = CAR_MODELS.find((c) => c.id === user.equippedCarId) || CAR_MODELS[0];
  const [previewCar, setPreviewCar] = useState<CarModel>(initialCar);
  const [isEquipping, setIsEquipping] = useState<boolean>(false);

  const categories = [
    { label: 'All Vehicles', value: 'All' },
    { label: 'Rugged SUVs', value: 'SUV' },
    { label: 'Luxury Sedans', value: 'Luxury' },
    { label: 'Sports Cars', value: 'Sports' },
    { label: 'Supercars', value: 'Supercar' },
    { label: 'Hypercars & Legendary', value: 'Hypercar' },
  ];

  const filteredCars = CAR_MODELS.filter(
    (car) => selectedCategory === 'All' || car.category === selectedCategory
  );

  const isExplicitlyUnlocked = user.unlockedCars.includes(previewCar.id);
  const meetsRequirements = user.level >= previewCar.unlockLevel && user.xp >= previewCar.priceXp;
  const isPreviewUnlocked = isExplicitlyUnlocked || meetsRequirements;
  const isPreviewEquipped = user.equippedCarId === previewCar.id;

  const handleEquipCar = async (carId: string) => {
    const targetCar = CAR_MODELS.find((c) => c.id === carId);
    if (!targetCar) return;

    const isUnlocked =
      user.unlockedCars.includes(carId) ||
      (user.level >= targetCar.unlockLevel && user.xp >= targetCar.priceXp);

    if (!isUnlocked) return;

    try {
      setIsEquipping(true);
      const newUnlockedCars = user.unlockedCars.includes(carId)
        ? user.unlockedCars
        : [...user.unlockedCars, carId];

      const updated = await ApiService.updateUserProfile({
        equippedCarId: carId,
        unlockedCars: newUnlockedCars,
      });

      await onUserUpdate(updated);
    } catch (err) {
      console.error('Failed to equip vehicle:', err);
    } finally {
      setIsEquipping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Title & Comparison View Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center md:justify-start gap-3 tracking-tight">
            <Zap className="w-8 h-8 text-amber-400 fill-amber-400/20 animate-pulse" />
            TYPERUSH SHOWROOM & GARAGE
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            25 distinct vehicle-specific designs with custom geometry, multi-layer shading, and unique silhouettes.
          </p>
        </div>

        {/* Silhouette Comparison View Toggle */}
        <button
          onClick={() => setShowComparisonView(!showComparisonView)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
            showComparisonView
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <Grid className="w-4 h-4 text-amber-400" />
          {showComparisonView ? 'Exit Comparison Mode' : 'Compare All 25 Silhouettes'}
        </button>
      </div>

      {/* ALL 25 SILHOUETTES COMPARISON GRID (DEVELOPMENT & INSPECTION VIEW) */}
      {showComparisonView && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white">ALL 25 VEHICLES SILHOUETTE COMPARISON</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Rendered at 1:1 Scale Baseline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CAR_MODELS.map((car, index) => (
              <div
                key={car.id}
                onClick={() => {
                  setPreviewCar(car);
                  setShowComparisonView(false);
                }}
                className={`bg-slate-950 border rounded-2xl p-3 space-y-2 hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between ${
                  previewCar.id === car.id ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="text-amber-400">#{index + 1}</span>
                  <span className="uppercase text-slate-300">{car.category}</span>
                </div>

                <div className="h-24 bg-slate-900/60 rounded-xl flex items-center justify-center p-1 border border-slate-800/80">
                  <CarGraphic car={car} size="sm" />
                </div>

                <div className="text-center">
                  <h4 className="text-xs font-black text-white truncate">{car.name}</h4>
                  <span className="text-[10px] text-slate-400 block font-mono">{car.topSpeedMph} MPH</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CENTRAL SHOWROOM TURNTABLE STAGE */}
      {!showComparisonView && (
        <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Stage Lighting / Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Car Specs & Details */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  {previewCar.category} Category
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    previewCar.speedClass === 'Mythic'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : previewCar.speedClass === 'Legendary'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : previewCar.speedClass === 'Hyper'
                      ? 'bg-rose-500/20 text-rose-300'
                      : previewCar.speedClass === 'Pro'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {previewCar.speedClass} Class
                </span>
              </div>

              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">{previewCar.name}</h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                  {previewCar.description}
                </p>
              </div>

              {/* Performance Stat Bars */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-rose-400" /> Top Speed</span>
                    <span className="text-rose-400 font-mono font-black">{previewCar.topSpeedMph} MPH</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (previewCar.topSpeedMph / 280) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-cyan-400" /> Acceleration</span>
                    <span className="text-cyan-400 font-mono font-black">{previewCar.accelerationStat}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-500"
                      style={{ width: `${previewCar.accelerationStat}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Handling</span>
                    <span className="text-emerald-400 font-mono font-black">{previewCar.handlingStat}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${previewCar.handlingStat}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action CTA */}
              <div>
                {isPreviewEquipped ? (
                  <div className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 shadow-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Currently Equipped Vehicle
                  </div>
                ) : isPreviewUnlocked ? (
                  <button
                    disabled={isEquipping}
                    onClick={() => handleEquipCar(previewCar.id)}
                    className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" /> Equip {previewCar.name}
                  </button>
                ) : (
                  <div className="w-full py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" /> Unlocks at Level {previewCar.unlockLevel} &bull; {previewCar.priceXp} XP Required
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Luminous Stage Display */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[240px] sm:min-h-[300px]">
              {/* Luminous Glowing Pedestal Floor */}
              <div
                className="absolute bottom-4 w-72 sm:w-96 h-16 rounded-full blur-2xl opacity-70 transition-all duration-700"
                style={{ backgroundColor: previewCar.neonGlowColor || previewCar.bodyColor }}
              />
              <div className="absolute bottom-6 w-64 sm:w-80 h-10 rounded-full border-2 border-slate-700/50 bg-slate-950/80 shadow-2xl flex items-center justify-center">
                <div
                  className="w-full h-full rounded-full opacity-35 animate-pulse"
                  style={{ backgroundColor: previewCar.bodyColor }}
                />
              </div>

              {/* Vehicle Vector Render */}
              <div className="relative z-10 transition-transform duration-500 hover:scale-105 filter drop-shadow-[0_18px_18px_rgba(0,0,0,0.85)]">
                <CarGraphic car={previewCar} size="xl" />
              </div>

              <span className="relative z-10 mt-6 text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Multi-Layer Vector Geometry Engine
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY TABS */}
      {!showComparisonView && (
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ALL VEHICLES SHOWROOM GRID */}
      {!showComparisonView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => {
            const isUnlocked =
              user.unlockedCars.includes(car.id) ||
              (user.level >= car.unlockLevel && user.xp >= car.priceXp);
            const isEquipped = user.equippedCarId === car.id;
            const isSelectedForPreview = previewCar.id === car.id;

            return (
              <div
                key={car.id}
                onClick={() => setPreviewCar(car)}
                className={`bg-slate-900 border rounded-3xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-xl cursor-pointer group ${
                  isSelectedForPreview
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-slate-900'
                    : isEquipped
                    ? 'border-emerald-500/60 bg-slate-900/90'
                    : isUnlocked
                    ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    : 'border-slate-900 opacity-60 bg-slate-950'
                }`}
              >
                <div className="space-y-3">
                  {/* Header Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                      {car.category}
                    </span>

                    {isEquipped ? (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-md">
                        <CheckCircle className="w-3 h-3" /> EQUIPPED
                      </span>
                    ) : !isUnlocked ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> L{car.unlockLevel} &bull; {car.priceXp} XP
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> UNLOCKED
                      </span>
                    )}
                  </div>

                  {/* Car Vector Box */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl h-36 flex items-center justify-center relative overflow-hidden group-hover:border-slate-700 transition-colors">
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      <CarGraphic car={car} size="md" />
                    </div>
                    <div
                      className="absolute inset-x-0 bottom-0 h-1"
                      style={{ backgroundColor: car.bodyColor }}
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-white group-hover:text-rose-400 transition-colors">
                      {car.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {car.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Top Speed</span>
                      <span className="text-rose-400 font-black font-mono">{car.topSpeedMph} MPH</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Accel / Handle</span>
                      <span className="text-cyan-400 font-black font-mono">{car.accelerationStat} / {car.handlingStat}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Preview CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewCar(car);
                    if (isUnlocked && !isEquipped) {
                      handleEquipCar(car.id);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isEquipped
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : isUnlocked
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  {isEquipped ? 'Equipped' : isUnlocked ? 'Equip Vehicle' : 'Inspect Requirements'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
