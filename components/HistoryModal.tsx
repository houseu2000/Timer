import React, { useMemo, useState, useEffect } from 'react';
import { WeeklyArchive } from '../types';
import { X, Calendar, ChevronRight } from 'lucide-react';

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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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
    const archiveYears = archives.map(a => getMajorityMonthInfo(new Date(a.weekStartDate)).year);
    
    // Explicitly requested range 2025-2030 for planning
    const requestedRange = [2025, 2026, 2027, 2028, 2029, 2030];
    
    // Combine with existing data years (in case user has old data) and sort ascending
    const uniqueYears = Array.from(new Set([...requestedRange, ...archiveYears])).sort((a, b) => a - b);

    // 2. Helper to get archive for a specific date
    const findArchive = (date: Date) => {
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
      // Start checking from late previous year to find the first week that "belongs" to Jan
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

  // Set default year when opening
  useEffect(() => {
    if (isOpen) {
      // Default to current year if available in list, otherwise the first available year
      const currentYear = new Date().getFullYear();
      if (calendarData.years.includes(currentYear)) {
          setSelectedYear(currentYear);
      } else {
          setSelectedYear(calendarData.years[0]);
      }
    }
  }, [isOpen, calendarData.years]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Archive & Planning
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        {/* Main Body with Sidebar Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar: Years */}
          <div className="w-48 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 flex flex-col gap-2">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Select Year</h3>
             {calendarData.years.map(year => (
               <button
                 key={year}
                 onClick={() => setSelectedYear(year)}
                 className={`
                   w-full text-left px-4 py-3 rounded-lg font-bold flex justify-between items-center transition-all
                   ${selectedYear === year 
                     ? 'bg-indigo-600 text-white shadow-md' 
                     : 'text-slate-600 hover:bg-white hover:shadow-sm'
                   }
                 `}
               >
                 {year}
                 {selectedYear === year && <ChevronRight size={16} />}
               </button>
             ))}
          </div>

          {/* Content: Months Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{selectedYear} Overview</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {MONTH_NAMES.map((monthName, mIndex) => {
                    const weeks = calendarData.data[selectedYear]?.[mIndex] || [];
                    
                    return (
                      <div 
                        key={mIndex} 
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow"
                      >
                        <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between items-center">
                          {monthName}
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">{weeks.length} wks</span>
                        </div>
                        
                        <div className="flex flex-wrap content-start gap-2 flex-1">
                          {weeks.map((week) => (
                            <button
                              key={week.startDate}
                              onClick={() => onSelectWeek(week.startDate)}
                              className={`
                                w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all relative group
                                ${week.archive 
                                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 ring-2 ring-indigo-100' 
                                  : 'bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-500 border border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                                }
                              `}
                              title={week.archive 
                                ? `${week.archive.weekLabel}` 
                                : `Start planning: ${new Date(week.startDate).toLocaleDateString()}`
                              }
                            >
                              {week.dayLabel}
                              {week.archive && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                })}
             </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-white shrink-0 flex justify-between items-center">
           <div className="text-xs text-slate-400">
             Currently viewing: <span className="font-bold text-slate-600">{selectedYear}</span>
           </div>
           <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 bg-indigo-600 rounded"></span> Has Data
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded"></span> Empty
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};