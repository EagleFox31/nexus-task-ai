import React, { useState } from 'react';
import { Task, SubTask, TaskStatus, Priority } from '../types';
import { breakDownTask, suggestEvolution } from '../services/geminiService';
import { CheckCircle2, Circle, MoreVertical, Sparkles, Wand2, ChevronDown, ChevronUp, Trash2, Timer } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusToggle = () => {
    let nextStatus = TaskStatus.TODO;
    if (task.status === TaskStatus.TODO) nextStatus = TaskStatus.IN_PROGRESS;
    else if (task.status === TaskStatus.IN_PROGRESS) nextStatus = TaskStatus.DONE;
    // else DONE -> TODO (starts over)
    
    onUpdate({ ...task, status: nextStatus });
  };

  const handleSubtaskToggle = (subTaskId: string) => {
    const newSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subTasks: newSubTasks });
  };

  const handleSmartBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.subTasks.length > 0 && !confirm("Remplacer les sous-tâches existantes par une suggestion IA ?")) return;
    
    setIsProcessing(true);
    setExpanded(true);
    
    const subTaskTitles = await breakDownTask(task.title, task.description);
    const newSubTasks: SubTask[] = subTaskTitles.map((t, i) => ({
        id: Date.now().toString() + i,
        title: t,
        completed: false
    }));
    
    const evolution = await suggestEvolution(task);

    onUpdate({ 
        ...task, 
        subTasks: newSubTasks,
        aiAnalysis: evolution
    });
    setIsProcessing(false);
  };

  const priorityColor = {
    [Priority.LOW]: 'bg-slate-600',
    [Priority.MEDIUM]: 'bg-blue-600',
    [Priority.HIGH]: 'bg-rose-600',
  };

  const getStatusStyles = () => {
    switch(task.status) {
        case TaskStatus.IN_PROGRESS:
            return {
                label: 'En cours',
                badgeClass: 'bg-nexus-500/20 text-nexus-300 border-nexus-500/30',
                containerClass: 'bg-nexus-800 border-nexus-500/40 shadow-lg shadow-nexus-500/10',
                icon: <Timer size={22} className="text-nexus-400" />
            };
        case TaskStatus.DONE:
            return {
                label: 'Terminé',
                badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                containerClass: 'bg-nexus-900 border-slate-800 opacity-60',
                icon: <CheckCircle2 size={22} className="text-nexus-accent" />
            };
        default:
            return {
                label: 'À faire',
                badgeClass: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
                containerClass: 'bg-nexus-800 border-slate-700/50',
                icon: <Circle size={22} className="text-slate-500 hover:text-slate-400" />
            };
    }
  }

  const statusStyle = getStatusStyles();

  const completedSubtasks = task.subTasks.filter(st => st.completed).length;
  const totalSubtasks = task.subTasks.length;
  const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

  return (
    <div 
        className={`group relative rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-nexus-900/50 border ${statusStyle.containerClass}`}
    >
      {/* Priority Badge */}
      <div className={`absolute left-0 top-8 w-1 h-8 rounded-r-full ${priorityColor[task.priority]}`} />

      <div className="pl-3 flex items-start gap-3">
        <button 
            onClick={handleStatusToggle} 
            className="mt-3 hover:scale-110 active:scale-95 transition-transform"
            title={`Statut actuel : ${statusStyle.label}. Cliquez pour changer.`}
        >
          {statusStyle.icon}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1 w-full mr-2 overflow-hidden">
                <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit ${statusStyle.badgeClass}`}>
                    {statusStyle.label}
                </span>

                <h4 
                    className={`font-medium text-slate-100 truncate cursor-pointer select-none ${task.status === TaskStatus.DONE ? 'line-through text-slate-500' : ''}`}
                    onClick={() => setExpanded(!expanded)}
                >
                    {task.title}
                </h4>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                 <button onClick={handleSmartBreakdown} disabled={isProcessing} title="Découpage intelligent" className="p-1.5 hover:bg-slate-700 rounded-lg text-nexus-400 transition-colors">
                    {isProcessing ? <Sparkles size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
                <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-slate-700 rounded-lg text-red-400 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
          
          {task.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-1">{task.description}</p>
          )}

          {/* Progress Bar for subtasks */}
          {totalSubtasks > 0 && (
            <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-nexus-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pl-10 pr-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
             {task.aiAnalysis && (
                <div className="bg-gradient-to-r from-nexus-500/10 to-transparent p-3 rounded-lg border-l-2 border-nexus-500">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-nexus-400" />
                        <span className="text-xs font-bold text-nexus-400 uppercase tracking-wide">Conseil IA</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">{task.aiAnalysis}</p>
                </div>
            )}

            <div className="space-y-1">
                {task.subTasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group/sub">
                        <button 
                            onClick={() => handleSubtaskToggle(st.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${st.completed ? 'bg-nexus-500 border-nexus-500' : 'border-slate-600 hover:border-nexus-500'}`}
                        >
                            {st.completed && <CheckCircle2 size={12} className="text-white" />}
                        </button>
                        <span className={`text-sm ${st.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                            {st.title}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="pt-2 border-t border-slate-700/50 flex justify-center">
                 <button onClick={() => setExpanded(false)} className="text-slate-500 hover:text-white transition-colors">
                    <ChevronUp size={16} />
                 </button>
            </div>
        </div>
      )}
      
      {!expanded && totalSubtasks === 0 && (
         <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setExpanded(true)} className="text-slate-500 hover:text-white">
                <ChevronDown size={16} />
            </button>
         </div>
      )}
    </div>
  );
};