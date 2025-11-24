
import React from 'react';
import { DailyLog } from '../types';
import { Clock, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsOverviewProps {
  history: DailyLog[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ history }) => {
  
  const formatHours = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    return hours < 0.1 && hours > 0 ? '< 0.1h' : `${hours.toFixed(1)}h`;
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Calculate Stats
  let timeYesterday = 0;
  let timeWeek = 0;
  let timeMonth = 0;
  let timeLastMonth = 0;

  history.forEach(log => {
    const logDate = new Date(log.date);
    
    // Yesterday
    if (isSameDay(logDate, yesterday)) {
        timeYesterday += log.totalTime;
    }

    // This Week
    if (logDate >= startOfWeek) {
        timeWeek += log.totalTime;
    }

    // This Month
    if (logDate >= startOfMonth) {
        timeMonth += log.totalTime;
    }

    // Last Month
    if (logDate >= startOfLastMonth && logDate <= endOfLastMonth) {
        timeLastMonth += log.totalTime;
    }
  });

  // Calculate Trend (Month vs Last Month prorated or just raw comparison)
  // Simple raw comparison for now
  const trend = timeMonth - timeLastMonth;
  const hasData = history.length > 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      
      {/* Yesterday Card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Hier</span>
        </div>
        <div className="text-2xl font-mono font-bold text-white">
            {formatHours(timeYesterday)}
        </div>
        <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
             <div className="h-full bg-indigo-500/50 w-1/2"></div>{/* Dummy visual filler */}
        </div>
      </div>

      {/* Week Card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Calendar size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Semaine</span>
        </div>
        <div className="text-2xl font-mono font-bold text-white">
            {formatHours(timeWeek)}
        </div>
        <div className="text-xs text-slate-500 mt-1">
            Depuis Lundi
        </div>
      </div>

       {/* Month Card + Trend */}
       <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group hover:bg-white/5 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
            <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Mois</span>
            </div>
            
            {/* Trend Indicator */}
            {hasData && timeLastMonth > 0 && (
                <div className={`flex items-center text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trend > 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                    {trend > 0 ? '+' : ''}{Math.round(((timeMonth - timeLastMonth) / timeLastMonth) * 100)}%
                </div>
            )}
        </div>
        <div className="text-2xl font-mono font-bold text-nexus-400">
            {formatHours(timeMonth)}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
             vs mois dernier ({formatHours(timeLastMonth)})
        </div>
      </div>

    </div>
  );
};
