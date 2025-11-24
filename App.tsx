
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Priority, DaySession, WorkloadAnalysis, DailyLog } from './types';
import { analyzeWorkload } from './services/geminiService';
import { storageService } from './services/storageService';
import { auth, googleProvider } from './services/firebase'; // Import auth
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'; // Auth methods
import { DailyControl } from './components/DailyControl';
import { TaskCard } from './components/TaskCard';
import { WorkloadIndicator } from './components/WorkloadIndicator';
import { StatsOverview } from './components/StatsOverview';
import { LoginScreen } from './components/LoginScreen';
import { Plus, LayoutGrid, List, Rocket, Wifi, WifiOff, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- App State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<DailyLog[]>([]);
  
  // Dual Workload State
  const [initialWorkload, setInitialWorkload] = useState<WorkloadAnalysis | null>(null);
  const [currentWorkload, setCurrentWorkload] = useState<WorkloadAnalysis | null>(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [isCloudActive, setIsCloudActive] = useState(false);
  
  const [session, setSession] = useState<DaySession>({
    isActive: false,
    isPaused: false,
    startTime: null,
    accumulatedTime: 0,
    lastResumeTime: null,
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // --- Auth Effect ---
  useEffect(() => {
    if (!auth) {
        setAuthLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      // If user logs out, clear local state to prevent data leak
      if (!currentUser) {
          setTasks([]);
          setHistory([]);
          setSession({ isActive: false, isPaused: false, startTime: null, accumulatedTime: 0, lastResumeTime: null });
          setInitialWorkload(null);
          setCurrentWorkload(null);
          setIsLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Data Loading Effect ---
  useEffect(() => {
    if (!user) return; // Only load data if user is logged in

    const loadData = async () => {
        setIsLoaded(false); // Start loading
        setIsCloudActive(storageService.isCloudActive());

        const [loadedTasks, loadedSession, loadedHistory, loadedWorkloads] = await Promise.all([
            storageService.getTasks(),
            storageService.getSession(),
            storageService.getHistory(),
            storageService.getWorkloads()
        ]);
        
        if (loadedTasks.length > 0) setTasks(loadedTasks);
        if (loadedSession) setSession(loadedSession);
        if (loadedHistory.length > 0) setHistory(loadedHistory);
        if (loadedWorkloads) {
            setInitialWorkload(loadedWorkloads.initial);
            setCurrentWorkload(loadedWorkloads.current);
        }
        
        setIsLoaded(true);
    };
    
    loadData();
  }, [user]); // Run when user changes (logs in)

  // Persist Data on Change
  useEffect(() => {
    if (isLoaded && user) {
        storageService.saveTasks(tasks);
    }
  }, [tasks, isLoaded, user]);

  useEffect(() => {
    if (isLoaded && user) {
        storageService.saveSession(session);
    }
  }, [session, isLoaded, user]);

  useEffect(() => {
      if (isLoaded && user) {
          storageService.saveWorkloads(initialWorkload, currentWorkload);
      }
  }, [initialWorkload, currentWorkload, isLoaded, user]);

  // --- Handlers ---

  const handleLogin = async () => {
    if (!auth || !googleProvider) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
        console.error("Login failed", error);
        setLoginError(error.code || error.message);
    } finally {
        setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
      if (!auth) return;
      try {
          await signOut(auth);
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      subTasks: []
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleDayComplete = async (totalTime: number) => {
     const completedCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
     
     const log: DailyLog = {
         id: Date.now().toString(),
         date: new Date().toISOString(),
         totalTime,
         completedTasks: completedCount
     };
     
     await storageService.saveLog(log);
     setHistory(prev => [...prev, log]);
     
     setSession({
        isActive: false,
        isPaused: false,
        startTime: null,
        accumulatedTime: 0,
        lastResumeTime: null,
     });
  };

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    const result = await analyzeWorkload(tasks);
    
    if (!initialWorkload) {
        setInitialWorkload(result);
    }
    setCurrentWorkload(result);
    
    setAnalyzing(false);
  }, [tasks, initialWorkload]);

  const sortedTasks = [...tasks].sort((a, b) => {
      if (a.status === TaskStatus.DONE && b.status !== TaskStatus.DONE) return 1;
      if (a.status !== TaskStatus.DONE && b.status === TaskStatus.DONE) return -1;
      const pVal = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      return pVal[b.priority] - pVal[a.priority];
  });

  // --- Render Loading / Login / App ---

  if (authLoading) {
      return <div className="min-h-screen bg-nexus-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-nexus-500 border-t-transparent rounded-full animate-spin"></div>
      </div>;
  }

  if (!user) {
      return <LoginScreen onLogin={handleLogin} loading={loginLoading} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-nexus-900 text-slate-200 pb-20 selection:bg-nexus-500 selection:text-white">
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-nexus-500 to-nexus-400 rounded-lg flex items-center justify-center shadow-lg shadow-nexus-500/20">
                <Rocket className="text-white fill-white/20" size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Nexus<span className="text-nexus-400">Task</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-colors duration-500 ${
                 isCloudActive 
                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                 : 'bg-slate-800/50 text-slate-500 border-slate-700/50'
             }`}>
                {isCloudActive ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="font-medium">
                    {isCloudActive ? 'Cloud Sync' : 'Offline'}
                </span>
             </div>

            <div className="flex items-center gap-2">
                 {user.photoURL ? (
                     <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                 ) : (
                     <div className="w-8 h-8 rounded-full bg-nexus-700 flex items-center justify-center text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                 )}
                 <button 
                    onClick={handleLogout}
                    title="Se déconnecter"
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                 >
                     <LogOut size={18} />
                 </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1">
                <DailyControl session={session} setSession={setSession} onDayComplete={handleDayComplete} />
            </div>

            <div className="md:col-span-1">
                <WorkloadIndicator 
                    initialAnalysis={initialWorkload}
                    currentAnalysis={currentWorkload}
                    loading={analyzing} 
                    onAnalyze={runAnalysis}
                />
            </div>

            <div className="md:col-span-1 glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Progression</h3>
                    <p className="text-slate-400 text-xs">Tâches terminées cette semaine</p>
                </div>
                <div className="mt-4">
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-3xl font-bold text-white">{tasks.filter(t => t.status === TaskStatus.DONE).length}</span>
                        <span className="text-sm text-slate-500">sur {tasks.length}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div 
                            className="bg-nexus-500 h-1.5 rounded-full transition-all duration-700" 
                            style={{ width: `${tasks.length ? (tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100 : 0}%` }} 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Statistics Row */}
        <StatsOverview history={history} />

        <div className="mb-8 flex items-center gap-4">
            <form onSubmit={handleAddTask} className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Plus className="text-nexus-400" size={20} />
                </div>
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ajouter une nouvelle tâche majeure..."
                    className="block w-full pl-11 pr-4 py-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 focus:border-nexus-500 transition-all shadow-lg"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                    <button 
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="bg-nexus-600 hover:bg-nexus-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Ajouter
                    </button>
                </div>
            </form>
            
             <div className="hidden md:flex bg-slate-800/50 rounded-xl p-1 border border-slate-700 h-[58px] items-center px-1">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <List size={20} />
                </button>
            </div>
        </div>

        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
            {sortedTasks.map(task => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdate={handleUpdateTask} 
                    onDelete={handleDeleteTask}
                />
            ))}
            
            {isLoaded && sortedTasks.length === 0 && (
                <div className="col-span-full py-20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                        <LayoutGrid className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-slate-300 font-medium text-lg">Tout est calme</h3>
                    <p className="text-slate-500 mt-1">Commencez par ajouter vos objectifs de la semaine.</p>
                </div>
            )}

            {!isLoaded && (
                 <div className="col-span-full py-20 text-center text-slate-500">
                    Chargement de vos données...
                 </div>
            )}
        </div>

      </main>
    </div>
  );
};

export default App;
