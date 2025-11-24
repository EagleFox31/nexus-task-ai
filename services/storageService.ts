import { Task, DaySession, DailyLog, WorkloadAnalysis } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const STORAGE_KEYS = {
  TASKS: 'nexus_tasks',
  SESSION: 'nexus_session',
  HISTORY: 'nexus_history',
  WORKLOADS: 'nexus_workloads',
  USER_ID: 'nexus_user_id',
};

// Helper to get or create a persistent local user ID
const getUserId = () => {
    let uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) {
        uid = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(STORAGE_KEYS.USER_ID, uid);
    }
    return uid;
};

// Helper to migrate legacy session format
const migrateSession = (data: any): DaySession => {
    if (data && typeof data.lastPauseTime !== 'undefined') {
        return {
            ...data,
            lastResumeTime: data.lastPauseTime,
            // Clean up old key conceptually
        } as DaySession;
    }
    return data as DaySession;
};

let debounceTimer: ReturnType<typeof setTimeout>;
const DEBOUNCE_DELAY = 2000;

export const storageService = {
  isCloudActive: (): boolean => {
    return !!db;
  },

  getTasks: async (): Promise<Task[]> => {
    if (db) {
        try {
            const userId = getUserId();
            const docRef = doc(db, 'user_data', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().tasks) {
                const tasks = docSnap.data().tasks;
                localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
                return tasks;
            }
        } catch (error) {
            console.error("Firebase read error, falling back to local:", error);
        }
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  saveTasks: async (tasks: Task[]): Promise<void> => {
    try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) { console.error(e); }

    if (db) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const userId = getUserId();
                await setDoc(doc(db, 'user_data', userId), { tasks }, { merge: true });
                console.log("Synced tasks to cloud");
            } catch (error) {
                console.error("Firebase write error:", error);
            }
        }, DEBOUNCE_DELAY);
    }
  },

  getSession: async (): Promise<DaySession | null> => {
    if (db) {
        try {
            const userId = getUserId();
            const docRef = doc(db, 'user_data', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().session) {
                const session = migrateSession(docSnap.data().session);
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
                return session;
            }
        } catch (error) {
             console.error("Firebase session read error, using local");
        }
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? migrateSession(JSON.parse(data)) : null;
    } catch (error) {
      return null;
    }
  },

  saveSession: async (session: DaySession): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    if (db) {
         try {
            const userId = getUserId();
            await setDoc(doc(db, 'user_data', userId), { session }, { merge: true });
        } catch (error) {
            console.error("Firebase session write error:", error);
        }
    }
  },

  getHistory: async (): Promise<DailyLog[]> => {
    if (db) {
        try {
            const userId = getUserId();
            const docRef = doc(db, 'user_data', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().history) {
                const history = docSnap.data().history;
                localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
                return history;
            }
        } catch (error) {
            console.error("Firebase history read error, falling back to local");
        }
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  saveLog: async (log: DailyLog): Promise<void> => {
      // Local append
      try {
          const existing = localStorage.getItem(STORAGE_KEYS.HISTORY);
          const history = existing ? JSON.parse(existing) : [];
          history.push(log);
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      } catch(e) { console.error(e); }

      // Cloud append
      if (db) {
          try {
              const userId = getUserId();
              const docRef = doc(db, 'user_data', userId);
              // Use arrayUnion to append to the 'history' array field
              await setDoc(docRef, { history: arrayUnion(log) }, { merge: true });
              console.log("Daily log saved to cloud");
          } catch (error) {
              console.error("Firebase log save error:", error);
          }
      }
  },

  // --- Workload Persistence ---
  
  getWorkloads: async (): Promise<{ initial: WorkloadAnalysis | null, current: WorkloadAnalysis | null } | null> => {
      if (db) {
          try {
              const userId = getUserId();
              const docRef = doc(db, 'user_data', userId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists() && docSnap.data().workloads) {
                  const workloads = docSnap.data().workloads;
                  localStorage.setItem(STORAGE_KEYS.WORKLOADS, JSON.stringify(workloads));
                  return workloads;
              }
          } catch (e) { console.error("Firebase workload read error"); }
      }

      try {
          const data = localStorage.getItem(STORAGE_KEYS.WORKLOADS);
          return data ? JSON.parse(data) : null;
      } catch (e) { return null; }
  },

  saveWorkloads: async (initial: WorkloadAnalysis | null, current: WorkloadAnalysis | null): Promise<void> => {
      const workloads = { initial, current };
      localStorage.setItem(STORAGE_KEYS.WORKLOADS, JSON.stringify(workloads));

      if (db) {
          try {
              const userId = getUserId();
              await setDoc(doc(db, 'user_data', userId), { workloads }, { merge: true });
          } catch (e) { console.error("Firebase workload write error", e); }
      }
  },

  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.WORKLOADS);
  }
};