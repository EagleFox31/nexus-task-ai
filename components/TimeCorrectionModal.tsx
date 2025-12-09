
import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Clock, AlertTriangle, Moon, Sun, Briefcase, Coffee, Edit2 } from 'lucide-react';
import { WorkSchedule } from '../types';

interface TimeCorrectionModalProps {
  initialMs: number;
  sessionStartTime: number; // Start timestamp of the session
  schedule?: WorkSchedule; // User schedule for smart guessing
  isZombie: boolean; 
  onConfirm: (newMs: number) => void;
  onCancel: () => void;
}

export const TimeCorrectionModal: React.FC<TimeCorrectionModalProps> = ({ initialMs, sessionStartTime, schedule, isZombie, onConfirm, onCancel }) => {
  const [mode, setMode] = useState<'SMART' | 'MANUAL'>(isZombie ? 'SMART' : 'MANUAL');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // Suggestions
  const [suggestedTime, setSuggestedTime] = useState<{ label: string, ms: number, icon: any } | null>(null);

  useEffect(() => {
    // Calc Manual Default
    const h = Math.floor(initialMs / (1000 * 60 * 60));
    const m = Math.floor((initialMs / (1000 * 60)) % 60);
    setHours(h);
    setMinutes(m);

    // Smart Suggestion Logic
    if (isZombie && schedule) {
        const startDate = new Date(sessionStartTime);
        const now = new Date();
        
        // Scenario 1: Forgot to stop at end of work day
        const endWorkTime = new Date(startDate);
        const [endH, endM] = schedule.workEnd.split(':').map(Number);
        endWorkTime.setHours(endH, endM, 0, 0);

        if (now > endWorkTime && startDate < endWorkTime) {
            const probableDuration = endWorkTime.getTime() - startDate.getTime();
            if (probableDuration > 0) {
                setSuggestedTime({
                    label: `J'ai fini à mon heure habituelle (${schedule.workEnd})`,
                    ms: probableDuration,
                    icon: Moon
                });
            }
        }
    }
  }, [initialMs, sessionStartTime, schedule, isZombie]);

  const handleManualSave = () => {
    const totalMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    onConfirm(totalMs);
  };

  const applySuggestion = () => {
      if (suggestedTime) onConfirm(suggestedTime.ms);
  };

  const formatDuration = (ms: number) => {
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms / (1000 * 60)) % 60);
      return `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl relative flex flex-col p-6 z-10 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isZombie ? 'bg-red-500/20 text-red-400' : 'bg-nexus-500/20 text-nexus-400'}`}>
                    {isZombie ? <AlertTriangle size={20} /> : <Clock size={20} />}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">
                        {isZombie ? "Absence détectée" : "Ajustement"}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {isZombie ? "Le timer a tourné trop longtemps." : "Correction manuelle du temps."}
                    </p>
                </div>
            </div>

            {mode === 'SMART' && suggestedTime ? (
                <div className="space-y-3">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-300 mb-4">Que s'est-il passé ?</p>
                        
                        <button 
                            onClick={applySuggestion}
                            className="w-full flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-lg group transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <suggestedTime.icon size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-emerald-400 text-sm">{suggestedTime.label}</div>
                                <div className="text-xs text-emerald-500/60">Garder seulement {formatDuration(suggestedTime.ms)}</div>
                            </div>
                        </button>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase">Ou</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <button 
                            onClick={() => setMode('MANUAL')}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white text-sm font-medium transition-colors"
                        >
                           <Edit2 size={14} className="inline mr-2" />
                           Ajuster manuellement
                        </button>
                    </div>

                    <button 
                        onClick={() => onConfirm(0)} 
                        className="w-full py-2 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 hover:underline opacity-80"
                    >
                        <Trash2 size={12} /> C'était une erreur (Ne rien compter)
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1">Heures</label>
                            <input 
                                type="number" 
                                min="0" max="23"
                                value={hours}
                                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-20 h-16 bg-slate-800 border border-slate-600 rounded-xl text-3xl font-mono text-center text-white focus:border-nexus-500 outline-none"
                            />
                        </div>
                        <span className="text-2xl text-slate-600 font-bold mt-4">:</span>
                        <div className="flex flex-col items-center">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1">Minutes</label>
                            <input 
                                type="number" 
                                min="0" max="59"
                                value={minutes}
                                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                className="w-20 h-16 bg-slate-800 border border-slate-600 rounded-xl text-3xl font-mono text-center text-white focus:border-nexus-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onCancel}
                            className="py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={handleManualSave}
                            className="py-3 rounded-xl bg-nexus-500 hover:bg-nexus-400 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-nexus-500/20"
                        >
                            <Check size={18} /> Valider
                        </button>
                    </div>
                </>
            )}
            
        </div>
    </div>
  );
};
