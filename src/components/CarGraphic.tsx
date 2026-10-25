import React from 'react';
import { CarModel } from '../types';

interface CarGraphicProps {
  car: CarModel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGlow?: boolean;
}

export const CarGraphic: React.FC<CarGraphicProps> = ({
  car,
  size = 'md',
  className = '',
  showGlow = true,
}) => {
  const dimensions = {
    sm: { width: 110, height: 48 },
    md: { width: 160, height: 70 },
    lg: { width: 220, height: 95 },
  }[size];

  const {
    bodyColor,
    stripeColor,
    accentColor,
    headlightColor = '#fef08a',
    neonGlowColor = bodyColor,
    bodyType,
    wingStyle,
    wheelStyle,
    speedClass,
  } = car;

  // Body Silhouette Paths based on bodyType
  const getBodyPath = () => {
    switch (bodyType) {
      case 'hatchback':
        return 'M 15 48 L 45 42 L 70 22 L 120 22 L 140 48 Z';
      case 'sedan':
        return 'M 15 48 L 48 40 L 68 24 L 105 24 L 125 40 L 145 40 L 145 48 Z';
      case 'coupe':
        return 'M 15 48 L 50 38 L 74 20 L 130 40 L 145 48 Z';
      case 'muscle':
        return 'M 10 48 L 12 36 L 55 36 L 75 18 L 115 18 L 148 48 Z';
      case 'sports':
        return 'M 10 48 L 46 32 L 72 18 L 120 22 L 150 48 Z';
      case 'supercar':
        return 'M 5 48 L 42 28 L 70 16 L 115 20 L 152 48 Z';
      case 'hypercar':
        return 'M 5 48 L 40 26 L 68 14 L 110 16 L 155 48 Z';
      case 'formula':
        return 'M 2 48 L 18 42 L 45 38 L 65 18 L 80 24 L 95 12 L 118 28 L 152 48 Z';
      case 'cyberpunk':
        return 'M 5 48 L 35 32 L 60 18 L 110 18 L 140 32 L 155 48 Z';
      case 'jet':
        return 'M 2 44 L 40 30 L 70 12 L 110 20 L 158 44 Z';
      default:
        return 'M 15 48 L 48 38 L 74 20 L 130 40 L 145 48 Z';
    }
  };

  // Canopy Glass Path based on bodyType
  const getCanopyPath = () => {
    switch (bodyType) {
      case 'hatchback':
        return 'M 50 40 L 72 24 L 115 24 L 122 40 Z';
      case 'sedan':
        return 'M 50 38 L 69 26 L 102 26 L 120 38 Z';
      case 'coupe':
        return 'M 52 36 L 74 22 L 118 32 L 124 38 Z';
      case 'muscle':
        return 'M 58 34 L 76 20 L 110 20 L 122 34 Z';
      case 'sports':
        return 'M 48 30 L 72 20 L 112 24 L 125 32 Z';
      case 'supercar':
        return 'M 44 26 L 70 18 L 108 20 L 128 30 Z';
      case 'hypercar':
        return 'M 42 24 L 68 16 L 106 18 L 132 28 Z';
      case 'formula':
        return 'M 65 20 L 78 24 L 75 32 L 62 30 Z'; // Open cockpit driver helmet cutout
      case 'cyberpunk':
        return 'M 38 30 L 62 20 L 106 20 L 136 30 Z';
      case 'jet':
        return 'M 42 28 L 70 14 L 102 22 L 112 30 Z';
      default:
        return 'M 52 36 L 74 22 L 118 32 L 124 38 Z';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 160 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Neon Underglow Filter */}
          <filter id={`neon-glow-${car.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Body Gradient */}
          <linearGradient id={`body-grad-${car.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bodyColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Canopy Tint */}
          <linearGradient id={`canopy-grad-${car.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 1. NEON UNDERGLOW */}
        {showGlow && (
          <ellipse
            cx="80"
            cy="52"
            rx="65"
            ry="8"
            fill={neonGlowColor}
            opacity="0.5"
            filter={`url(#neon-glow-${car.id})`}
          />
        )}

        {/* 2. BODY SHADOW */}
        <ellipse cx="80" cy="53" rx="68" ry="6" fill="#020617" opacity="0.6" />

        {/* 3. REAR EXHAUST JET FLAME (for Jet & Cyberpunk & Mythic/Legendary) */}
        {(bodyType === 'jet' || speedClass === 'Mythic' || speedClass === 'Legendary') && (
          <path
            d="M 152 42 Q 165 44 152 46 Q 160 44 152 42 Z"
            fill={accentColor}
            className="animate-pulse"
          />
        )}

        {/* 4. MAIN CAR BODY */}
        <path d={getBodyPath()} fill={`url(#body-grad-${car.id})`} stroke="#020617" strokeWidth="1.5" />

        {/* 5. RACING STRIPE */}
        <path
          d={
            bodyType === 'formula'
              ? 'M 2 48 L 152 48 L 118 28 L 18 42 Z'
              : 'M 10 48 Q 80 28 150 48'
          }
          stroke={stripeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* 6. COCKPIT / CANOPY GLASS */}
        <path d={getCanopyPath()} fill={`url(#canopy-grad-${car.id})`} stroke={accentColor} strokeWidth="1" />

        {/* 7. HEADLIGHTS & TAILLIGHTS */}
        {/* Headlight Front Glow */}
        <ellipse cx="12" cy="42" rx="3" ry="2" fill={headlightColor} />
        {/* Taillight Red Glow */}
        <ellipse cx="148" cy="42" rx="2.5" ry="2" fill="#ef4444" />

        {/* 8. REAR WINGS / SPOILERS */}
        {wingStyle === 'ducktail' && (
          <path d="M 135 38 L 148 30 L 148 40 Z" fill={accentColor} />
        )}
        {wingStyle === 'spoiler' && (
          <path d="M 130 32 L 148 32 L 148 35 L 132 35 Z M 134 35 L 134 40 M 144 35 L 144 40" stroke="#020617" strokeWidth="2" fill={accentColor} />
        )}
        {wingStyle === 'high_wing' && (
          <g>
            <path d="M 125 24 L 150 24 L 152 27 L 125 27 Z" fill="#020617" stroke={accentColor} strokeWidth="1" />
            <line x1="130" y1="27" x2="132" y2="42" stroke="#020617" strokeWidth="2.5" />
            <line x1="145" y1="27" x2="145" y2="42" stroke="#020617" strokeWidth="2.5" />
          </g>
        )}
        {wingStyle === 'carbon_blade' && (
          <g>
            <path d="M 120 20 L 152 20 L 154 23 L 122 23 Z" fill="#0f172a" stroke={stripeColor} strokeWidth="1" />
            <path d="M 152 16 L 154 26 L 151 26 Z" fill={accentColor} />
            <line x1="132" y1="23" x2="134" y2="40" stroke="#020617" strokeWidth="2" />
          </g>
        )}
        {wingStyle === 'active_aero' && (
          <g>
            <path d="M 118 18 L 154 18 L 152 22 L 120 22 Z" fill={accentColor} />
            <path d="M 122 23 L 150 23 L 148 26 L 124 26 Z" fill="#020617" />
            <line x1="128" y1="26" x2="130" y2="40" stroke="#020617" strokeWidth="2" />
          </g>
        )}
        {wingStyle === 'f1_wing' && (
          <g>
            <path d="M 115 14 L 156 14 L 154 18 L 118 18 Z" fill="#f59e0b" stroke="#020617" strokeWidth="1" />
            <path d="M 118 19 L 152 19 L 150 22 L 120 22 Z" fill="#020617" />
            <rect x="150" y="10" width="5" height="18" fill="#ef4444" rx="1" />
            <line x1="130" y1="22" x2="132" y2="42" stroke="#020617" strokeWidth="3" />
          </g>
        )}
        {wingStyle === 'plasma_wings' && (
          <g>
            <path d="M 110 12 L 158 12 L 152 18 L 115 18 Z" fill={neonGlowColor} opacity="0.9" />
            <path d="M 115 18 L 150 18 L 146 22 L 120 22 Z" fill={accentColor} />
            <circle cx="154" cy="15" r="3" fill="#ffffff" className="animate-ping" />
          </g>
        )}

        {/* 9. WHEELS & RIMS */}
        {/* Front Wheel */}
        <g>
          <circle cx="38" cy="48" r="10" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          {wheelStyle === 'steel' && <circle cx="38" cy="48" r="5" fill="#475569" />}
          {wheelStyle === 'alloy' && <circle cx="38" cy="48" r="6" fill="#cbd5e1" stroke="#020617" strokeWidth="1" />}
          {wheelStyle === 'spoke' && (
            <g>
              <circle cx="38" cy="48" r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="38" y1="42" x2="38" y2="54" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="32" y1="48" x2="44" y2="48" stroke="#cbd5e1" strokeWidth="1" />
            </g>
          )}
          {wheelStyle === 'deep_dish' && (
            <circle cx="38" cy="48" r="7" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
          )}
          {wheelStyle === 'neon_ring' && (
            <circle cx="38" cy="48" r="7" fill="#020617" stroke={neonGlowColor} strokeWidth="2.5" />
          )}
          {wheelStyle === 'gold_bbs' && (
            <circle cx="38" cy="48" r="7" fill="#f59e0b" stroke="#020617" strokeWidth="1" />
          )}
          {wheelStyle === 'plasma_disc' && (
            <g>
              <circle cx="38" cy="48" r="7.5" fill="#38bdf8" opacity="0.9" />
              <circle cx="38" cy="48" r="3" fill="#ffffff" />
            </g>
          )}
        </g>

        {/* Rear Wheel */}
        <g>
          <circle cx="122" cy="48" r="10" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          {wheelStyle === 'steel' && <circle cx="122" cy="48" r="5" fill="#475569" />}
          {wheelStyle === 'alloy' && <circle cx="122" cy="48" r="6" fill="#cbd5e1" stroke="#020617" strokeWidth="1" />}
          {wheelStyle === 'spoke' && (
            <g>
              <circle cx="122" cy="48" r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="122" y1="42" x2="122" y2="54" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="116" y1="48" x2="128" y2="48" stroke="#cbd5e1" strokeWidth="1" />
            </g>
          )}
          {wheelStyle === 'deep_dish' && (
            <circle cx="122" cy="48" r="7" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
          )}
          {wheelStyle === 'neon_ring' && (
            <circle cx="122" cy="48" r="7" fill="#020617" stroke={neonGlowColor} strokeWidth="2.5" />
          )}
          {wheelStyle === 'gold_bbs' && (
            <circle cx="122" cy="48" r="7" fill="#f59e0b" stroke="#020617" strokeWidth="1" />
          )}
          {wheelStyle === 'plasma_disc' && (
            <g>
              <circle cx="122" cy="48" r="7.5" fill="#38bdf8" opacity="0.9" />
              <circle cx="122" cy="48" r="3" fill="#ffffff" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
