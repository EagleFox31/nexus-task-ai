
import React, { useState } from 'react';
import { WorkloadAnalysis, WorkloadAdviceExplanation, MentorId } from '../types';
import { Activity, BrainCircuit, TrendingUp, TrendingDown, Minus, BookOpen, Loader2 } from 'lucide-react';
import { explainWorkloadAdvice } from '../services/geminiService';
import { storageService } from '../services/storageService'; // To get tasks context

interface WorkloadIndicatorProps {
  initialAnalysis: WorkloadAnalysis | null;
  currentAnalysis: WorkloadAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
  onAdviceExplained: (explanation: WorkloadAdviceExplanation) => void;
  mentorId?: MentorId; // New Prop
}

export const WorkloadIndicator: React.FC<WorkloadIndicatorProps> = ({ initialAnalysis, currentAnalysis, loading, onAnalyze, onAdviceExplained, mentorId }) => {
  const [explaining, setExplaining] = useState(false);
  
  // Use current if available, otherwise initial
  const displayAnalysis = currentAnalysis || initialAnalysis;
  
  const handleExplainAdvice = async () => {
      if (!displayAnalysis?.advice) return;
      
      setExplaining(true);
      try {
          // Fetch current tasks for context
          const tasks = await storageService.getTasks();
          // Pass the mentorId to customize the tone
          const result = await explainWorkloadAdvice(displayAnalysis.advice, tasks, mentorId);
          if (result) {
              onAdviceExplained(result);
          }
      } catch (e) {
          console.error("Failed to explain advice", e);
      } finally {
          setExplaining(false);
      }
  };

  const getColor = (level?: string) => {
    switch (level) {
      case 'Light': return 'text-emerald-500 dark:text-emerald-400 border-emerald-500/30';
      case 'Balanced': return 'text-blue-500 dark:text-blue-400 border-blue-500/30';
      case 'Heavy': return 'text-orange-500 dark:text-orange-400 border-orange-500/30';
      case 'Overload': return 'text-red-500 dark:text-red-500 border-red-500/30';
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

  const getTrend = () => {
    if (!initialAnalysis || !currentAnalysis) return null;
    const diff = currentAnalysis.score - initialAnalysis.score;
    if (Math.abs(diff) < 2) return { icon: <Minus size={14} />, text: "Stable", color: "text-slate-400" };
    if (diff > 0) return { icon: <TrendingUp size={14} />, text: `+${diff}%`, color: "text-red-500 dark:text-red-400" };
    return { icon: <TrendingDown size={14} />, text: `${diff}%`, color: "text-emerald-500 dark:text-emerald-400" };
  };

  const trend = getTrend();

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group min-h-[200px] flex flex-col justify-between">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Activity size={80} className="text-slate-900 dark:text-white" />
      </div>

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
           <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BrainCircuit size={20} className="text-nexus-500 dark:text-nexus-400"/>
            Charge Cognitive
           </h3>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analyse Initiale vs Ajustée</p>
        </div>
        <button 
            onClick={onAnalyze}
            disabled={loading}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
        >
            {loading ? 'Calcul...' : 'Analyser'}
        </button>
      </div>

      {displayAnalysis ? (
        <div className="space-y-4 relative z-10">
            {/* Main Score Display */}
            <div className="flex items-end justify-between">
                <div className="flex items-end gap-2">
                    <span className={`text-4xl font-bold ${getColor(displayAnalysis.level).split(' ')[0]}`}>
                        {displayAnalysis.score}%
                    </span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded border ${getColor(displayAnalysis.level)} mb-1`}>
                        {displayAnalysis.level}
                    </span>
                </div>
                
                {/* Trend Display */}
                {trend && (
                    <div className={`flex flex-col items-end ${trend.color}`}>
                        <div className="flex items-center gap-1 font-bold text-sm">
                            {trend.icon} {trend.text}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">vs Planifié</span>
                    </div>
                )}
            </div>

            {/* Dual Progress Bar */}
            <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                {/* Current Load */}
                <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out z-20 ${getBarColor(displayAnalysis.level)}`}
                    style={{ width: `${displayAnalysis.score}%` }}
                />
                
                {/* Initial Ghost Load (if different) */}
                {initialAnalysis && initialAnalysis.score !== displayAnalysis.score && (
                    <div 
                        className="absolute top-0 left-0 h-full bg-slate-400/20 dark:bg-white/10 z-10 border-r border-slate-400/50 dark:border-white/30"
                        style={{ width: `${initialAnalysis.score}%` }}
                    />
                )}
            </div>

            <div className="flex items-start gap-3 pt-2">
                 <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-slate-400 dark:border-slate-600 pl-3">
                        "{displayAnalysis.advice}"
                    </p>
                 </div>
                 <button 
                    onClick={handleExplainAdvice}
                    disabled={explaining}
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                    title={mentorId ? "Comment appliquer ce conseil (Mode Coach)" : "Comment appliquer ce conseil ?"}
                 >
                     {explaining ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                 </button>
            </div>
            
            {/* Legend if comparing */}
            {initialAnalysis && currentAnalysis && (
                <div className="flex gap-4 text-[10px] text-slate-500 mt-1">
                     <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400/50 dark:bg-white/20"></div> Initial
                     </div>
                     <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getColor(currentAnalysis.level).split(' ')[0].replace('text-', 'bg-')}`}></div> Actuel
                     </div>
                </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-sm relative z-10">
            <p>Données insuffisantes</p>
            <button onClick={onAnalyze} className="text-nexus-500 dark:text-nexus-400 hover:text-nexus-600 dark:hover:text-nexus-300 mt-1 underline">Lancer l'analyse</button>
        </div>
      )}
    </div>
  );
};
