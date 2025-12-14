
export type TaskType = 'calendar' | 'sidebar';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dayIndex: number | null; // 0 (Mon) - 6 (Sun), or null if in sidebar
  startTime: string | null; // "HH:mm", or null if in sidebar
  duration: number; // in minutes, default 30
  isCompleted: boolean;
  color?: string;
}

export interface Goal {
  id: string;
  text: string;
  isCompleted: boolean;
  color: string; // Goals now have a persistent color
}

export interface WeeklyArchive {
  id: string;
  weekStartDate: string; // ISO date string
  weekLabel: string; // e.g., "2025 - Week 12"
  tasks: Task[];
  goals: Goal[];
  dailyThoughts?: Record<string, string>; // Changed to map of Day -> Content
}

export type Period = 'morning' | 'afternoon' | 'evening';
