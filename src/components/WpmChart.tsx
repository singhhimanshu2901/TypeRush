import React from 'react';
import { RaceResult } from '../types';

interface WpmChartProps {
  races: RaceResult[];
}

export const WpmChart: React.FC<WpmChartProps> = ({ races }) => {
  if (!races || races.length === 0) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 font-medium text-sm">
        No race history available yet. Complete your first race to see your WPM telemetry graph!
      </div>
    );
  }

  // Take up to 10 recent races in chronological order
  const raceList = [...races].reverse().slice(-10);
  const maxWpm = Math.max(80, ...raceList.map((r) => r.netWpm)) + 10;
  const height = 160;
  const width = 500;
  const padding = 30;

  const points = raceList.map((r, i) => {
    const x = padding + (i / Math.max(1, raceList.length - 1)) * (width - 2 * padding);
    const y = height - padding - (r.netWpm / maxWpm) * (height - 2 * padding);
    return { x, y, wpm: r.netWpm, date: new Date(r.date).toLocaleDateString() };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-sm text-slate-200 tracking-wide uppercase flex items-center gap-2">
          <span>📈</span> WPM Performance Progression
        </h3>
        <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
          Last {raceList.length} Races
        </span>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[400px]">
          {/* Grid Lines */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = height - padding - ratio * (height - 2 * padding);
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Area Fill Gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#chartGradient)"
            />
          )}

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Point Circles & Tooltip Labels */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
              <text
                x={p.x}
                y={p.y - 10}
                fill="#38bdf8"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.wpm}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
