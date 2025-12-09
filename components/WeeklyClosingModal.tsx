
import React, { useState, useMemo } from 'react';
import { Task, WeekCycle, TaskStatus, RolloverLog, Priority, RolloverDecision } from '../types';
import { ArrowRight, Check, Trash2, Archive, ArrowRightCircle, X } from 'lucide-react';

interface WeeklyClosingModalProps {
  cycle: WeekCycle;
  tasks: Task[]; // All tasks
  onClose: () => void;
  onConfirm: (decisions: Record<string, RolloverDecision>) => Promise<void>;
}

type Step = 'INTRO' | 'TRIAGE' | 'SUMMARY';

const REASONS: { id: RolloverLog['reason']; label: string; icon: string }[] = [
    { id: 'UNDERESTIMATED', label: 'Sous-estimé (Temps)', icon: '⏱️' },
    { id: 'BLOCKED', label: 'Bloqué (Dépendance)', icon: '🚧' },
    { id: 'NOT_PRIORITY', label: 'Pas prioritaire finalement', icon: '📉' },
    { id: 'UNCLEAR', label: 'Pas clair / Flou', icon: '☁️' },
    { id: 'CONTEXT_SWITCH', label: 'Trop d\'imprévus / Interruptions', icon: '🔥' },
    { id: 'OTHER', label: 'Autre / Procrastination', icon: '🤷' }
];

export const WeeklyClosingModal: React.FC<WeeklyClosingModalProps> = ({ cycle, tasks, onClose, onConfirm }) => {
  const [step, setStep] = useState<Step>('INTRO');
  const [decisions, setDecisions] = useState<Record<string, RolloverDecision>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Filter tasks for this cycle
  const cycleTasks = useMemo(() => tasks.filter(t => t.cycleId === cycle.id), [tasks, cycle.id]);
  const completedTasks = cycleTasks.filter(t => t.status === TaskStatus.DONE);
  const unfinishedTasks = cycleTasks.filter(t => t.status !== TaskStatus.DONE);

  // Stats
  const totalPoints = cycleTasks.reduce((acc, t) => acc + (t.effort || 1), 0);
  const completedPoints = completedTasks.reduce((acc, t) => acc + (t.effort || 1), 0);
  const reliabilityScore = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Handlers
  const handleDecision = (taskId: string, decision: RolloverDecision) => {
      setDecisions(prev => ({ ...prev, [taskId]: decision }));
      if (currentTaskIndex < unfinishedTasks.length - 1) {
          setCurrentTaskIndex(prev => prev + 1);
      } else {
          setStep('SUMMARY');
      }
  };

  const handleFinish = async () => {
      setIsSubmitting(true);
      await onConfirm(decisions);
      setIsSubmitting(false);
      onClose();
  };

  // Renderers
  const renderIntro = () => (
      <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 relative">
              <span className={`text-3xl font-bold ${reliabilityScore >= 80 ? 'text-emerald-400' : reliabilityScore >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
                  {reliabilityScore}%
              </span>
              <div className="absolute -bottom-2 bg-slate-900 text-xs px-2 py-0.5 rounded border border-slate-700 text-slate-400">Fiabilité</div>
          </div>
          
          <div>
              <h2 className="text-2xl font-bold text-white mb-2">Semaine Terminée !</h2>
              <p className="text-slate-400 max-w-sm mx-auto">
                  Vous avez complété <strong>{completedTasks.length} tâches</strong> ({completedPoints} pts) sur {cycleTasks.length} prévues.
              </p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full max-w-sm">
              <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Objectif Capacité</span>
                  <span className="text-white font-mono">{completedPoints} / {totalPoints} pts</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${reliabilityScore >= 80 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${reliabilityScore}%` }} />
              </div>
          </div>

          {unfinishedTasks.length > 0 ? (
              <button 
                onClick={() => setStep('TRIAGE')}
                className="bg-nexus-500 hover:bg-nexus-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-nexus-500/20 transition-all"
              >
                  Traiter les restes ({unfinishedTasks.length}) <ArrowRight size={18} />
              </button>
          ) : (
              <button 
                onClick={handleFinish}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                  Clôturer la semaine <Check size={18} />
              </button>
          )}
      </div>
  );

  const renderTriage = () => {
      const task = unfinishedTasks[currentTaskIndex];
      const progress = ((currentTaskIndex) / unfinishedTasks.length) * 100;

      return (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Triage des restes</h3>
                  <span className="text-xs text-slate-500">{currentTaskIndex + 1} / {unfinishedTasks.length}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full mb-8">
                  <div className="h-full bg-nexus-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              {/* Task Card Focus */}
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 mb-8">
                   <div className={`text-xs px-2 py-0.5 rounded border uppercase ${
                        task.priority === Priority.HIGH ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 
                        task.priority === Priority.MEDIUM ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                        'bg-slate-700 text-slate-400 border-slate-600'
                   }`}>
                       {task.priority || 'LOW'} Priority
                   </div>
                   <h2 className="text-2xl font-bold text-white max-w-md">{task.title}</h2>
                   {task.effort && <div className="text-yellow-500 font-bold flex items-center gap-1"><span className="text-sm">⚡</span> {task.effort} pts</div>}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                   <p className="text-center text-slate-500 text-xs mb-2">Que faire de cette tâche ?</p>
                   
                   {/* Rollover with Reasons */}
                   <div className="grid grid-cols-2 gap-2 mb-2">
                       {REASONS.map(r => (
                           <button 
                                key={r.id}
                                onClick={() => handleDecision(task.id, { action: 'ROLLOVER', reason: r.id })}
                                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-nexus-500/50 rounded-xl text-left transition-all group"
                           >
                               <span className="block text-lg mb-1">{r.icon}</span>
                               <span className="text-xs font-medium text-slate-300 group-hover:text-white block leading-tight">Reporter : {r.label}</span>
                           </button>
                       ))}
                   </div>

                   <div className="flex gap-3">
                       <button 
                            onClick={() => handleDecision(task.id, { action: 'BACKLOG' })}
                            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                       >
                           <Archive size={16} /> Au Frigo (Backlog)
                       </button>
                       <button 
                            onClick={() => handleDecision(task.id, { action: 'DELETE' })}
                            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center justify-center gap-2"
                       >
                           <Trash2 size={16} /> Supprimer
                       </button>
                   </div>
              </div>
          </div>
      );
  };

  const renderSummary = () => {
      const allDecisions = Object.values(decisions) as RolloverDecision[];
      const rolloverCount = allDecisions.filter(d => d.action === 'ROLLOVER').length;
      const backlogCount = allDecisions.filter(d => d.action === 'BACKLOG').length;
      const deleteCount = allDecisions.filter(d => d.action === 'DELETE').length;

      return (
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-300 h-full justify-center">
              <div className="w-20 h-20 bg-nexus-500 rounded-full flex items-center justify-center shadow-xl shadow-nexus-500/30">
                  <Check size={40} className="text-white" />
              </div>
              
              <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Triage Terminé</h2>
                  <p className="text-slate-400">Votre semaine est propre. Voici le bilan de vos décisions :</p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                      <div className="text-xl font-bold text-white">{rolloverCount}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Reportés</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                      <div className="text-xl font-bold text-white">{backlogCount}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Backlog</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                      <div className="text-xl font-bold text-white">{deleteCount}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Supprimés</div>
                  </div>
              </div>

              <button 
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                  {isSubmitting ? <span className="animate-pulse">Traitement...</span> : <>Lancer la semaine suivante <ArrowRightCircle size={20} /></>}
              </button>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-xl h-auto min-h-[600px] rounded-3xl shadow-2xl relative flex flex-col p-8 z-10 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-nexus-500 to-emerald-500" />
            
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors z-20">
                <X size={24} />
            </button>

            {step === 'INTRO' && renderIntro()}
            {step === 'TRIAGE' && renderTriage()}
            {step === 'SUMMARY' && renderSummary()}
            
        </div>
    </div>
  );
};
