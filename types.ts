

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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId?: string; // Lien vers le projet
  subTasks: SubTask[];
  aiAnalysis?: string; // Evolution suggestion
  estimatedTime?: number; // In hours
  updatedAt?: any; // Firestore Timestamp or string
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
  color: string;
  description: string;
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