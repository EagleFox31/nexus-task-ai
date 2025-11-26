














import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Priority, DaySession, WorkloadAnalysis, DailyLog, MentorId, WeeklyReportData, UserProfile, CounterAnalysis, WorkloadAdviceExplanation, AdviceLog, PrioritizationSuggestion, Project } from './types';
import { analyzeWorkload, generateWeeklyReport, generateCounterAnalysis, suggestTaskPriorities } from './services/geminiService';
import { storageService } from './services/storageService';
import { auth, googleProvider } from './services/firebase'; 
import firebase from 'firebase/compat/app'; 
import { DailyControl } from './components/DailyControl';
import { TaskCard } from './components/TaskCard';
import { WorkloadIndicator } from './components/WorkloadIndicator';
import { StatsOverview } from './components/StatsOverview';
import { LoginScreen } from './components/LoginScreen';
import { MentorSelector } from './components/MentorSelector';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { ReportHistoryModal } from './components/ReportHistoryModal';
import { AdviceHistoryModal } from './components/AdviceHistoryModal';
import { PinnedInsight } from './components/PinnedInsight';
import { OnboardingWizard } from './components/OnboardingWizard';
import { StarfieldBackground } from './components/StarfieldBackground';
import { PrioritizationModal } from './components/PrioritizationModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { ProjectPlanningModal } from './components/ProjectPlanningModal';
import { generateHeaderGreeting } from './services/greetingService';
import { Plus, LayoutGrid, List, Rocket, Wifi, WifiOff, LogOut, FileText, Sparkles, X, Flag, BookOpen, Lightbulb, Wand2, FolderPlus, Folder } from 'lucide-react';

type User = firebase.User;

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // --- App State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // New Project State
  const [history, setHistory] = useState<DailyLog[]>([]);
  
  // Dual Workload State
  const [initialWorkload, setInitialWorkload] = useState<WorkloadAnalysis | null>(null);
  const [currentWorkload, setCurrentWorkload] = useState<WorkloadAnalysis | null>(null);
  const [pinnedAdvice, setPinnedAdvice] = useState<WorkloadAdviceExplanation | null>(null);
  const [adviceHistory, setAdviceHistory] = useState<AdviceLog[]>([]);
  
  // Mentor & Report State
  const [currentMentorId, setCurrentMentorId] = useState<MentorId | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Modals
  const [showMentorSelector, setShowMentorSelector] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showPrioritizationModal, setShowPrioritizationModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false); // New Project Modal
  const [planningProject, setPlanningProject] = useState<Project | null>(null); // For AI Project Planning

  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [reportsHistory, setReportsHistory] = useState<WeeklyReportData[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [prioritizationSuggestions, setPrioritizationSuggestions] = useState<PrioritizationSuggestion[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false); 
  const [isCloudActive, setIsCloudActive] = useState(false);
  
  const [session, setSession] = useState<DaySession>({
    isActive: false,
    isPaused: false,
    startTime: null,
    accumulatedTime: 0,
    lastResumeTime: null,
  });
  
  // UI Inputs & Filters
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.LOW);
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>(''); // For creation
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterProjectId, setFilterProjectId] = useState<string | 'ALL'>('ALL'); // For filtering list

  // --- Auth Effect ---
  useEffect(() => {
    if (!auth) {
        setAuthLoading(false);
        return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser: User | null) => {
      if (isTestMode) return;
      
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
          setTasks([]);
          setProjects([]);
          setHistory([]);
          setSession({ isActive: false, isPaused: false, startTime: null, accumulatedTime: 0, lastResumeTime: null });
          setInitialWorkload(null);
          setCurrentWorkload(null);
          setCurrentMentorId(undefined);
          setUserProfile(null);
          setWeeklyReport(null);
          setReportsHistory([]);
          setAdviceHistory([]);
          setPinnedAdvice(null);
          setIsLoaded(false);
      }
    });
    return () => unsubscribe();
  }, [isTestMode]);

  // --- Data Loading Effect ---
  useEffect(() => {
    if (!user) return; 

    const loadData = async () => {
        setIsLoaded(false); 
        setIsCloudActive(storageService.isCloudActive());

        const [loadedTasks, loadedProjects, loadedSession, loadedHistory, loadedWorkloads, loadedProfile, loadedReports, loadedAdvice] = await Promise.all([
            storageService.getTasks(),
            storageService.getProjects(),
            storageService.getSession(),
            storageService.getHistory(),
            storageService.getWorkloads(),
            storageService.getUserProfile(),
            storageService.getWeeklyReports(),
            storageService.getAdviceHistory()
        ]);
        
        if (loadedTasks.length > 0) setTasks(loadedTasks);
        if (loadedProjects.length > 0) setProjects(loadedProjects);
        if (loadedSession) setSession(loadedSession);
        if (loadedHistory.length > 0) setHistory(loadedHistory);
        if (loadedWorkloads) {
            setInitialWorkload(loadedWorkloads.initial);
            setCurrentWorkload(loadedWorkloads.current);
        }
        if (loadedReports.length > 0) setReportsHistory(loadedReports);
        if (loadedAdvice.length > 0) {
            setAdviceHistory(loadedAdvice);
            if (loadedAdvice.length > 0) {
                 setPinnedAdvice(loadedAdvice[0].content);
            }
        }
        
        if (loadedProfile && loadedProfile.onboardingStatus === 'complete') {
            setUserProfile(loadedProfile);
            setCurrentMentorId(loadedProfile.mentorId);
            setShowOnboarding(false);
        } else {
            setShowOnboarding(true);
        }
        
        setIsLoaded(true);
    };
    
    loadData();
  }, [user]);

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
        await auth.signInWithPopup(googleProvider);
    } catch (error: any) {
        console.error("Login failed", error);
        setLoginError(error.code || error.message);
    } finally {
        setLoginLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoginLoading(true);
    setTimeout(() => {
        const mockUser = {
            uid: 'tester_mode_user',
            email: 'test@nexustask.ai',
            displayName: 'Testeur Nexus',
        } as unknown as User;

        setIsTestMode(true);
        setUser(mockUser);
        localStorage.setItem('nexus_user_id', mockUser.uid);
        setLoginLoading(false);
    }, 800);
  };

  const handleLogout = async () => {
      storageService.clearAll();

      if (isTestMode) {
          setIsTestMode(false);
          setUser(null);
          setTasks([]);
          setProjects([]);
          setHistory([]);
          setSession({ isActive: false, isPaused: false, startTime: null, accumulatedTime: 0, lastResumeTime: null });
          setInitialWorkload(null);
          setCurrentWorkload(null);
          setCurrentMentorId(undefined);
          setUserProfile(null);
          setWeeklyReport(null);
          setReportsHistory([]);
          setAdviceHistory([]);
          setPinnedAdvice(null);
          setIsLoaded(false);
          return;
      }

      if (!auth) return;
      try {
          await auth.signOut();
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
      setUserProfile(profile);
      setCurrentMentorId(profile.mentorId);
      await storageService.saveUserProfile(profile);
      setShowOnboarding(false);
  };

  const cyclePriority = (e: React.MouseEvent) => {
      e.preventDefault();
      if (newTaskPriority === Priority.LOW) setNewTaskPriority(Priority.MEDIUM);
      else if (newTaskPriority === Priority.MEDIUM) setNewTaskPriority(Priority.HIGH);
      else setNewTaskPriority(Priority.LOW);
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
          case Priority.MEDIUM: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
          default: return 'text-slate-400 bg-slate-700/50 border-slate-600';
      }
  };

  // --- Project CRUD ---
  const handleAddProject = async (project: Project) => {
      setProjects([project, ...projects]);
      await storageService.addProject(project);
  };
  const handleUpdateProject = async (project: Project) => {
      setProjects(projects.map(p => p.id === project.id ? project : p));
      await storageService.updateProject(project);
  };
  const handleDeleteProject = async (id: string) => {
      setProjects(projects.filter(p => p.id !== id));
      // Local state update for tasks linked to this project
      setTasks(tasks.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
      await storageService.deleteProject(id);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: '',
      status: TaskStatus.TODO,
      priority: newTaskPriority,
      projectId: newTaskProjectId || undefined,
      subTasks: []
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskPriority(Priority.LOW); 
    // Keep project selection or reset? Let's keep it for rapid entry in same project.
    
    await storageService.addTask(newTask);
  };

  const handleAddMultipleTasks = async (newTasksPartial: Partial<Task>[]) => {
      const newTasks: Task[] = newTasksPartial.map((t, i) => ({
          id: Date.now().toString() + i,
          title: t.title || "Nouvelle tâche",
          description: t.description || "",
          status: TaskStatus.TODO,
          priority: t.priority || Priority.LOW,
          projectId: t.projectId,
          subTasks: []
      }));

      setTasks([...newTasks, ...tasks]);
      for (const t of newTasks) {
          await storageService.addTask(t);
      }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    await storageService.updateTask(updatedTask);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await storageService.deleteTask(id);
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
     setSession({ isActive: false, isPaused: false, startTime: null, accumulatedTime: 0, lastResumeTime: null });
  };

  // --- AI HANDLERS (UPDATED WITH PROJECT CONTEXT AND HISTORY) ---

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    // Pass Projects AND History to AI for velocity-based adaptation
    const result = await analyzeWorkload(tasks, projects, history);
    
    if (!initialWorkload) setInitialWorkload(result);
    setCurrentWorkload(result);
    setAnalyzing(false);
  }, [tasks, projects, history, initialWorkload]);

  const handlePrioritize = async () => {
      if (tasks.length === 0) return;
      setPrioritizing(true);
      const goal = userProfile?.primaryGoal || "Être productif";
      
      const suggestions = await suggestTaskPriorities(
          tasks.filter(t => t.status !== TaskStatus.DONE), 
          projects, 
          goal
      );
      
      setPrioritizing(false);

      if (suggestions === null) {
          alert("Erreur lors de l'analyse IA. Veuillez réessayer.");
          return;
      }

      const filteredSuggestions = suggestions.filter(s => {
          const task = tasks.find(t => t.id === s.taskId);
          if (!task) return false;
          s.currentPriority = task.priority || Priority.LOW;
          return s.suggestedPriority !== task.priority;
      });

      setPrioritizationSuggestions(filteredSuggestions);
      
      if (filteredSuggestions.length > 0) {
          setShowPrioritizationModal(true);
      } else {
          alert("Vos priorités sont déjà optimales selon l'IA !");
      }
  };

  const handleApplyPriorities = async (changes: PrioritizationSuggestion[]) => {
      const updatedTasks = [...tasks];
      for (const change of changes) {
          const index = updatedTasks.findIndex(t => t.id === change.taskId);
          if (index !== -1) {
              const newTask = { ...updatedTasks[index], priority: change.suggestedPriority };
              updatedTasks[index] = newTask;
              await storageService.updateTask(newTask);
          }
      }
      setTasks(updatedTasks);
      setShowPrioritizationModal(false);
  };

  const handleAdviceExplained = async (explanation: WorkloadAdviceExplanation) => {
      setPinnedAdvice(explanation);
      const newAdvice: AdviceLog = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          source: 'CognitiveLoad',
          content: explanation
      };
      await storageService.saveAdvice(newAdvice);
      setAdviceHistory(prev => [newAdvice, ...prev]);
  };
  
  const handleReportClick = () => {
      if (!currentMentorId) setShowMentorSelector(true);
      else generateReport(currentMentorId);
  };
  
  const handleSelectMentor = async (id: MentorId) => {
      setCurrentMentorId(id);
      if (userProfile) {
          const updated: UserProfile = { ...userProfile, mentorId: id };
          setUserProfile(updated);
          await storageService.saveUserProfile(updated);
      } else {
          storageService.saveUserPreferences({ mentorId: id });
      }
      setShowMentorSelector(false);
      setTimeout(() => generateReport(id), 100);
  };
  
  const generateReport = async (mentorId: MentorId) => {
      setGeneratingReport(true);
      // Pass Projects
      const report = await generateWeeklyReport(mentorId, tasks, history, currentWorkload?.score || 50, userProfile || undefined, projects);
      
      if (report) {
          const fullReport: WeeklyReportData = {
              ...report,
              id: Date.now().toString(),
              createdAt: new Date().toISOString()
          };
          await storageService.saveWeeklyReport(fullReport);
          setReportsHistory(prev => [fullReport, ...prev]);
          setWeeklyReport(fullReport);
          setShowReportModal(true);
      } else {
          alert("Erreur génération rapport.");
      }
      setGeneratingReport(false);
  };

  const handleRequestSecondOpinion = async (originalReport: WeeklyReportData, newMentorId: MentorId) => {
     try {
         const counterAnalysis = await generateCounterAnalysis(originalReport, newMentorId);
         if (counterAnalysis) {
             const updatedReport = { ...originalReport, counter_analysis: counterAnalysis };
             setWeeklyReport(updatedReport);
             setReportsHistory(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
             await storageService.saveWeeklyReport(updatedReport);
         }
     } catch (e) {
         console.error("Failed to generate second opinion", e);
         alert("Impossible de générer le 2ème avis.");
     }
  };

  const handleSelectHistoryReport = (report: WeeklyReportData) => {
      setWeeklyReport(report);
      setShowHistoryModal(false);
      setShowReportModal(true);
  };

  const handleDeleteHistoryReport = async (id: string) => {
      if (window.confirm("Supprimer ce rapport ?")) {
          await storageService.deleteReport(id);
          setReportsHistory(prev => prev.filter(r => r.id !== id));
      }
  };

  // --- Filtering & Sorting ---
  const filteredTasks = tasks.filter(t => {
      if (filterProjectId === 'ALL') return true;
      if (filterProjectId === 'INBOX') return !t.projectId;
      return t.projectId === filterProjectId;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (a.status === TaskStatus.DONE && b.status !== TaskStatus.DONE) return 1;
      if (a.status !== TaskStatus.DONE && b.status === TaskStatus.DONE) return -1;
      const pA = a.priority || Priority.LOW;
      const pB = b.priority || Priority.LOW;
      const pVal = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      return pVal[pB] - pVal[pA];
  });

  if (authLoading) {
      return <div className="min-h-screen bg-nexus-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-nexus-500 border-t-transparent rounded-full animate-spin"></div>
      </div>;
  }

  if (!user) {
      return <LoginScreen onLogin={handleLogin} onTestLogin={handleTestLogin} loading={loginLoading} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-nexus-900 text-slate-200 pb-20 selection:bg-nexus-500 selection:text-white relative overflow-hidden">
      <StarfieldBackground />
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-nexus-500 to-nexus-400 rounded-lg flex items-center justify-center shadow-lg shadow-nexus-500/20">
                <Rocket className="text-white fill-white/20" size={18} />
            </div>
            
            <div className="flex flex-col">
                 <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block leading-none">
                    Nexus<span className="text-nexus-400">Task</span>
                 </h1>
                 {userProfile && userProfile.displayName && (
                     <span className="text-[10px] text-nexus-300 font-medium hidden sm:block animate-in fade-in slide-in-from-left-2">
                        {generateHeaderGreeting(userProfile.displayName, userProfile.primaryGoal)}
                     </span>
                 )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-colors duration-500 ${
                 isCloudActive && !isTestMode
                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                 : 'bg-slate-800/50 text-slate-500 border-slate-700/50'
             }`}>
                {isCloudActive && !isTestMode ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="font-medium">
                    {isCloudActive && !isTestMode ? 'Cloud Sync' : 'Offline Mode'}
                </span>
             </div>
             
             {adviceHistory.length > 0 && (
                <button onClick={() => setShowAdviceModal(true)} className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
                    <Lightbulb size={18} />
                </button>
             )}
             {reportsHistory.length > 0 && (
                 <button onClick={() => setShowHistoryModal(true)} className="p-2 text-slate-400 hover:text-nexus-400 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
                     <BookOpen size={18} />
                 </button>
             )}

             <button 
                onClick={handleReportClick}
                disabled={generatingReport}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {generatingReport ? <><Sparkles size={14} className="animate-spin" /> Génération...</> : <><FileText size={14} /> Rapport Hebdo</>}
             </button>

            <div className="flex items-center gap-2">
                 {user.photoURL ? (
                     <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                 ) : (
                     <div className="w-8 h-8 rounded-full bg-nexus-700 flex items-center justify-center text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                 )}
                 <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
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
                    onAdviceExplained={handleAdviceExplained}
                    mentorId={currentMentorId} 
                />
            </div>
            <div className="md:col-span-1 glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Projets</h3>
                        <p className="text-slate-400 text-xs">Domaines & Contextes</p>
                    </div>
                    <button onClick={() => setShowProjectModal(true)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-nexus-400 transition-colors" title="Gérer les projets">
                        <FolderPlus size={18} />
                    </button>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                    {projects.length === 0 && <span className="text-xs text-slate-500 italic">Aucun projet défini.</span>}
                    {projects.map(p => (
                        <div key={p.id} className={`shrink-0 w-8 h-8 rounded-full ${p.color} flex items-center justify-center shadow-lg cursor-default`} title={p.title}>
                            <span className="text-[10px] font-bold text-white">{p.title.substring(0,2).toUpperCase()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <StatsOverview history={history} />
        {pinnedAdvice && <PinnedInsight insight={pinnedAdvice} onDismiss={() => setPinnedAdvice(null)} />}

        {/* --- ADD TASK BAR --- */}
        <div className="mb-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1">
                <button 
                    onClick={() => setFilterProjectId('ALL')}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${filterProjectId === 'ALL' ? 'bg-nexus-500 text-white border-nexus-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                >
                    Tout
                </button>
                <button 
                    onClick={() => setFilterProjectId('INBOX')}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${filterProjectId === 'INBOX' ? 'bg-nexus-500 text-white border-nexus-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                >
                    Inbox
                </button>
                {projects.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => setFilterProjectId(p.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex items-center gap-1 ${filterProjectId === p.id ? 'bg-nexus-500 text-white border-nexus-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${p.color}`}></span>
                        {p.title}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <form onSubmit={handleAddTask} className="relative flex-1 group flex items-stretch shadow-lg rounded-2xl">
                    <button
                        type="button"
                        onClick={cyclePriority}
                        className={`rounded-l-2xl pl-4 pr-3 flex items-center justify-center border-y border-l transition-all ${getPriorityColor(newTaskPriority)}`}
                        title="Priorité"
                    >
                        <Flag size={18} fill={newTaskPriority === Priority.HIGH ? "currentColor" : "none"} />
                    </button>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nouvelle tâche..."
                            className="block w-full px-4 py-4 bg-slate-800/80 border-y border-r border-slate-700 rounded-r-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-nexus-500 focus:bg-slate-800 transition-all pr-[120px]"
                        />
                        
                        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                             {/* Project Selector inside Input */}
                             <select 
                                value={newTaskProjectId}
                                onChange={(e) => setNewTaskProjectId(e.target.value)}
                                className="bg-slate-900 text-xs text-slate-300 border border-slate-600 rounded-lg px-2 py-1.5 focus:border-nexus-500 outline-none max-w-[100px] truncate"
                             >
                                 <option value="">(Inbox)</option>
                                 {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                             </select>

                            <button 
                                type="submit"
                                disabled={!newTaskTitle.trim()}
                                className="bg-nexus-600 hover:bg-nexus-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </form>
                
                <div className="hidden md:flex bg-slate-800/50 rounded-xl p-1 border border-slate-700 h-[58px] items-center px-1">
                    <button onClick={handlePrioritize} disabled={prioritizing || tasks.length === 0} className="p-2.5 rounded-lg text-nexus-400 hover:text-white hover:bg-nexus-500/20 transition-all border border-transparent hover:border-nexus-500/30 mr-1">
                        {prioritizing ? <Sparkles size={20} className="animate-spin" /> : <Wand2 size={20} />}
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><List size={20} /></button>
                </div>
            </div>
        </div>

        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
            {sortedTasks.map(task => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    project={projects.find(p => p.id === task.projectId)}
                    projects={projects}
                    onUpdate={handleUpdateTask} 
                    onDelete={handleDeleteTask}
                />
            ))}
            {isLoaded && sortedTasks.length === 0 && (
                <div className="col-span-full py-20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                        <LayoutGrid className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-slate-300 font-medium text-lg">Aucune tâche trouvée</h3>
                    <p className="text-slate-500 mt-1">Changez de filtre ou ajoutez-en une.</p>
                </div>
            )}
        </div>

      </main>

      {/* --- MODALS --- */}
      {showMentorSelector && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowMentorSelector(false)} />
               <div className="bg-nexus-900 border border-slate-700 max-w-5xl w-full rounded-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <button onClick={() => setShowMentorSelector(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white z-20"><X size={24} /></button>
                    <MentorSelector onSelect={handleSelectMentor} selectedId={currentMentorId} />
               </div>
          </div>
      )}

      {showProjectModal && (
          <ProjectManagerModal 
             projects={projects}
             onAddProject={handleAddProject}
             onUpdateProject={handleUpdateProject}
             onDeleteProject={handleDeleteProject}
             onPlanProject={(p) => setPlanningProject(p)} 
             onClose={() => setShowProjectModal(false)}
          />
      )}

      {planningProject && (
          <ProjectPlanningModal 
             project={planningProject}
             onAddTasks={handleAddMultipleTasks}
             onClose={() => setPlanningProject(null)}
          />
      )}

      {showReportModal && weeklyReport && <WeeklyReportModal report={weeklyReport} onClose={() => setShowReportModal(false)} onRequestSecondOpinion={handleRequestSecondOpinion} />}
      {showHistoryModal && <ReportHistoryModal reports={reportsHistory} onSelectReport={handleSelectHistoryReport} onDeleteReport={handleDeleteHistoryReport} onClose={() => setShowHistoryModal(false)} />}
      {showAdviceModal && <AdviceHistoryModal history={adviceHistory} onClose={() => setShowAdviceModal(false)} />}
      {showPrioritizationModal && <PrioritizationModal tasks={tasks} suggestions={prioritizationSuggestions} onApply={handleApplyPriorities} onClose={() => setShowPrioritizationModal(false)} userGoal={userProfile?.primaryGoal || 'Productivité'} />}
    </div>
  );
};

export default App;
