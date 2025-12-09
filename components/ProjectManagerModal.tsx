
import React, { useState } from 'react';
import { Project, Priority, Task, TaskStatus } from '../types';
import { X, Plus, Folder, Trash2, Edit2, Check, Hash, BrainCircuit, ListTodo, Layers, ArrowRight } from 'lucide-react';

interface ProjectManagerModalProps {
  projects: Project[];
  tasks: Task[]; // Added tasks to calculate stats
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onPlanProject: (project: Project) => void;
  onClose: () => void;
  showList?: boolean; // NEW PROP: Controls visibility of the left sidebar list
}

const COLORS = [
    { label: 'Bleu', class: 'bg-blue-500', border: 'border-blue-500' },
    { label: 'Violet', class: 'bg-purple-500', border: 'border-purple-500' },
    { label: 'Vert', class: 'bg-emerald-500', border: 'border-emerald-500' },
    { label: 'Orange', class: 'bg-orange-500', border: 'border-orange-500' },
    { label: 'Rose', class: 'bg-pink-500', border: 'border-pink-500' },
    { label: 'Gris', class: 'bg-slate-500', border: 'border-slate-500' },
];

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ 
    projects, 
    tasks, 
    onAddProject, 
    onUpdateProject, 
    onDeleteProject, 
    onPlanProject, 
    onClose,
    showList = true 
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [domains, setDomains] = useState('');
  const [color, setColor] = useState(COLORS[0].class);
  const [priority, setPriority] = useState<Priority>(Priority.LOW);

  const resetForm = () => {
      setTitle('');
      setDesc('');
      setDomains('');
      setColor(COLORS[0].class);
      setPriority(Priority.LOW);
      setIsEditing(null);
  };

  const handleSubmit = (e: React.FormEvent, mode: 'create_only' | 'create_and_plan' = 'create_only') => {
      e.preventDefault();
      if (!title.trim()) return;

      const domainArray = domains.split(',').map(d => d.trim()).filter(Boolean);
      const newProject: Project = {
          id: isEditing || Date.now().toString(),
          title,
          description: desc,
          domains: domainArray,
          color,
          priority,
          createdAt: new Date().toISOString()
      };

      if (isEditing) {
          onUpdateProject(newProject);
          resetForm();
      } else {
          onAddProject(newProject);
          
          if (mode === 'create_and_plan') {
              // WORKFLOW FLUIDE: On ferme ce modal et on ouvre le planificateur
              onPlanProject(newProject);
              onClose();
              return;
          }
          resetForm();
      }

      if (!showList) onClose(); 
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`bg-nexus-900 border border-slate-700 w-full ${showList ? 'max-w-5xl' : 'max-w-xl'} max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300`}>
            
            {/* Left: Project List (CONDITIONAL) */}
            {showList && (
                <div className="w-full md:w-3/5 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col h-auto md:h-full max-h-[40vh] md:max-h-full min-h-0 shrink-0">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/30 shrink-0">
                        <h2 className="text-white font-bold flex items-center gap-2">
                            <Folder className="text-nexus-400" size={20} /> Vos Projets
                        </h2>
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">{projects.length}</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 flex-1">
                        {projects.length === 0 ? (
                            <div className="text-center text-slate-500 py-10 text-sm">
                                Aucun projet.<br/>Créez-en un pour organiser vos tâches.
                            </div>
                        ) : (
                            projects.map(p => {
                                const stats = getProjectStats(p.id, tasks);
                                
                                return (
                                    <div key={p.id} className="group bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 hover:border-nexus-500/30 rounded-xl p-4 transition-all cursor-default relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${p.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                                                <h3 className="font-bold text-slate-200 text-sm">{p.title}</h3>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setIsEditing(p.id); setTitle(p.title); setDesc(p.description); setDomains(p.domains.join(', ')); setColor(p.color); setPriority(p.priority || Priority.LOW); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Modifier"><Edit2 size={16}/></button>
                                                <button onClick={() => { if(confirm('Supprimer ?')) onDeleteProject(p.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 mb-2">
                                            <div 
                                                className={`h-full rounded-full ${p.color.replace('text-', 'bg-')}`} 
                                                style={{ width: `${stats.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>{stats.totalTasks} tâches</span>
                                            <span>{stats.progress}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Right: Form (Always Visible) */}
            <div className={`w-full ${showList ? 'md:w-2/5' : 'md:w-full'} flex flex-col h-full overflow-y-auto custom-scrollbar bg-slate-800/20 shadow-inner`}>
                <div className="p-4 flex justify-between items-center md:hidden">
                     <h2 className="text-white font-bold">{isEditing ? 'Modifier' : 'Nouveau Projet'}</h2>
                     <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
                </div>
                <button onClick={onClose} className="hidden md:block absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X size={24} /></button>

                <ProjectForm 
                    title={title} setTitle={setTitle}
                    desc={desc} setDesc={setDesc}
                    domains={domains} setDomains={setDomains}
                    color={color} setColor={setColor}
                    priority={priority} setPriority={setPriority}
                    isEditing={!!isEditing}
                    onSubmit={handleSubmit}
                    onCancel={() => { resetForm(); if(!showList) onClose(); }}
                />
            </div>
        </div>
    </div>
  );
};

const getProjectStats = (projectId: string, tasks: Task[]) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    let totalPoints = 0;
    let completedPoints = 0;
    projectTasks.forEach(t => {
        if (t.subTasks && t.subTasks.length > 0) {
            totalPoints += t.subTasks.length;
            completedPoints += t.subTasks.filter(st => st.completed).length;
        } else {
            totalPoints += 1;
            if (t.status === TaskStatus.DONE) completedPoints += 1;
        }
    });
    const progress = totalPoints === 0 ? 0 : Math.round((completedPoints / totalPoints) * 100);
    return { totalTasks: projectTasks.length, progress };
};

const ProjectForm = ({ title, setTitle, desc, setDesc, domains, setDomains, color, setColor, priority, setPriority, isEditing, onSubmit, onCancel }: any) => (
    <form className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-center">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1 hidden md:block">{isEditing ? 'Modifier le projet' : 'Créer un projet'}</h2>
            <p className="text-sm text-slate-400 mb-6 hidden md:block">Les tâches de ce projet partageront ce contexte pour l'IA.</p>
            
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Titre du Projet</label>
            <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 outline-none"
                placeholder="Ex: Refonte Site Web, Lancement Produit..."
                required
                autoFocus
            />
        </div>

        <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Importance Stratégique</label>
                <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-600">
                    <button type="button" onClick={() => setPriority(Priority.LOW)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${priority === Priority.LOW ? 'bg-slate-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>LOW</button>
                    <button type="button" onClick={() => setPriority(Priority.MEDIUM)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${priority === Priority.MEDIUM ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>MEDIUM</button>
                    <button type="button" onClick={() => setPriority(Priority.HIGH)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${priority === Priority.HIGH ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>HIGH</button>
                </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description / Contexte</label>
            <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 outline-none min-h-[100px]"
                placeholder="Décrivez le contexte pour aider l'IA..."
            />
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Domaines (Combo)</label>
            <div className="relative">
                <Hash className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input 
                    type="text" 
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white focus:border-nexus-500 outline-none"
                    placeholder="Ex: IT, Marketing..."
                />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Couleur</label>
            <div className="flex gap-3 flex-wrap">
                {COLORS.map(c => (
                    <button
                        key={c.class}
                        type="button"
                        onClick={() => setColor(c.class)}
                        className={`w-8 h-8 rounded-full ${c.class} transition-transform hover:scale-110 flex items-center justify-center ${color === c.class ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                    >
                        {color === c.class && <Check size={14} className="text-white" />}
                    </button>
                ))}
            </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
             {/* Main Action Group */}
             <div className="flex gap-3">
                <button 
                    type="button" 
                    onClick={(e) => onSubmit(e, 'create_only')}
                    className="flex-1 bg-nexus-500 hover:bg-nexus-400 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-nexus-500/20"
                >
                    {isEditing ? <Check size={18} /> : <Plus size={18} />}
                    {isEditing ? 'Enregistrer' : 'Créer'}
                </button>
                
                {!isEditing && (
                    <button 
                        type="button" 
                        onClick={(e) => onSubmit(e, 'create_and_plan')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                        title="Créer et lancer la génération de tâches"
                    >
                        <BrainCircuit size={18} />
                        Planifier
                    </button>
                )}
             </div>

             <button type="button" onClick={onCancel} className="px-6 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm">
                Annuler
             </button>
        </div>
    </form>
);
