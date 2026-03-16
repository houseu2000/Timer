import { describe, expect, it } from 'vitest';
import { formatDate, generateWeekLabel, getCurrentDayIndex, getISOWeekNumber, getLocalDateFromStr, getMonday } from './date';

describe('date utils', () => {
  it('returns monday for dates in same week', () => {
    const monday = getMonday(new Date(2026, 2, 18));
    expect(formatDate(monday)).toBe('2026-03-16');
  });

  it('parses and formats local date string consistently', () => {
    const parsed = getLocalDateFromStr('2026-03-16');
    expect(formatDate(parsed)).toBe('2026-03-16');
  });

  it('calculates ISO week number across year boundary', () => {
    expect(getISOWeekNumber(new Date(2020, 11, 31))).toBe(53);
    expect(getISOWeekNumber(new Date(2021, 0, 1))).toBe(53);
    expect(getISOWeekNumber(new Date(2021, 0, 4))).toBe(1);
  });

  it('builds week label from iso week number', () => {
    expect(generateWeekLabel(new Date(2026, 2, 16))).toBe('2026 - Week 12');
  });

  it('returns current day index in [0, 6]', () => {
    const dayIndex = getCurrentDayIndex();
    expect(dayIndex).toBeGreaterThanOrEqual(0);
    expect(dayIndex).toBeLessThanOrEqual(6);
  });
});
