import React from 'react';
import { Task } from '../types';
import { GripVertical, Check, X, Trash2 } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onClick?: (task: Task) => void;
  isSidebar?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onDragStart, 
  onToggleComplete, 
  onDelete,
  onClick,
  isSidebar = false 
}) => {
  // Reduced padding for calendar items to fit in smaller slots
  const baseClasses = `
    relative group flex flex-col justify-between rounded-md border text-xs shadow-sm cursor-grab active:cursor-grabbing transition-all overflow-hidden
    ${task.isCompleted ? 'opacity-60 grayscale' : 'opacity-100'}
    ${task.color || 'bg-white border-slate-200'}
    ${isSidebar ? 'p-2 mb-2 w-full h-auto min-h-[60px]' : 'p-1 h-full w-full absolute inset-0 z-10 hover:z-20 hover:shadow-md'}
  `;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick && onClick(task)}
      className={baseClasses}
      style={!isSidebar ? { height: '100%' } : {}}
      title={task.title}
    >
      <div className="flex items-start justify-between w-full pointer-events-none">
        <span className={`font-medium truncate leading-tight ${task.isCompleted ? 'line-through' : ''}`}>
          {task.title}
        </span>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/70 rounded px-1 absolute right-1 top-1 z-30 pointer-events-auto">
           {/* Actions */}
           <button 
            onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
            className="hover:text-green-600 p-0.5"
          >
            {task.isCompleted ? <X size={12} /> : <Check size={12} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="hover:text-red-600 p-0.5"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {!isSidebar && (
        <div className="mt-auto flex items-center text-[9px] text-gray-600 opacity-80 pointer-events-none">
           {task.startTime} ({task.duration}m)
        </div>
      )}
      
      {isSidebar && (
         <div className="mt-2 flex justify-end pointer-events-none">
            <GripVertical size={14} className="text-gray-400" />
         </div>
      )}
    </div>
  );
};
