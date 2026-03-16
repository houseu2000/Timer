import { describe, expect, it } from 'vitest';
import { hasWeeklyContent, roundSessionDurationMinutes } from './planner';

describe('planner utils', () => {
  it('rounds short sessions up to 15 minutes', () => {
    expect(roundSessionDurationMinutes(1)).toBe(15);
    expect(roundSessionDurationMinutes(14 * 60)).toBe(15);
  });

  it('rounds to nearest 15-minute block upwards', () => {
    expect(roundSessionDurationMinutes(16 * 60)).toBe(30);
    expect(roundSessionDurationMinutes(61 * 60)).toBe(75);
  });

  it('detects empty weekly content', () => {
    expect(hasWeeklyContent([], [], {})).toBe(false);
    expect(hasWeeklyContent([], [], { Mon: '  ' })).toBe(false);
  });

  it('detects non-empty weekly content', () => {
    expect(hasWeeklyContent([{ id: 't1', title: 'Task', dayIndex: 0, startTime: '09:00', duration: 30, isCompleted: false }], [], {})).toBe(true);
    expect(hasWeeklyContent([], [{ id: 'g1', text: 'Goal', isCompleted: false, color: 'bg-blue-100' }], {})).toBe(true);
    expect(hasWeeklyContent([], [], { Tue: 'note' })).toBe(true);
  });
});
