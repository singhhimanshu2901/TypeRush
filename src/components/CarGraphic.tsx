import React from 'react';
import { CarModel } from '../types';

interface CarGraphicProps {
  car: CarModel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    sm: { width: 120, height: 55 },
    md: { width: 180, height: 82 },
    lg: { width: 250, height: 114 },
    xl: { width: 340, height: 155 },
  }[size];

  const {
    id,
    bodyColor,
    stripeColor,
    accentColor,
    headlightColor = '#fef08a',
    neonGlowColor = bodyColor,
    geometry,
    speedClass,
  } = car;

  const {
    bodyLength,
    bodyHeight,
    groundClearance,
    hoodLength,
    cabinPosition,
    cabinLength,
    cabinHeight,
    windshieldAngle,
    roofline,
    fenderStyle,
    headlightStyle,
    grilleStyle,
    frontBumperStyle,
    sideIntakeStyle,
    rearDiffuserStyle,
    spoilerStyle,
    roofAccessories,
    wheelStyle,
    frontWheelSize,
    rearWheelSize,
    wheelbase,
    frontOverhang,
    rearOverhang,
    paintFinish,
    windowTint,
  } = geometry;

  // Geometry Coordinate Mathematics for SVG Canvas (0 0 170 85)
  const groundY = 66;
  const wheelY = groundY - groundClearance;

  const frontWheelX = 12 + frontOverhang;
  const rearWheelX = Math.min(158, frontWheelX + wheelbase);

  // Body Outline Keypoints
  const frontNoseX = Math.max(4, frontWheelX - frontOverhang);
  const frontNoseY = wheelY - bodyHeight * 0.38;

  const hoodEndX = frontNoseX + hoodLength;
  const hoodEndY = wheelY - bodyHeight * 0.48;

  // Windshield angle offset
  const windshieldSlope =
    windshieldAngle === 'steep'
      ? 8
      : windshieldAngle === 'medium'
      ? 14
      : windshieldAngle === 'sloped'
      ? 20
      : windshieldAngle === 'bubble'
      ? 16
      : 28;

  const roofStartX = hoodEndX + windshieldSlope;
  const roofStartY = wheelY - bodyHeight;

  const actualCabinLength = Math.min(
    70,
    cabinLength * (roofline === 'limo' ? 1.25 : roofline === 'teardrop' ? 1.1 : 1.0)
  );

  const roofEndX = roofStartX + actualCabinLength;
  const roofEndY = roofStartY + (roofline === 'fastback' || roofline === 'teardrop' ? 4 : 0);

  const rearDeckX = Math.min(166, roofEndX + (roofline === 'fastback' ? 22 : roofline === 'boxy' ? 6 : 14));
  const rearTailX = Math.min(168, rearWheelX + rearOverhang);
  const rearTailY = wheelY - bodyHeight * 0.42;

  // Generate SVG Body Polygon Path
  const bodyPath = `
    M ${frontNoseX} ${frontNoseY}
    L ${frontNoseX + 4} ${frontNoseY - 4}
    L ${hoodEndX} ${hoodEndY}
    L ${roofStartX} ${roofStartY}
    L ${roofEndX} ${roofEndY}
    L ${rearDeckX} ${roofEndY + (roofline === 'boxy' ? 12 : 18)}
    L ${rearTailX} ${rearTailY}
    L ${rearTailX} ${wheelY}
    L ${rearWheelX + rearWheelSize + 3} ${wheelY}
    A ${rearWheelSize + 3} ${rearWheelSize + 3} 0 0 0 ${rearWheelX - rearWheelSize - 3} ${wheelY}
    L ${frontWheelX + frontWheelSize + 3} ${wheelY}
    A ${frontWheelSize + 3} ${frontWheelSize + 3} 0 0 0 ${frontWheelX - frontWheelSize - 3} ${wheelY}
    L ${frontNoseX} ${wheelY}
    Z
  `;

  // Generate Glass Canopy Path
  const glassPath = `
    M ${hoodEndX + 2} ${hoodEndY - 1}
    L ${roofStartX + 2} ${roofStartY + 2}
    L ${roofEndX - 4} ${roofEndY + 2}
    L ${roofEndX + (roofline === 'fastback' ? 14 : 6)} ${roofEndY + 12}
    Z
  `;

  // Window Tint Color
  const getGlassFill = () => {
    switch (windowTint) {
      case 'cyan_laser':
        return 'url(#glass-cyan)';
      case 'bronze':
        return 'url(#glass-bronze)';
      case 'silver_reflection':
        return 'url(#glass-silver)';
      case 'blackout':
      default:
        return 'url(#glass-blackout)';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 170 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Neon Underglow Filter */}
          <filter id={`neon-glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Body Metallic Paint Gradient */}
          <linearGradient id={`body-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bodyColor} stopOpacity="1" />
            <stop offset="45%" stopColor={bodyColor} stopOpacity="1" />
            <stop offset="70%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={bodyColor} stopOpacity="0.75" />
          </linearGradient>

          {/* Hood Metallic Highlight Strip */}
          <linearGradient id={`hood-highlight-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          {/* Window Tint Gradients */}
          <linearGradient id="glass-blackout" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="glass-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="glass-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="glass-silver" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0.9" />
          </linearGradient>

          {/* Wheel Brake Caliper & Disc Gradient */}
          <radialGradient id="disc-rotors" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* 1. NEON UNDERGLOW */}
        {showGlow && (
          <ellipse
            cx="85"
            cy={groundY + 2}
            rx={bodyLength * 0.46}
            ry="9"
            fill={neonGlowColor}
            opacity="0.65"
            filter={`url(#neon-glow-${id})`}
          />
        )}

        {/* 2. GROUND CONTACT DROP SHADOW */}
        <ellipse cx="85" cy={groundY + 3} rx={bodyLength * 0.48} ry="5" fill="#020617" opacity="0.85" />

        {/* 3. HIGH SPEED EXHAUST FLAME TRAIL (For Mythic & Legendary) */}
        {(speedClass === 'Mythic' || speedClass === 'Legendary') && (
          <g>
            <path
              d={`M ${rearTailX + 2} ${rearTailY + 4} Q ${rearTailX + 18} ${rearTailY + 6} ${rearTailX + 2} ${rearTailY + 8} Z`}
              fill={accentColor}
              className="animate-pulse"
            />
            <circle cx={rearTailX + 12} cy={rearTailY + 6} r="2" fill="#ffffff" className="animate-ping" />
          </g>
        )}

        {/* 4. MAIN CHASSIS BODY SHAPE */}
        <path d={bodyPath} fill={`url(#body-grad-${id})`} stroke="#020617" strokeWidth="1.75" />

        {/* Metallic Upper Body Reflection Line */}
        <path
          d={`M ${frontNoseX + 6} ${frontNoseY - 2} L ${hoodEndX} ${hoodEndY} L ${roofStartX} ${roofStartY} L ${roofEndX} ${roofEndY}`}
          stroke={`url(#hood-highlight-${id})`}
          strokeWidth="2"
          fill="none"
        />

        {/* 5. FENDER FLARES / WHEEL ARCH OVERLAYS */}
        {fenderStyle === 'widebody' && (
          <g>
            <path
              d={`M ${frontWheelX - frontWheelSize - 6} ${wheelY + 2} Q ${frontWheelX} ${wheelY - frontWheelSize - 6} ${frontWheelX + frontWheelSize + 6} ${wheelY + 2}`}
              stroke="#020617"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d={`M ${rearWheelX - rearWheelSize - 6} ${wheelY + 2} Q ${rearWheelX} ${wheelY - rearWheelSize - 6} ${rearWheelX + rearWheelSize + 6} ${wheelY + 2}`}
              stroke="#020617"
              strokeWidth="2.5"
              fill="none"
            />
          </g>
        )}
        {fenderStyle === 'squared' && (
          <g>
            <path
              d={`M ${frontWheelX - frontWheelSize - 5} ${wheelY + 2} L ${frontWheelX - frontWheelSize - 3} ${wheelY - frontWheelSize - 4} L ${frontWheelX + frontWheelSize + 3} ${wheelY - frontWheelSize - 4} L ${frontWheelX + frontWheelSize + 5} ${wheelY + 2}`}
              stroke="#020617"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M ${rearWheelX - rearWheelSize - 5} ${wheelY + 2} L ${rearWheelX - rearWheelSize - 3} ${wheelY - rearWheelSize - 4} L ${rearWheelX + rearWheelSize + 3} ${wheelY - rearWheelSize - 4} L ${rearWheelX + rearWheelSize + 5} ${wheelY + 2}`}
              stroke="#020617"
              strokeWidth="2"
              fill="none"
            />
          </g>
        )}

        {/* 6. COCKPIT CANOPY GLASS & PILLARS */}
        <path d={glassPath} fill={getGlassFill()} stroke={accentColor} strokeWidth="1" />
        {/* B-Pillar Divider Line */}
        <line
          x1={(roofStartX + roofEndX) / 2}
          y1={roofStartY + 2}
          x2={(roofStartX + roofEndX) / 2 + 2}
          y2={hoodEndY + 10}
          stroke="#020617"
          strokeWidth="1.5"
        />

        {/* 7. FRONT GRILLE & FASCIA DETAILS */}
        {grilleStyle === 'vertical_chrome' && (
          <g>
            <rect x={frontNoseX + 2} y={frontNoseY} width="5" height="12" fill="#1e293b" stroke="#cbd5e1" strokeWidth="0.75" rx="1" />
            <line x1={frontNoseX + 4} y1={frontNoseY + 1} x2={frontNoseX + 4} y2={frontNoseY + 11} stroke="#cbd5e1" strokeWidth="1" />
          </g>
        )}
        {grilleStyle === 'dual_kidney' && (
          <g>
            <rect x={frontNoseX + 2} y={frontNoseY} width="4" height="5" fill="#020617" stroke="#38bdf8" strokeWidth="1" rx="1" />
            <rect x={frontNoseX + 2} y={frontNoseY + 6} width="4" height="5" fill="#020617" stroke="#38bdf8" strokeWidth="1" rx="1" />
          </g>
        )}
        {grilleStyle === 'mesh_hex' && (
          <rect x={frontNoseX + 2} y={frontNoseY} width="6" height="10" fill="#020617" stroke="#475569" strokeWidth="1" rx="1" />
        )}
        {grilleStyle === 'enclosed_ev' && (
          <rect x={frontNoseX + 2} y={frontNoseY + 2} width="4" height="8" fill="#0f172a" stroke={accentColor} strokeWidth="1.25" rx="1" />
        )}

        {/* Front Bumper Splitters & Canards */}
        {frontBumperStyle === 'rugged_skid' && (
          <rect x={frontNoseX - 2} y={wheelY - 4} width="8" height="4" fill="#475569" stroke="#020617" strokeWidth="1" rx="1" />
        )}
        {frontBumperStyle === 'splitter' && (
          <path d={`M ${frontNoseX - 4} ${wheelY - 1} L ${frontNoseX + 12} ${wheelY - 1} L ${frontNoseX + 10} ${wheelY + 1} L ${frontNoseX - 4} ${wheelY + 1} Z`} fill="#0f172a" stroke={accentColor} strokeWidth="0.75" />
        )}
        {frontBumperStyle === 'canards' && (
          <path d={`M ${frontNoseX} ${frontNoseY + 4} L ${frontNoseX - 5} ${frontNoseY + 2} L ${frontNoseX - 2} ${frontNoseY + 8} Z`} fill="#020617" />
        )}

        {/* 8. HEADLIGHTS SIGNATURE */}
        {headlightStyle === 'vertical_led' && (
          <rect x={frontNoseX + 2} y={frontNoseY - 2} width="2.5" height="10" fill={headlightColor} rx="1" />
        )}
        {headlightStyle === 'laser_strip' && (
          <rect x={frontNoseX + 2} y={frontNoseY + 2} width="8" height="2" fill={headlightColor} rx="1" />
        )}
        {headlightStyle === 'quad_projector' && (
          <g>
            <circle cx={frontNoseX + 4} cy={frontNoseY + 2} r="1.5" fill={headlightColor} />
            <circle cx={frontNoseX + 8} cy={frontNoseY + 2} r="1.5" fill={headlightColor} />
          </g>
        )}
        {headlightStyle === 'dual_halo' && (
          <g>
            <circle cx={frontNoseX + 4} cy={frontNoseY + 4} r="2.5" fill="#020617" stroke={headlightColor} strokeWidth="1.5" />
          </g>
        )}
        {headlightStyle === 'split_matrix' && (
          <g>
            <rect x={frontNoseX + 3} y={frontNoseY} width="4" height="2" fill={headlightColor} />
            <rect x={frontNoseX + 3} y={frontNoseY + 4} width="4" height="2" fill={headlightColor} />
          </g>
        )}

        {/* Taillights */}
        <rect x={rearTailX - 2} y={rearTailY} width="3" height="8" fill="#ef4444" rx="1" />

        {/* 9. SIDE INTAKES & GILLS */}
        {sideIntakeStyle === 'gill' && (
          <g stroke="#020617" strokeWidth="1">
            <line x1={frontWheelX + 16} y1={wheelY - 12} x2={frontWheelX + 14} y2={wheelY - 4} />
            <line x1={frontWheelX + 20} y1={wheelY - 12} x2={frontWheelX + 18} y2={wheelY - 4} />
            <line x1={frontWheelX + 24} y1={wheelY - 12} x2={frontWheelX + 22} y2={wheelY - 4} />
          </g>
        )}
        {sideIntakeStyle === 'massive_scoop' && (
          <path d={`M ${rearWheelX - 28} ${wheelY - 14} L ${rearWheelX - 12} ${wheelY - 16} L ${rearWheelX - 14} ${wheelY - 4} L ${rearWheelX - 26} ${wheelY - 2} Z`} fill="#020617" stroke={accentColor} strokeWidth="1" />
        )}
        {sideIntakeStyle === 'tunnel' && (
          <path d={`M ${rearWheelX - 32} ${wheelY - 16} L ${rearWheelX - 10} ${wheelY - 18} L ${rearWheelX - 12} ${wheelY - 2} Z`} fill="#090d16" stroke={stripeColor} strokeWidth="1" />
        )}

        {/* 10. ROOF ACCESSORIES */}
        {roofAccessories === 'roof_rack' && (
          <g>
            <rect x={roofStartX + 4} y={roofStartY - 5} width={actualCabinLength - 8} height="3" fill="#1e293b" rx="1" />
            <line x1={roofStartX + 10} y1={roofStartY - 2} x2={roofStartX + 10} y2={roofStartY} stroke="#020617" strokeWidth="2" />
            <line x1={roofEndX - 10} y1={roofStartY - 2} x2={roofEndX - 10} y2={roofStartY} stroke="#020617" strokeWidth="2" />
          </g>
        )}
        {roofAccessories === 'light_bar' && (
          <g>
            <rect x={roofStartX - 2} y={roofStartY - 5} width="16" height="4" fill="#0f172a" rx="1" />
            <circle cx={roofStartX + 1} cy={roofStartY - 3} r="1.2" fill="#fef08a" />
            <circle cx={roofStartX + 6} cy={roofStartY - 3} r="1.2" fill="#fef08a" />
            <circle cx={roofStartX + 11} cy={roofStartY - 3} r="1.2" fill="#fef08a" />
          </g>
        )}
        {roofAccessories === 'dorsal_fin' && (
          <path d={`M ${roofStartX + 20} ${roofStartY - 1} L ${roofEndX + 10} ${roofStartY - 1} L ${roofEndX - 5} ${roofStartY + 8} Z`} fill={accentColor} stroke="#020617" strokeWidth="0.75" />
        )}
        {roofAccessories === 'roof_scoop' && (
          <path d={`M ${roofStartX + 8} ${roofStartY - 4} L ${roofStartX + 22} ${roofStartY - 1} L ${roofStartX + 8} ${roofStartY} Z`} fill="#020617" stroke={accentColor} strokeWidth="1" />
        )}

        {/* 11. REAR SPOILERS & WINGS */}
        {spoilerStyle === 'ducktail' && (
          <path d={`M ${rearDeckX - 4} ${roofEndY + 12} L ${rearTailX} ${roofEndY + 2} L ${rearTailX} ${roofEndY + 12} Z`} fill={accentColor} />
        )}
        {spoilerStyle === 'spoiler' && (
          <g>
            <rect x={rearTailX - 16} y={rearTailY - 8} width="18" height="3" fill={accentColor} stroke="#020617" strokeWidth="0.75" rx="1" />
            <line x1={rearTailX - 12} y1={rearTailY - 5} x2={rearTailX - 12} y2={rearTailY} stroke="#020617" strokeWidth="2" />
            <line x1={rearTailX - 4} y1={rearTailY - 5} x2={rearTailX - 4} y2={rearTailY} stroke="#020617" strokeWidth="2" />
          </g>
        )}
        {spoilerStyle === 'high_wing' && (
          <g>
            <path d={`M ${rearTailX - 22} ${rearTailY - 14} L ${rearTailX + 2} ${rearTailY - 14} L ${rearTailX + 4} ${rearTailY - 11} L ${rearTailX - 22} ${rearTailY - 11} Z`} fill="#0f172a" stroke={accentColor} strokeWidth="1" />
            <line x1={rearTailX - 16} y1={rearTailY - 11} x2={rearTailX - 14} y2={rearTailY} stroke="#020617" strokeWidth="2.5" />
            <line x1={rearTailX - 4} y1={rearTailY - 11} x2={rearTailX - 4} y2={rearTailY} stroke="#020617" strokeWidth="2.5" />
          </g>
        )}
        {spoilerStyle === 'carbon_blade' && (
          <g>
            <path d={`M ${rearTailX - 26} ${rearTailY - 16} L ${rearTailX + 4} ${rearTailY - 16} L ${rearTailX + 6} ${rearTailY - 12} L ${rearTailX - 26} ${rearTailY - 12} Z`} fill="#090d16" stroke={stripeColor} strokeWidth="1" />
            <path d={`M ${rearTailX + 4} ${rearTailY - 20} L ${rearTailX + 6} ${rearTailY - 8} L ${rearTailX + 2} ${rearTailY - 8} Z`} fill={accentColor} />
            <line x1={rearTailX - 14} y1={rearTailY - 12} x2={rearTailX - 12} y2={rearTailY} stroke="#020617" strokeWidth="2.5" />
          </g>
        )}
        {spoilerStyle === 'active_aero' && (
          <g>
            <path d={`M ${rearTailX - 24} ${rearTailY - 18} L ${rearTailX + 4} ${rearTailY - 18} L ${rearTailX + 2} ${rearTailY - 14} L ${rearTailX - 22} ${rearTailY - 14} Z`} fill={accentColor} stroke="#020617" strokeWidth="1" />
            <line x1={rearTailX - 14} y1={rearTailY - 14} x2={rearTailX - 12} y2={rearTailY} stroke="#020617" strokeWidth="2.5" />
          </g>
        )}
        {spoilerStyle === 'plasma_wings' && (
          <g>
            <path d={`M ${rearTailX - 30} ${rearTailY - 22} L ${rearTailX + 6} ${rearTailY - 22} L ${rearTailX + 2} ${rearTailY - 16} L ${rearTailX - 26} ${rearTailY - 16} Z`} fill={neonGlowColor} opacity="0.9" />
            <line x1={rearTailX - 16} y1={rearTailY - 16} x2={rearTailX - 12} y2={rearTailY} stroke="#020617" strokeWidth="3" />
            <circle cx={rearTailX + 4} cy={rearTailY - 19} r="3" fill="#ffffff" className="animate-ping" />
          </g>
        )}
        {spoilerStyle === 'buttress' && (
          <path d={`M ${roofEndX - 10} ${roofEndY + 4} L ${rearTailX - 2} ${rearTailY} L ${rearTailX - 8} ${rearTailY} Z`} fill={accentColor} opacity="0.85" />
        )}

        {/* 12. WHEELS & RIMS (Sized per vehicle geometry) */}
        {/* FRONT WHEEL */}
        <g>
          {/* Outer Tyre */}
          <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize} fill="#090d16" stroke="#1e293b" strokeWidth="2.5" />
          {/* Brake Rotor & Caliper */}
          <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 3} fill="url(#disc-rotors)" />
          <rect x={frontWheelX - frontWheelSize + 3} y={wheelY - 3} width="3" height="6" fill="#ef4444" rx="1" />

          {/* Rim Style Rendering */}
          {wheelStyle === 'offroad_chunky' && (
            <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize} fill="none" stroke="#475569" strokeWidth="3.5" strokeDasharray="4 2" />
          )}
          {wheelStyle === 'steel' && <circle cx={frontWheelX} cy={wheelY} r="4.5" fill="#64748b" stroke="#020617" strokeWidth="1" />}
          {wheelStyle === 'alloy' && (
            <g>
              <circle cx={frontWheelX} cy={wheelY} r="5.5" fill="#cbd5e1" stroke="#020617" strokeWidth="1" />
              <circle cx={frontWheelX} cy={wheelY} r="2" fill="#020617" />
            </g>
          )}
          {wheelStyle === 'spoke' && (
            <g>
              <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 3} fill="#020617" stroke="#38bdf8" strokeWidth="1" />
              <line x1={frontWheelX - frontWheelSize + 4} y1={wheelY} x2={frontWheelX + frontWheelSize - 4} y2={wheelY} stroke="#cbd5e1" strokeWidth="1" />
              <line x1={frontWheelX} y1={wheelY - frontWheelSize + 4} x2={frontWheelX} y2={wheelY + frontWheelSize - 4} stroke="#cbd5e1" strokeWidth="1" />
            </g>
          )}
          {wheelStyle === 'deep_dish' && (
            <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 2} fill="#f8fafc" stroke="#475569" strokeWidth="2.5" />
          )}
          {wheelStyle === 'neon_ring' && (
            <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 2.5} fill="#020617" stroke={neonGlowColor} strokeWidth="2.5" />
          )}
          {wheelStyle === 'gold_bbs' && (
            <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 2.5} fill="#f59e0b" stroke="#020617" strokeWidth="1.5" />
          )}
          {wheelStyle === 'aerodisc' && (
            <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 2} fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
          )}
          {wheelStyle === 'plasma_disc' && (
            <g>
              <circle cx={frontWheelX} cy={wheelY} r={frontWheelSize - 2} fill="#38bdf8" opacity="0.9" />
              <circle cx={frontWheelX} cy={wheelY} r="2.5" fill="#ffffff" />
            </g>
          )}
        </g>

        {/* REAR WHEEL */}
        <g>
          {/* Outer Tyre */}
          <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize} fill="#090d16" stroke="#1e293b" strokeWidth="2.5" />
          {/* Brake Rotor & Caliper */}
          <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 3} fill="url(#disc-rotors)" />
          <rect x={rearWheelX - rearWheelSize + 3} y={wheelY - 3} width="3" height="6" fill="#ef4444" rx="1" />

          {/* Rim Style Rendering */}
          {wheelStyle === 'offroad_chunky' && (
            <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize} fill="none" stroke="#475569" strokeWidth="3.5" strokeDasharray="4 2" />
          )}
          {wheelStyle === 'steel' && <circle cx={rearWheelX} cy={wheelY} r="4.5" fill="#64748b" stroke="#020617" strokeWidth="1" />}
          {wheelStyle === 'alloy' && (
            <g>
              <circle cx={rearWheelX} cy={wheelY} r="5.5" fill="#cbd5e1" stroke="#020617" strokeWidth="1" />
              <circle cx={rearWheelX} cy={wheelY} r="2" fill="#020617" />
            </g>
          )}
          {wheelStyle === 'spoke' && (
            <g>
              <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 3} fill="#020617" stroke="#38bdf8" strokeWidth="1" />
              <line x1={rearWheelX - rearWheelSize + 4} y1={wheelY} x2={rearWheelX + rearWheelSize - 4} y2={wheelY} stroke="#cbd5e1" strokeWidth="1" />
              <line x1={rearWheelX} y1={wheelY - rearWheelSize + 4} x2={rearWheelX} y2={wheelY + rearWheelSize - 4} stroke="#cbd5e1" strokeWidth="1" />
            </g>
          )}
          {wheelStyle === 'deep_dish' && (
            <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 2} fill="#f8fafc" stroke="#475569" strokeWidth="2.5" />
          )}
          {wheelStyle === 'neon_ring' && (
            <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 2.5} fill="#020617" stroke={neonGlowColor} strokeWidth="2.5" />
          )}
          {wheelStyle === 'gold_bbs' && (
            <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 2.5} fill="#f59e0b" stroke="#020617" strokeWidth="1.5" />
          )}
          {wheelStyle === 'aerodisc' && (
            <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 2} fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
          )}
          {wheelStyle === 'plasma_disc' && (
            <g>
              <circle cx={rearWheelX} cy={wheelY} r={rearWheelSize - 2} fill="#38bdf8" opacity="0.9" />
              <circle cx={rearWheelX} cy={wheelY} r="2.5" fill="#ffffff" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
