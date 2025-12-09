
import React from 'react';
import { WorkloadAdviceExplanation } from '../types';
import { X, Lightbulb, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ConceptExplainerModalProps {
  explanation: WorkloadAdviceExplanation;
  onClose: () => void;
}

export const ConceptExplainerModal: React.FC<ConceptExplainerModalProps> = ({ explanation, onClose }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal */}
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            <div className="bg-gradient-to-r from-nexus-900 to-slate-900 p-6 border-b border-slate-800 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-nexus-400 mb-1">
                        <Lightbulb size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Concept Clé</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{explanation.concept_name}</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                
                {/* Definition */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">C'est quoi ?</h3>
                    <p className="text-slate-200 leading-relaxed border-l-2 border-nexus-500 pl-4 bg-nexus-500/5 py-2 rounded-r-lg">
                        {explanation.definition}
                    </p>
                </div>

                {/* Concrete Application */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <BookOpen size={16} />
                        Mise en pratique immédiate
                    </h3>
                    <div className="space-y-3">
                        {explanation.concrete_application.map((step, idx) => (
                            <div key={idx} className="flex gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="w-6 h-6 rounded-full bg-nexus-500/20 text-nexus-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                </div>
                                <p className="text-sm text-slate-300">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why it works */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                     <div className="flex items-center gap-2 mb-2 text-emerald-400">
                         <CheckCircle2 size={16} />
                         <h3 className="text-xs font-bold uppercase">Pourquoi ça marche</h3>
                     </div>
                     <p className="text-sm text-emerald-200/80">
                         {explanation.why_it_works}
                     </p>
                </div>

            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    J'ai compris <ArrowRight size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};
