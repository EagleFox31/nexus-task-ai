
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
  subTasks: SubTask[];
  aiAnalysis?: string; // Evolution suggestion
  estimatedTime?: number; // In hours
}

export interface DaySession {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  accumulatedTime: number; // in milliseconds
  lastResumeTime: number | null; // Renamed from lastPauseTime for clarity
}

export interface DailyLog {
  id: string;
  date: string;
  totalTime: number;
  completedTasks: number;
}

export interface WorkloadAnalysis {
  score: number; // 0 to 100
  level: 'Light' | 'Balanced' | 'Heavy' | 'Overload';
  advice: string;
}
