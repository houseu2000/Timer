import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { TASK_COLORS, DAYS_OF_WEEK } from '../constants';
import { X, Clock, Calendar as CalendarIcon, Type, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  initialData: Partial<Task> | null;
  isNew?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialData,
  isNew = false
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    startTime: '09:00',
    duration: 30,
    dayIndex: 0,
    color: TASK_COLORS[0],
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        ...initialData,
        color: initialData.color || TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)],
        duration: initialData.duration || 30,
        dayIndex: initialData.dayIndex !== null && initialData.dayIndex !== undefined ? initialData.dayIndex : 0
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800">
            {isNew ? 'New Task' : 'Edit Task'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Type size={12} /> Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700"
              placeholder="Task name"
              autoFocus
            />
          </div>

          {/* Time & Day Row */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <CalendarIcon size={12} /> Day
              </label>
              <select
                value={formData.dayIndex ?? 0}
                onChange={(e) => handleChange('dayIndex', Number(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 bg-white"
              >
                {DAYS_OF_WEEK.map((day, idx) => (
                  <option key={day} value={idx}>{day}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Clock size={12} /> Start Time
              </label>
              <input
                type="time"
                value={formData.startTime || '09:00'}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Clock size={12} /> Duration
            </label>
            <div className="flex gap-2">
               {[30, 60, 90, 120].map(mins => (
                 <button
                   key={mins}
                   type="button"
                   onClick={() => handleChange('duration', mins)}
                   className={`flex-1 py-1.5 px-2 text-xs rounded-md border transition-all ${
                     formData.duration === mins 
                     ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                     : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                   }`}
                 >
                   {mins}m
                 </button>
               ))}
               <input 
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', Number(e.target.value))}
                  className="w-16 p-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center"
                  min="15"
                  step="15"
               />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Color</label>
             <div className="flex flex-wrap gap-2">
               {TASK_COLORS.map((colorClass) => (
                 <button
                   key={colorClass}
                   type="button"
                   onClick={() => handleChange('color', colorClass)}
                   className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${colorClass.split(' ')[0]} ${
                     formData.color === colorClass ? 'border-slate-600 scale-110 ring-2 ring-offset-1 ring-slate-300' : 'border-transparent'
                   }`}
                 />
               ))}
             </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
             {!isNew && onDelete && (
               <button
                 type="button"
                 onClick={() => { onDelete(formData.id!); onClose(); }}
                 className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
               >
                 <Trash2 size={16} /> Delete
               </button>
             )}
             <div className="flex-1"></div>
             <button
               type="button"
               onClick={onClose}
               className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               Cancel
             </button>
             <button
               type="submit"
               className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
             >
               Save
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};
