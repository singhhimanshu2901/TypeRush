/**
 * TypeRush Engine - Standard Typing Metrics & Monotonic Timing Calculations
 */

export interface DetailedTypingStats {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  cpm: number;
  correctChars: number;
  uncorrectedErrors: number;
  backspaces: number;
  elapsedSeconds: number;
  speedTier: string;
}

/**
 * Standard Gross WPM Formula:
 * Gross WPM = (Total Typed Characters / 5) / Elapsed Minutes
 */
export function calculateGrossWpm(totalChars: number, timeSeconds: number): number {
  if (!timeSeconds || timeSeconds <= 0 || !isFinite(timeSeconds)) return 0;
  const minutes = timeSeconds / 60;
  const rawWpm = (totalChars / 5) / minutes;
  return isFinite(rawWpm) ? Math.max(0, Math.round(rawWpm)) : 0;
}

/**
 * Standard Net WPM Formula:
 * Net WPM = ((Correct Typed Characters - Uncorrected Errors) / 5) / Elapsed Minutes
 */
export function calculateNetWpm(correctChars: number, errors: number, timeSeconds: number): number {
  if (!timeSeconds || timeSeconds <= 0 || !isFinite(timeSeconds)) return 0;
  const minutes = timeSeconds / 60;
  const netWords = (correctChars - errors) / 5;
  const rawWpm = netWords / minutes;
  return isFinite(rawWpm) ? Math.max(0, Math.round(rawWpm)) : 0;
}

/**
 * High-Precision Monotonic WPM Calculation from Milliseconds (performance.now())
 */
export function calculateNetWpmFromMs(correctChars: number, errors: number, elapsedMs: number): number {
  if (!elapsedMs || elapsedMs <= 0 || !isFinite(elapsedMs)) return 0;
  const elapsedSeconds = elapsedMs / 1000;
  return calculateNetWpm(correctChars, errors, elapsedSeconds);
}

export function calculateAccuracy(correctChars: number, totalEvaluated: number): number {
  if (!totalEvaluated || totalEvaluated <= 0) return 100;
  const rawAcc = (correctChars / totalEvaluated) * 100;
  if (!isFinite(rawAcc)) return 100;
  return Math.min(100, Math.max(0, Math.round(rawAcc * 10) / 10));
}

export function getSpeedTier(netWpm: number): string {
  if (netWpm >= 110) return 'Hypersonic Grandmaster ⚡';
  if (netWpm >= 85) return 'Supersonic Racer 🏁';
  if (netWpm >= 60) return 'Pro Driver 🏎️';
  if (netWpm >= 40) return 'Street Racer 💨';
  if (netWpm >= 20) return 'Speed Amateur 🚗';
  return 'Rookie Student 🚦';
}

export function calculateCarSpeedMph(wpm: number, accuracy: number): number {
  const baseSpeed = wpm * 1.8;
  const accuracyMultiplier = accuracy / 100;
  const speed = Math.round(baseSpeed * accuracyMultiplier);
  return isFinite(speed) ? Math.max(0, speed) : 0;
}

export function calculateXpEarned(
  netWpm: number,
  accuracy: number,
  finishPosition: number,
  difficultyMultiplier: number = 1
): number {
  let baseXP = netWpm * 2.5;
  if (accuracy >= 98) baseXP += 60;
  else if (accuracy >= 95) baseXP += 30;

  if (finishPosition === 1) baseXP += 120;
  else if (finishPosition === 2) baseXP += 60;
  else if (finishPosition === 3) baseXP += 30;

  const xp = Math.round(baseXP * difficultyMultiplier);
  return isFinite(xp) ? Math.max(0, xp) : 0;
}
