export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const START_HOUR = 6; // Changed from 8 to 6 AM
export const END_HOUR = 23; // 11 PM
export const TIME_SLOT_MINUTES = 30;

export const TASK_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-rose-100 border-rose-300 text-rose-800',
];

export const PERIODS = {
  morning: { label: 'Morning', start: 6, end: 12, bg: 'bg-amber-50/50' },
  afternoon: { label: 'Afternoon', start: 12, end: 18, bg: 'bg-sky-50/50' },
  evening: { label: 'Evening', start: 18, end: 24, bg: 'bg-indigo-50/50' },
};
