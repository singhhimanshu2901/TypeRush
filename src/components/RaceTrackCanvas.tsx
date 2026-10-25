import React, { useEffect, useRef } from 'react';
import { CAR_MODELS } from '../data/cars';
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
      particlesRef.current.forEach((p, idx) => {
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

        const carModel = CAR_MODELS.find((c) => c.id === p.carId) || CAR_MODELS[0];
        const carColor = p.isUser ? '#f43f5e' : p.color || carModel.bodyColor;

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

        // Car Body Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(currentCarX, laneCenterY + 12, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Body Shape
        ctx.fillStyle = carColor;
        ctx.beginPath();
        ctx.roundRect(currentCarX - 24, laneCenterY - 11, 46, 22, [6, 11, 11, 6]);
        ctx.fill();

        // Cockpit Glass
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(currentCarX - 8, laneCenterY - 7, 18, 14, 3);
        ctx.fill();

        // Stripe
        ctx.fillStyle = carModel.stripeColor || '#ffffff';
        ctx.fillRect(currentCarX - 24, laneCenterY - 1.5, 46, 3);

        // Wheels
        ctx.fillStyle = '#111827';
        ctx.fillRect(currentCarX - 18, laneCenterY - 14, 11, 4);
        ctx.fillRect(currentCarX + 8, laneCenterY - 14, 11, 4);
        ctx.fillRect(currentCarX - 18, laneCenterY + 10, 11, 4);
        ctx.fillRect(currentCarX + 8, laneCenterY + 10, 11, 4);

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
