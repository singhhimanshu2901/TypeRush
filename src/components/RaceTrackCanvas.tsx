import React, { useEffect, useRef } from 'react';
import { getCarById } from '../data/cars';
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

      // 1. Environmental Backdrop (Dark green grass / landscape borders)
      ctx.fillStyle = '#0f291e';
      ctx.fillRect(0, 0, width, height);

      // Grass texture detail lines
      ctx.fillStyle = '#143d2c';
      for (let gx = 0; gx < width; gx += 40) {
        ctx.fillRect(gx, 2, 20, 10);
        ctx.fillRect(gx + 15, height - 12, 20, 10);
      }

      // 2. Main Racing Track Body (Dark Asphalt)
      const trackTop = 16;
      const trackBottom = height - 16;
      const trackHeight = trackBottom - trackTop;

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, trackTop, width, trackHeight);

      // Track curb borders (Red & White checkered safety barriers)
      const curbSize = 14;
      for (let x = 0; x < width; x += curbSize) {
        const isRed = Math.floor(x / curbSize) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#f8fafc';
        ctx.fillRect(x, trackTop - 5, curbSize, 5);
        ctx.fillRect(x, trackBottom, curbSize, 5);
      }

      // 3. Multi-lane Markings
      const numLanes = Math.max(1, participants.length);
      const laneHeight = trackHeight / numLanes;

      if (isRacing) offset = (offset + 6) % 40;
      ctx.setLineDash([24, 16]);
      ctx.lineDashOffset = -offset;
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;

      for (let i = 1; i < numLanes; i++) {
        const laneY = trackTop + i * laneHeight;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(width, laneY);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dash

      // 4. Start Line
      const startX = 85;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, trackTop);
      ctx.lineTo(startX, trackBottom);
      ctx.stroke();

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('START', startX, trackTop - 7);

      // 5. Checkered Finish Line Banner
      const finishX = width - 95;
      const checkSize = 10;
      for (let y = trackTop; y < trackBottom; y += checkSize) {
        for (let col = 0; col < 2; col++) {
          const isWhite = (Math.floor(y / checkSize) + col) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#090d16';
          ctx.fillRect(finishX + col * checkSize, y, checkSize, checkSize);
        }
      }

      // Finish Line Arch / Header Tag
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(finishX - 4, trackTop - 12, 28, 10);
      ctx.font = 'black 8px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH', finishX + 10, trackTop - 4);

      // 6. Particle Systems (Exhaust trails & Finish sparks)
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Filter expired particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // 7. Render Player & AI Opponent Vehicles
      const trackLength = finishX - startX;

      participants.forEach((p, idx) => {
        const laneCenterY = trackTop + idx * laneHeight + laneHeight / 2;
        const currentCarX = startX + Math.min(1.0, Math.max(0, p.progress)) * trackLength;

        const carModel = getCarById(p.carId);
        const geom = carModel.geometry;
        const carColor = carModel.bodyColor || (p.isUser ? '#f43f5e' : p.color || '#38bdf8');

        // Exhaust smoke / plasma flame particles
        if (isRacing && p.currentWpm > 25 && Math.random() < 0.45) {
          particlesRef.current.push({
            x: currentCarX - 24,
            y: laneCenterY + (Math.random() * 8 - 4),
            vx: -Math.random() * 3 - 1,
            vy: (Math.random() - 0.5) * 1.5,
            color: p.isUser ? '#f43f5e' : '#38bdf8',
            alpha: 0.85,
            size: Math.random() * 3 + 2,
          });
        }

        // Finish Line fireworks
        if (p.progress >= 1.0 && Math.random() < 0.25) {
          for (let k = 0; k < 3; k++) {
            particlesRef.current.push({
              x: finishX + 10,
              y: laneCenterY,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#f59e0b',
              alpha: 1.0,
              size: 3.5,
            });
          }
        }

        // Nitro Glow Effect under car
        if (isRacing && p.currentWpm > 45) {
          ctx.fillStyle = p.isUser ? 'rgba(244, 63, 94, 0.45)' : 'rgba(56, 189, 248, 0.35)';
          ctx.beginPath();
          ctx.ellipse(currentCarX - 18, laneCenterY, 26, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Car Neon Underglow
        if (carModel.neonGlowColor || carModel.speedClass === 'Hyper' || carModel.speedClass === 'Legendary' || carModel.speedClass === 'Mythic') {
          ctx.fillStyle = carModel.neonGlowColor || carColor;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.ellipse(currentCarX, laneCenterY, 28, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Car Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(currentCarX, laneCenterY + 12, 24, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Body Geometry
        const carHalfWidth = geom.bodyLength * 0.16;
        const carHalfHeight = Math.max(9, geom.bodyHeight * 0.35);

        ctx.fillStyle = carColor;
        ctx.beginPath();
        if (carModel.category === 'SUV' || geom.roofline === 'boxy') {
          ctx.roundRect(currentCarX - carHalfWidth, laneCenterY - carHalfHeight - 2, carHalfWidth * 2, carHalfHeight * 2 + 4, [3, 6, 6, 3]);
        } else if (carModel.category === 'Luxury' || geom.roofline === 'limo') {
          ctx.roundRect(currentCarX - carHalfWidth - 3, laneCenterY - carHalfHeight, carHalfWidth * 2 + 6, carHalfHeight * 2, [5, 10, 10, 5]);
        } else if (geom.roofline === 'extreme_wedge' || geom.roofline === 'teardrop' || geom.roofline === 'canopy') {
          ctx.moveTo(currentCarX + carHalfWidth + 3, laneCenterY);
          ctx.lineTo(currentCarX + carHalfWidth - 3, laneCenterY - carHalfHeight + 1);
          ctx.lineTo(currentCarX - carHalfWidth + 3, laneCenterY - carHalfHeight);
          ctx.lineTo(currentCarX - carHalfWidth - 3, laneCenterY - 3);
          ctx.lineTo(currentCarX - carHalfWidth - 3, laneCenterY + 3);
          ctx.lineTo(currentCarX - carHalfWidth + 3, laneCenterY + carHalfHeight);
          ctx.lineTo(currentCarX + carHalfWidth - 3, laneCenterY + carHalfHeight - 1);
          ctx.closePath();
        } else if (geom.roofline === 'fastback') {
          ctx.roundRect(currentCarX - carHalfWidth, laneCenterY - carHalfHeight, carHalfWidth * 2 + 2, carHalfHeight * 2, [4, 12, 8, 4]);
        } else {
          ctx.roundRect(currentCarX - carHalfWidth, laneCenterY - carHalfHeight, carHalfWidth * 2, carHalfHeight * 2, [5, 12, 12, 5]);
        }
        ctx.fill();

        // Flared Fenders / Accents
        if (geom.fenderStyle === 'flared' || geom.fenderStyle === 'widebody' || geom.fenderStyle === 'squared') {
          ctx.fillStyle = carModel.accentColor || '#38bdf8';
          ctx.fillRect(currentCarX + carHalfWidth - 14, laneCenterY - carHalfHeight - 2, 10, 2);
          ctx.fillRect(currentCarX - carHalfWidth + 4, laneCenterY - carHalfHeight - 2, 10, 2);
          ctx.fillRect(currentCarX + carHalfWidth - 14, laneCenterY + carHalfHeight, 10, 2);
          ctx.fillRect(currentCarX - carHalfWidth + 4, laneCenterY + carHalfHeight, 10, 2);
        }

        // Racing Stripe Graphics
        if (carModel.stripeColor && carModel.stripeColor !== 'transparent') {
          ctx.fillStyle = carModel.stripeColor;
          ctx.fillRect(currentCarX - carHalfWidth + 2, laneCenterY - 1.5, carHalfWidth * 2 - 4, 3);
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

        // Headlights
        ctx.fillStyle = carModel.headlightColor || '#fef08a';
        ctx.fillRect(currentCarX + carHalfWidth - 2, laneCenterY - carHalfHeight + 2, 3, 4);
        ctx.fillRect(currentCarX + carHalfWidth - 2, laneCenterY + carHalfHeight - 6, 3, 4);

        // Rear Spoiler
        if (geom.spoilerStyle && geom.spoilerStyle !== 'none') {
          ctx.fillStyle = carModel.accentColor || '#f59e0b';
          ctx.fillRect(currentCarX - carHalfWidth - 4, laneCenterY - carHalfHeight - 2, 4, carHalfHeight * 2 + 4);
        }

        // Wheels
        const rimColor =
          geom.wheelStyle === 'gold_bbs'
            ? '#f59e0b'
            : geom.wheelStyle === 'neon_ring' || geom.wheelStyle === 'plasma_disc'
            ? carModel.accentColor || '#38bdf8'
            : '#94a3b8';

        ctx.fillStyle = '#090d16';
        ctx.fillRect(currentCarX - 16, laneCenterY - carHalfHeight - 3, 10, 5);
        ctx.fillRect(currentCarX + 8, laneCenterY - carHalfHeight - 3, 10, 5);
        ctx.fillRect(currentCarX - 16, laneCenterY + carHalfHeight - 2, 10, 5);
        ctx.fillRect(currentCarX + 8, laneCenterY + carHalfHeight - 2, 10, 5);

        ctx.fillStyle = rimColor;
        ctx.fillRect(currentCarX - 14, laneCenterY - carHalfHeight - 2, 6, 3);
        ctx.fillRect(currentCarX + 10, laneCenterY - carHalfHeight - 2, 6, 3);
        ctx.fillRect(currentCarX - 14, laneCenterY + carHalfHeight - 1, 6, 3);
        ctx.fillRect(currentCarX + 10, laneCenterY + carHalfHeight - 1, 6, 3);

        // Rank Badge (#1, #2, etc.)
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

        // Driver Name Label & Player "YOU" Highlighting Tag
        const displayAvatarEmoji = getAvatarEmoji(p.avatar);
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';

        if (p.isUser) {
          // Highlighted YOU badge for player
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(currentCarX - 26, laneCenterY - 26, 120, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#34d399';
          ctx.fillText(`🏎️ YOU: ${p.name}`, currentCarX - 22, laneCenterY - 14);
        } else {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillText(`${displayAvatarEmoji} ${p.name}`, currentCarX - 22, laneCenterY - 14);
        }

        // Live WPM Tag
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`${p.currentWpm} WPM`, currentCarX + 28, laneCenterY + 4);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [participants, isRacing]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-black text-xs tracking-wider uppercase text-slate-200">
            ARCADE RACE TRACK
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Progress: <strong className="text-emerald-400">{Math.round((participants.find((p) => p.isUser)?.progress || 0) * 100)}%</strong>
        </div>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <canvas
          ref={canvasRef}
          width={920}
          height={Math.max(180, participants.length * 56 + 32)}
          className="w-full min-w-[720px] h-auto rounded-2xl border border-slate-800 bg-slate-950"
        />
      </div>
    </div>
  );
};
