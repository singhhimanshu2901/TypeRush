import { DailyChallenge } from '../types';

export const DAILY_CHALLENGES_DEFAULT: DailyChallenge[] = [
  {
    id: 'dc-races',
    title: 'Daily Track Time',
    description: 'Complete 3 races today in any mode.',
    target: 3,
    currentProgress: 0,
    rewardXp: 150,
    completed: false,
  },
  {
    id: 'dc-wpm',
    title: 'High Velocity',
    description: 'Reach at least 50 WPM in a race.',
    target: 50,
    currentProgress: 0,
    rewardXp: 200,
    completed: false,
  },
  {
    id: 'dc-accuracy',
    title: 'Precision Driver',
    description: 'Finish a race with 96%+ typing accuracy.',
    target: 96,
    currentProgress: 0,
    rewardXp: 180,
    completed: false,
  },
];
