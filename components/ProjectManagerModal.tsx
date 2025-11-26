

import React, { useState } from 'react';
import { Project, Priority } from '../types';
import { X, Plus, Folder, Trash2, Edit2, Check, Hash, Flag, BrainCircuit } from 'lucide-react';

interface ProjectManagerModalProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onPlanProject: (project: Project) => void; // New prop
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

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ projects, onAddProject, onUpdateProject, onDeleteProject, onPlanProject, onClose }) => {
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
              createdAt: new Date().toISOString() // Keep original date ideally, but ok for now
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

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
          case Priority.MEDIUM: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          default: return 'text-slate-400 bg-slate-700/50 border-slate-600';
      }
  };

  const getPriorityBadge = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></span>;
          case Priority.MEDIUM: return <span className="w-2 h-2 rounded-full bg-blue-500"></span>;
          default: return <span className="w-2 h-2 rounded-full bg-slate-600"></span>;
      }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Left: Project List */}
            <div className="w-full md:w-1/2 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col h-full max-h-[40vh] md:max-h-full">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-white font-bold flex items-center gap-2">
                        <Folder className="text-nexus-400" size={20} /> Vos Projets
                    </h2>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{projects.length}</span>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 flex-1">
                    {projects.length === 0 ? (
                        <div className="text-center text-slate-500 py-10 text-sm">
                            Aucun projet.<br/>Créez-en un pour organiser vos tâches.
                        </div>
                    ) : (
                        projects.map(p => (
                            <div key={p.id} className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl p-3 transition-all cursor-default relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${p.color}`} />
                                        <h3 className="font-bold text-slate-200">{p.title}</h3>
                                        <div className="ml-1" title={`Priorité: ${p.priority || 'LOW'}`}>
                                            {getPriorityBadge(p.priority || Priority.LOW)}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onPlanProject(p)} className="p-1.5 text-nexus-400 hover:text-white hover:bg-nexus-500/20 rounded" title="Générer des tâches avec l'IA"><BrainCircuit size={14}/></button>
                                        <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Modifier"><Edit2 size={14}/></button>
                                        <button onClick={() => { if(confirm('Supprimer ?')) onDeleteProject(p.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded" title="Supprimer"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{p.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {p.domains.map((d, i) => (
                                        <span key={i} className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Form */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto custom-scrollbar bg-slate-800/20">
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
