import { Goal, Task } from '../types';

export const roundSessionDurationMinutes = (totalSeconds: number) => {
  const minutes = Math.ceil(totalSeconds / 60);
  return Math.max(15, Math.ceil(minutes / 15) * 15);
};

export const hasWeeklyContent = (
  tasks: Task[],
  goals: Goal[],
  dailyThoughts: Record<string, string>
) => {
  return tasks.length > 0 || goals.length > 0 || Object.values(dailyThoughts).some(text => text.trim().length > 0);
};
