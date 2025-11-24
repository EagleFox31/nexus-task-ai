import React from 'react';
import { WorkloadAnalysis } from '../types';
import { Activity, BrainCircuit } from 'lucide-react';

interface WorkloadIndicatorProps {
  analysis: WorkloadAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
}

export const WorkloadIndicator: React.FC<WorkloadIndicatorProps> = ({ analysis, loading, onAnalyze }) => {
  const getColor = (level?: string) => {
    switch (level) {
      case 'Light': return 'text-emerald-400 border-emerald-500/30';
      case 'Balanced': return 'text-blue-400 border-blue-500/30';
      case 'Heavy': return 'text-orange-400 border-orange-500/30';
      case 'Overload': return 'text-red-500 border-red-500/30';
      default: return 'text-slate-400 border-slate-500/30';
    }
  };

  const getBarColor = (level?: string) => {
    switch (level) {
      case 'Light': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'Balanced': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      case 'Heavy': return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
      case 'Overload': return 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Activity size={80} />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
           <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BrainCircuit size={20} className="text-nexus-400"/>
            Charge Cognitive
           </h3>
           <p className="text-xs text-slate-400 mt-1">Analyse IA de votre semaine</p>
        </div>
        <button 
            onClick={onAnalyze}
            disabled={loading}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 border-slate-600'}`}
        >
            {loading ? 'Analyse...' : 'Actualiser'}
        </button>
      </div>

      {analysis ? (
        <div className="space-y-4 relative z-10">
            <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold ${getColor(analysis.level).split(' ')[0]}`}>
                    {analysis.score}%
                </span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded border ${getColor(analysis.level)} mb-1`}>
                    {analysis.level}
                </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(analysis.level)}`}
                    style={{ width: `${analysis.score}%` }}
                />
            </div>

            <p className="text-sm text-slate-300 italic border-l-2 border-slate-600 pl-3">
                "{analysis.advice}"
            </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 text-slate-500 text-sm relative z-10">
            <p>Aucune donnée disponible</p>
            <button onClick={onAnalyze} className="text-nexus-400 hover:text-nexus-300 mt-1 underline">Lancer l'analyse</button>
        </div>
      )}
    </div>
  );
};
