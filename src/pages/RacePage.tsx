import React, { useEffect, useState, useRef } from 'react';
import { User, RaceMode, Difficulty, Passage, RaceResult, AIRacer } from '../types';
import { RaceTrackCanvas, ParticipantTrackData } from '../components/RaceTrackCanvas';
import { TypingArea } from '../components/TypingArea';
import { calculateGrossWpm, calculateNetWpm, calculateAccuracy, calculateXpEarned } from '../utils/typingEngine';
import { ApiService } from '../services/api';
import { Pause, Play, RotateCcw } from 'lucide-react';

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

  // Initialize AI Racers on Mount based on difficulty
  useEffect(() => {
    let baseWpm = 35;
    if (difficulty === 'intermediate') baseWpm = 55;
    if (difficulty === 'advanced') baseWpm = 80;
    if (difficulty === 'expert') baseWpm = 105;

    const bots: AIRacer[] = [
      {
        id: 'bot-1',
        name: 'Apex Striker AI',
        avatar: '🤖',
        carId: 'car-neon-viper',
        targetWpm: baseWpm + (Math.random() * 8 - 4),
        variance: 0.1,
        color: '#06b6d4',
        currentProgress: 0,
        currentWpm: baseWpm,
        position: 2,
      },
      {
        id: 'bot-2',
        name: 'Cyber Velocity',
        avatar: '⚡',
        carId: 'car-cyber-speedster',
        targetWpm: baseWpm - 6 + Math.random() * 6,
        variance: 0.15,
        color: '#10b981',
        currentProgress: 0,
        currentWpm: baseWpm - 5,
        position: 3,
      },
      {
        id: 'bot-3',
        name: 'Phantom Driver',
        avatar: '🔥',
        carId: 'car-phantom-gt',
        targetWpm: baseWpm + 4 + Math.random() * 6,
        variance: 0.08,
        color: '#a855f7',
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
  }, [difficulty, mode]);

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

  // Main Race Game Loop Timer
  useEffect(() => {
    if (!isRacing || isPaused || raceFinishedRef.current) return;

    timerRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;

      const elapsedMs = performance.now() - startTimeRef.current;
      const currentSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
      setElapsedTime(currentSeconds);

      // Recalculate live WPM
      const wpm = calculateNetWpm(correctCount, errorCount, currentSeconds);
      setUserWpm(wpm);

      // Advance AI Opponents
      if (mode !== 'solo') {
        setAiRacers((prevBots) =>
          prevBots.map((bot) => {
            const totalCharsNeeded = passage.charCount;
            const wpmShift = (Math.random() - 0.5) * 8;
            const currentBotSpeed = Math.max(10, bot.targetWpm + wpmShift);
            const charsPerSec = (currentBotSpeed * 5) / 60;
            const newProgress = Math.min(1.0, bot.currentProgress + charsPerSec / totalCharsNeeded);

            return {
              ...bot,
              currentProgress: newProgress,
              currentWpm: Math.round(currentBotSpeed),
            };
          })
        );
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRacing, isPaused, correctCount, errorCount, passage.charCount, mode]);

  // Handle Typing Input from TypingArea
  const handleTyped = (input: string, correct: number, errors: number, backspaces: number) => {
    if (isPaused || raceFinishedRef.current) return;

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

  // Single-Execution Guaranteed Race Finish Handler
  const handleFinish = async () => {
    if (raceFinishedRef.current) return;
    raceFinishedRef.current = true;
    setIsRacing(false);

    if (timerRef.current) clearInterval(timerRef.current);

    const exactMs = startTimeRef.current ? performance.now() - startTimeRef.current : elapsedTime * 1000;
    const durationSeconds = Math.max(1, Math.round(exactMs / 1000));

    const grossWpm = calculateGrossWpm(userTyped.length, durationSeconds);
    const netWpm = calculateNetWpm(correctCount, errorCount, durationSeconds);
    const finalAccuracy = calculateAccuracy(correctCount, userTyped.length);

    // Determine final finish position
    let userProgress = 1.0;
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
      correctChars: correctCount,
      incorrectChars: errorCount,
      backspaces: backspaceCount,
      finishPosition: position,
      totalParticipants: mode === 'solo' ? 1 : aiRacers.length + 1,
      xpEarned,
      date: new Date().toISOString(),
    };

    onFinishRace(result);
  };

  // Calculate user progress
  const userProgress = passage.charCount > 0 ? Math.min(1.0, userTyped.length / passage.charCount) : 0;

  let allTrackParticipants: ParticipantTrackData[] = [
    {
      id: user.id,
      name: user.username,
      avatar: user.avatar,
      carId,
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 relative">
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

      {/* Race Top Controls */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-extrabold text-sm text-white truncate max-w-[200px] md:max-w-xs">{passage.title}</span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-xs uppercase border border-rose-500/20 shrink-0">
            {difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
          >
            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={onCancelRace}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 font-bold text-xs"
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
        comboStreak={comboStreak}
      />
    </div>
  );
};
