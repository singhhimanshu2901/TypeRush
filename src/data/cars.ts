import { CarModel } from '../types';

export const CAR_MODELS: CarModel[] = [
  {
    id: 'car-apex-racer',
    name: 'Apex Striker',
    speedClass: 'Standard',
    priceXp: 0,
    unlockLevel: 1,
    bodyColor: '#ef4444', // Red
    stripeColor: '#ffffff',
    accentColor: '#f59e0b',
    description: 'A nimble starter sports coupe equipped with responsive handling and balanced speed curves.',
    topSpeedMph: 120,
    accelerationStat: 70,
    handlingStat: 85,
  },
  {
    id: 'car-neon-viper',
    name: 'Neon Viper GT',
    speedClass: 'Pro',
    priceXp: 500,
    unlockLevel: 3,
    bodyColor: '#06b6d4', // Cyan
    stripeColor: '#a855f7', // Purple
    accentColor: '#38bdf8',
    description: 'Electric supercar featuring high-voltage neon trails and rapid acceleration out of tight turns.',
    topSpeedMph: 145,
    accelerationStat: 88,
    handlingStat: 80,
  },
  {
    id: 'car-cyber-speedster',
    name: 'Cyber Speedster',
    speedClass: 'Pro',
    priceXp: 1200,
    unlockLevel: 5,
    bodyColor: '#10b981', // Emerald
    stripeColor: '#facc15', // Yellow
    accentColor: '#34d399',
    description: 'Aerodynamic futuristic racer crafted with lightweight carbon composite and twin turbo boosters.',
    topSpeedMph: 160,
    accelerationStat: 92,
    handlingStat: 82,
  },
  {
    id: 'car-phantom-gt',
    name: 'Phantom Stealth GT',
    speedClass: 'Hyper',
    priceXp: 2500,
    unlockLevel: 8,
    bodyColor: '#6366f1', // Indigo
    stripeColor: '#ec4899', // Pink
    accentColor: '#818cf8',
    description: 'Stealth-coated hypercar designed for ultra-high typing speed performance with minimal drag.',
    topSpeedMph: 185,
    accelerationStat: 95,
    handlingStat: 90,
  },
  {
    id: 'car-formula-type1',
    name: 'Formula Type-1',
    speedClass: 'Legendary',
    priceXp: 5000,
    unlockLevel: 12,
    bodyColor: '#f59e0b', // Gold / Amber
    stripeColor: '#000000',
    accentColor: '#ef4444',
    description: 'The pinnacle of racing engineering. Unlocks top-tier speed visual effects and golden exhaust sparks.',
    topSpeedMph: 220,
    accelerationStat: 99,
    handlingStat: 95,
  },
];
