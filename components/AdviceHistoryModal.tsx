
import React from 'react';
import { AdviceLog } from '../types';
import { X, Lightbulb, Calendar } from 'lucide-react';

interface AdviceHistoryModalProps {
  history: AdviceLog[];
  onClose: () => void;
}

export const AdviceHistoryModal: React.FC<AdviceHistoryModalProps> = ({ history, onClose }) => {
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lightbulb className="text-yellow-400" size={24} />
                    Boîte à Outils & Conseils
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
                {history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>Aucun conseil archivé pour le moment.</p>
                        <p className="text-xs mt-2">Lancez une analyse de charge et cliquez sur "En savoir plus" pour remplir votre boîte à outils.</p>
                    </div>
                ) : (
                    history.map((log) => (
                        <div key={log.id} className="relative pl-6 border-l-2 border-slate-700 pb-2 last:pb-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-nexus-500"></div>
                            
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                                    <Calendar size={10} /> {formatDate(log.date)}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-nexus-400 tracking-wider">
                                    {log.source === 'WeeklyReport' ? 'Rapport Hebdo' : 'Analyse Charge'}
                                </span>
                            </div>

                            <div className="glass-panel p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-white font-bold text-lg mb-2">{log.content.concept_name}</h3>
                                <p className="text-slate-300 text-sm italic mb-4 border-l-2 border-slate-600 pl-3">
                                    "{log.content.definition}"
                                </p>
                                
                                <div className="space-y-2">
                                    {log.content.concrete_application.map((step, i) => (
                                        <div key={i} className="flex gap-2 text-sm text-slate-400">
                                            <span className="text-nexus-500 font-bold">•</span>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};
