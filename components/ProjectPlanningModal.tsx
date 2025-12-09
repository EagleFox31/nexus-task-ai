

import React, { useState, useEffect } from 'react';
import { Project, Priority, Task, TaskStatus } from '../types';
import { suggestProjectTasks } from '../services/geminiService';
import { X, BrainCircuit, Check, Loader2, Plus, ArrowRight } from 'lucide-react';

interface ProjectPlanningModalProps {
  project: Project;
  onAddTasks: (tasks: Partial<Task>[]) => void;
  onClose: () => void;
  onGoToPlanning?: () => void; // Optional callback to navigate to planning
}

interface SuggestedTask extends Partial<Task> {
    id: string; // temp id
    selected: boolean;
}

export const ProjectPlanningModal: React.FC<ProjectPlanningModalProps> = ({ project, onAddTasks, onClose, onGoToPlanning }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [successMode, setSuccessMode] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
        setLoading(true);
        const rawTasks = await suggestProjectTasks(project);
        
        const formatted: SuggestedTask[] = rawTasks.map((t, i) => ({
            id: `temp_${i}`,
            title: t.title,
            priority: t.priority,
            status: TaskStatus.TODO,
            projectId: project.id,
            subTasks: [],
            selected: true // Selected by default
        }));
        
        setSuggestions(formatted);
        setLoading(false);
    };

    loadSuggestions();
  }, [project]);

  const toggleSelection = (id: string) => {
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const updateTitle = (id: string, newTitle: string) => {
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const updatePriority = (id: string, newPriority: Priority) => {
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, priority: newPriority } : s));
  };

  const handleConfirm = () => {
      const selected = suggestions.filter(s => s.selected).map(({ id, selected, ...task }) => task);
      onAddTasks(selected);
      setSuccessMode(true);
      // If we don't have a planning redirect, close immediately
      if (!onGoToPlanning) {
         setTimeout(onClose, 1500);
      }
  };

  if (successMode) {
      return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-nexus-900 border border-slate-700 w-full max-w-sm p-8 rounded-2xl shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                     <Check size={32} className="text-white" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Tâches Ajoutées !</h2>
                 <p className="text-slate-400 mb-6 text-sm">Les tâches ont été ajoutées au backlog de votre projet.</p>
                 
                 {onGoToPlanning ? (
                     <button 
                        onClick={() => { onClose(); onGoToPlanning(); }}
                        className="w-full bg-nexus-500 hover:bg-nexus-400 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                     >
                         Aller au Planning <ArrowRight size={18} />
                     </button>
                 ) : (
                     <button onClick={onClose} className="text-slate-500 hover:text-white text-sm">Fermer</button>
                 )}
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.color} shadow-lg text-white`}>
                        <BrainCircuit size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Planification IA</h2>
                        <p className="text-slate-400 text-xs">Génération de tâches pour : {project.title}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 size={40} className="text-nexus-400 animate-spin" />
                        <p className="text-slate-400 text-sm animate-pulse">Analyse du contexte et génération des tâches...</p>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">
                        L'IA n'a pas pu générer de tâches pour ce projet. Essayez d'enrichir la description du projet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-slate-500 uppercase">Suggestions ({suggestions.filter(s=>s.selected).length})</span>
                             <button onClick={() => setSuggestions(prev => prev.map(s => ({...s, selected: !s.selected})))} className="text-xs text-nexus-400 hover:text-white">Tout (dé)sélectionner</button>
                        </div>
                        {suggestions.map(s => (
                            <div key={s.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${s.selected ? 'bg-slate-800 border-nexus-500/30' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                                <button 
                                    onClick={() => toggleSelection(s.id)}
                                    className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${s.selected ? 'bg-nexus-500 border-nexus-500 text-white' : 'border-slate-600 hover:border-slate-400'}`}
                                >
                                    {s.selected && <Check size={12} />}
                                </button>
                                
                                <div className="flex-1 space-y-2">
                                    <input 
                                        type="text" 
                                        value={s.title}
                                        onChange={(e) => updateTitle(s.id, e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-200 focus:outline-none border-b border-transparent focus:border-nexus-500 pb-1"
                                    />
                                    <div className="flex gap-2">
                                        {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(p => (
                                            <button 
                                                key={p}
                                                onClick={() => updatePriority(s.id, p)}
                                                className={`text-[10px] px-2 py-0.5 rounded border ${s.priority === p ? 
                                                    (p === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 
                                                     p === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                                                     'bg-slate-600/30 text-slate-300 border-slate-600') 
                                                    : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    Annuler
                </button>
                <button 
                    onClick={handleConfirm}
                    disabled={loading || suggestions.filter(s => s.selected).length === 0}
                    className="bg-nexus-500 hover:bg-nexus-400 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-nexus-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={18} />
                    Ajouter au projet
                </button>
            </div>
        </div>
    </div>
  );
};