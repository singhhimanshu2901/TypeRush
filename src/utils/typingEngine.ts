/**
 * TypeRush Engine - Standard Typing Metrics & Performance Calculations
 */

export interface DetailedTypingStats {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  cpm: number; // Characters per minute
  correctChars: number;
  uncorrectedErrors: number;
  correctedErrors: number;
  backspaces: number;
  elapsedSeconds: number;
  speedTier: string;
}

export function calculateGrossWpm(totalChars: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  const minutes = timeSeconds / 60;
  return Math.round((totalChars / 5) / minutes);
}

export function calculateNetWpm(correctChars: number, errors: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  const minutes = timeSeconds / 60;
  const netWords = (correctChars - errors) / 5;
  return Math.max(0, Math.round(netWords / minutes));
}

export function calculateAccuracy(correctChars: number, totalEvaluated: number): number {
  if (totalEvaluated <= 0) return 100;
  const rawAcc = (correctChars / totalEvaluated) * 100;
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
  return Math.round(baseSpeed * accuracyMultiplier);
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

  return Math.round(baseXP * difficultyMultiplier);
}
