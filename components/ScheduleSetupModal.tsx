
import React, { useState } from 'react';
import { WorkSchedule } from '../types';
import { Clock, Sun, Moon, Coffee, CalendarCheck, Zap, ShieldAlert, Check } from 'lucide-react';

interface ScheduleSetupModalProps {
  onConfirm: (schedule: WorkSchedule) => void;
  isNewUser: boolean; // Pour adapter le message (Bienvenue vs Nouvelle fonctionnalité)
}

export const ScheduleSetupModal: React.FC<ScheduleSetupModalProps> = ({ onConfirm, isNewUser }) => {
  // Default standard schedule
  const [schedule, setSchedule] = useState<WorkSchedule>({
      workStart: "09:00",
      workEnd: "18:00",
      lunchStart: "12:30",
      lunchDuration: 60,
      workDays: [1, 2, 3, 4, 5] // Lun-Ven
  });

  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const toggleDay = (day: number) => {
      setSchedule(prev => {
          if (prev.workDays.includes(day)) return { ...prev, workDays: prev.workDays.filter(d => d !== day) };
          return { ...prev, workDays: [...prev.workDays, day].sort() };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onConfirm(schedule);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-nexus-900/90 backdrop-blur-md" />
        
        <div className="bg-white dark:bg-nexus-900 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-500 overflow-hidden">
            
            {/* Header Visuel */}
            <div className="bg-nexus-500 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-inner backdrop-blur-sm">
                        <Clock size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        {isNewUser ? "Synchronisons nos montres" : "Mise à jour NexusTask"}
                    </h2>
                    <p className="text-nexus-100 text-sm mt-1 max-w-xs mx-auto">
                        Pour que votre Mentor puisse vous protéger du surmenage, il doit connaître votre rythme théorique.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                
                {/* Benefits Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-nexus-600 dark:text-nexus-400 font-bold text-xs uppercase mb-1">
                            <ShieldAlert size={14} /> Mode Zombie
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                            Si vous oubliez d'arrêter le timer après {schedule.workEnd}, le système le détectera et corrigera le temps automatiquement.
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-1">
                            <Zap size={14} /> Capacité Réelle
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                            Permet de calculer si votre planning hebdo rentre dans vos heures disponibles.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CalendarCheck size={16} className="text-nexus-500" />
                            Définissez vos horaires types
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    <Sun size={14} /> Début
                                </label>
                                <input 
                                    type="time" 
                                    required
                                    value={schedule.workStart}
                                    onChange={(e) => setSchedule({...schedule, workStart: e.target.value})}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-nexus-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    <Moon size={14} /> Fin
                                </label>
                                <input 
                                    type="time" 
                                    required
                                    value={schedule.workEnd}
                                    onChange={(e) => setSchedule({...schedule, workEnd: e.target.value})}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-nexus-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 flex items-center gap-4">
                            <div className="flex-1 space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    <Coffee size={14} /> Pause Déj.
                                </label>
                                <input 
                                    type="time" 
                                    required
                                    value={schedule.lunchStart}
                                    onChange={(e) => setSchedule({...schedule, lunchStart: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    Durée (min)
                                </label>
                                <input 
                                    type="number" 
                                    min="0"
                                    max="180"
                                    value={schedule.lunchDuration}
                                    onChange={(e) => setSchedule({...schedule, lunchDuration: parseInt(e.target.value) || 0})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Jours Travaillés</label>
                             <div className="flex justify-between bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl">
                                {DAYS.map((d, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => toggleDay(i)}
                                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                                            schedule.workDays.includes(i) 
                                            ? 'bg-nexus-500 text-white shadow-md' 
                                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white'
                                        }`}
                                    >
                                        {d.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit"
                        className="w-full bg-nexus-600 hover:bg-nexus-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-nexus-500/20 transition-all hover:scale-[1.02]"
                    >
                        C'est tout bon <Check size={20} />
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">
                        Vous pourrez modifier cela plus tard dans les paramètres.
                    </p>
                </div>

            </form>
        </div>
    </div>
  );
};
