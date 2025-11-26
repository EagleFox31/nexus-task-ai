
import React from 'react';
import { WeeklyReportData, MentorId } from '../types';
import { X, Calendar, User, ArrowRight, Trash2 } from 'lucide-react';
import { MENTOR_ICONS, MENTOR_PROFILES } from '../data/mentors';

interface ReportHistoryModalProps {
  reports: WeeklyReportData[];
  onSelectReport: (report: WeeklyReportData) => void;
  onDeleteReport: (id: string) => void;
  onClose: () => void;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({ reports, onSelectReport, onDeleteReport, onClose }) => {
  
  const formatDate = (dateStr?: string) => {
      if (!dateStr) return 'Date inconnue';
      return new Date(dateStr).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  const getMentorColor = (mentorId: string) => {
      const mentor = MENTOR_PROFILES.find(m => m.id === mentorId);
      return mentor ? mentor.color : 'from-slate-600 to-zinc-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="bg-nexus-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-nexus-400" size={24} />
                    Historique des Rapports
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar p-4 space-y-3">
                {reports.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>Aucun rapport archivé pour le moment.</p>
                    </div>
                ) : (
                    reports.map((report: WeeklyReportData) => {
                        const mentorId = report.mentor.id as MentorId;
                        
                        return (
                            <div 
                                key={report.id} 
                                className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-nexus-500/50 rounded-xl p-4 transition-all cursor-pointer"
                                onClick={() => onSelectReport(report)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getMentorColor(mentorId)} flex items-center justify-center text-white shadow-lg`}>
                                            {MENTOR_ICONS[mentorId] || <User size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium flex items-center gap-2">
                                                {report.mentor.name}
                                                <span className="text-[10px] text-slate-500 font-normal uppercase border border-slate-700 px-1.5 rounded">
                                                    {report.week.start.split('-').slice(1).reverse().join('/')} - {report.week.end.split('-').slice(1).reverse().join('/')}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Généré le {formatDate(report.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(report.id) onDeleteReport(report.id); }}
                                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Supprimer ce rapport"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                <p className="text-sm text-slate-300 line-clamp-2 border-l-2 border-slate-600 pl-3 mb-3 group-hover:border-nexus-500 transition-colors">
                                    {report.executive_summary}
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex gap-3">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            {report.metrics_snapshot.tasks_completed} Tâches
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-nexus-500"></span>
                                            {report.metrics_snapshot.focus_minutes}m Focus
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-nexus-400 font-bold group-hover:translate-x-1 transition-transform">
                                        Lire le rapport <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
  );
};
