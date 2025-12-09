
import React from 'react';
import { Project, Task, TaskStatus, Priority } from '../types';
import { X, Calendar, Hash, Folder, CheckCircle2, Circle, Timer, Layers } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project;
  tasks: Task[];
  onClose: () => void;
  onEdit: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, tasks, onClose, onEdit }) => {
  
  // Filter tasks for this project
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  
  // Calculate Stats
  const total = projectTasks.length;
  const completed = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
  const inProgress = projectTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const todo = projectTasks.filter(t => t.status === TaskStatus.TODO).length;

  // Weighted Progress
  let totalPoints = 0;
  let earnedPoints = 0;
  projectTasks.forEach(t => {
      if (t.subTasks && t.subTasks.length > 0) {
          totalPoints += t.subTasks.length;
          earnedPoints += t.subTasks.filter(st => st.completed).length;
      } else {
          totalPoints += 1;
          if (t.status === TaskStatus.DONE) earnedPoints += 1;
      }
  });
  const progress = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Header with Project Color */}
            <div className={`p-6 border-b border-slate-800 bg-gradient-to-r ${project.color.replace('bg-', 'from-').replace('500', '900')} to-slate-900 flex justify-between items-start shrink-0 relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-64 h-64 ${project.color} opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none`}></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-black/20 border-white/10 text-white`}>
                            {project.priority || 'NORMAL'}
                        </span>
                        <span className="text-xs text-slate-300 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        {project.title}
                    </h2>
                </div>
                <button onClick={onClose} className="relative z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Description & Domains */}
                <div className="space-y-4">
                    <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-slate-600 pl-4 italic">
                        {project.description || "Aucune description fournie."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {project.domains.map((d, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                                <Hash size={10} /> {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-2xl font-bold text-white">{progress}%</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Global</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-xl font-bold text-emerald-400">{completed}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Terminées</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-xl font-bold text-nexus-400">{inProgress}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">En cours</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                        <div className="text-xl font-bold text-slate-300">{todo}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">À faire</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${project.color.replace('text-', 'bg-')}`} 
                        style={{ width: `${progress}%` }} 
                    />
                </div>

                {/* Task Snapshot List */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layers size={16} /> Tâches associées ({total})
                    </h3>
                    <div className="space-y-2 bg-slate-900/50 p-1 rounded-xl max-h-[200px] overflow-y-auto custom-scrollbar">
                        {projectTasks.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-500">Aucune tâche dans ce projet.</div>
                        ) : (
                            projectTasks.map(t => (
                                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
                                    <div className="shrink-0">
                                        {t.status === TaskStatus.DONE ? <CheckCircle2 size={16} className="text-emerald-500"/> :
                                         t.status === TaskStatus.IN_PROGRESS ? <Timer size={16} className="text-nexus-400"/> :
                                         <Circle size={16} className="text-slate-600"/>}
                                    </div>
                                    <span className={`text-sm truncate ${t.status === TaskStatus.DONE ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                        {t.title}
                                    </span>
                                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border uppercase ${
                                        t.priority === Priority.HIGH ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                        t.priority === Priority.MEDIUM ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-slate-700/50 text-slate-500 border-slate-600'
                                    }`}>
                                        {t.priority || 'LOW'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <button onClick={onEdit} className="text-xs text-slate-400 hover:text-white underline">
                    Modifier le projet
                </button>
                <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Fermer
                </button>
            </div>
        </div>
    </div>
  );
};
