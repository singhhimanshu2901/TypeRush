import React, { useState } from 'react';
import { User } from '../types';
import { CAR_MODELS } from '../data/cars';
import { ApiService } from '../services/api';
import { CarGraphic } from '../components/CarGraphic';
import { Zap, CheckCircle, Lock, Shield, Sparkles } from 'lucide-react';

interface GaragePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => Promise<void> | void;
}

export const GaragePage: React.FC<GaragePageProps> = ({ user, onUserUpdate }) => {
  const [selectedClass, setSelectedClass] = useState<string>('All');

  const classes = ['All', 'Standard', 'Pro', 'Hyper', 'Legendary', 'Mythic'];

  const filteredCars = CAR_MODELS.filter(
    (car) => selectedClass === 'All' || car.speedClass === selectedClass
  );

  const handleEquipCar = async (carId: string) => {
    const isUnlocked =
      user.unlockedCars.includes(carId) ||
      (user.level >= (CAR_MODELS.find((c) => c.id === carId)?.unlockLevel || 1) &&
        user.xp >= (CAR_MODELS.find((c) => c.id === carId)?.priceXp || 0));

    if (!isUnlocked) return;

    const newUnlockedCars = user.unlockedCars.includes(carId)
      ? user.unlockedCars
      : [...user.unlockedCars, carId];

    const updated = await ApiService.updateUserProfile({
      equippedCarId: carId,
      unlockedCars: newUnlockedCars,
    });

    await onUserUpdate(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-amber-400" /> DRIVER'S GARAGE & SHOWROOM
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Unlock and equip high-performance racing vehicles across 25 distinct models.
        </p>
      </div>

      {/* Class Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {classes.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedClass === cls
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Car Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map((car) => {
          const isExplicitlyUnlocked = user.unlockedCars.includes(car.id);
          const meetsRequirements = user.level >= car.unlockLevel && user.xp >= car.priceXp;
          const isUnlocked = isExplicitlyUnlocked || meetsRequirements;
          const isEquipped = user.equippedCarId === car.id;

          return (
            <div
              key={car.id}
              className={`bg-slate-900 border rounded-3xl p-6 space-y-5 transition-all flex flex-col justify-between shadow-xl ${
                isEquipped
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : isUnlocked
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-900 opacity-60 bg-slate-950'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                      car.speedClass === 'Mythic'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : car.speedClass === 'Legendary'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : car.speedClass === 'Hyper'
                        ? 'bg-rose-500/20 text-rose-300'
                        : car.speedClass === 'Pro'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {car.speedClass} Class
                  </span>
                  {isEquipped ? (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-md">
                      <CheckCircle className="w-3.5 h-3.5" /> EQUIPPED
                    </span>
                  ) : !isUnlocked ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> L{car.unlockLevel} &bull; {car.priceXp} XP
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> UNLOCKED
                    </span>
                  )}
                </div>

                {/* Car Preview Box with SVG Vector Chassis */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl h-36 flex items-center justify-center relative overflow-hidden group">
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <CarGraphic car={car} size="md" />
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 h-1.5"
                    style={{ backgroundColor: car.bodyColor }}
                  />
                </div>

                <div>
                  <h3 className="font-black text-xl text-white">{car.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{car.description}</p>
                </div>

                {/* Car Stats */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Top Speed</span>
                    <span className="text-rose-400">{car.topSpeedMph} MPH</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (car.topSpeedMph / 280) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between font-bold text-slate-400 pt-1">
                    <span>Acceleration</span>
                    <span className="text-cyan-400">{car.accelerationStat}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-500"
                      style={{ width: `${car.accelerationStat}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Equip CTA */}
              <div className="pt-4">
                {isUnlocked ? (
                  <button
                    disabled={isEquipped}
                    onClick={() => handleEquipCar(car.id)}
                    className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                      isEquipped
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                    }`}
                  >
                    {isEquipped ? 'Equipped' : 'Equip Vehicle'}
                  </button>
                ) : (
                  <div className="text-center text-xs font-semibold text-slate-500 py-2">
                    Requires Level {car.unlockLevel} &bull; {car.priceXp} XP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
