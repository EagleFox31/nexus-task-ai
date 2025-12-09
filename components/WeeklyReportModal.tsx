
import React, { useState } from 'react';
import { WeeklyReportData, MentorId } from '../types';
import { MENTOR_PROFILES, MENTOR_ICONS } from '../data/mentors';
import { X, Trophy, AlertOctagon, Lightbulb, Target, Scale, MessageSquareQuote, Zap, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WeeklyReportModalProps {
  report: WeeklyReportData;
  onClose: () => void;
  onRequestSecondOpinion: (originalReport: WeeklyReportData, newMentorId: MentorId) => Promise<void>;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ report, onClose, onRequestSecondOpinion }) => {
  const { language } = useLanguage();
  const [showSecondOpinionSelector, setShowSecondOpinionSelector] = useState(false);
  const [loadingOpinion, setLoadingOpinion] = useState(false);

  const handleSelectOpinionMentor = async (mentorId: MentorId) => {
      setLoadingOpinion(true);
      setShowSecondOpinionSelector(false);
      await onRequestSecondOpinion(report, mentorId);
      setLoadingOpinion(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-start shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-nexus-400 bg-nexus-900/50 px-2 py-1 rounded border border-nexus-500/30">
                            {report.week?.start || 'N/A'} → {report.week?.end || 'N/A'}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Rapport Hebdomadaire
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        Analyse de {report.mentor?.name || 'Mentor'}
                    </h2>
                    <p className="text-slate-400 text-sm italic">"{report.mentor?.tagline || 'AI'}"</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto custom-scrollbar p-6 space-y-8 flex-1">
                
                {/* Executive Summary */}
                <section className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Résumé Exécutif</h3>
                    <p className="text-lg text-slate-200 leading-relaxed">
                        {report.executive_summary}
                    </p>
                </section>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {report.scores?.map((score, idx) => (
                         <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                             <div className="text-2xl font-bold text-nexus-400">{score.value}/10</div>
                             <div className="text-xs text-slate-400 uppercase mt-1">{score.label}</div>
                         </div>
                     )) || (
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center col-span-2">
                            <div className="text-2xl font-bold text-nexus-400">{report.metrics_snapshot?.tasks_completed}/{report.metrics_snapshot?.tasks_planned}</div>
                            <div className="text-xs text-slate-400 uppercase mt-1">Tâches Finies</div>
                        </div>
                     )}
                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                         <div className="text-2xl font-bold text-emerald-400">{report.metrics_snapshot?.focus_minutes}h</div>
                         <div className="text-xs text-slate-400 uppercase mt-1">Focus Total</div>
                     </div>
                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                         <div className="text-2xl font-bold text-orange-400 uppercase">{report.metrics_snapshot?.cognitive_load_level || 'N/A'}</div>
                         <div className="text-xs text-slate-400 uppercase mt-1">Charge</div>
                     </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* WINS */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Trophy size={20} />
                            <h3 className="font-bold uppercase tracking-wider">Ce qui a fonctionné (Wins)</h3>
                        </div>
                        {report.wins?.map((win, i) => (
                            <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                                <h4 className="font-bold text-emerald-300">{win.title}</h4>
                                <p className="text-sm text-emerald-200/70 mt-1">{win.evidence}</p>
                            </div>
                        ))}
                    </section>

                    {/* LEAKS */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                            <AlertOctagon size={20} />
                            <h3 className="font-bold uppercase tracking-wider">Fuites de temps (Leaks)</h3>
                        </div>
                        {report.time_leaks?.map((leak, i) => (
                            <div key={i} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                                <h4 className="font-bold text-red-300">{leak.title}</h4>
                                <p className="text-sm text-red-200/70 mt-1"><span className="font-semibold">Cause:</span> {leak.cause}</p>
                                <div className="mt-2 text-xs bg-red-900/30 text-red-300 inline-block px-2 py-1 rounded">Fix: {leak.fix}</div>
                            </div>
                        ))}
                    </section>
                </div>

                {/* RECOMMENDATIONS */}
                <section>
                    <div className="flex items-center gap-2 text-indigo-400 mb-4">
                        <Lightbulb size={20} />
                        <h3 className="font-bold uppercase tracking-wider">Plan d'action Mentor</h3>
                    </div>
                    <div className="space-y-3">
                        {report.recommendations?.map((rec, i) => (
                            <div key={i} className="glass-panel p-4 rounded-xl flex gap-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-indigo-200 flex items-center gap-2">
                                        {rec.title}
                                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                                            Impact: {rec.impact}
                                        </span>
                                    </h4>
                                    <p className="text-sm text-slate-400 mt-1 mb-2">{rec.why}</p>
                                    <ul className="space-y-1">
                                        {rec.steps?.map((step, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                                <span className="text-indigo-500 mt-1">•</span> {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CHALLENGE */}
                {report.challenge && (
                    <section className="bg-gradient-to-br from-nexus-900 to-black border border-nexus-500/30 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Target size={100} />
                        </div>
                        <h3 className="text-nexus-400 font-bold uppercase tracking-wider mb-2 text-sm">Le Défi de la semaine</h3>
                        <h2 className="text-2xl font-bold text-white mb-4">{report.challenge.name}</h2>
                        
                        <div className="flex flex-col md:flex-row gap-6 relative z-10">
                            <div className="flex-1">
                                <h4 className="text-slate-400 text-xs uppercase mb-2">Règles</h4>
                                <ul className="space-y-1 text-slate-200 text-sm">
                                    {report.challenge.rules?.map((rule, i) => <li key={i}>• {rule}</li>)}
                                </ul>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-slate-400 text-xs uppercase mb-2">Critère de succès</h4>
                                <p className="text-emerald-400 font-medium text-sm border-l-2 border-emerald-500 pl-3">
                                    {report.challenge.success_metric}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* COUNTER ANALYSIS (Optional) */}
                {report.counter_analysis ? (
                    <section className="bg-slate-800/80 border border-slate-600 rounded-2xl overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4">
                         <div className="bg-gradient-to-r from-orange-900/50 to-slate-900 p-4 border-b border-slate-700 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <Scale className="text-orange-400" size={24} />
                                 <div>
                                     {/* SAFE NAVIGATION HERE */}
                                     <h3 className="font-bold text-orange-100">Contre-Analyse (2ème Avis)</h3>
                                     <p className="text-xs text-orange-300/70 uppercase tracking-wide">
                                         Par {report.counter_analysis?.mentor?.name || 'Mentor Alternatif'}
                                     </p>
                                 </div>
                             </div>
                             <div className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded border border-orange-500/30">
                                 Alternative
                             </div>
                         </div>
                         <div className="p-6 space-y-6">
                             <div className="flex gap-4">
                                 <MessageSquareQuote className="text-slate-500 shrink-0 mt-1" size={24} />
                                 <div>
                                     <h4 className="text-sm font-bold text-slate-300 uppercase mb-2">La Critique</h4>
                                     <p className="text-slate-200 italic leading-relaxed">
                                         "{report.counter_analysis.critique}"
                                     </p>
                                 </div>
                             </div>
                             <div className="flex gap-4">
                                 <Zap className="text-nexus-400 shrink-0 mt-1" size={24} />
                                 <div>
                                     <h4 className="text-sm font-bold text-nexus-300 uppercase mb-2">Le Conseil Alternatif</h4>
                                     <p className="text-slate-200 leading-relaxed border-l-2 border-nexus-500 pl-4">
                                         {report.counter_analysis.alternative_perspective}
                                     </p>
                                 </div>
                             </div>
                         </div>
                    </section>
                ) : (
                    /* Request Second Opinion Section */
                    <div className="mt-8 pt-8 border-t border-slate-800 flex justify-center">
                        {loadingOpinion ? (
                            <div className="flex items-center gap-2 text-nexus-400 animate-pulse">
                                <Loader2 size={20} className="animate-spin" />
                                <span className="text-sm font-medium">Analyse contradictoire en cours...</span>
                            </div>
                        ) : !showSecondOpinionSelector ? (
                            <button 
                                onClick={() => setShowSecondOpinionSelector(true)}
                                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all hover:scale-105"
                            >
                                <Scale size={18} />
                                <span className="font-medium text-sm">Demander un 2ème avis</span>
                            </button>
                        ) : (
                            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-4 animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-slate-300">Qui doit critiquer ce rapport ?</h4>
                                    <button onClick={() => setShowSecondOpinionSelector(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {MENTOR_PROFILES
                                        .filter(m => m.id !== report.mentor.id)
                                        .map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleSelectOpinionMentor(m.id)}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-600 transition-all text-left group/mentor"
                                            >
                                                <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xs`}>
                                                    {MENTOR_ICONS[m.id]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-300 group-hover/mentor:text-white text-sm truncate">{m.name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{m.role}</div>
                                                </div>
                                                <ArrowRight size={14} className="ml-auto opacity-0 group-hover/mentor:opacity-100 text-slate-400" />
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="text-center pt-8 border-t border-slate-800 text-slate-500 italic">
                    "{report.closing}"
                </div>
            </div>
        </div>
    </div>
  );
};
