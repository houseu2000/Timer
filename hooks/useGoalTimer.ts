import { useEffect, useRef, useState } from 'react';

interface TimerState {
  goalId: string;
  startTime: number;
  accumulated: number;
  isRunning: boolean;
}

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const useGoalTimer = (onStop: (goalId: string, totalSeconds: number) => void) => {
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const [timerDisplay, setTimerDisplay] = useState<number>(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTimer && activeTimer.isRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - activeTimer.startTime) / 1000);
        setTimerDisplay(activeTimer.accumulated + diffInSeconds);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimer]);

  const toggleTimer = (goalId: string) => {
    if (activeTimer && activeTimer.goalId === goalId) {
      if (activeTimer.isRunning) {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - activeTimer.startTime) / 1000);
        setActiveTimer({
          ...activeTimer,
          isRunning: false,
          accumulated: activeTimer.accumulated + diffInSeconds,
        });
      } else {
        setActiveTimer({
          ...activeTimer,
          isRunning: true,
          startTime: Date.now(),
        });
      }
      return;
    }

    setActiveTimer({
      goalId,
      startTime: Date.now(),
      accumulated: 0,
      isRunning: true,
    });
    setTimerDisplay(0);
  };

  const stopTimer = (goalId: string) => {
    if (!activeTimer || activeTimer.goalId !== goalId) return;

    let totalSeconds = activeTimer.accumulated;
    if (activeTimer.isRunning) {
      const now = Date.now();
      totalSeconds += Math.floor((now - activeTimer.startTime) / 1000);
    }

    setActiveTimer(null);
    setTimerDisplay(0);

    if (totalSeconds > 0) {
      onStop(goalId, totalSeconds);
    }
  };

  return {
    activeTimer,
    timerDisplay,
    toggleTimer,
    stopTimer,
  };
};
