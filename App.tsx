import React, { useState, useEffect, useRef } from 'react';
import { DAYS_OF_WEEK, START_HOUR, END_HOUR, PERIODS, TASK_COLORS } from './constants';
import { Task, Goal, WeeklyArchive, Period } from './types';
import { TaskItem } from './components/TaskItem';
import { HistoryModal } from './components/HistoryModal';
import { TaskModal } from './components/TaskModal';
import { Plus, Archive, Bell, CheckCircle2, Circle, Clock, GripVertical, Menu, X, LogOut, Save, User as UserIcon, ChevronLeft, ChevronRight, Play, Pause, Square } from 'lucide-react';

// Utility to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to determine period based on hour
const getPeriod = (hour: number): Period => {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// Helper: Get Monday of the week for any date
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(date.setDate(diff));
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Helper: Get Local ISO-like string YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Parse YYYY-MM-DD to local Date object
const getLocalDateFromStr = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Helper: Format seconds to MM:SS
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface TimerState {
  goalId: string;
  startTime: number; // Timestamp when start was clicked
  accumulated: number; // Seconds accumulated before current pause
  isRunning: boolean;
}

export default function App() {
  // -- State --
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyThoughts, setDailyThoughts] = useState<Record<string, string>>({});
  const [archives, setArchives] = useState<WeeklyArchive[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  
  // Track which week we are currently viewing
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<string>(formatDate(getMonday(new Date())));
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [currentWeekLabel, setCurrentWeekLabel] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentTimeLineTop, setCurrentTimeLineTop] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Timer State
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const [timerDisplay, setTimerDisplay] = useState<number>(0); // For UI updates

  // Grid Configuration
  const SLOT_HEIGHT_REM = 2; // h-8 is 2rem
  const SLOT_HEIGHT_PX = 32;

  // -- Refs --
  const dragItem = useRef<{ id: string, type: 'TASK' | 'GOAL' } | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Static Storage Keys for Single User
  const STORAGE_KEY = 'weekly_planner_data_v1';
  const HISTORY_KEY = 'weekly_planner_history_v1';

  // -- Data Loading --
  useEffect(() => {
    // Set expanded day to today by default
    const d = new Date();
    const todayIndex = (d.getDay() + 6) % 7;
    setExpandedDay(DAYS_OF_WEEK[todayIndex]);

    // Load current state
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTasks(parsed.tasks || []);
      setGoals(parsed.goals || []);
      
      if (typeof parsed.dailyThoughts === 'string') {
        setDailyThoughts({ [DAYS_OF_WEEK[todayIndex]]: parsed.dailyThoughts });
      } else {
        setDailyThoughts(parsed.dailyThoughts || {});
      }
      
      if (parsed.currentWeekStartDate) {
        setCurrentWeekStartDate(parsed.currentWeekStartDate);
        setCurrentWeekLabel(generateWeekLabel(new Date(parsed.currentWeekStartDate)));
      } else {
        const monday = getMonday(new Date());
        setCurrentWeekStartDate(formatDate(monday));
        setCurrentWeekLabel(generateWeekLabel(monday));
      }

    } else {
       const monday = getMonday(new Date());
       setCurrentWeekStartDate(formatDate(monday));
       setCurrentWeekLabel(generateWeekLabel(monday));
    }

    // Load History
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      setArchives(JSON.parse(savedHistory));
    } else {
      setArchives([]);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    }

    setIsLoaded(true);
  }, []);

  // -- Persistence Effect (Current View) --
  useEffect(() => {
    if (!isLoaded) return;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      goals,
      dailyThoughts,
      currentWeekStartDate,
      weekLabel: currentWeekLabel
    }));
  }, [tasks, goals, dailyThoughts, currentWeekLabel, currentWeekStartDate, isLoaded]);

  // -- Auto-Sync to History Effect --
  useEffect(() => {
    if (!isLoaded || !currentWeekStartDate) return;

    setArchives(prevArchives => {
      const existingIndex = prevArchives.findIndex(a => a.weekStartDate === currentWeekStartDate);
      
      // Only save if there is actual content
      const hasContent = tasks.length > 0 || goals.length > 0 || Object.values(dailyThoughts).some((t) => (t as string).trim().length > 0);

      if (!hasContent) {
        if (existingIndex >= 0) {
          const newArchives = prevArchives.filter((_, idx) => idx !== existingIndex);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(newArchives));
          return newArchives;
        }
        return prevArchives;
      }

      const currentArchiveData: WeeklyArchive = {
        id: existingIndex >= 0 ? prevArchives[existingIndex].id : generateId(),
        weekStartDate: currentWeekStartDate,
        weekLabel: currentWeekLabel,
        tasks: [...tasks],
        goals: [...goals],
        dailyThoughts: {...dailyThoughts}
      };

      let newArchives;
      if (existingIndex >= 0) {
        newArchives = [...prevArchives];
        newArchives[existingIndex] = currentArchiveData;
      } else {
        newArchives = [currentArchiveData, ...prevArchives];
      }
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newArchives));
      return newArchives;
    });
  }, [tasks, goals, dailyThoughts, currentWeekLabel, currentWeekStartDate, isLoaded]);

  // -- Clock & Reminder Logic --
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const viewingDate = new Date(currentWeekStartDate);
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
        const pixelsPerMinute = SLOT_HEIGHT_PX / 30;
        setCurrentTimeLineTop(totalMinutesFromStart * pixelsPerMinute);
      } else {
        setCurrentTimeLineTop(null);
      }
    };

    updateTime(); 
    const intervalId = setInterval(updateTime, 60000); 

    return () => clearInterval(intervalId);
  }, [tasks, notificationsEnabled, currentWeekStartDate]);

  // -- Timer Logic --
  useEffect(() => {
    if (activeTimer && activeTimer.isRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - activeTimer.startTime) / 1000);
        setTimerDisplay(activeTimer.accumulated + diffInSeconds);
      }, 1000);
    } else {
       if (timerIntervalRef.current) {
         clearInterval(timerIntervalRef.current);
         timerIntervalRef.current = null;
       }
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
         // Pause
         const now = Date.now();
         const diffInSeconds = Math.floor((now - activeTimer.startTime) / 1000);
         setActiveTimer({
            ...activeTimer,
            isRunning: false,
            accumulated: activeTimer.accumulated + diffInSeconds
         });
       } else {
         // Resume
         setActiveTimer({
            ...activeTimer,
            isRunning: true,
            startTime: Date.now()
         });
       }
    } else {
      // Start new timer (implicit reset of previous if any, though UI blocks it)
      setActiveTimer({
        goalId,
        startTime: Date.now(),
        accumulated: 0,
        isRunning: true
      });
      setTimerDisplay(0);
    }
  };

  const stopTimer = (goalId: string) => {
    if (!activeTimer || activeTimer.goalId !== goalId) return;
    
    // Calculate final time
    let totalSeconds = activeTimer.accumulated;
    if (activeTimer.isRunning) {
      const now = Date.now();
      totalSeconds += Math.floor((now - activeTimer.startTime) / 1000);
    }
    
    // Reset timer
    setActiveTimer(null);
    setTimerDisplay(0);

    // Create Task if duration is valid (> 0)
    // Even if it's 1 second, we want to log it as a minimum 15-minute block.
    if (totalSeconds > 0) {
      const minutes = Math.ceil(totalSeconds / 60);
      const roundedDuration = Math.max(15, Math.ceil(minutes / 15) * 15); // Round up to nearest 15, minimum 15
      
      const goal = goals.find(g => g.id === goalId);
      
      // Determine task placement: Today, Current Time
      // We subtract the duration from current time to show "When I did it"
      // Note: We use the actual duration for calculating start time, then snap the grid display.
      const now = new Date();
      const startTime = new Date(now.getTime() - (totalSeconds * 1000));
      
      let h = startTime.getHours();
      const m = startTime.getMinutes();
      
      // Clamp to grid
      if (h < START_HOUR) h = START_HOUR;
      
      // Snap to nearest 30m slot for vertical alignment consistency
      const timeString = `${h.toString().padStart(2, '0')}:${m < 30 ? '00' : '30'}`; 
      const todayIndex = getCurrentDayIndex();

      createTaskFromGoal(
        `${goal?.text || 'Focus Session'} (Timer)`,
        todayIndex,
        timeString,
        goal?.color || TASK_COLORS[2],
        roundedDuration,
        true // Mark as Completed
      );
    }
  };

  const generateWeekLabel = (d: Date) => {
    return `${d.getFullYear()} - Week ${getWeekNumber(d)}`;
  };

  const getWeekNumber = (d: Date) => {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((d.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
  };

  const getCurrentDayIndex = () => {
    const d = new Date();
    return (d.getDay() + 6) % 7;
  };

  const handleManualSave = () => {
    if (!isLoaded) return;
    
    // Force Save Current View
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      goals,
      dailyThoughts,
      currentWeekStartDate,
      weekLabel: currentWeekLabel
    }));

    // Archives are updated via useEffect, but we can force a sync message
    alert(`Data saved successfully for ${currentWeekLabel}!`);
  };

  // -- Event Handlers --

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    dragItem.current = { id: taskId, type: 'TASK' };
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGoalDragStart = (e: React.DragEvent, goalId: string) => {
    dragItem.current = { id: goalId, type: 'GOAL' };
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnGrid = (dayIndex: number, hour: number, minute: number) => {
    if (!dragItem.current) return;
    
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    if (dragItem.current.type === 'TASK') {
      const taskId = dragItem.current.id;
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            dayIndex,
            startTime: timeString,
          };
        }
        return t;
      }));
    } else if (dragItem.current.type === 'GOAL') {
      const goal = goals.find(g => g.id === dragItem.current?.id);
      if (goal) {
         createTaskFromGoal(goal.text, dayIndex, timeString, goal.color);
      }
    }

    dragItem.current = null;
    setIsSidebarOpen(false); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const addGoal = () => {
    if (!newGoalText.trim()) return;
    const newGoal: Goal = {
      id: generateId(),
      text: newGoalText,
      isCompleted: false,
      color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)]
    };
    setGoals([...goals, newGoal]);
    setNewGoalText('');
  };

  const createTaskFromGoal = (text: string, dayIndex: number, startTime: string, color: string, duration = 30, isCompleted = false) => {
    const newTask: Task = {
      id: generateId(),
      title: text,
      dayIndex: dayIndex,
      startTime: startTime,
      duration: duration,
      isCompleted: isCompleted,
      color: color 
    };
    setTasks(prev => [...prev, newTask]);
  };

  const addTaskToToday = (goal: Goal) => {
    const today = getCurrentDayIndex();
    const now = new Date();
    let h = now.getHours();
    if (h < START_HOUR) h = START_HOUR;
    if (h >= END_HOUR) h = START_HOUR; 
    const m = now.getMinutes() < 30 ? '00' : '30';
    
    createTaskFromGoal(goal.text, today, `${h.toString().padStart(2, '0')}:${m}`, goal.color);
    setIsSidebarOpen(false);
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
      const current = getLocalDateFromStr(currentWeekStartDate);
      const offset = direction === 'next' ? 7 : -7;
      current.setDate(current.getDate() + offset);
      const newDateStr = formatDate(current);
      handleSelectWeek(newDateStr);
  };

  // -- Modal & Editing Handlers --

  const handleGridClick = (dayIndex: number, h: number, m: number) => {
    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    setEditingTask({
      id: undefined, 
      dayIndex,
      startTime: timeString,
      duration: 30,
      title: '',
      color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)]
    });
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskData.id) {
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        ...(taskData as Task),
        id: generateId(),
        isCompleted: false,
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleDeleteTask = (taskId: string) => {
     setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSelectWeek = (startDate: string) => {
    const targetDateStr = startDate.split('T')[0];
    const existingArchive = archives.find(a => a.weekStartDate.startsWith(targetDateStr));
    
    if (existingArchive) {
        setTasks(existingArchive.tasks);
        setGoals(existingArchive.goals);
        if (!existingArchive.dailyThoughts) {
          setDailyThoughts({});
        } else if (typeof existingArchive.dailyThoughts === 'string') {
          setDailyThoughts({ "Mon": existingArchive.dailyThoughts }); 
        } else {
          setDailyThoughts(existingArchive.dailyThoughts);
        }
        setCurrentWeekLabel(existingArchive.weekLabel);
    } else {
        setTasks([]);
        setGoals([]);
        setDailyThoughts({});
        const d = new Date(startDate);
        setCurrentWeekLabel(generateWeekLabel(d));
    }
    
    setCurrentWeekStartDate(targetDateStr);
    setIsHistoryOpen(false);
  };

  // -- Render Helpers --
  
  const renderTimeSlots = () => {
    const slots = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      slots.push({ h, m: 0 });
      slots.push({ h, m: 30 });
    }
    return slots;
  };

  const timeSlots = renderTimeSlots();
  const currentDayIndex = getCurrentDayIndex();
  const weekStart = getLocalDateFromStr(currentWeekStartDate);

  return (
    <div className="h-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Weekly Focus
                </h1>
                <p className="hidden md:block text-sm text-slate-500">{currentWeekLabel}</p>
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => handleWeekChange('prev')}
                  className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all"
                  title="Previous Week"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                  onClick={() => handleWeekChange('next')}
                  className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all"
                  title="Next Week"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 items-center">
          <button 
            onClick={handleManualSave}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            title="Save Data"
          >
            <Save size={18} />
            <span className="hidden md:inline">Save</span>
          </button>
          
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Archive size={18} />
            <span className="hidden md:inline">History</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Time Grid */}
        <div className="flex-1 overflow-auto scrollbar-thin relative bg-white">
          <div className="min-w-[700px] md:min-w-full inline-block min-h-full">
            
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex border-b border-slate-200 bg-white shadow-sm">
               <div className="sticky left-0 z-40 w-16 md:w-20 shrink-0 p-3 text-center font-bold text-slate-500 border-r border-slate-100 text-sm uppercase tracking-wide bg-white flex items-center justify-center">
                 Time
               </div>
               
               <div className="flex flex-1">
                 {DAYS_OF_WEEK.map((day, i) => {
                    const isToday = i === currentDayIndex && getMonday(new Date()).getTime() === new Date(currentWeekStartDate).getTime();
                    const colDate = new Date(weekStart);
                    colDate.setDate(weekStart.getDate() + i);
                    const dateStr = `${colDate.getMonth() + 1}.${colDate.getDate()}`;

                    return (
                      <div key={day} className={`flex-1 min-w-[80px] p-2 text-center border-r border-slate-100 last:border-0 bg-white ${isToday ? 'bg-indigo-50/50' : ''}`}>
                        <div className={`flex flex-col items-center justify-center`}>
                          <span className={`text-base font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {day}
                          </span>
                          <span className={`text-sm ${isToday ? 'text-indigo-500 font-semibold' : 'text-slate-400'}`}>
                            {dateStr}
                          </span>
                        </div>
                        {isToday && <span className="block mt-0.5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Today</span>}
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Main Grid Body */}
            <div className="flex relative min-h-[calc(100%-50px)]">
              
              <div className="sticky left-0 z-20 w-16 md:w-20 shrink-0 bg-white border-r border-slate-100">
                {timeSlots.map((slot, index) => (
                  <div key={`time-${index}`} className="h-8 border-b border-slate-100 text-sm font-medium text-slate-500 flex items-start justify-center pt-1 leading-none bg-white">
                    {slot.m === 0 ? `${slot.h}:00` : ''}
                  </div>
                ))}
              </div>

              <div className="flex flex-1 relative">
                {DAYS_OF_WEEK.map((_, dayIndex) => {
                  const isToday = dayIndex === currentDayIndex && getMonday(new Date()).getTime() === new Date(currentWeekStartDate).getTime();
                  return (
                    <div key={`col-${dayIndex}`} className={`flex-1 min-w-[80px] relative border-r border-slate-100 last:border-0 ${isToday ? 'bg-indigo-50/10' : 'bg-white'}`}>
                      
                      {timeSlots.map((slot, slotIndex) => {
                         const period = getPeriod(slot.h);
                         const periodClass = PERIODS[period].bg;
                         return (
                          <div
                            key={`cell-${dayIndex}-${slotIndex}`}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropOnGrid(dayIndex, slot.h, slot.m)}
                            onDoubleClick={() => handleGridClick(dayIndex, slot.h, slot.m)}
                            className={`h-8 border-b border-slate-100 relative group transition-colors hover:bg-indigo-100/30 cursor-pointer ${periodClass}`}
                          >
                             {slot.m === 30 && <div className="absolute top-0 left-0 right-0 border-t border-slate-100/30 pointer-events-none"></div>}
                          </div>
                        );
                      })}

                      {isToday && currentTimeLineTop !== null && (
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none shadow-[0_0_4px_rgba(239,68,68,0.6)]"
                          style={{ top: `${currentTimeLineTop}px` }}
                        >
                           <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      )}

                      {tasks.filter(t => t.dayIndex === dayIndex).map(task => {
                        if (!task.startTime) return null;
                        const [h, m] = task.startTime.split(':').map(Number);
                        const minutesFromStart = (h - START_HOUR) * 60 + m;
                        const slotsFromStart = minutesFromStart / 30;
                        const topPos = slotsFromStart * SLOT_HEIGHT_REM;
                        const height = (task.duration / 30) * SLOT_HEIGHT_REM;

                        return (
                          <div
                            key={task.id}
                            className="absolute inset-x-1 z-10"
                            style={{ top: `${topPos}rem`, height: `${height}rem` }}
                          >
                             <TaskItem 
                                task={task} 
                                onDragStart={handleTaskDragStart}
                                onToggleComplete={(id) => setTasks(prev => prev.map(t => t.id === id ? {...t, isCompleted: !t.isCompleted} : t))}
                                onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
                                onClick={handleTaskClick}
                             />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div 
          className={`
            fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 shadow-2xl
            transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:shadow-xl md:flex md:flex-col
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          onDragOver={handleDragOver}
        >
          <div className="flex md:hidden justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
             <h2 className="font-bold text-slate-700">Tools & Goals</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-200 rounded">
               <X size={20} />
             </button>
          </div>

          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/80">
              <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center uppercase tracking-wider">
                <CheckCircle2 size={16} className="mr-2 text-indigo-500" />
                Weekly Goals & Timer
              </h2>
              
              <div className="space-y-2 mb-4 max-h-[30vh] overflow-y-auto pr-1">
                {goals.map(goal => {
                  const isTimerActive = activeTimer?.goalId === goal.id;
                  
                  return (
                    <div 
                      key={goal.id} 
                      className={`flex flex-col group bg-white rounded border shadow-sm transition-colors border-l-4 ${isTimerActive ? 'ring-2 ring-indigo-200' : ''}`}
                      style={{ borderLeftColor: goal.color ? goal.color.split(' ')[0].replace('bg-', '').replace('-100', '-400') : '#cbd5e1' }}
                    >
                      {/* Goal Header Row */}
                      <div 
                        className="flex items-center p-2 cursor-move"
                        draggable
                        onDragStart={(e) => handleGoalDragStart(e, goal.id)}
                      >
                          <button 
                            onClick={() => setGoals(prev => prev.map(g => g.id === goal.id ? {...g, isCompleted: !g.isCompleted} : g))}
                            className={`mr-2 flex-shrink-0 ${goal.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-400'}`}
                          >
                            {goal.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </button>
                          <span className={`flex-1 text-sm truncate ${goal.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {goal.text}
                          </span>
                          
                          <GripVertical size={12} className="text-slate-300 mr-1 hidden md:block" />
                          
                          <button 
                            onClick={() => addTaskToToday(goal)}
                            className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                            title="Add to Today's Grid"
                          >
                            <Plus size={14} />
                          </button>
                      </div>

                      {/* Timer Control Row */}
                      <div className="flex items-center justify-between px-2 pb-2 pt-0 border-t border-dashed border-slate-100 mt-0.5">
                          <div className="flex items-center gap-1">
                             {!isTimerActive ? (
                               <button 
                                 onClick={() => toggleTimer(goal.id)}
                                 className="flex items-center gap-1 px-2 py-0.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                               >
                                 <Play size={10} fill="currentColor" /> Start
                               </button>
                             ) : (
                               <>
                                 <button 
                                   onClick={() => toggleTimer(goal.id)}
                                   className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors ${
                                     activeTimer.isRunning 
                                     ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200' 
                                     : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                                   }`}
                                 >
                                   {activeTimer.isRunning ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                                   {activeTimer.isRunning ? 'Pause' : 'Resume'}
                                 </button>
                                 <button 
                                   onClick={() => stopTimer(goal.id)}
                                   className="flex items-center gap-1 px-2 py-0.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                                   title="Stop & Log Time"
                                 >
                                   <Square size={10} fill="currentColor" /> Done
                                 </button>
                               </>
                             )}
                          </div>
                          {isTimerActive && (
                             <span className={`text-xs font-mono font-bold ${activeTimer.isRunning ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`}>
                                {formatDuration(timerDisplay)}
                             </span>
                          )}
                      </div>
                    </div>
                  );
                })}
                {goals.length === 0 && (
                  <div className="text-xs text-slate-400 italic text-center py-2">Add goals to track your weekly progress</div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  placeholder="New goal..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button 
                  onClick={addGoal}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 bg-white flex flex-col min-h-0 overflow-y-auto">
               <div className="flex items-center justify-between mb-3 shrink-0">
                   <h2 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                     <Clock size={16} className="mr-2 text-purple-500" />
                     Daily Reflection
                   </h2>
               </div>
               
               <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
                 {DAYS_OF_WEEK.map((day, idx) => {
                   const isSelected = expandedDay === day;
                   const isToday = idx === currentDayIndex && getMonday(new Date()).getTime() === new Date(currentWeekStartDate).getTime();
                   const hasContent = !!dailyThoughts[day] && dailyThoughts[day].trim().length > 0;
                   
                   return (
                     <button
                       key={day}
                       onClick={() => setExpandedDay(isSelected ? null : day)}
                       className={`
                         aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all border
                         ${isSelected 
                           ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' 
                           : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                         }
                       `}
                     >
                       <span className="text-xs font-bold">{day}</span>
                       <div className="flex gap-1 mt-1">
                         {isToday && (
                           <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`} title="Today"></div>
                         )}
                         {hasContent && (
                           <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-slate-300'}`} title="Has notes"></div>
                         )}
                       </div>
                     </button>
                   );
                 })}
               </div>

               {expandedDay ? (
                 <div className="flex-1 flex flex-col min-h-[120px] animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-medium text-slate-500 mb-1 ml-1 flex justify-between">
                       <span>Notes for <span className="text-purple-600 font-bold">{expandedDay}</span></span>
                    </label>
                    <textarea 
                       className="w-full flex-1 p-3 text-sm focus:outline-none border border-slate-200 rounded-lg bg-yellow-50/20 text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-purple-500/20"
                       placeholder={`Write your thoughts for ${expandedDay}...`}
                       value={dailyThoughts[expandedDay] || ''}
                       onChange={(e) => setDailyThoughts(prev => ({ ...prev, [expandedDay]: e.target.value }))}
                       autoFocus
                    />
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-300 text-xs italic border-2 border-dashed border-slate-100 rounded-lg">
                   Select a day to view notes
                 </div>
               )}
            </div>
            
            <div className="p-3 border-t border-slate-200 text-[10px] text-slate-400 text-center bg-slate-50">
               {notificationsEnabled ? (
                  <span className="flex items-center justify-center gap-1 text-green-600"><Bell size={10} /> Reminders On</span>
               ) : (
                  <span className="flex items-center justify-center gap-1 cursor-pointer hover:text-indigo-500" onClick={() => Notification.requestPermission()}>Enable Reminders</span>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Widgets */}
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        archives={archives}
        onSelectWeek={handleSelectWeek}
      />
      
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={editingTask}
        isNew={!editingTask?.id}
      />
      
    </div>
  );
}