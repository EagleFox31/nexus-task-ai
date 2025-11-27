
import React, { useState } from 'react';
import { Project, Priority, Task, TaskStatus } from '../types';
import { X, Plus, Folder, Trash2, Edit2, Check, Hash, BrainCircuit, ListTodo, Layers } from 'lucide-react';

interface ProjectManagerModalProps {
  projects: Project[];
  tasks: Task[]; // Added tasks to calculate stats
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onPlanProject: (project: Project) => void;
  onClose: () => void;
}

const COLORS = [
    { label: 'Bleu', class: 'bg-blue-500', border: 'border-blue-500' },
    { label: 'Violet', class: 'bg-purple-500', border: 'border-purple-500' },
    { label: 'Vert', class: 'bg-emerald-500', border: 'border-emerald-500' },
    { label: 'Orange', class: 'bg-orange-500', border: 'border-orange-500' },
    { label: 'Rose', class: 'bg-pink-500', border: 'border-pink-500' },
    { label: 'Gris', class: 'bg-slate-500', border: 'border-slate-500' },
];

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ projects, tasks, onAddProject, onUpdateProject, onDeleteProject, onPlanProject, onClose }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      const domainArray = domains.split(',').map(d => d.trim()).filter(Boolean);

      if (isEditing) {
          onUpdateProject({
              id: isEditing,
              title,
              description: desc,
              domains: domainArray,
              color,
              priority,
              createdAt: new Date().toISOString()
          });
      } else {
          onAddProject({
              id: Date.now().toString(),
              title,
              description: desc,
              domains: domainArray,
              color,
              priority,
              createdAt: new Date().toISOString()
          });
      }
      resetForm();
  };

  const handleEdit = (p: Project) => {
      setIsEditing(p.id);
      setTitle(p.title);
      setDesc(p.description);
      setDomains(p.domains.join(', '));
      setColor(p.color);
      setPriority(p.priority || Priority.LOW);
  };

  const getPriorityBadge = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></span>;
          case Priority.MEDIUM: return <span className="w-2 h-2 rounded-full bg-blue-500"></span>;
          default: return <span className="w-2 h-2 rounded-full bg-slate-600"></span>;
      }
  };

  // --- STATS CALCULATION ---
  const getProjectStats = (projectId: string) => {
      const projectTasks = tasks.filter(t => t.projectId === projectId);
      const totalTasks = projectTasks.length;
      
      let totalPoints = 0;
      let completedPoints = 0;
      let totalSubtasks = 0;

      projectTasks.forEach(t => {
          if (t.subTasks && t.subTasks.length > 0) {
              totalSubtasks += t.subTasks.length;
              totalPoints += t.subTasks.length;
              completedPoints += t.subTasks.filter(st => st.completed).length;
          } else {
              // Task without subtasks counts as 1 point
              totalPoints += 1;
              if (t.status === TaskStatus.DONE) completedPoints += 1;
          }
      });

      const progress = totalPoints === 0 ? 0 : Math.round((completedPoints / totalPoints) * 100);

      return { totalTasks, totalSubtasks, progress };
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Left: Project List */}
            {/* Ajout de min-h-0 et shrink-0 pour forcer le scroll dans le conteneur flex parent */}
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
                            const stats = getProjectStats(p.id);
                            
                            return (
                                <div key={p.id} className="group bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 hover:border-nexus-500/30 rounded-xl p-4 transition-all cursor-default relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${p.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                                            <h3 className="font-bold text-slate-200 text-sm">{p.title}</h3>
                                            <div className="ml-1 flex items-center" title={`Priorité: ${p.priority || 'LOW'}`}>
                                                {getPriorityBadge(p.priority || Priority.LOW)}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onPlanProject(p)} className="p-1.5 text-nexus-400 hover:text-white hover:bg-nexus-500/20 rounded-lg transition-colors" title="Planifier avec l'IA"><BrainCircuit size={16}/></button>
                                            <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Modifier"><Edit2 size={16}/></button>
                                            <button onClick={() => { if(confirm('Supprimer ?')) onDeleteProject(p.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-bold">
                                            <span>Progression</span>
                                            <span className={stats.progress === 100 ? 'text-emerald-400' : 'text-slate-300'}>{stats.progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${stats.progress === 100 ? 'bg-emerald-500' : p.color.replace('text-', 'bg-')}`} 
                                                style={{ width: `${stats.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/50">
                                            <ListTodo size={12} /> {stats.totalTasks} Tâches
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/50">
                                            <Layers size={12} /> {stats.totalSubtasks} Sous-tâches
                                        </div>
                                    </div>
                                    
                                    {p.description && <p className="text-xs text-slate-500 line-clamp-1 mt-3 italic border-l-2 border-slate-700 pl-2">{p.description}</p>}
                                    
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {p.domains.map((d, i) => (
                                            <span key={i} className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right: Form */}
            <div className="w-full md:w-2/5 flex flex-col h-full overflow-y-auto custom-scrollbar bg-slate-800/20 shadow-inner">
                <div className="p-4 flex justify-between items-center md:hidden">
                     <h2 className="text-white font-bold">{isEditing ? 'Modifier' : 'Nouveau Projet'}</h2>
                     <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
                </div>
                <button onClick={onClose} className="hidden md:block absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X size={24} /></button>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-center">
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
                            placeholder="Décrivez le contexte pour aider l'IA (Ex: Client exigeant, stack React/Node, deadline courte...)"
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
                                placeholder="Ex: IT, Marketing, Automobile (séparés par virgules)"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Utilisé pour adapter le vocabulaire et l'expertise de l'IA.</p>
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

                    <div className="pt-4 flex gap-3">
                        {isEditing && (
                             <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800">
                                 Annuler
                             </button>
                        )}
                        <button type="submit" className="flex-1 bg-nexus-500 hover:bg-nexus-400 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-nexus-500/20">
                            {isEditing ? <Check size={18} /> : <Plus size={18} />}
                            {isEditing ? 'Enregistrer' : 'Créer le projet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};
