
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum Effort {
  QUICK = 1,   // 15 min
  MEDIUM = 2,  // 1h
  HEAVY = 3,   // 2h
  MONSTER = 5  // 4h
}

// Helpers for UI Display & Calculation
export const EFFORT_LABELS: Record<Effort, string> = {
  [Effort.QUICK]: '15m',
  [Effort.MEDIUM]: '1h',
  [Effort.HEAVY]: '2h',
  [Effort.MONSTER]: '4h'
};

export const EFFORT_TO_HOURS: Record<Effort, number> = {
  [Effort.QUICK]: 0.25,
  [Effort.MEDIUM]: 1,
  [Effort.HEAVY]: 2,
  [Effort.MONSTER]: 4
};

export interface Project {
  id: string;
  title: string;
  description: string; // Contexte pour l'IA
  domains: string[]; // Ex: ["IT", "Automotive", "LMS"]
  color: string; // Tailwind class identifier (e.g. "blue", "red")
  priority: Priority; // Importance du projet
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RolloverLog {
  date: string;
  fromCycleId: string;
  reason: 'BLOCKED' | 'UNDERESTIMATED' | 'NOT_PRIORITY' | 'UNCLEAR' | 'CONTEXT_SWITCH' | 'OTHER';
  comment?: string;
}

export interface RolloverDecision {
  action: 'ROLLOVER' | 'BACKLOG' | 'DELETE';
  reason?: RolloverLog['reason'];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId?: string; // Lien vers le projet (Si null = INBOX)
  cycleId?: string; // Lien vers le cycle hebdo (Si null = BACKLOG/INBOX)
  effort?: Effort; // Points de complexité/temps
  rolloverHistory?: RolloverLog[]; // Historique des reports
  
  subTasks: SubTask[];
  aiAnalysis?: string; // Evolution suggestion
  estimatedTime?: number; // In hours (Legacy, prefer effort)
  updatedAt?: any; // Firestore Timestamp or string
}

export type WeekStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface WeekCycle {
  id: string; // Format ISO "YYYY-Www" ex: "2024-W12"
  theme: string; // "Focus Backend", "Semaine Admin", etc.
  status: WeekStatus;
  startDate: string; // ISO Date of Monday
  endDate: string; // ISO Date of Sunday
  capacityTarget: number; // Target in Hours (formerly points, roughly equivalent)
  capacityUsed: number; // Current Sum
  mood?: 'FIRE' | 'ZEN' | 'TIRED' | 'CHAOS';
  metrics?: {
    reliability: number; // % Completed / Planned at start
    output: number; // Total Points Completed
  };
  updatedAt?: any;
}

export interface DaySession {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  accumulatedTime: number; // in milliseconds
  lastResumeTime: number | null; // Renamed from lastPauseTime for clarity
  updatedAt?: any;
}

export interface DailyLog {
  id: string;
  date: string;
  totalTime: number;
  completedTasks: number;
  updatedAt?: any;
}

export interface WorkloadAnalysis {
  score: number; // 0 to 100
  level: 'Light' | 'Balanced' | 'Heavy' | 'Overload';
  advice: string;
}

export interface WorkloadAdviceExplanation {
  concept_name: string;
  definition: string;
  concrete_application: string[]; // Steps specifically applied to user tasks
  why_it_works: string;
}

// --- ADVICE HISTORY TYPES ---

export interface AdviceLog {
  id: string;
  date: string; // ISO String
  source: 'CognitiveLoad' | 'WeeklyReport';
  content: WorkloadAdviceExplanation;
}

// --- MENTOR & REPORT TYPES ---

export type MentorId = 'aya_operator' | 'elias_strategist' | 'mina_deepwork' | 'salma_systems' | 'kassi_stoic';

export interface MentorProfile {
  id: MentorId;
  name: string;
  tagline: string;
  role: string;
  color: string; // Gradient class
  description: string | { fr: string, en: string }; // Supports i18n
  themeColors: { 50: string; 100: string; 200: string; 300: string; 400: string; 500: string; 600: string; }; // RGB values
}

export interface ReportWin {
  title: string;
  evidence: string;
}

export interface ReportLeak {
  title: string;
  cause: string;
  fix: string;
}

export interface ReportRecommendation {
  title: string;
  why: string;
  steps: string[];
  effort: 'S' | 'M' | 'L';
  impact: 'S' | 'M' | 'L';
}

export interface CounterAnalysis {
  mentor: { id: MentorId; name: string; tagline: string };
  critique: string;
  alternative_perspective: string;
}

export interface WeeklyReportData {
  id?: string; // Added for persistence
  createdAt?: string; // Added for persistence
  mentor: { id: MentorId; name: string; tagline: string };
  week: { start: string; end: string };
  executive_summary: string;
  scores?: { label: string; value: number; note: string }[];
  wins: ReportWin[];
  time_leaks: ReportLeak[];
  metrics_snapshot: {
    focus_minutes: number;
    tasks_completed: number;
    tasks_planned: number;
    planned_vs_adjusted_gap: number;
    cognitive_load_level: string;
    reliability_score?: number; // FROM CLOSING
  };
  cycle_context?: {
      theme: string;
      rollover_reasons_summary: string;
  };
  recommendations: ReportRecommendation[];
  challenge: { name: string; rules: string[]; success_metric: string };
  closing: string;
  counter_analysis?: CounterAnalysis; // New field for second opinion
}

// --- ONBOARDING & USER PROFILE TYPES (NEW) ---

export type ProfileOption =
  | "student" | "intern" | "employee_ic" | "employee_manager" | "executive"
  | "freelance" | "founder" | "solopreneur" | "public_sector" | "ngo_association"
  | "career_switch" | "job_seeker" | "other" | "none";


export type GoalOption = 
  | 'certification_exam' | 'deliver_work_project' | 'build_portfolio'
  | 'grow_freelance_income' | 'launch_or_scale_business' | 'reduce_mental_load'
  | 'level_up_leadership' | 'get_hired' | 'personal_organization' | 'other';

export type ConstraintOption = 
  | 'low_time' | 'procrastination' | 'distractions' | 'vague_tasks'
  | 'unplanned_interruptions' | 'mental_fatigue' | 'prioritization'
  | 'too_repetitive_admin' | 'too_many_meetings' | 'tool_sprawl';

export type FrustrationOption = 
  | 'start_not_finish' | 'lose_focus' | 'drowning_in_admin' | 'cant_say_no'
  | 'low_visible_impact' | 'plans_always_explode' | 'none';

export type WorkModeOption = 
  | 'deep_work_heavy' | 'ops_firefighting' | 'meetings_coordination' | 'mixed';

export type TimeBudgetOption = '<5h' | '5-10h' | '10-20h' | '20h+';

// NEW: Work Schedule for Smart Time Tracking
export interface WorkSchedule {
    workStart: string; // "09:00"
    workEnd: string; // "18:00"
    lunchStart: string; // "12:30"
    lunchDuration: number; // 60 minutes
    workDays: number[]; // [1, 2, 3, 4, 5] (Monday to Friday)
}

export interface UserProfile {
  uid?: string;
  displayName: string; // New field for personalized greeting
  
  // New Onboarding Fields
  profilePrimary: ProfileOption;
  profileSecondary?: ProfileOption[];
  roleWeights: { primary: number; secondary: number };
  
  primaryGoal: GoalOption;
  constraints: ConstraintOption[];
  frustration: FrustrationOption;
  workMode: WorkModeOption;
  timeBudget: TimeBudgetOption;
  
  // System Fields
  mentorId: MentorId;
  onboardingStatus: 'pending' | 'complete';
  completedAt?: string;
  timezone: string;
  
  // NEW: Schedule Settings
  workSchedule?: WorkSchedule;
}

// Added for legacy support compatibility
export interface UserPreferences {
  mentorId?: MentorId;
}

export interface RecommendationResult {
  mentorId: MentorId;
  confidence: 'High' | 'Medium' | 'Low';
  reasons: string[];
  scores: Record<MentorId, number>;
}

// --- PRIORITIZATION ---
export interface PrioritizationSuggestion {
  taskId: string;
  currentPriority: Priority;
  suggestedPriority: Priority;
  reason: string;
}
