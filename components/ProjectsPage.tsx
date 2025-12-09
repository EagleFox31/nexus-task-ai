
import React from 'react';
import { Project, Task, TaskStatus, Priority } from '../types';
import { ArrowLeft, Plus, Folder, Layers, CheckCircle2, Circle, Timer, Zap, BarChart3, BrainCircuit, Edit2, Trash2, PieChart } from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  onBack: () => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onPlanProject: (project: Project) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ 
    projects, 
    tasks, 
    onBack, 
    onNewProject, 
    onEditProject, 
    onDeleteProject, 
    onPlanProject 
}) => {

  // --- STATS CALCULATIONS ---

  const calculateGlobalStats = () => {
      const activeProjects = projects.length;
      if (activeProjects === 0) return null;

      const projectTasks = tasks.filter(t => t.projectId);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
      
      // Global completion rate
      const globalProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      // High Priority Projects count
      const highPriProjects = projects.filter(p => p.priority === Priority.HIGH).length;

      // Most used domain
      const allDomains = projects.flatMap(p => p.domains);
      const domainCounts = allDomains.reduce((acc: Record<string, number>, domain) => {
          acc[domain] = (acc[domain] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      
      const topDomain = Object.entries(domainCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

      return {
          activeProjects,
          totalTasks,
          completedTasks,
          globalProgress,
          highPriProjects,
          topDomain: topDomain ? topDomain[0] : 'N/A'
      };
  };

  const getProjectDetails = (projectId: string) => {
      const pTasks = tasks.filter(t => t.projectId === projectId);
      const total = pTasks.length;
      const todo = pTasks.filter(t => t.status === TaskStatus.TODO).length;
      const inProgress = pTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
      const done = pTasks.filter(t => t.status === TaskStatus.DONE).length;
      
      // Calculate weighted progress (subtasks included)
      let totalPoints = 0;
      let earnedPoints = 0;
      
      pTasks.forEach(t => {
          if (t.subTasks && t.subTasks.length > 0) {
             totalPoints += t.subTasks.length;
             earnedPoints += t.subTasks.filter(st => st.completed).length;
          } else {
             totalPoints += 1;
             if (t.status === TaskStatus.DONE) earnedPoints += 1;
          }
      });

      const progress = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

      return { total, todo, inProgress, done, progress };
  };

  const globalStats = calculateGlobalStats();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Portefeuille Projets
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Vue d'ensemble et pilotage stratégique</p>
                </div>
            </div>
            
            <button 
                onClick={onNewProject}
                className="bg-nexus-500 hover:bg-nexus-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-nexus-500/20 transition-all hover:scale-105"
            >
                <Plus size={20} /> Nouveau Projet
            </button>
        </div>

        {/* GLOBAL KPIS */}
        {globalStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 dark:text-blue-400"><Folder size={20} /></div>
                        <span className="text-xs text-slate-500 uppercase font-bold">Actifs</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{globalStats.activeProjects}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{globalStats.highPriProjects} haute priorité</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"><BarChart3 size={20} /></div>
                        <span className="text-xs text-slate-500 uppercase font-bold">Progression</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{globalStats.globalProgress}%</div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${globalStats.globalProgress}%` }} />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-nexus-500/10 rounded-lg text-nexus-600 dark:text-nexus-400"><Layers size={20} /></div>
                        <span className="text-xs text-slate-500 uppercase font-bold">Volume</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{globalStats.completedTasks}<span className="text-lg text-slate-500 font-normal">/{globalStats.totalTasks}</span></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tâches terminées</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600 dark:text-orange-400"><Zap size={20} /></div>
                        <span className="text-xs text-slate-500 uppercase font-bold">Top Domaine</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white truncate capitalize">{globalStats.topDomain}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dominante actuelle</div>
                </div>
            </div>
        )}

        {/* PROJECTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.length === 0 ? (
                <div className="col-span-full py-20 text-center glass-panel rounded-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 mb-6">
                        <Folder className="text-slate-400 dark:text-slate-600" size={40} />
                    </div>
                    <h3 className="text-xl text-slate-700 dark:text-white font-bold">Votre portefeuille est vide</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-md mx-auto">
                        Créez votre premier projet pour regrouper vos tâches par contexte (ex: "Lancement Freelance", "Apprentissage React").
                    </p>
                    <button onClick={onNewProject} className="text-nexus-500 dark:text-nexus-400 hover:text-nexus-600 dark:hover:text-nexus-300 font-medium underline">
                        Créer un projet maintenant
                    </button>
                </div>
            ) : (
                projects.map(project => {
                    const stats = getProjectDetails(project.id);
                    
                    return (
                        <div key={project.id} className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-nexus-500/30 transition-all group flex flex-col">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl ${project.color} flex items-center justify-center text-white shadow-lg`}>
                                        <Folder size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{project.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                                project.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300 border-rose-500/30' :
                                                project.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500 dark:text-blue-300 border-blue-500/30' :
                                                'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600'
                                            }`}>
                                                {project.priority || 'NORMAL'}
                                            </span>
                                            <span className="text-xs text-slate-500">• {new Date(project.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => onPlanProject(project)} className="p-2 text-nexus-500 dark:text-nexus-400 hover:bg-nexus-500/10 rounded-lg transition-colors" title="Planifier avec l'IA">
                                        <BrainCircuit size={20} />
                                    </button>
                                    <button onClick={() => onEditProject(project)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <Edit2 size={20} />
                                    </button>
                                    <button onClick={() => { if(confirm('Supprimer ce projet et détacher ses tâches ?')) onDeleteProject(project.id); }} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                {project.description || "Aucune description. Ajoutez du contexte pour l'IA."}
                            </p>

                            {/* Progress Section */}
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl mb-4">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avancement</span>
                                    <span className={`text-xl font-mono font-bold ${stats.progress === 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                        {stats.progress}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${stats.progress === 100 ? 'bg-emerald-500' : project.color.replace('text-', 'bg-')}`} 
                                        style={{ width: `${stats.progress}%` }} 
                                    />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-100 dark:bg-slate-800/30 rounded-lg p-2 text-center border border-slate-200 dark:border-slate-700/30">
                                    <div className="text-slate-400 dark:text-slate-400 mb-1 flex justify-center"><Circle size={14} /></div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200">{stats.todo}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">À faire</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/30 rounded-lg p-2 text-center border border-slate-200 dark:border-slate-700/30">
                                    <div className="text-nexus-500 dark:text-nexus-400 mb-1 flex justify-center"><Timer size={14} /></div>
                                    <div className="font-bold text-nexus-600 dark:text-nexus-200">{stats.inProgress}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">En cours</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/30 rounded-lg p-2 text-center border border-slate-200 dark:border-slate-700/30">
                                    <div className="text-emerald-500 dark:text-emerald-400 mb-1 flex justify-center"><CheckCircle2 size={14} /></div>
                                    <div className="font-bold text-emerald-600 dark:text-emerald-200">{stats.done}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Fini</div>
                                </div>
                            </div>

                            {/* Domains */}
                            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap gap-2">
                                {project.domains.length > 0 ? project.domains.map((d, i) => (
                                    <span key={i} className="text-[10px] bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-1 rounded border border-slate-300 dark:border-slate-700">
                                        #{d}
                                    </span>
                                )) : (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-600 italic">Aucun domaine tagué</span>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
