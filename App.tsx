import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Priority, DaySession, WorkloadAnalysis, DailyLog, MentorId, WeeklyReportData, UserProfile, CounterAnalysis, WorkloadAdviceExplanation, AdviceLog, PrioritizationSuggestion, Project, WeekCycle, RolloverDecision, WorkSchedule } from './types';
import { analyzeWorkload, generateWeeklyReport, generateCounterAnalysis, suggestTaskPriorities } from './services/geminiService';
import { storageService } from './services/storageService';
import { auth, googleProvider } from './services/firebase'; 
import firebase from 'firebase/compat/app'; 
import { DailyControl } from './components/DailyControl';
import { TaskCard } from './components/TaskCard';
import { WorkloadIndicator } from './components/WorkloadIndicator';
import { StatsOverview } from './components/StatsOverview';
import { LandingPage } from './components/LandingPage';
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
import { ProjectDetailsModal } from './components/ProjectDetailsModal'; 
import { ProjectsPage } from './components/ProjectsPage';
import { PlanningPage } from './components/PlanningPage'; 
import { WeeklyClosingModal } from './components/WeeklyClosingModal'; 
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { ScheduleSetupModal } from './components/ScheduleSetupModal';
import { generateHeaderGreeting } from './services/greetingService';
import { Rocket, Wifi, WifiOff, LogOut, FileText, Sparkles, X, Flag, BookOpen, Lightbulb, Wand2, Folder, PieChart, LayoutGrid, List, ArrowRight, Settings, Moon, Sun, Globe } from 'lucide-react';
import { MENTOR_PROFILES, MENTOR_ICONS } from './data/mentors';
import { useLanguage } from './contexts/LanguageContext';

type User = firebase.User;
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // --- Theme State ---
  const [theme, setTheme] = useState<Theme>(() => {
      const stored = localStorage.getItem('nexus_theme');
      return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  // --- View State (Navigation) ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'planning'>('dashboard');

  // --- App State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [currentCycle, setCurrentCycle] = useState<WeekCycle | null>(null); 

  // Dual Workload State
  const [initialWorkload, setInitialWorkload] = useState<WorkloadAnalysis | null>(null);
  const [currentWorkload, setCurrentWorkload] = useState<WorkloadAnalysis | null>(null);
  const [pinnedAdvice, setPinnedAdvice] = useState<WorkloadAdviceExplanation | null>(null);
  const [adviceHistory, setAdviceHistory] = useState<AdviceLog[]>([]);
  
  // Mentor & Report State
  const [currentMentorId, setCurrentMentorId] = useState<MentorId | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showScheduleSetup, setShowScheduleSetup] = useState(false);
  
  // Modals
  const [showMentorSelector, setShowMentorSelector] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showPrioritizationModal, setShowPrioritizationModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false); 
  const [projectModalShowList, setProjectModalShowList] = useState(true);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false); 

  const [planningProject, setPlanningProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

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
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterProjectId, setFilterProjectId] = useState<string | 'ALL'>('ALL');

  // TOAST SYSTEM
  const [toast, setToast] = useState<{ message: string, action?: () => void, actionLabel?: string } | null>(null);
  
  const showToast = (message: string, actionLabel?: string, action?: () => void) => {
      setToast({ message, action, actionLabel });
      setTimeout(() => setToast(null), 5000);
  };

  // --- Dynamic Theme Chameleon Effect ---
  useEffect(() => {
    if (currentMentorId) {
      const mentor = MENTOR_PROFILES.find(m => m.id === currentMentorId);
      if (mentor && mentor.themeColors) {
        const root = document.documentElement;
        // Inject RGB values into CSS variables
        Object.entries(mentor.themeColors).forEach(([shade, value]) => {
           root.style.setProperty(`--nexus-${shade}`, value as string);
        });
      }
    }
  }, [currentMentorId]);

  // --- Theme Effect ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- Auth Effect with Test Mode Persistence ---
  useEffect(() => {
    // 1. Check for legacy/local test user FIRST
    const storedUid = localStorage.getItem('nexus_user_id');
    if (storedUid === 'tester_mode_user') {
         const mockUser = {
            uid: 'tester_mode_user',
            email: 'test@nexustask.ai',
            displayName: 'Testeur Nexus',
            photoURL: null,
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => '',
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({}),
            phoneNumber: null,
            providerId: 'firebase'
        } as unknown as User;
        
        console.log("Restoring Test Session...");
        setIsTestMode(true);
        setUser(mockUser);
        setAuthLoading(false);
        return; // Skip Firebase check if test mode found
    }

    // 2. Otherwise Check Firebase
    if (!auth) {
        setAuthLoading(false);
        return;
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser: User | null) => {
      // Don't override Test Mode if we are already in it
      if (isTestMode) return; 

      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
          // Full Reset only if truly logged out and not in test mode
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
          setCurrentCycle(null);
          setIsLoaded(false);
      }
    });
    return () => unsubscribe();
  }, [isTestMode]); // Re-run if test mode state changes explicitly

  // --- Data Loading Effect ---
  useEffect(() => {
    if (!user) return; 

    const loadData = async () => {
        setIsLoaded(false); 
        // Only active cloud if we are NOT in test mode and have a real user
        setIsCloudActive(storageService.isCloudActive() && !isTestMode);

        const [loadedTasks, loadedProjects, loadedSession, loadedHistory, loadedWorkloads, loadedProfile, loadedReports, loadedAdvice, loadedCycle] = await Promise.all([
            storageService.getTasks(),
            storageService.getProjects(),
            storageService.getSession(),
            storageService.getHistory(),
            storageService.getWorkloads(),
            storageService.getUserProfile(),
            storageService.getWeeklyReports(),
            storageService.getAdviceHistory(),
            storageService.getCurrentWeekCycle()
        ]);
        
        if (loadedTasks.length > 0) setTasks(loadedTasks);
        if (loadedProjects.length > 0) setProjects(loadedProjects);
        if (loadedSession) setSession(loadedSession);
        if (loadedHistory.length > 0) setHistory(loadedHistory);
        if (loadedCycle) setCurrentCycle(loadedCycle);

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

            // Check if schedule is missing for existing users
            if (!loadedProfile.workSchedule) {
                setShowScheduleSetup(true);
            }
        } else {
            setShowOnboarding(true);
        }
        
        setIsLoaded(true);
    };
    
    loadData();
  }, [user, isTestMode]);

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

        // Force local persistence for test user
        localStorage.setItem('nexus_user_id', mockUser.uid);
        
        setIsTestMode(true);
        setUser(mockUser);
        setLoginLoading(false);
    }, 800);
  };

  const handleLogout = async () => {
      // 1. Immediate visual feedback to prevent double clicks
      setAuthLoading(true);

      try {
          // 2. Clear Local Storage FIRST
          localStorage.removeItem('nexus_user_id');
          localStorage.removeItem('nexus_active_uid');
          storageService.clearAll();

          // 3. Attempt Firebase Signout with a Race Condition
          // If Firebase takes > 500ms (network hanging), we force logout anyway
          if (!isTestMode && auth) {
              const signOutPromise = auth.signOut();
              const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
              await Promise.race([signOutPromise, timeoutPromise]);
          }
      } catch (error) {
          console.error("Logout warning:", error);
      } finally {
          // 4. Force Reload to reset app state absolutely
          setIsTestMode(false);
          setUser(null);
          window.location.reload();
      }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
      setUserProfile(profile);
      setCurrentMentorId(profile.mentorId);
      await storageService.saveUserProfile(profile);
      setShowOnboarding(false);
      // Immediately trigger schedule setup after onboarding if not present
      if (!profile.workSchedule) {
          setShowScheduleSetup(true);
      }
  };

  const handleScheduleSetupComplete = async (schedule: WorkSchedule) => {
      if (userProfile) {
          const updated = { ...userProfile, workSchedule: schedule };
          setUserProfile(updated);
          await storageService.saveUserProfile(updated);
          setShowScheduleSetup(false);
          showToast("Horaires configurés avec succès !");
      }
  };
  
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
      setUserProfile(updatedProfile);
      await storageService.saveUserProfile(updatedProfile);
      showToast("Paramètres mis à jour");
  };

  // --- Project CRUD ---
  const handleAddProject = async (project: Project) => {
      setProjects([project, ...projects]);
      await storageService.addProject(project);
      showToast("Projet créé avec succès.", "Planifier", () => {
          setPlanningProject(project);
      });
  };
  const handleUpdateProject = async (project: Project) => {
      setProjects(projects.map(p => p.id === project.id ? project : p));
      await storageService.updateProject(project);
  };
  const handleDeleteProject = async (id: string) => {
      setProjects(projects.filter(p => p.id !== id));
      setTasks(tasks.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
      await storageService.deleteProject(id);
  };
  
  const openProjectManager = (showList: boolean = true) => {
      setProjectModalShowList(showList);
      setShowProjectModal(true);
  };

  // --- Task CRUD ---
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
      cycleId: currentCycle ? currentCycle.id : undefined, // Auto-assign to current cycle if adding from dashboard
      subTasks: [],
      effort: 1 // Default effort
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskPriority(Priority.LOW); 
    
    await storageService.addTask(newTask);

    showToast("Tâche ajoutée.", "Voir au Planning", () => setCurrentView('planning'));
  };

  const handleAddMultipleTasks = async (newTasksPartial: Partial<Task>[]) => {
      const newTasks: Task[] = newTasksPartial.map((t, i) => ({
          id: Date.now().toString() + i,
          title: t.title || "Nouvelle tâche",
          description: t.description || "",
          status: TaskStatus.TODO,
          priority: t.priority || Priority.LOW,
          projectId: t.projectId,
          cycleId: undefined, // Plan generated tasks go to backlog
          subTasks: [],
          effort: 1
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

  // --- Cycle Handling ---
  const handleUpdateCycle = async (cycle: WeekCycle) => {
      setCurrentCycle(cycle);
      await storageService.saveWeekCycle(cycle);
  };

  const handleCloseCycleConfirm = async (decisions: Record<string, RolloverDecision>) => {
      if (!currentCycle) return;
      
      // Store the closed cycle ID to use for the report BEFORE it is replaced
      const cycleToReport = { ...currentCycle };

      const { nextCycle, updatedTasks } = await storageService.closeWeekCycle(currentCycle, tasks, decisions);
      
      setTasks(updatedTasks);
      setCurrentCycle(nextCycle);
      setShowClosingModal(false);
      
      // Prompt for Report Generation immediately
      if (currentMentorId && window.confirm("Semaine clôturée avec succès ! Voulez-vous générer le bilan du Mentor maintenant ?")) {
          // Re-fetching updated cycle from storage to get the computed metrics (reliability etc)
          const cycles = await storageService.getCycles();
          const closedCycleWithMetrics = cycles.find(c => c.id === cycleToReport.id);
          
          // IMPORTANT: Pass updatedTasks so the report generator sees the added rollover history
          generateReport(currentMentorId, closedCycleWithMetrics || cycleToReport, updatedTasks);
      } else {
          setCurrentView('planning'); 
      }
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

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    const result = await analyzeWorkload(tasks, projects, history, currentMentorId);
    if (!initialWorkload) setInitialWorkload(result);
    setCurrentWorkload(result);
    setAnalyzing(false);
  }, [tasks, projects, history, initialWorkload, currentMentorId]);

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
      if (suggestions && suggestions.length > 0) {
          setPrioritizationSuggestions(suggestions);
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
  
  const generateReport = async (mentorId: MentorId, closedCycle?: WeekCycle, tasksOverride?: Task[]) => {
      setGeneratingReport(true);
      
      const tasksToUse = tasksOverride || tasks;
      const report = await generateWeeklyReport(
          mentorId, 
          tasksToUse, 
          history, 
          currentWorkload?.score || 50, 
          userProfile || undefined, 
          projects,
          closedCycle
      );
      
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

  // --- Statistics Helpers ---
  const calculateGlobalProjectProgress = () => {
      // Find all tasks related to a project
      const projectTasks = tasks.filter(t => t.projectId); 
      if (projectTasks.length === 0) return 0;
      
      let totalPoints = 0;
      let completedPoints = 0;

      projectTasks.forEach(t => {
          if (t.subTasks && t.subTasks.length > 0) {
              // Weighted by subtasks count
              totalPoints += t.subTasks.length;
              completedPoints += t.subTasks.filter(st => st.completed).length;
          } else {
              // Simple task
              totalPoints += 1;
              if (t.status === TaskStatus.DONE) completedPoints += 1;
          }
      });
      
      if (totalPoints === 0) return 0;
      return Math.round((completedPoints / totalPoints) * 100);
  };
  const globalProgress = calculateGlobalProjectProgress();

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
          default: return 'text-slate-400 dark:text-slate-400 bg-slate-700/50 dark:bg-slate-700/50 border-slate-600';
      }
  };

  const filteredTasks = tasks.filter(t => {
      if (!currentCycle) return true;
      // Dashboard only shows tasks for CURRENT cycle
      if (t.cycleId !== currentCycle.id) return false;

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
      return <LandingPage onLogin={handleLogin} onTestLogin={handleTestLogin} loading={loginLoading} error={loginError} theme={theme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-nexus-900 text-slate-900 dark:text-slate-200 pb-20 selection:bg-nexus-500 selection:text-white relative transition-colors duration-300">
      <StarfieldBackground theme={theme} />
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      {showScheduleSetup && !showOnboarding && (
          <ScheduleSetupModal 
              isNewUser={!userProfile?.workSchedule} 
              onConfirm={handleScheduleSetupComplete} 
          />
      )}

      {/* --- TOAST --- */}
      {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 border border-nexus-500/50 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <span>{toast.message}</span>
              {toast.action && (
                  <button 
                    onClick={() => { toast.action?.(); setToast(null); }}
                    className="text-nexus-400 font-bold hover:text-white text-sm uppercase tracking-wide"
                  >
                      {toast.actionLabel || "Action"}
                  </button>
              )}
          </div>
      )}

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-nexus-500 to-nexus-400 rounded-lg flex items-center justify-center shadow-lg shadow-nexus-500/20">
                <Rocket className="text-white fill-white/20" size={18} />
            </div>
            
            <div className="flex flex-col">
                 <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block leading-none">
                    Nexus<span className="text-nexus-500 dark:text-nexus-400">Task</span>
                 </h1>
                 {userProfile && userProfile.displayName && (
                     <span className="text-[10px] text-slate-500 dark:text-nexus-300 font-medium hidden sm:block animate-in fade-in slide-in-from-left-2">
                        {generateHeaderGreeting(userProfile.displayName, userProfile.primaryGoal)}
                     </span>
                 )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">

            {/* Language Toggle (Short) */}
            <button 
                onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase"
            >
                {language}
            </button>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title={theme === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

             {currentMentorId && (
                <button 
                    onClick={() => setShowMentorSelector(true)}
                    className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-nexus-500/50 rounded-full pl-1 pr-3 py-1 transition-all group"
                    title="Changer de Mentor"
                >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${MENTOR_PROFILES.find(m => m.id === currentMentorId)?.color} flex items-center justify-center text-white text-[10px]`}>
                        {MENTOR_ICONS[currentMentorId]}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Coach</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-nexus-600 dark:group-hover:text-white">
                            {MENTOR_PROFILES.find(m => m.id === currentMentorId)?.name.split(' ')[0]}
                        </span>
                    </div>
                </button>
             )}

             <div className={`hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-colors duration-500 ${
                 isCloudActive && !isTestMode
                 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                 : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700/50'
             }`}>
                {isCloudActive && !isTestMode ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="font-medium">
                    {isCloudActive && !isTestMode ? 'Cloud' : 'Offline'}
                </span>
             </div>
             
             {adviceHistory.length > 0 && (
                <button onClick={() => setShowAdviceModal(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
                    <Lightbulb size={18} />
                </button>
             )}
             {reportsHistory.length > 0 && (
                 <button onClick={() => setShowHistoryModal(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-nexus-500 dark:hover:text-nexus-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
                     <BookOpen size={18} />
                 </button>
             )}

             <button 
                onClick={handleReportClick}
                disabled={generatingReport}
                className="flex items-center gap-2 bg-gradient-to-r from-nexus-600 to-nexus-500 hover:from-nexus-500 hover:to-nexus-400 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_15px_rgba(var(--nexus-500),0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {generatingReport ? <><Sparkles size={14} className="animate-spin" /> Génération...</> : <><FileText size={14} /> Rapport Hebdo</>}
             </button>

            <div className="flex items-center gap-2">
                 {/* Settings Button */}
                 <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                 >
                     <Settings size={16} />
                 </button>

                 <button 
                    onClick={handleLogout} 
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
                    title="Déconnexion"
                 >
                    <LogOut size={18} />
                 </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {currentView === 'dashboard' ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                    <DailyControl 
                        session={session} 
                        setSession={setSession} 
                        onDayComplete={handleDayComplete} 
                        userSchedule={userProfile?.workSchedule} 
                    />
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
                
                {/* PROJECT & PLANNING CARD */}
                <div className="md:col-span-1 flex flex-col gap-4">
                    {/* Projects Tile */}
                    <div 
                        className="glass-panel p-4 rounded-xl flex flex-col justify-center cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors relative overflow-hidden flex-1"
                        onClick={() => setCurrentView('projects')}
                    >
                         <div className="relative z-10 flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-nexus-500 dark:text-nexus-400"><Folder size={20} /></div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-nexus-500 dark:group-hover:text-nexus-400 transition-colors">{t('dash.projects')}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">{projects.length} actifs</p>
                                </div>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                 <PieChart size={16} />
                             </div>
                         </div>
                         
                         {/* GLOBAL PROJECT PROGRESS BAR */}
                         {projects.length > 0 && (
                             <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                 <div 
                                    className="h-full bg-gradient-to-r from-nexus-500 to-purple-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${globalProgress}%` }} 
                                 />
                             </div>
                         )}
                         <div className="text-[10px] text-slate-500 mt-1 text-right">
                             {globalProgress}% {t('dash.completed')}
                         </div>
                    </div>

                    {/* Planning Tile */}
                    <div 
                        className="glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors relative overflow-hidden flex-1"
                        onClick={() => setCurrentView('planning')}
                    >
                         <div className="relative z-10 flex items-center gap-3">
                             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-emerald-500 dark:text-emerald-400"><List size={20} /></div>
                             <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t('dash.planning')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Semaine {currentCycle?.id || '?'}</p>
                             </div>
                         </div>
                         <div className="relative z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                             <LayoutGrid size={16} />
                         </div>
                    </div>
                </div>
            </div>

            <StatsOverview history={history} userProfile={userProfile} />
            {pinnedAdvice && <PinnedInsight insight={pinnedAdvice} onDismiss={() => setPinnedAdvice(null)} />}

            {/* --- ADD TASK BAR --- */}
            <div className="mb-4">
                {/* Filter Bar */}
                <div className="flex items-center gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1">
                    <button 
                        onClick={() => setFilterProjectId('ALL')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${filterProjectId === 'ALL' ? 'bg-nexus-500 text-white border-nexus-400' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                    >
                        {t('filter.all')}
                    </button>
                    <button 
                        onClick={() => setFilterProjectId('INBOX')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${filterProjectId === 'INBOX' ? 'bg-nexus-500 text-white border-nexus-400' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                    >
                        Inbox
                    </button>
                    {projects.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setFilterProjectId(p.id)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex items-center gap-1 ${filterProjectId === p.id ? 'bg-nexus-500 text-white border-nexus-400' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
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
                                placeholder={t('input.newtask')}
                                className="block w-full px-4 py-4 bg-white dark:bg-slate-800/80 border-y border-r border-slate-200 dark:border-slate-700 rounded-r-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-nexus-500 focus:bg-white dark:focus:bg-slate-800 transition-all pr-[120px]"
                            />
                            
                            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                                 {/* Project Selector inside Input */}
                                 <select 
                                    value={newTaskProjectId}
                                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                                    className="bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:border-nexus-500 outline-none max-w-[100px] truncate"
                                 >
                                     <option value="">(Inbox)</option>
                                     {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                 </select>

                                <button 
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="bg-nexus-600 hover:bg-nexus-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    {t('btn.add')}
                                </button>
                            </div>
                        </div>
                    </form>
                    
                    <div className="hidden md:flex bg-white/50 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-200 dark:border-slate-700 h-[58px] items-center px-1">
                        <button onClick={handlePrioritize} disabled={prioritizing || tasks.length === 0} className="p-2.5 rounded-lg text-nexus-500 dark:text-nexus-400 hover:text-white hover:bg-nexus-500/20 transition-all border border-transparent hover:border-nexus-500/30 mr-1">
                            {prioritizing ? <Sparkles size={20} className="animate-spin" /> : <Wand2 size={20} />}
                        </button>
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                        <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><List size={20} /></button>
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 mb-4">
                            <LayoutGrid className="text-slate-400 dark:text-slate-600" size={32} />
                        </div>
                        <h3 className="text-slate-600 dark:text-slate-300 font-medium text-lg">{t('dash.empty')}</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                            {t('dash.empty.sub')}
                        </p>
                        <button 
                            onClick={() => setCurrentView('planning')}
                            className="mt-4 text-nexus-500 dark:text-nexus-400 hover:underline"
                        >
                            Aller au Planning
                        </button>
                    </div>
                )}
            </div>
        </>
        ) : currentView === 'projects' ? (
            <ProjectsPage 
                projects={projects}
                tasks={tasks}
                onBack={() => setCurrentView('dashboard')}
                onNewProject={() => openProjectManager(false)}
                onEditProject={(p) => { openProjectManager(true); }} 
                onDeleteProject={handleDeleteProject}
                onPlanProject={(p) => setPlanningProject(p)}
            />
        ) : (
            currentCycle && (
                <PlanningPage 
                    tasks={tasks}
                    projects={projects}
                    onBack={() => setCurrentView('dashboard')}
                    onUpdateTask={handleUpdateTask}
                    currentCycle={currentCycle}
                    onUpdateCycle={handleUpdateCycle}
                    onCloseCycle={() => setShowClosingModal(true)}
                />
            )
        )}

      </main>

      {/* --- MODALS --- */}
      {showSettingsModal && userProfile && (
          <ProfileSettingsModal 
             profile={userProfile} 
             onUpdate={handleUpdateProfile} 
             onClose={() => setShowSettingsModal(false)}
          />
      )}

      {showClosingModal && currentCycle && (
          <WeeklyClosingModal 
             cycle={currentCycle}
             tasks={tasks}
             onConfirm={handleCloseCycleConfirm}
             onClose={() => setShowClosingModal(false)}
          />
      )}

      {showMentorSelector && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowMentorSelector(false)} />
               <div className="bg-white dark:bg-nexus-900 border border-slate-200 dark:border-slate-700 max-w-5xl w-full rounded-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <button onClick={() => setShowMentorSelector(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white z-20"><X size={24} /></button>
                    <MentorSelector onSelect={handleSelectMentor} selectedId={currentMentorId} />
               </div>
          </div>
      )}

      {showProjectModal && (
          <ProjectManagerModal 
             projects={projects}
             tasks={tasks}
             onAddProject={handleAddProject}
             onUpdateProject={handleUpdateProject}
             onDeleteProject={handleDeleteProject}
             onPlanProject={(p) => { setShowProjectModal(false); setPlanningProject(p); }} 
             onClose={() => setShowProjectModal(false)}
             showList={projectModalShowList}
          />
      )}

      {planningProject && (
          <ProjectPlanningModal 
             project={planningProject}
             onAddTasks={handleAddMultipleTasks}
             onClose={() => setPlanningProject(null)}
             onGoToPlanning={() => {
                 setPlanningProject(null);
                 setCurrentView('planning');
             }}
          />
      )}

      {viewingProject && (
          <ProjectDetailsModal 
             project={viewingProject}
             tasks={tasks}
             onClose={() => setViewingProject(null)}
             onEdit={() => { setViewingProject(null); openProjectManager(true); }}
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