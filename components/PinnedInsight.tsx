
import React, { useState } from 'react';
import { WorkloadAdviceExplanation } from '../types';
import { Lightbulb, BookOpen, ChevronDown, ChevronUp, X, CheckCircle2 } from 'lucide-react';

interface PinnedInsightProps {
  insight: WorkloadAdviceExplanation;
  onDismiss: () => void;
}

export const PinnedInsight: React.FC<PinnedInsightProps> = ({ insight, onDismiss }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="glass-panel rounded-2xl border border-nexus-500/30 overflow-hidden relative shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            {/* Header / Pin Title */}
            <div className="bg-gradient-to-r from-nexus-900/80 to-slate-900/80 p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-nexus-500/20 text-nexus-400 flex items-center justify-center border border-nexus-500/30">
                        <Lightbulb size={18} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base flex items-center gap-2">
                             Focus Méthode : {insight.concept_name}
                             <span className="text-[10px] bg-nexus-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span>
                        </h3>
                        <p className="text-xs text-nexus-300/80">Stratégie recommandée par votre analyse cognitive</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <button className="text-slate-400 hover:text-white transition-colors">
                         {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                        className="p-1 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white transition-colors"
                        title="Fermer ce conseil"
                     >
                         <X size={18} />
                     </button>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="p-6 bg-slate-900/40 backdrop-blur-sm space-y-5">
                    
                    <p className="text-sm text-slate-300 italic border-l-2 border-nexus-500 pl-4">
                        "{insight.definition}"
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                         <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <BookOpen size={14} /> Application Immédiate
                            </h4>
                            <div className="space-y-2">
                                {insight.concrete_application.map((step, idx) => (
                                    <div key={idx} className="flex gap-3 items-start bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                                        <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm text-slate-300">{step}</p>
                                    </div>
                                ))}
                            </div>
                         </div>
                         
                         <div className="flex flex-col">
                             <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                 <CheckCircle2 size={14} /> Le Gain
                             </h4>
                             <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex-1">
                                 <p className="text-sm text-emerald-200/90 leading-relaxed">
                                     {insight.why_it_works}
                                 </p>
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
