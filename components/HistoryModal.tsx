import React, { useMemo } from 'react';
import { WeeklyArchive } from '../types';
import { X, Calendar } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  archives: WeeklyArchive[];
  onSelectWeek: (startDate: string) => void;
}

interface WeekBlock {
  startDate: string; // ISO string
  dayLabel: number; // Day of month for the Monday
  archive?: WeeklyArchive;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, archives, onSelectWeek }) => {
  if (!isOpen) return null;

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper: Get the year and month index where the majority of the week falls
  const getMajorityMonthInfo = (date: Date) => {
    // Clone to avoid modifying original
    const thursday = new Date(date);
    // Move to Thursday of this week (Monday + 3 days)
    thursday.setDate(date.getDate() + 3);
    return {
      year: thursday.getFullYear(),
      monthIndex: thursday.getMonth(),
    };
  };

  // Generate a complete map of Year -> Month -> Weeks
  const calendarData = useMemo(() => {
    const data: Record<number, Record<number, WeekBlock[]>> = {};
    
    // 1. Determine the range of years to display
    const currentYear = new Date().getFullYear();
    const archiveYears = archives.map(a => getMajorityMonthInfo(new Date(a.weekStartDate)).year);
    const uniqueYears = Array.from(new Set([currentYear, ...archiveYears])).sort((a, b) => b - a);

    // 2. Helper to get archive for a specific date
    // We match by comparing ISO date strings (YYYY-MM-DD) roughly or just timestamps for the Monday
    const findArchive = (date: Date) => {
      // Normalize comparison to YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      return archives.find(a => a.weekStartDate.startsWith(dateStr));
    };

    // 3. Build the grid for each year
    uniqueYears.forEach(year => {
      data[year] = {};
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        data[year][i] = [];
      }

      // Find the first Monday that could belong to this year
      // Start a bit before the year to catch weeks that straddle years
      const iterDate = new Date(year - 1, 11, 20); 
      
      // Fast forward to first Monday
      while (iterDate.getDay() !== 1) {
        iterDate.setDate(iterDate.getDate() + 1);
      }

      // Loop until we are well into the next year
      while (true) {
        const { year: majorityYear, monthIndex } = getMajorityMonthInfo(iterDate);

        // Optimization: If we've moved past the target year, break
        if (majorityYear > year) break;

        // If this week belongs to the target year, add it
        if (majorityYear === year) {
          data[year][monthIndex].push({
            startDate: iterDate.toISOString(),
            dayLabel: iterDate.getDate(),
            archive: findArchive(iterDate)
          });
        }

        // Move to next week
        iterDate.setDate(iterDate.getDate() + 7);
      }
    });

    return { years: uniqueYears, data };
  }, [archives]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Archive
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="space-y-10">
            {calendarData.years.map((year) => (
              <div key={year} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-sm">{year}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {MONTH_NAMES.map((monthName, mIndex) => {
                    const weeks = calendarData.data[year][mIndex];
                    
                    // Always render the month card
                    return (
                      <div 
                        key={mIndex} 
                        className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col h-full"
                      >
                        <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider border-b border-slate-100 pb-2">
                          {monthName}
                        </div>
                        
                        <div className="flex flex-wrap content-start gap-2 flex-1">
                          {weeks.map((week) => (
                            <button
                              key={week.startDate}
                              onClick={() => onSelectWeek(week.startDate)}
                              className={`
                                w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all
                                ${week.archive 
                                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-110 cursor-pointer ring-2 ring-indigo-100' 
                                  : 'bg-slate-100 text-slate-400 cursor-pointer hover:bg-indigo-100 hover:text-indigo-600 border border-transparent hover:border-indigo-200'
                                }
                              `}
                              title={week.archive 
                                ? `${week.archive.weekLabel} (${new Date(week.startDate).toLocaleDateString()})` 
                                : `Start planning for week of ${new Date(week.startDate).toLocaleDateString()}`
                              }
                            >
                              {week.dayLabel}
                            </button>
                          ))}
                          {weeks.length === 0 && (
                            <span className="text-[10px] text-slate-300 italic">No weeks</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-xl text-right shrink-0">
          <div className="text-xs text-slate-400 mr-4 inline-block">
             <span className="inline-block w-3 h-3 bg-indigo-600 rounded mr-1 align-middle"></span> Archived
             <span className="inline-block w-3 h-3 bg-slate-100 rounded ml-3 mr-1 align-middle"></span> Empty
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
