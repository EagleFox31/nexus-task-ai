
import React, { useState, useEffect } from 'react';
import { Task, SubTask, TaskStatus, Priority, Project, Effort, EFFORT_LABELS } from '../types';
import { breakDownTask, suggestEvolution } from '../services/geminiService';
import { CheckCircle2, Circle, Sparkles, Wand2, ChevronDown, ChevronUp, Trash2, Timer, Pencil, Save, X, Folder, Maximize2, Minimize2, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project?: Project; // Project Context
  projects?: Project[]; // All Projects (for selection)
  onUpdate: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, project, projects = [], onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedAdvice, setExpandedAdvice] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority || Priority.LOW);
  const [editProjectId, setEditProjectId] = useState<string>(task.projectId || '');
  const [editEffort, setEditEffort] = useState<number>(task.effort || Effort.QUICK);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority || Priority.LOW);
    setEditProjectId(task.projectId || '');
    setEditEffort(task.effort || Effort.QUICK);
  }, [task]);

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus = TaskStatus.TODO;
    let newSubTasks = [...task.subTasks];

    if (task.status === TaskStatus.TODO) {
        nextStatus = TaskStatus.IN_PROGRESS;
    }
    else if (task.status === TaskStatus.IN_PROGRESS) {
        nextStatus = TaskStatus.DONE;
        if (newSubTasks.length > 0) {
            newSubTasks = newSubTasks.map(st => ({ ...st, completed: true }));
        }
    }
    else if (task.status === TaskStatus.DONE) {
        nextStatus = TaskStatus.TODO;
    }
    
    onUpdate({ ...task, status: nextStatus, subTasks: newSubTasks });
  };

  const handleSubtaskToggle = (subTaskId: string) => {
    const newSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );

    const completedCount = newSubTasks.filter(st => st.completed).length;
    const totalCount = newSubTasks.length;
    let newStatus = task.status;

    if (totalCount > 0) {
        if (completedCount === totalCount) {
            newStatus = TaskStatus.DONE;
        } else if (completedCount > 0) {
            newStatus = TaskStatus.IN_PROGRESS;
        } else {
            newStatus = TaskStatus.TODO;
        }
    }

    onUpdate({ ...task, subTasks: newSubTasks, status: newStatus });
  };

  const handleSmartBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.subTasks.length > 0 && !confirm("Remplacer les sous-tâches existantes par une suggestion IA ?")) return;
    
    setIsProcessing(true);
    setExpanded(true);
    
    const subTaskTitles = await breakDownTask(task, project);
    const newSubTasks: SubTask[] = subTaskTitles.map((t, i) => ({
        id: Date.now().toString() + i,
        title: t,
        completed: false
    }));
    
    const evolution = await suggestEvolution(task, project);

    onUpdate({ 
        ...task, 
        subTasks: newSubTasks,
        aiAnalysis: evolution,
        status: TaskStatus.TODO 
    });
    setIsProcessing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setExpanded(true); 
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!editTitle.trim()) return;
      onUpdate({ 
          ...task, 
          title: editTitle, 
          description: editDesc,
          priority: editPriority,
          projectId: editProjectId || undefined,
          effort: editEffort
      });
      setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditTitle(task.title);
      setEditDesc(task.description);
      setEditPriority(task.priority || Priority.LOW);
      setEditProjectId(task.projectId || '');
      setEditEffort(task.effort || Effort.QUICK);
      setIsEditing(false);
  };

  const currentPriority = task.priority || Priority.LOW;

  const priorityColor = {
    [Priority.LOW]: 'bg-slate-500 dark:bg-slate-600',
    [Priority.MEDIUM]: 'bg-blue-500 dark:bg-blue-600',
    [Priority.HIGH]: 'bg-rose-500 dark:bg-rose-600',
  };

  const getStatusStyles = () => {
    switch(task.status) {
        case TaskStatus.IN_PROGRESS:
            return {
                label: 'En cours',
                badgeClass: 'bg-nexus-50 dark:bg-nexus-500/20 text-nexus-600 dark:text-nexus-300 border-nexus-200 dark:border-nexus-500/30',
                containerClass: 'bg-white dark:bg-nexus-800 border-nexus-300 dark:border-nexus-500/40 shadow-lg shadow-nexus-500/10',
                icon: <Timer size={22} className="text-nexus-500 dark:text-nexus-400" />
            };
        case TaskStatus.DONE:
            return {
                label: 'Terminé',
                badgeClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
                containerClass: 'bg-slate-50 dark:bg-nexus-900 border-slate-200 dark:border-slate-800 opacity-60',
                icon: <CheckCircle2 size={22} className="text-emerald-500 dark:text-nexus-accent" />
            };
        default:
            return {
                label: 'À faire',
                badgeClass: 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/50',
                containerClass: 'bg-white dark:bg-nexus-800 border-slate-200 dark:border-slate-700/50',
                icon: <Circle size={22} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400" />
            };
    }
  }

  const statusStyle = getStatusStyles();

  const completedSubtasks = task.subTasks.filter(st => st.completed).length;
  const totalSubtasks = task.subTasks.length;
  const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

  const isAdviceLong = task.aiAnalysis && task.aiAnalysis.length > 150;

  return (
    <div 
        className={`group relative rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-nexus-900/10 dark:hover:shadow-nexus-900/50 border ${statusStyle.containerClass}`}
        onClick={() => !isEditing && setExpanded(!expanded)}
    >
      <div className={`absolute left-0 top-8 w-1 h-8 rounded-r-full ${priorityColor[currentPriority]}`} />

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
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit ${statusStyle.badgeClass}`}>
                        {statusStyle.label}
                    </span>
                    
                    {!isEditing && project ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${project.color.replace('bg-', 'text-').replace('500', '600 dark:text-400')} border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900`}>
                            <Folder size={10} /> {project.title}
                        </span>
                    ) : null}

                    {/* Effort Badge */}
                    {!isEditing && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock size={10} className="text-yellow-600 dark:text-yellow-500 fill-current" />
                            {EFFORT_LABELS[task.effort as Effort] || '15m'}
                        </span>
                    )}
                </div>

                {isEditing ? (
                    <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-nexus-500 w-full mt-1"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <h4 
                        className={`font-medium text-slate-900 dark:text-slate-100 cursor-pointer select-none transition-all ${
                            task.status === TaskStatus.DONE ? 'line-through text-slate-500' : ''
                        } ${
                            expanded ? 'whitespace-normal break-words' : 'truncate'
                        }`}
                        title={task.title}
                    >
                        {task.title}
                    </h4>
                )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                 {isEditing ? (
                     <>
                        <button onClick={handleSaveEdit} className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-500 dark:text-emerald-400 transition-colors" title="Sauvegarder">
                            <Save size={16} />
                        </button>
                        <button onClick={handleCancelEdit} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors" title="Annuler">
                            <X size={16} />
                        </button>
                     </>
                 ) : (
                     <>
                        <button onClick={handleEditClick} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Modifier">
                            <Pencil size={16} />
                        </button>
                        <button onClick={handleSmartBreakdown} disabled={isProcessing} title="Découpage intelligent" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-nexus-500 dark:text-nexus-400 transition-colors">
                            {isProcessing ? <Sparkles size={16} className="animate-spin" /> : <Wand2 size={16} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-red-500 dark:text-red-400 transition-colors" title="Supprimer">
                            <Trash2 size={16} />
                        </button>
                     </>
                 )}
            </div>
          </div>
          
          {isEditing ? (
              <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                   <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority Selector */}
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-500 uppercase font-bold">Priorité:</span>
                             <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-300 dark:border-slate-700">
                                  <button onClick={() => setEditPriority(Priority.LOW)} className={`px-2 py-1 text-xs rounded-md transition-all ${editPriority === Priority.LOW ? 'bg-slate-500 dark:bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>Low</button>
                                  <button onClick={() => setEditPriority(Priority.MEDIUM)} className={`px-2 py-1 text-xs rounded-md transition-all ${editPriority === Priority.MEDIUM ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>Medium</button>
                                  <button onClick={() => setEditPriority(Priority.HIGH)} className={`px-2 py-1 text-xs rounded-md transition-all ${editPriority === Priority.HIGH ? 'bg-rose-500 dark:bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>High</button>
                             </div>
                        </div>

                        {/* Effort Selector */}
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-500 uppercase font-bold">Durée:</span>
                             <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-300 dark:border-slate-700">
                                  {[Effort.QUICK, Effort.MEDIUM, Effort.HEAVY, Effort.MONSTER].map(pts => (
                                      <button 
                                        key={pts} 
                                        onClick={() => setEditEffort(pts)}
                                        className={`px-2 py-1 text-xs rounded-md transition-all font-bold ${editEffort === pts ? 'bg-nexus-500 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                      >
                                          {EFFORT_LABELS[pts as Effort]}
                                      </button>
                                  ))}
                             </div>
                        </div>

                        {/* Project Selector */}
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-500 uppercase font-bold">Projet:</span>
                             <select 
                                value={editProjectId}
                                onChange={(e) => setEditProjectId(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-900 text-xs text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:border-nexus-500 outline-none max-w-[150px]"
                             >
                                 <option value="">(Aucun / Inbox)</option>
                                 {projects.map(p => (
                                     <option key={p.id} value={p.id}>{p.title}</option>
                                 ))}
                             </select>
                        </div>
                   </div>
                   <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Ajouter une description..." className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-800 dark:text-slate-300 w-full focus:outline-none focus:border-nexus-500 min-h-[60px]" />
              </div>
          ) : (
             task.description && (
                <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${expanded ? '' : 'line-clamp-1'}`}>
                    {task.description}
                </p>
             )
          )}

          {totalSubtasks > 0 && !isEditing && (
            <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${task.status === TaskStatus.DONE ? 'bg-emerald-500' : 'bg-nexus-500'}`} style={{ width: `${progress}%` }} />
                </div>
                <span className={`text-[10px] font-mono ${task.status === TaskStatus.DONE ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
        </div>
      </div>

      {expanded && !isEditing && (
        <div className="mt-4 pl-10 pr-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
             {task.aiAnalysis && (
                <div className="bg-gradient-to-r from-nexus-100 to-transparent dark:from-nexus-500/10 dark:to-transparent p-3 rounded-lg border-l-2 border-nexus-500 relative">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-nexus-500 dark:text-nexus-400" />
                        <span className="text-xs font-bold text-nexus-600 dark:text-nexus-400 uppercase tracking-wide">Conseil IA</span>
                    </div>
                    
                    <div className={`text-xs text-slate-600 dark:text-slate-300 italic ${expandedAdvice ? 'whitespace-pre-wrap' : 'line-clamp-3'}`}>
                        {task.aiAnalysis}
                    </div>

                    {isAdviceLong && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedAdvice(!expandedAdvice); }}
                            className="text-[10px] font-bold text-nexus-500 hover:text-nexus-700 dark:text-nexus-400 dark:hover:text-white mt-1 flex items-center gap-1"
                        >
                            {expandedAdvice ? <><Minimize2 size={10} /> Voir moins</> : <><Maximize2 size={10} /> Voir plus</>}
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-1">
                {task.subTasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group/sub">
                        <button 
                            onClick={() => handleSubtaskToggle(st.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${st.completed ? 'bg-nexus-500 border-nexus-500' : 'border-slate-400 dark:border-slate-600 hover:border-nexus-500'}`}
                        >
                            {st.completed && <CheckCircle2 size={12} className="text-white" />}
                        </button>
                        <span className={`text-sm ${st.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                            {st.title}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-center">
                 <button onClick={(e) => { e.stopPropagation(); setExpanded(false); }} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <ChevronUp size={16} />
                 </button>
            </div>
        </div>
      )}
      
      {!expanded && totalSubtasks === 0 && !isEditing && (
         <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <ChevronDown size={16} />
            </button>
         </div>
      )}
    </div>
  );
};
