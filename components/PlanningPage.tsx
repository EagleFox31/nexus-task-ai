import React, { useState, useEffect } from 'react';
import { Task, Project, WeekCycle, Effort, TaskStatus, Priority, EFFORT_TO_HOURS, EFFORT_LABELS } from '../types';
import { storageService } from '../services/storageService';
import { ArrowLeft, Inbox, Briefcase, Calendar, ChevronRight, AlertCircle, Sparkles, Check, Flame, Battery, BatteryCharging, BatteryWarning, ArrowRightCircle, CheckCircle2, Clock } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { useLanguage } from '../contexts/LanguageContext';

interface PlanningPageProps {
  tasks: Task[];
  projects: Project[];
  onBack: () => void;
  onUpdateTask: (task: Task) => void;
  currentCycle: WeekCycle;
  onUpdateCycle: (cycle: WeekCycle) => void;
  onCloseCycle: () => void; // New Prop
}

export const PlanningPage: React.FC<PlanningPageProps> = ({ 
  tasks, projects, onBack, onUpdateTask, currentCycle, onUpdateCycle, onCloseCycle 
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'inbox' | 'projects'>('inbox');
  const [themeInput, setThemeInput] = useState(currentCycle.theme);
  
  // Calculate Capacity in HOURS
  // Default target if not set (legacy) is 20, treating as hours now.
  
  const calculateHours = (taskList: Task[]) => {
      return taskList.reduce((acc, t) => acc + (EFFORT_TO_HOURS[t.effort || Effort.QUICK] || 0.25), 0);
  };

  const usedHours = calculateHours(tasks.filter(t => t.cycleId === currentCycle.id && t.status !== TaskStatus.DONE));
  const targetHours = currentCycle.capacityTarget || 20;
  const capacityPercent = Math.min((usedHours / targetHours) * 100, 100);

  // Filter Tasks
  const inboxTasks = tasks.filter(t => !t.cycleId && !t.projectId && t.status !== TaskStatus.DONE);
  const backlogTasks = tasks.filter(t => !t.cycleId && t.projectId && t.status !== TaskStatus.DONE);
  const weekTasks = tasks.filter(t => t.cycleId === currentCycle.id);

  const handleSaveTheme = () => {
      onUpdateCycle({ ...currentCycle, theme: themeInput });
  };

  const moveToWeek = (task: Task) => {
      onUpdateTask({ ...task, cycleId: currentCycle.id });
  };

  const removeFromWeek = (task: Task) => {
      onUpdateTask({ ...task, cycleId: undefined });
  };

  const getCapacityColor = () => {
      if (usedHours > targetHours) return 'text-red-500 bg-red-100 dark:bg-red-500';
      if (usedHours > targetHours * 0.8) return 'text-orange-500 bg-orange-100 dark:bg-orange-500';
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* HEADER: CAPACITY & THEME */}
        <div className="glass-panel p-4 rounded-2xl mb-4 flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-4 w-full lg:w-auto">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        {t('plan.title')} <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">{currentCycle.id}</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <input 
                            type="text" 
                            value={themeInput}
                            onChange={(e) => setThemeInput(e.target.value)}
                            onBlur={handleSaveTheme}
                            placeholder={t('plan.theme.placeholder')}
                            className="bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-nexus-500 text-sm text-slate-700 dark:text-nexus-300 placeholder-slate-400 dark:placeholder-slate-600 outline-none w-full lg:w-64 transition-all truncate"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                {/* CLOSE BUTTON */}
                <button 
                    onClick={onCloseCycle}
                    className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm order-2 sm:order-1"
                    title="Clôturer cette semaine pour démarrer la suivante"
                >
                    <CheckCircle2 size={16} /> {t('plan.close')}
                </button>
                
                {/* CAPACITY GAUGE */}
                <div className="flex items-center justify-between sm:justify-start gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700/50 order-1 sm:order-2">
                    <div className="flex flex-col items-end">
                        <span className={`text-lg font-bold font-mono ${getCapacityColor().split(' ')[0]}`}>
                            {usedHours}h <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {targetHours}h</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase tracking-wider font-bold">{t('plan.budget')}</span>
                    </div>
                    <div className="h-10 w-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end">
                        <div 
                            className={`w-full transition-all duration-500 ${getCapacityColor().split(' ')[1]}`} 
                            style={{ height: `${capacityPercent}%` }} 
                        />
                    </div>
                    {usedHours > targetHours && (
                        <div className="text-red-500 dark:text-red-400 animate-pulse" title="Surcharge détectée !">
                            <Flame size={20} />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* MAIN SPLIT VIEW */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
            
            {/* LEFT: STOCKAGE (Inbox/Backlog) */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden min-h-0">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700/50 flex gap-2 shrink-0">
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'inbox' ? 'bg-nexus-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                    >
                        <Inbox size={14} /> {t('plan.inbox')} ({inboxTasks.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('projects')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                    >
                        <Briefcase size={14} /> {t('plan.projects')} ({backlogTasks.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {(activeTab === 'inbox' ? inboxTasks : backlogTasks).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                            <Sparkles size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">{t('plan.empty.bucket')}</p>
                        </div>
                    )}
                    {(activeTab === 'inbox' ? inboxTasks : backlogTasks).map(task => (
                        <div key={task.id} className="group flex items-start gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-nexus-500/50 transition-all shadow-sm">
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{task.title}</h4>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 rounded ml-2 whitespace-nowrap flex items-center gap-1 border border-slate-200 dark:border-slate-800">
                                        <Clock size={10} />
                                        {EFFORT_LABELS[task.effort as Effort] || '15m'}
                                    </span>
                                </div>
                                {task.projectId && (
                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${projects.find(p => p.id === task.projectId)?.color || 'bg-slate-500'}`} />
                                        {projects.find(p => p.id === task.projectId)?.title}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => moveToWeek(task)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white text-slate-400 rounded-lg transition-colors"
                                title="Ajouter à la semaine"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: ACTIVE WEEK */}
            <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-nexus-500/20 overflow-hidden relative min-h-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                         <Calendar className="text-nexus-500 dark:text-nexus-400" size={18} />
                         {t('plan.week.title')}
                     </div>
                     <span className="text-xs text-slate-500 dark:text-slate-400">{weekTasks.length} tâches</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                     {weekTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-8 text-center">
                            <ArrowRightCircle size={40} className="mb-4 text-nexus-500/20" />
                            <h3 className="text-slate-900 dark:text-white font-bold mb-1">{t('plan.week.empty.title')}</h3>
                            <p className="text-sm">{t('plan.week.empty.desc')}</p>
                        </div>
                     ) : (
                         weekTasks.map(task => (
                             <div key={task.id} className="group relative flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-nexus-500/50 transition-all shadow-sm">
                                 <button 
                                    onClick={() => removeFromWeek(task)}
                                    className="mt-0.5 text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                    title="Retirer de la semaine"
                                 >
                                     <AlertCircle size={16} />
                                 </button>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex items-center justify-between">
                                         <span className={`text-sm font-medium ${task.status === TaskStatus.DONE ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                             {task.title}
                                         </span>
                                         {/* Effort Selector Small */}
                                         <div className="flex bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 ml-2">
                                             {[Effort.QUICK, Effort.MEDIUM, Effort.HEAVY, Effort.MONSTER].map(pts => (
                                                 <button 
                                                    key={pts}
                                                    onClick={() => onUpdateTask({ ...task, effort: pts })}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold transition-colors ${task.effort === pts ? 'bg-nexus-500 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                                 >
                                                     {EFFORT_LABELS[pts as Effort]}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                     {task.projectId && (
                                         <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                             {projects.find(p => p.id === task.projectId)?.title}
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ))
                     )}
                </div>
            </div>

        </div>
    </div>
  );
};