export interface DailyProgress {
  date: string;
  solvedCount: number;
  correctCount: number;
  expEarned: number;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastAnsweredDate: string | null;
}
