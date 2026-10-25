import React, { useEffect, useRef } from 'react';
import { CAR_MODELS, getCarById } from '../data/cars';
import { getAvatarEmoji } from './UserAvatar';

export interface ParticipantTrackData {
  id: string;
  name: string;
  avatar: string;
  carId: string;
  progress: number; // 0.0 to 1.0
  currentWpm: number;
  isUser: boolean;
  position: number;
  color?: string;
  hasTypo?: boolean;
}

interface RaceTrackCanvasProps {
  participants: ParticipantTrackData[];
  isRacing: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const RaceTrackCanvas: React.FC<RaceTrackCanvasProps> = ({ participants, isRacing }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark asphalt track background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Main racing track body
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 24, width, height - 48);

      // Track curb borders (Red & White checkered strip)
      const curbSize = 12;
      for (let x = 0; x < width; x += curbSize) {
        const isRed = Math.floor(x / curbSize) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
        ctx.fillRect(x, 18, curbSize, 6);
        ctx.fillRect(x, height - 24, curbSize, 6);
      }

      const numLanes = Math.max(1, participants.length);
      const trackHeight = height - 64;
      const laneHeight = trackHeight / numLanes;

      // Parallax animated lane divider lines
      if (isRacing) offset = (offset + 5) % 40;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -offset;
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;

      for (let i = 1; i < numLanes; i++) {
        const laneY = 32 + i * laneHeight;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(width, laneY);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dash

      // Start Line
      const startX = 80;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, 24);
      ctx.lineTo(startX, height - 24);
      ctx.stroke();

      // Finish Line (Checkered flag pattern)
      const finishX = width - 90;
      const checkSize = 10;
      for (let y = 24; y < height - 24; y += checkSize) {
        for (let col = 0; col < 2; col++) {
          const isWhite = (Math.floor(y / checkSize) + col) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
          ctx.fillRect(finishX + col * checkSize, y, checkSize, checkSize);
        }
      }

      // Finish Text
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH LINE', finishX + 10, 16);

      // Render Particles (Exhaust & Finish sparks)
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Filter dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // Draw Participants
      const trackLength = finishX - startX;

      participants.forEach((p, idx) => {
        const laneCenterY = 32 + idx * laneHeight + laneHeight / 2;
        const currentCarX = startX + Math.min(1.0, Math.max(0, p.progress)) * trackLength;

        const carModel = getCarById(p.carId);
        const geom = carModel.geometry;
        const carColor = carModel.bodyColor || (p.isUser ? '#f43f5e' : p.color || '#38bdf8');

        // Spawn exhaust particles if moving fast
        if (isRacing && p.currentWpm > 25 && Math.random() < 0.4) {
          particlesRef.current.push({
            x: currentCarX - 25,
            y: laneCenterY + (Math.random() * 8 - 4),
            vx: -Math.random() * 3 - 1,
            vy: (Math.random() - 0.5) * 1.5,
            color: p.isUser ? '#f43f5e' : '#38bdf8',
            alpha: 0.8,
            size: Math.random() * 3 + 2,
          });
        }

        // Finish Line fireworks/sparks if finished
        if (p.progress >= 1.0 && Math.random() < 0.2) {
          for (let k = 0; k < 3; k++) {
            particlesRef.current.push({
              x: finishX + 10,
              y: laneCenterY,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#f59e0b',
              alpha: 1.0,
              size: 3,
            });
          }
        }

        // Nitro Glow Flame under car
        if (isRacing && p.currentWpm > 45) {
          ctx.fillStyle = p.isUser ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.3)';
          ctx.beginPath();
          ctx.ellipse(currentCarX - 20, laneCenterY, 25, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tier & Car Neon Underglow
        if (carModel.neonGlowColor || carModel.speedClass === 'Hyper' || carModel.speedClass === 'Legendary' || carModel.speedClass === 'Mythic') {
          ctx.fillStyle = carModel.neonGlowColor || carColor;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.ellipse(currentCarX, laneCenterY, 28, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Car Body Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(currentCarX, laneCenterY + 12, 24, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Body Geometry derived from CarGeometry properties
        const carHalfWidth = geom.bodyLength * 0.16; // 20 - 27px
        const carHalfHeight = Math.max(9, geom.bodyHeight * 0.35); // 9 - 15px

        ctx.fillStyle = carColor;
        ctx.beginPath();
        if (carModel.category === 'SUV' || geom.roofline === 'boxy') {
          // Boxy wide SUV / Offroad profile
          ctx.roundRect(currentCarX - carHalfWidth, laneCenterY - carHalfHeight - 2, carHalfWidth * 2, carHalfHeight * 2 + 4, [3, 6, 6, 3]);
        } else if (carModel.category === 'Luxury' || geom.roofline === 'limo') {
          // Long executive saloon body
          ctx.roundRect(currentCarX - carHalfWidth - 3, laneCenterY - carHalfHeight, carHalfWidth * 2 + 6, carHalfHeight * 2, [5, 10, 10, 5]);
        } else if (geom.roofline === 'extreme_wedge' || geom.roofline === 'teardrop' || geom.roofline === 'canopy') {
          // Polygon wedge hypercar / supercar silhouette
          ctx.moveTo(currentCarX + carHalfWidth + 3, laneCenterY);
          ctx.lineTo(currentCarX + carHalfWidth - 3, laneCenterY - carHalfHeight + 1);
          ctx.lineTo(currentCarX - carHalfWidth + 3, laneCenterY - carHalfHeight);
          ctx.lineTo(currentCarX - carHalfWidth - 3, laneCenterY - 3);
          ctx.lineTo(currentCarX - carHalfWidth - 3, laneCenterY + 3);
          ctx.lineTo(currentCarX - carHalfWidth + 3, laneCenterY + carHalfHeight);
          ctx.lineTo(currentCarX + carHalfWidth - 3, laneCenterY + carHalfHeight - 1);
          ctx.closePath();
        } else if (geom.roofline === 'fastback') {
          // Fastback curved sports coupe
          ctx.roundRect(currentCarX - carHalfWidth, laneCenterY - carHalfHeight, carHalfWidth * 2 + 2, carHalfHeight * 2, [4, 12, 8, 4]);
        } else {
          // Standard / Sports roundRect chassis
          ctx.roundRect(currentCarX - carHalfWidth, laneCenterY - carHalfHeight, carHalfWidth * 2, carHalfHeight * 2, [5, 12, 12, 5]);
        }
        ctx.fill();

        // Flared Fenders / Widebody accents
        if (geom.fenderStyle === 'flared' || geom.fenderStyle === 'widebody' || geom.fenderStyle === 'squared') {
          ctx.fillStyle = carModel.accentColor || '#38bdf8';
          ctx.fillRect(currentCarX + carHalfWidth - 14, laneCenterY - carHalfHeight - 2, 10, 2);
          ctx.fillRect(currentCarX - carHalfWidth + 4, laneCenterY - carHalfHeight - 2, 10, 2);
          ctx.fillRect(currentCarX + carHalfWidth - 14, laneCenterY + carHalfHeight, 10, 2);
          ctx.fillRect(currentCarX - carHalfWidth + 4, laneCenterY + carHalfHeight, 10, 2);
        }

        // Racing Stripe / Accent Graphics
        if (carModel.stripeColor && carModel.stripeColor !== 'transparent') {
          ctx.fillStyle = carModel.stripeColor;
          ctx.fillRect(currentCarX - carHalfWidth + 2, laneCenterY - 1.5, carHalfWidth * 2 - 4, 3);
        }

        // Roof Accessories (Light bar, Dorsal fin, Roof rack, Scoop)
        if (geom.roofAccessories === 'light_bar') {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(currentCarX - 4, laneCenterY - carHalfHeight - 5, 10, 3);
        } else if (geom.roofAccessories === 'dorsal_fin') {
          ctx.fillStyle = carModel.accentColor || '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(currentCarX - 4, laneCenterY - 1.5);
          ctx.lineTo(currentCarX - 22, laneCenterY - 1.5);
          ctx.lineTo(currentCarX - 16, laneCenterY - 11);
          ctx.closePath();
          ctx.fill();
        } else if (geom.roofAccessories === 'roof_rack') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(currentCarX - 12, laneCenterY - carHalfHeight - 4, 20, 2);
        } else if (geom.roofAccessories === 'roof_scoop') {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(currentCarX - 2, laneCenterY - carHalfHeight - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cockpit Glass
        const glassColor =
          geom.windowTint === 'cyan_laser'
            ? 'rgba(6, 182, 212, 0.85)'
            : geom.windowTint === 'bronze'
            ? 'rgba(217, 119, 6, 0.85)'
            : geom.windowTint === 'silver_reflection'
            ? 'rgba(148, 163, 184, 0.85)'
            : '#0f172a';

        ctx.fillStyle = glassColor;
        ctx.beginPath();
        if (carModel.category === 'SUV') {
          ctx.roundRect(currentCarX - 8, laneCenterY - 8, 22, 16, 2);
        } else if (geom.roofline === 'extreme_wedge' || geom.roofline === 'canopy') {
          ctx.ellipse(currentCarX, laneCenterY, 12, 6, 0, 0, Math.PI * 2);
        } else {
          ctx.roundRect(currentCarX - 6, laneCenterY - 7, 18, 14, 3);
        }
        ctx.fill();

        // Front Headlights
        const hColor = carModel.headlightColor || '#fef08a';
        ctx.fillStyle = hColor;
        if (geom.headlightStyle === 'laser_strip' || geom.headlightStyle === 'vertical_led') {
          ctx.fillRect(currentCarX + carHalfWidth - 2, laneCenterY - carHalfHeight + 1, 3, carHalfHeight * 2 - 2);
        } else if (geom.headlightStyle === 'quad_projector' || geom.headlightStyle === 'dual_halo') {
          ctx.beginPath();
          ctx.arc(currentCarX + carHalfWidth - 1, laneCenterY - carHalfHeight + 4, 2, 0, Math.PI * 2);
          ctx.arc(currentCarX + carHalfWidth - 1, laneCenterY + carHalfHeight - 4, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(currentCarX + carHalfWidth - 3, laneCenterY - carHalfHeight + 2, 3, 4);
          ctx.fillRect(currentCarX + carHalfWidth - 3, laneCenterY + carHalfHeight - 6, 3, 4);
        }

        // Front Grille
        if (geom.grilleStyle && geom.grilleStyle !== 'none' && geom.grilleStyle !== 'enclosed_ev') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(currentCarX + carHalfWidth - 1, laneCenterY - 3, 2, 6);
        }

        // Rear Wing / Spoiler
        if (geom.spoilerStyle && geom.spoilerStyle !== 'none') {
          ctx.fillStyle = carModel.accentColor || '#f59e0b';
          if (geom.spoilerStyle === 'plasma_wings') {
            ctx.fillStyle = carModel.neonGlowColor || '#06b6d4';
            ctx.fillRect(currentCarX - carHalfWidth - 6, laneCenterY - carHalfHeight - 4, 6, carHalfHeight * 2 + 8);
          } else if (
            geom.spoilerStyle === 'high_wing' ||
            geom.spoilerStyle === 'f1_wing' ||
            geom.spoilerStyle === 'gt_wing' ||
            geom.spoilerStyle === 'active_aero'
          ) {
            ctx.fillRect(currentCarX - carHalfWidth - 5, laneCenterY - carHalfHeight - 3, 5, carHalfHeight * 2 + 6);
          } else {
            ctx.fillRect(currentCarX - carHalfWidth - 2, laneCenterY - carHalfHeight, 4, carHalfHeight * 2);
          }
        }

        // Wheels
        const rimColor =
          geom.wheelStyle === 'gold_bbs'
            ? '#f59e0b'
            : geom.wheelStyle === 'neon_ring' || geom.wheelStyle === 'plasma_disc'
            ? carModel.accentColor || '#38bdf8'
            : geom.wheelStyle === 'offroad_chunky'
            ? '#475569'
            : '#94a3b8';

        const frontWheelR = (geom.frontWheelSize || 10) * 0.45;
        const rearWheelR = (geom.rearWheelSize || 10) * 0.45;

        // Wheel Treads (Dark Outer Tires)
        ctx.fillStyle = '#090d16';
        ctx.fillRect(currentCarX - 18, laneCenterY - carHalfHeight - rearWheelR * 0.4, 11, rearWheelR * 0.8);
        ctx.fillRect(currentCarX + 8, laneCenterY - carHalfHeight - frontWheelR * 0.4, 11, frontWheelR * 0.8);
        ctx.fillRect(currentCarX - 18, laneCenterY + carHalfHeight - rearWheelR * 0.4, 11, rearWheelR * 0.8);
        ctx.fillRect(currentCarX + 8, laneCenterY + carHalfHeight - frontWheelR * 0.4, 11, frontWheelR * 0.8);

        // Wheel Metallic Hubs / Spokes
        ctx.fillStyle = rimColor;
        ctx.fillRect(currentCarX - 16, laneCenterY - carHalfHeight - 1, 7, 2);
        ctx.fillRect(currentCarX + 10, laneCenterY - carHalfHeight - 1, 7, 2);
        ctx.fillRect(currentCarX - 16, laneCenterY + carHalfHeight - 1, 7, 2);
        ctx.fillRect(currentCarX + 10, laneCenterY + carHalfHeight - 1, 7, 2);

        // Position Badge (#1, #2, etc.)
        const posColor =
          p.position === 1 ? '#f59e0b' : p.position === 2 ? '#94a3b8' : p.position === 3 ? '#b45309' : '#475569';
        ctx.fillStyle = posColor;
        ctx.beginPath();
        ctx.arc(currentCarX - 35, laneCenterY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${p.position}`, currentCarX - 35, laneCenterY);

        // Name & Speed Tag
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = p.isUser ? '#f43f5e' : '#f3f4f6';
        ctx.textAlign = 'left';
        const displayAvatarEmoji = getAvatarEmoji(p.avatar);
        ctx.fillText(`${displayAvatarEmoji} ${p.name}`, currentCarX - 24, laneCenterY - 16);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`${p.currentWpm} WPM`, currentCarX + 26, laneCenterY + 4);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [participants, isRacing]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="font-extrabold text-xs tracking-wider uppercase text-slate-300">
            2D Track Telemetry & Car Physics
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>Distance: <strong className="text-white">{Math.round((participants.find((p) => p.isUser)?.progress || 0) * 100)}%</strong></span>
        </div>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <canvas
          ref={canvasRef}
          width={900}
          height={Math.max(180, participants.length * 60 + 40)}
          className="w-full min-w-[720px] h-auto rounded-2xl border border-slate-800 bg-slate-950"
        />
      </div>
    </div>
  );
};
