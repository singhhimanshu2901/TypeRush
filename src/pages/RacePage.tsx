import React, { useEffect, useState, useRef } from 'react';
import { User, RaceMode, Difficulty, Passage, RaceResult, AIRacer } from '../types';
import { RaceTrackCanvas, ParticipantTrackData } from '../components/RaceTrackCanvas';
import { TypingArea } from '../components/TypingArea';
import { calculateGrossWpm, calculateNetWpm, calculateAccuracy, calculateXpEarned } from '../utils/typingEngine';
import { CAR_MODELS, getCarById } from '../data/cars';
import { Pause, Play, RotateCcw, Trophy, Flag, ShieldAlert } from 'lucide-react';

interface RacePageProps {
  user: User;
  mode: RaceMode;
  difficulty: Difficulty;
  passage: Passage;
  carId: string;
  onFinishRace: (result: RaceResult) => void;
  onCancelRace: () => void;
}

export const RacePage: React.FC<RacePageProps> = ({
  user,
  mode,
  difficulty,
  passage,
  carId,
  onFinishRace,
  onCancelRace,
}) => {
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isRacing, setIsRacing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [formattedTime, setFormattedTime] = useState<string>('0:00.0');

  // High precision timing and single-execution race finished guard
  const raceIdRef = useRef<string>(`race-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
  const raceFinishedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number | null>(null);

  // User Typing state
  const [userTyped, setUserTyped] = useState<string>('');
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [backspaceCount, setBackspaceCount] = useState<number>(0);

  // Live Metrics
  const [userWpm, setUserWpm] = useState<number>(0);
  const [userAccuracy, setUserAccuracy] = useState<number>(100);
  const [comboStreak, setComboStreak] = useState<number>(1);

  // AI Opponents Setup
  const [aiRacers, setAiRacers] = useState<AIRacer[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize AI Racers on Mount based on difficulty & picking distinct vehicles from CAR_MODELS
  useEffect(() => {
    let baseWpm = 35;
    if (difficulty === 'intermediate') baseWpm = 55;
    if (difficulty === 'advanced') baseWpm = 80;
    if (difficulty === 'expert') baseWpm = 105;

    const playerCarId = carId || user.equippedCarId || 'car-apex-racer';
    const otherCars = CAR_MODELS.filter((c) => c.id !== playerCarId);

    // Select 3 distinct vehicles
    const bot1Car = otherCars[Math.floor(Math.random() * otherCars.length)] || CAR_MODELS[1];
    const remainingCars1 = otherCars.filter((c) => c.id !== bot1Car.id);
    const bot2Car = remainingCars1[Math.floor(Math.random() * remainingCars1.length)] || CAR_MODELS[2];
    const remainingCars2 = remainingCars1.filter((c) => c.id !== bot2Car.id);
    const bot3Car = remainingCars2[Math.floor(Math.random() * remainingCars2.length)] || CAR_MODELS[3];

    const botProfiles = [
      { name: 'Apex Striker AI', avatar: '🤖' },
      { name: 'Cyber Velocity', avatar: '⚡' },
      { name: 'Phantom Driver', avatar: '🔥' },
      { name: 'Nitro Renegade', avatar: '🏎️' },
      { name: 'Veloce Rival', avatar: '🏆' },
      { name: 'Shadow Racer', avatar: '🕶️' },
    ];

    const shuffled = [...botProfiles].sort(() => 0.5 - Math.random());

    const bots: AIRacer[] = [
      {
        id: 'bot-1',
        name: shuffled[0].name,
        avatar: shuffled[0].avatar,
        carId: bot1Car.id,
        targetWpm: baseWpm + (Math.random() * 8 - 4),
        variance: 0.1,
        color: bot1Car.bodyColor,
        currentProgress: 0,
        currentWpm: baseWpm,
        position: 2,
      },
      {
        id: 'bot-2',
        name: shuffled[1].name,
        avatar: shuffled[1].avatar,
        carId: bot2Car.id,
        targetWpm: baseWpm - 6 + Math.random() * 6,
        variance: 0.15,
        color: bot2Car.bodyColor,
        currentProgress: 0,
        currentWpm: baseWpm - 5,
        position: 3,
      },
      {
        id: 'bot-3',
        name: shuffled[2].name,
        avatar: shuffled[2].avatar,
        carId: bot3Car.id,
        targetWpm: baseWpm + 4 + Math.random() * 6,
        variance: 0.08,
        color: bot3Car.bodyColor,
        currentProgress: 0,
        currentWpm: baseWpm + 4,
        position: 4,
      },
    ];

    if (mode === 'solo') {
      setAiRacers([]);
    } else {
      setAiRacers(bots);
    }
  }, [difficulty, mode, carId, user.equippedCarId]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setIsRacing(true);
      startTimeRef.current = performance.now();
    }
  }, [countdown]);

  // High Precision Game Loop Timer (100ms interval for smooth sub-second clock)
  useEffect(() => {
    if (!isRacing || isPaused || raceFinishedRef.current) return;

    timerRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;

      const elapsedMs = performance.now() - startTimeRef.current;
      const currentSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
      setElapsedTime(currentSeconds);

      // High precision clock display (e.g., 0:01.7)
      const totalSecs = elapsedMs / 1000;
      const mins = Math.floor(totalSecs / 60);
      const secs = Math.floor(totalSecs % 60);
      const tenths = Math.floor((totalSecs % 1) * 10);
      setFormattedTime(`${mins}:${secs.toString().padStart(2, '0')}.${tenths}`);

      // Recalculate live WPM
      const wpm = calculateNetWpm(correctCount, errorCount, currentSeconds);
      setUserWpm(wpm);

      // Advance AI Opponents in 100ms increments
      if (mode !== 'solo') {
        setAiRacers((prevBots) =>
          prevBots.map((bot) => {
            const totalCharsNeeded = passage.charCount;
            const wpmShift = (Math.random() - 0.5) * 8;
            const currentBotSpeed = Math.max(10, bot.targetWpm + wpmShift);
            const charsPerSec = (currentBotSpeed * 5) / 60;
            const newProgress = Math.min(1.0, bot.currentProgress + (charsPerSec * 0.1) / totalCharsNeeded);

            return {
              ...bot,
              currentProgress: newProgress,
              currentWpm: Math.round(currentBotSpeed),
            };
          })
        );
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRacing, isPaused, correctCount, errorCount, passage.charCount, mode]);

  const latestTypedRef = useRef({ input: '', correct: 0, errors: 0, backspaces: 0 });

  // Handle Typing Input from TypingArea
  const handleTyped = (input: string, correct: number, errors: number, backspaces: number) => {
    if (isPaused || raceFinishedRef.current) return;

    latestTypedRef.current = { input, correct, errors, backspaces };
    setUserTyped(input);
    setCorrectCount(correct);
    setErrorCount(errors);
    setBackspaceCount(backspaces);

    const acc = calculateAccuracy(correct, input.length);
    setUserAccuracy(acc);

    const currentSecs = startTimeRef.current
      ? Math.max(0.5, (performance.now() - startTimeRef.current) / 1000)
      : Math.max(1, elapsedTime);

    const currentWpm = calculateNetWpm(correct, errors, currentSecs);
    setUserWpm(currentWpm);

    if (acc > 95 && currentWpm > 40) {
      setComboStreak(Math.min(5, Math.floor(currentWpm / 20)));
    } else {
      setComboStreak(1);
    }
  };

  // Fail-Safe Completion Guard: Automatically finish race if userTyped reaches or exceeds passage length
  useEffect(() => {
    if (
      isRacing &&
      !raceFinishedRef.current &&
      passage.text &&
      passage.text.length > 0 &&
      userTyped.length >= passage.text.length
    ) {
      console.log('[RaceDiag] Fail-safe completion triggered in RacePage useEffect.', {
        userTypedLength: userTyped.length,
        passageLength: passage.text.length,
      });
      handleFinish(userTyped, correctCount, errorCount, backspaceCount);
    }
  }, [userTyped, isRacing, passage.text, correctCount, errorCount, backspaceCount]);

  // Single-Execution Guaranteed Race Finish Handler
  const handleFinish = async (finalInput?: string, finalCorrect?: number, finalErrors?: number, finalBackspaces?: number) => {
    if (raceFinishedRef.current) {
      console.warn('[RaceDiag] handleFinish called but raceFinishedRef is already true. Guarding.');
      return;
    }
    raceFinishedRef.current = true;
    setIsRacing(false);

    if (timerRef.current) clearInterval(timerRef.current);

    const inputVal = finalInput !== undefined ? finalInput : (latestTypedRef.current.input || userTyped);
    const correctVal = finalCorrect !== undefined ? finalCorrect : (latestTypedRef.current.correct || correctCount);
    const errorVal = finalErrors !== undefined ? finalErrors : (latestTypedRef.current.errors || errorCount);
    const backspaceVal = finalBackspaces !== undefined ? finalBackspaces : (latestTypedRef.current.backspaces || backspaceCount);

    const exactMs = startTimeRef.current ? performance.now() - startTimeRef.current : elapsedTime * 1000;
    const durationSeconds = Math.max(1, Math.round(exactMs / 1000));

    const grossWpm = calculateGrossWpm(inputVal.length, durationSeconds);
    const netWpm = calculateNetWpm(correctVal, errorVal, durationSeconds);
    const finalAccuracy = calculateAccuracy(correctVal, inputVal.length);

    // Determine final finish position
    let userProgress = passage.charCount > 0 ? Math.min(1.0, inputVal.length / passage.charCount) : 1.0;
    let position = 1;

    if (mode !== 'solo') {
      aiRacers.forEach((bot) => {
        if (bot.currentProgress >= userProgress) {
          position += 1;
        }
      });
    }

    const xpEarned = calculateXpEarned(netWpm, finalAccuracy, position, difficulty === 'expert' ? 1.5 : 1.0);

    const result: RaceResult = {
      id: raceIdRef.current,
      userId: user.id,
      username: user.username,
      mode,
      difficulty,
      passageId: passage.id,
      passageTitle: passage.title,
      grossWpm,
      netWpm,
      accuracy: finalAccuracy,
      durationSeconds,
      correctChars: correctVal,
      incorrectChars: errorVal,
      backspaces: backspaceVal,
      finishPosition: position,
      totalParticipants: mode === 'solo' ? 1 : aiRacers.length + 1,
      xpEarned,
      date: new Date().toISOString(),
    };

    console.log('[RaceDiag] handleFinish constructed RaceResult. Invoking onFinishRace.', result);
    try {
      onFinishRace(result);
    } catch (err) {
      console.error('[RaceDiag] Error in onFinishRace callback:', err);
    }
  };

  // Calculate user progress
  const userProgress = passage.charCount > 0 ? Math.min(1.0, userTyped.length / passage.charCount) : 0;
  const activeCarId = carId || user.equippedCarId || 'car-apex-racer';
  const resolvedCar = getCarById(activeCarId);

  let allTrackParticipants: ParticipantTrackData[] = [
    {
      id: user.id,
      name: user.username,
      avatar: user.avatar,
      carId: activeCarId,
      progress: userProgress,
      currentWpm: userWpm,
      isUser: true,
      position: 1,
    },
    ...aiRacers.map((bot) => ({
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      carId: bot.carId,
      progress: bot.currentProgress,
      currentWpm: bot.currentWpm,
      isUser: false,
      position: bot.position,
      color: bot.color,
    })),
  ];

  // Calculate live race positions
  allTrackParticipants.sort((a, b) => b.progress - a.progress);
  allTrackParticipants = allTrackParticipants.map((p, index) => ({
    ...p,
    position: index + 1,
  }));

  const userRank = allTrackParticipants.find((p) => p.isUser)?.position || 1;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 relative">
      {/* 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="text-8xl md:text-9xl font-black text-rose-500 animate-bounce tracking-tighter">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
            Hands on Home Row Keys!
          </p>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
          <div className="text-3xl font-black text-white flex items-center gap-3">
            <Pause className="w-8 h-8 text-rose-500" /> RACE PAUSED
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> RESUME
            </button>
            <button
              onClick={onCancelRace}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> QUIT RACE
            </button>
          </div>
        </div>
      )}

      {/* Top Arcade Racing Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl min-w-0 shadow-lg">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white truncate">{passage.title}</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[11px] uppercase border border-rose-500/20 shrink-0">
                {difficulty}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium truncate">
              Vehicle: <span className="text-rose-400 font-semibold">{resolvedCar.name}</span> ({resolvedCar.category})
            </div>
          </div>
        </div>

        {/* User Rank Indicator & Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">RANK:</span>
            <span className="text-amber-400 font-bold text-sm">
              #{userRank} <span className="text-[10px] text-slate-500 font-sans">/ {allTrackParticipants.length}</span>
            </span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 fill-white text-rose-500" /> : <Pause className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={onCancelRace}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 font-bold text-xs transition-colors"
          >
            Quit
          </button>
        </div>
      </div>

      {/* Top 2D Track View */}
      <RaceTrackCanvas participants={allTrackParticipants} isRacing={isRacing && !isPaused} />

      {/* Center Typing Interface */}
      <TypingArea
        text={passage.text}
        isRacing={isRacing && !isPaused}
        onTyped={handleTyped}
        onFinish={handleFinish}
        wpm={userWpm}
        accuracy={userAccuracy}
        elapsedTime={elapsedTime}
        formattedTime={formattedTime}
        comboStreak={comboStreak}
      />
    </div>
  );
};

