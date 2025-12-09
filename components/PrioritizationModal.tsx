
import React, { useState } from 'react';
import { Task, PrioritizationSuggestion, Priority } from '../types';
import { ArrowRight, Check, X, ShieldAlert, Wand2 } from 'lucide-react';

interface PrioritizationModalProps {
  tasks: Task[];
  suggestions: PrioritizationSuggestion[];
  onApply: (approvedChanges: PrioritizationSuggestion[]) => void;
  onClose: () => void;
  userGoal: string;
}

export const PrioritizationModal: React.FC<PrioritizationModalProps> = ({ tasks, suggestions, onApply, onClose, userGoal }) => {
  const [approvedList, setApprovedList] = useState<PrioritizationSuggestion[]>(suggestions);

  // Helper to change priority in the draft list
  const handleChangePriority = (taskId: string, newPriority: Priority) => {
      setApprovedList(prev => prev.map(s => 
          s.taskId === taskId ? { ...s, suggestedPriority: newPriority } : s
      ));
  };

  const handleToggleInclude = (suggestion: PrioritizationSuggestion) => {
      const exists = approvedList.find(s => s.taskId === suggestion.taskId);
      if (exists) {
          setApprovedList(prev => prev.filter(s => s.taskId !== suggestion.taskId));
      } else {
          setApprovedList(prev => [...prev, suggestion]);
      }
  };

  const getTaskTitle = (id: string) => tasks.find(t => t.id === id)?.title || "Tâche inconnue";

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
          case Priority.MEDIUM: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          default: return 'text-slate-400 bg-slate-700/50 border-slate-600';
      }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-nexus-400 mb-1">
                        <Wand2 size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Priorisation Automatique</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Validation des suggestions</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Basé sur votre objectif : <span className="text-white font-medium">"{userGoal}"</span>
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-900/30 flex-1">
                {suggestions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Aucun changement de priorité nécessaire selon l'IA.
                    </div>
                ) : (
                    suggestions.map((s) => {
                        const isIncluded = approvedList.some(approved => approved.taskId === s.taskId);
                        const currentApproved = approvedList.find(approved => approved.taskId === s.taskId) || s;

                        return (
                            <div key={s.taskId} className={`glass-panel p-4 rounded-xl border transition-all ${isIncluded ? 'border-nexus-500/40 bg-slate-800/60' : 'border-slate-700 opacity-60'}`}>
                                <div className="flex items-center gap-4">
                                    {/* Checkbox */}
                                    <button 
                                        onClick={() => handleToggleInclude(s)}
                                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${isIncluded ? 'bg-nexus-500 border-nexus-500 text-white' : 'border-slate-600 hover:border-slate-400'}`}
                                    >
                                        {isIncluded && <Check size={14} />}
                                    </button>

                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                        
                                        {/* Title & Reason */}
                                        <div className="md:col-span-6">
                                            <h4 className="font-bold text-white truncate" title={getTaskTitle(s.taskId)}>
                                                {getTaskTitle(s.taskId)}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                {s.reason}
                                            </p>
                                        </div>

                                        {/* Transformation */}
                                        <div className="md:col-span-6 flex items-center justify-end gap-3">
                                            <span className={`text-xs px-2 py-1 rounded border font-bold ${getPriorityColor(s.currentPriority)}`}>
                                                {s.currentPriority}
                                            </span>
                                            
                                            <ArrowRight size={14} className="text-slate-500" />
                                            
                                            {/* Selector for New Priority */}
                                            {isIncluded ? (
                                                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                                    <button 
                                                        onClick={() => handleChangePriority(s.taskId, Priority.LOW)}
                                                        className={`px-2 py-1 text-xs rounded transition-all ${currentApproved.suggestedPriority === Priority.LOW ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        LOW
                                                    </button>
                                                    <button 
                                                        onClick={() => handleChangePriority(s.taskId, Priority.MEDIUM)}
                                                        className={`px-2 py-1 text-xs rounded transition-all ${currentApproved.suggestedPriority === Priority.MEDIUM ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        MED
                                                    </button>
                                                    <button 
                                                        onClick={() => handleChangePriority(s.taskId, Priority.HIGH)}
                                                        className={`px-2 py-1 text-xs rounded transition-all ${currentApproved.suggestedPriority === Priority.HIGH ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        HIGH
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-500 decoration-slate-500 line-through">
                                                    {s.suggestedPriority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                    {approvedList.length} changements sélectionnés sur {suggestions.length}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={() => onApply(approvedList)}
                        disabled={approvedList.length === 0}
                        className="bg-nexus-500 hover:bg-nexus-400 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-nexus-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Appliquer <Check size={18} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
