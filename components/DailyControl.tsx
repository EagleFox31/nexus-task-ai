
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Check, X, Edit2 } from 'lucide-react';
import { DaySession, WorkSchedule } from '../types';
import { TimeCorrectionModal } from './TimeCorrectionModal';

interface DailyControlProps {
  session: DaySession;
  setSession: React.Dispatch<React.SetStateAction<DaySession>>;
  onDayComplete: (totalTime: number) => void;
  userSchedule?: WorkSchedule; // NEW PROP
}

export const DailyControl: React.FC<DailyControlProps> = ({ session, setSession, onDayComplete, userSchedule }) => {
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // New States for Time Management
  const [showCorrection, setShowCorrection] = useState(false);
  const [isZombieCorrection, setIsZombieCorrection] = useState(false);

  // Constants
  const ZOMBIE_THRESHOLD = 4 * 60 * 60 * 1000; // 4 Hours
  const WARNING_ORANGE = 90 * 60 * 1000; // 90 mins
  const WARNING_RED = 3 * 60 * 60 * 1000; // 3 Hours

  useEffect(() => {
    let interval: number;

    if (session.isActive && !session.isPaused) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const start = session.startTime || now;
        const currentSegment = now - (session.lastResumeTime || start);
        const total = session.accumulatedTime + currentSegment;
        
        setElapsed(total);

        // Zombie Check (> 4h continuous)
        // We check if the CURRENT segment is huge, implying user forgot to pause
        if (currentSegment > ZOMBIE_THRESHOLD) {
             handlePause(); // Auto-pause
             setIsZombieCorrection(true);
             setShowCorrection(true);
        }

      }, 1000);
    } else {
      setElapsed(session.accumulatedTime);
    }

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
      if (elapsed > WARNING_RED) return 'text-red-500 animate-pulse';
      if (elapsed > WARNING_ORANGE) return 'text-orange-500 dark:text-orange-400';
      return 'text-slate-900 dark:text-white';
  };

  const handleStart = () => {
    const now = Date.now();
    setSession({
      ...session,
      isActive: true,
      isPaused: false,
      startTime: session.startTime || now,
      lastResumeTime: now, 
    });
  };

  const handlePause = () => {
    const now = Date.now();
    const addedTime = now - (session.lastResumeTime || now);
    setSession({
      ...session,
      isPaused: true,
      accumulatedTime: session.accumulatedTime + addedTime,
      lastResumeTime: null,
    });
  };

  const handleResume = () => {
     setSession({
        ...session,
        isPaused: false,
        lastResumeTime: Date.now(),
     });
  }

  const handleStopClick = () => {
      setShowConfirm(true);
  };

  const cancelStop = () => {
      setShowConfirm(false);
  };

  const confirmStop = () => {
    const now = Date.now();
    let finalAccumulated = session.accumulatedTime;
    if (!session.isPaused && session.lastResumeTime) {
        finalAccumulated += (now - session.lastResumeTime);
    }
    
    setShowConfirm(false);
    onDayComplete(finalAccumulated);
  };

  // Manual Edit Handlers
  const openManualEdit = () => {
      setIsZombieCorrection(false);
      setShowCorrection(true);
      // If running, we should pause to avoid conflicts during edit
      if (session.isActive && !session.isPaused) {
          handlePause();
      }
  };

  const applyTimeCorrection = (newTotalMs: number) => {
      setSession({
          ...session,
          accumulatedTime: newTotalMs,
          lastResumeTime: session.isActive && !session.isPaused ? Date.now() : null
          // If it was paused, it stays paused with new accumulated time
          // If it was running, we effectively reset the current segment to 0 and put everything in accumulated
      });
      setShowCorrection(false);
      setIsZombieCorrection(false);
  };

  return (
    <>
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-lg shadow-nexus-900/50 min-h-[200px]">
        <div className="text-nexus-600 dark:text-nexus-400 flex items-center gap-2 mb-2">
            <Clock size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">Suivi Journalier</span>
        </div>
        
        {/* Clickable Timer Display */}
        <div 
            className={`group relative text-4xl font-mono font-bold tabular-nums tracking-tight cursor-pointer select-none transition-colors ${getTimerColor()}`}
            onClick={openManualEdit}
            title="Cliquez pour ajuster manuellement"
        >
            {formatTime(elapsed)}
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">
                <Edit2 size={16} />
            </div>
        </div>

        {!showConfirm ? (
            <div className="flex gap-4 mt-2 animate-in fade-in zoom-in duration-300">
                {!session.isActive ? (
                <button
                    onClick={handleStart}
                    className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-nexus-500 hover:bg-nexus-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                    title="Démarrer la journée"
                >
                    <Play className="text-white fill-current ml-1" size={24} />
                </button>
                ) : (
                <>
                    {session.isPaused ? (
                    <button
                    onClick={handleResume}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-nexus-500 hover:bg-nexus-400 transition-all hover:scale-105"
                    title="Reprendre"
                    >
                    <Play className="text-white fill-current ml-1" size={24} />
                    </button>
                    ) : (
                    <button
                    onClick={handlePause}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-nexus-warning/90 hover:bg-nexus-warning transition-all hover:scale-105"
                    title="Pause"
                    >
                    <Pause className="text-white fill-current" size={24} />
                    </button>
                    )}

                    <button
                    onClick={handleStopClick}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition-all hover:scale-105 border border-slate-300 dark:border-slate-600 group/stop"
                    title="Terminer la journée"
                    >
                    <Square className="text-slate-600 dark:text-white group-hover/stop:text-white fill-current" size={20} />
                    </button>
                </>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-sm text-slate-600 dark:text-slate-300">Terminer la journée ?</span>
                <div className="flex gap-3">
                    <button 
                        onClick={confirmStop}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Check size={16} />
                        Oui
                    </button>
                    <button 
                        onClick={cancelStop}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                    >
                        <X size={16} />
                        Non
                    </button>
                </div>
            </div>
        )}
        
        <p className="text-xs text-slate-500 dark:text-slate-400 h-4 flex items-center gap-1">
            {!session.isActive ? "Prêt à commencer ?" : session.isPaused ? "Session en pause" : "Focus activé"}
            {session.isActive && !session.isPaused && elapsed > WARNING_ORANGE && <span className="text-orange-500 dark:text-orange-400 font-bold px-1">!</span>}
        </p>
        </div>

        {/* TIME CORRECTION MODAL */}
        {showCorrection && (
            <TimeCorrectionModal 
                initialMs={elapsed}
                sessionStartTime={session.startTime || Date.now()}
                schedule={userSchedule}
                isZombie={isZombieCorrection}
                onConfirm={applyTimeCorrection}
                onCancel={() => { setShowCorrection(false); setIsZombieCorrection(false); }}
            />
        )}
    </>
  );
};
