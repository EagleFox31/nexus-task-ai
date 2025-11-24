
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Check, X } from 'lucide-react';
import { DaySession } from '../types';

interface DailyControlProps {
  session: DaySession;
  setSession: React.Dispatch<React.SetStateAction<DaySession>>;
  onDayComplete: (totalTime: number) => void;
}

export const DailyControl: React.FC<DailyControlProps> = ({ session, setSession, onDayComplete }) => {
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let interval: number;

    if (session.isActive && !session.isPaused) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const start = session.startTime || now;
        // Calculate logic: Accumulated (past segments) + Current Segment (Now - Last Resume)
        const currentSegment = now - (session.lastResumeTime || start);
        setElapsed(session.accumulatedTime + currentSegment);
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
    // Calculate time since last resume and add to accumulated
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
    // Final calculation
    const now = Date.now();
    let finalAccumulated = session.accumulatedTime;
    if (!session.isPaused && session.lastResumeTime) {
        finalAccumulated += (now - session.lastResumeTime);
    }
    
    setShowConfirm(false);
    onDayComplete(finalAccumulated);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-lg shadow-nexus-900/50 min-h-[200px]">
      <div className="text-nexus-400 flex items-center gap-2 mb-2">
        <Clock size={18} />
        <span className="text-sm font-medium uppercase tracking-wider">Suivi Journalier</span>
      </div>
      
      <div className="text-4xl font-mono font-bold text-white tabular-nums tracking-tight">
        {formatTime(elapsed)}
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
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-700 hover:bg-red-500 transition-all hover:scale-105 border border-slate-600"
                  title="Terminer la journée"
                >
                  <Square className="text-white fill-current" size={20} />
                </button>
              </>
            )}
          </div>
      ) : (
          <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-sm text-slate-300">Terminer la journée ?</span>
              <div className="flex gap-3">
                  <button 
                    onClick={confirmStop}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                      <Check size={16} />
                      Oui
                  </button>
                  <button 
                    onClick={cancelStop}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
                  >
                      <X size={16} />
                      Non
                  </button>
              </div>
          </div>
      )}
      
      <p className="text-xs text-slate-400 h-4">
        {!session.isActive ? "Prêt à commencer ?" : session.isPaused ? "Session en pause" : "Focus activé"}
      </p>
    </div>
  );
};
