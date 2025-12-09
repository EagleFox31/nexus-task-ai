
import React, { useState } from 'react';
import { UserProfile, WorkSchedule } from '../types';
import { X, Clock, Sun, Moon, Coffee, Save, Check } from 'lucide-react';

interface ProfileSettingsModalProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ profile, onUpdate, onClose }) => {
  const [schedule, setSchedule] = useState<WorkSchedule>(profile.workSchedule || {
      workStart: "09:00",
      workEnd: "18:00",
      lunchStart: "12:30",
      lunchDuration: 60,
      workDays: [1, 2, 3, 4, 5]
  });

  const [displayName, setDisplayName] = useState(profile.displayName || "");

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdate({ ...profile, displayName, workSchedule: schedule });
      onClose();
  };

  const toggleDay = (day: number) => {
      setSchedule(prev => {
          if (prev.workDays.includes(day)) return { ...prev, workDays: prev.workDays.filter(d => d !== day) };
          return { ...prev, workDays: [...prev.workDays, day].sort() };
      });
  };

  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Paramètres Profil
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                
                {/* Identity */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nom d'affichage</label>
                    <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-nexus-500 outline-none"
                    />
                </div>

                {/* Schedule Config */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="text-nexus-400" size={20} />
                        <h3 className="font-bold text-white">Rythme Habituel</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-6">
                        Ces horaires servent à corriger intelligemment le timer si vous oubliez de l'arrêter.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                                <Sun size={14} /> Début Journée
                            </label>
                            <input 
                                type="time" 
                                value={schedule.workStart}
                                onChange={(e) => setSchedule({...schedule, workStart: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white"
                            />
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                                <Moon size={14} /> Fin Journée
                            </label>
                            <input 
                                type="time" 
                                value={schedule.workEnd}
                                onChange={(e) => setSchedule({...schedule, workEnd: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                <Coffee size={14} /> Pause Déjeuner
                            </label>
                        </div>
                        <div className="flex items-center gap-4">
                            <input 
                                type="time" 
                                value={schedule.lunchStart}
                                onChange={(e) => setSchedule({...schedule, lunchStart: e.target.value})}
                                className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">Durée:</span>
                                <input 
                                    type="number" 
                                    value={schedule.lunchDuration}
                                    onChange={(e) => setSchedule({...schedule, lunchDuration: parseInt(e.target.value) || 0})}
                                    className="w-16 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-center"
                                />
                                <span className="text-sm text-slate-400">min</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jours Travaillés</label>
                        <div className="flex justify-between bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                            {DAYS.map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => toggleDay(i)}
                                    className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                                        schedule.workDays.includes(i) 
                                        ? 'bg-nexus-500 text-white shadow' 
                                        : 'text-slate-500 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-nexus-500 hover:bg-nexus-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-nexus-500/20 transition-all"
                >
                    <Save size={18} /> Enregistrer
                </button>

            </form>
        </div>
    </div>
  );
};
