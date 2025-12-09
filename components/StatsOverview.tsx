
import React from 'react';
import { DailyLog, UserProfile } from '../types';
import { Clock, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsOverviewProps {
  history: DailyLog[];
  userProfile?: UserProfile | null;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ history, userProfile }) => {
  
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

  // Calculate Trend
  const trend = timeMonth - timeLastMonth;
  const hasData = history.length > 0;

  // CALCULATE DYNAMIC DAILY GOAL
  const getDailyGoalMs = () => {
      if (!userProfile?.workSchedule) return 8 * 60 * 60 * 1000; // Fallback 8h
      
      const { workStart, workEnd, lunchDuration } = userProfile.workSchedule;
      const [startH, startM] = workStart.split(':').map(Number);
      const [endH, endM] = workEnd.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      const totalMinutes = (endMinutes - startMinutes) - lunchDuration;
      
      // Safety check if schedule is invalid (negative or zero)
      if (totalMinutes <= 0) return 8 * 60 * 60 * 1000;
      
      return totalMinutes * 60 * 1000;
  };

  const DAILY_GOAL_MS = getDailyGoalMs();
  const dailyGoalHours = DAILY_GOAL_MS / (1000 * 60 * 60);
  const yesterdayProgress = Math.min((timeYesterday / DAILY_GOAL_MS) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Yesterday Card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Clock size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Hier</span>
        </div>
        <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {formatHours(timeYesterday)}
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
             <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${yesterdayProgress}%` }}
             ></div>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 text-right">
            Objectif {Number.isInteger(dailyGoalHours) ? dailyGoalHours : dailyGoalHours.toFixed(1)}h
        </div>
      </div>

      {/* Week Card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Calendar size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Semaine</span>
        </div>
        <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {formatHours(timeWeek)}
        </div>
        <div className="text-xs text-slate-500 mt-1">
            Depuis Lundi
        </div>
      </div>

       {/* Month Card + Trend */}
       <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Mois</span>
            </div>
            
            {/* Trend Indicator */}
            {hasData && timeLastMonth > 0 && (
                <div className={`flex items-center text-xs font-bold ${trend >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {trend > 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                    {trend > 0 ? '+' : ''}{Math.round(((timeMonth - timeLastMonth) / timeLastMonth) * 100)}%
                </div>
            )}
        </div>
        <div className="text-2xl font-mono font-bold text-nexus-600 dark:text-nexus-400">
            {formatHours(timeMonth)}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
             vs mois dernier ({formatHours(timeLastMonth)})
        </div>
      </div>

    </div>
  );
};
