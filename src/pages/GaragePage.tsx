import React from 'react';
import { User, CarModel } from '../types';
import { CAR_MODELS } from '../data/cars';
import { ApiService } from '../services/api';
import { Zap, Gauge, Shield, CheckCircle, Lock } from 'lucide-react';

interface GaragePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const GaragePage: React.FC<GaragePageProps> = ({ user, onUserUpdate }) => {
  const handleEquipCar = (carId: string) => {
    const updated = ApiService.updateUser({ equippedCarId: carId });
    onUserUpdate(updated);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-amber-400" /> DRIVER'S GARAGE
        </h1>
        <p className="text-slate-400 text-sm font-medium">Customize and equip your high-performance racing vehicles.</p>
      </div>

      {/* Car Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CAR_MODELS.map((car) => {
          const isUnlocked = user.unlockedCars.includes(car.id);
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
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 uppercase">
                    {car.speedClass} Class
                  </span>
                  {isEquipped ? (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-md">
                      <CheckCircle className="w-3.5 h-3.5" /> EQUIPPED
                    </span>
                  ) : !isUnlocked ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Unlocks L{car.unlockLevel}
                    </span>
                  ) : null}
                </div>

                {/* Car Preview Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl h-36 flex items-center justify-center relative overflow-hidden">
                  <div className="text-6xl animate-pulse">🏎️</div>
                  <div
                    className="absolute inset-x-0 bottom-0 h-1"
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
                      className="bg-rose-500 h-full"
                      style={{ width: `${(car.topSpeedMph / 220) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between font-bold text-slate-400 pt-1">
                    <span>Acceleration</span>
                    <span className="text-cyan-400">{car.accelerationStat}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full"
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
                    Reach Level {car.unlockLevel} to Unlock
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
