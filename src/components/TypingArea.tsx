import React, { useEffect, useRef, useState } from 'react';
import { Gauge, Target, RefreshCw, Zap, Volume2, VolumeX, Timer } from 'lucide-react';

interface TypingAreaProps {
  text: string;
  isRacing: boolean;
  onTyped: (input: string, correctCount: number, errorCount: number, backspaceCount: number) => void;
  onFinish: () => void;
  wpm: number;
  accuracy: number;
  elapsedTime: number;
  formattedTime?: string;
  comboStreak: number;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  text,
  isRacing,
  onTyped,
  onFinish,
  wpm,
  accuracy,
  elapsedTime,
  formattedTime,
  comboStreak,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);

  // Web Audio synth for key tick audio
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playKeySound = (isError: boolean = false) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isError ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isError ? 180 : 600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context fallbacks ignored if restricted
    }
  };

  useEffect(() => {
    if (isRacing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRacing]);

  // Auto-scroll passage so current line remains centered
  useEffect(() => {
    if (activeCharRef.current && textContainerRef.current) {
      const activeEl = activeCharRef.current;
      const containerEl = textContainerRef.current;
      const activeTop = activeEl.offsetTop;
      const containerHeight = containerEl.clientHeight;

      if (activeTop > containerHeight / 2) {
        containerEl.scrollTo({
          top: activeTop - containerHeight / 3,
          behavior: 'smooth',
        });
      }
    }
  }, [inputVal.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRacing) return;

    if (e.key === 'Backspace') {
      setBackspaceCount((prev) => prev + 1);
      playKeySound(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isRacing) return;
    const value = e.target.value;

    // Do not allow typing beyond passage length
    if (value.length > text.length) return;

    setInputVal(value);

    // Calculate correct and incorrect characters
    let correct = 0;
    let errors = 0;

    for (let i = 0; i < value.length; i++) {
      if (value[i] === text[i]) {
        correct++;
      } else {
        errors++;
      }
    }

    const lastCharTyped = value[value.length - 1];
    const expectedChar = text[value.length - 1];
    if (lastCharTyped) {
      playKeySound(lastCharTyped !== expectedChar);
    }

    onTyped(value, correct, errors, backspaceCount);

    if (value.length === text.length && correct === text.length) {
      onFinish();
    }
  };

  const handleBoxClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const displayTime = formattedTime || `${elapsedTime}s`;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Top Telemetry Meters Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* WPM Meter */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <Gauge className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SPEED</div>
            <div className="text-2xl font-black text-rose-500 tracking-tight font-mono">{wpm} <span className="text-xs font-semibold text-slate-400">WPM</span></div>
          </div>
        </div>

        {/* Accuracy Meter */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACCURACY</div>
            <div className="text-2xl font-black text-cyan-400 tracking-tight font-mono">{accuracy}%</div>
          </div>
        </div>

        {/* Combo Nitro Streak */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NITRO BOOST</div>
            <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">{comboStreak}x <span className="text-xs font-semibold text-slate-400">Streak</span></div>
          </div>
        </div>

        {/* High Precision Race Time */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RACE TIME</div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">{displayTime}</div>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Text Passage Display Area */}
      <div
        ref={textContainerRef}
        onClick={handleBoxClick}
        className="cursor-text bg-slate-950/90 border-2 border-slate-800 hover:border-slate-700 rounded-2xl p-6 max-h-[220px] overflow-y-auto relative font-mono text-lg md:text-xl leading-relaxed tracking-wide select-none transition-all shadow-inner custom-scrollbar"
      >
        {!isRacing && inputVal.length === 0 && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <p className="text-slate-400 font-sans font-bold text-base flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-500" /> Waiting for countdown to start typing...
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center">
          {text.split('').map((char, index) => {
            let stateClass = 'text-slate-500';
            const isCurrent = index === inputVal.length;

            if (index < inputVal.length) {
              if (inputVal[index] === char) {
                stateClass = 'bg-emerald-500/20 text-emerald-400 font-bold rounded-xs';
              } else {
                stateClass = 'bg-rose-500/30 text-rose-400 font-bold underline underline-offset-4 rounded-xs';
              }
            } else if (isCurrent) {
              stateClass = 'text-slate-100 bg-rose-500/25 rounded-xs border-b-2 border-rose-500 animate-pulse font-bold shadow-xs shadow-rose-500/50';
            }

            return (
              <span
                key={index}
                ref={isCurrent ? activeCharRef : null}
                className={`relative inline-block transition-colors px-[1px] ${stateClass}`}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>

        {/* Hidden Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!isRacing}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};


