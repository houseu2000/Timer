import { useEffect, useState } from 'react';
import { END_HOUR, START_HOUR } from '../constants';
import { getLocalDateFromStr, getMonday } from '../utils/date';

export const useCurrentTimeLine = (currentWeekStartDate: string, slotHeightPx: number) => {
  const [currentTimeLineTop, setCurrentTimeLineTop] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const viewingDate = getLocalDateFromStr(currentWeekStartDate);
      const currentMonday = getMonday(now);
      const isViewingCurrentWeek = viewingDate.getTime() === currentMonday.getTime();

      if (!isViewingCurrentWeek) {
        setCurrentTimeLineTop(null);
        return;
      }

      const h = now.getHours();
      const m = now.getMinutes();

      if (h >= START_HOUR && h <= END_HOUR) {
        const totalMinutesFromStart = (h - START_HOUR) * 60 + m;
        const pixelsPerMinute = slotHeightPx / 30;
        setCurrentTimeLineTop(totalMinutesFromStart * pixelsPerMinute);
      } else {
        setCurrentTimeLineTop(null);
      }
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 60000);

    return () => window.clearInterval(intervalId);
  }, [currentWeekStartDate, slotHeightPx]);

  return currentTimeLineTop;
};
