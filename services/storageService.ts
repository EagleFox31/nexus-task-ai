import { Task, DaySession, DailyLog, WorkloadAnalysis, UserPreferences, UserProfile, WeeklyReportData, AdviceLog, Project, WeekCycle, WeekStatus, RolloverLog, RolloverDecision } from '../types';
import { db, auth } from './firebase';
import firebase from 'firebase/compat/app';

// Base keys for LocalStorage (Cache)
const BASE_KEYS = {
  TASKS: 'nexus_tasks',
  PROJECTS: 'nexus_projects', 
  CYCLES: 'nexus_cycles', // NEW
  SESSION: 'nexus_session',
  HISTORY: 'nexus_history',
  WORKLOADS: 'nexus_workloads',
  PREFS: 'nexus_prefs',
  PROFILE: 'nexus_profile',
  REPORTS: 'nexus_reports',
  ADVICE: 'nexus_advice',
  USER_ID: 'nexus_active_uid',
};

const LEGACY_UID_KEY = 'nexus_user_id'; 

// --- HELPER FUNCTIONS ---

const readStoredActiveUid = (): string | null => {
    return localStorage.getItem(BASE_KEYS.USER_ID) || localStorage.getItem(LEGACY_UID_KEY);
};

const writeStoredActiveUid = (uid: string) => {
    localStorage.setItem(BASE_KEYS.USER_ID, uid);
    localStorage.setItem(LEGACY_UID_KEY, uid);
};

// HELPER: ISO WEEK CALCULATION
const getISOWeekId = (date: Date = new Date()): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const year = d.getUTCFullYear();
    const weekNo = Math.ceil(( ( (d.getTime() - new Date(Date.UTC(year,0,1)).getTime()) / 86400000) + 1)/7);
    return `${year}-W${weekNo.toString().padStart(2, '0')}`;
};

const getNextWeekId = (currentId: string): string => {
    // Basic parsing assuming YYYY-Www format
    const [yearStr, weekStr] = currentId.split('-W');
    let year = parseInt(yearStr);
    let week = parseInt(weekStr);
    
    week++;
    // Simple overflow check (approximate, 52/53 weeks)
    if (week > 52) { 
        // A more robust date math would be better but this covers 99% cases for now
        // Or re-use getISOWeekId with date + 7 days
        // Let's use Date math for safety
        return getISOWeekId(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

const getWeekRange = (date: Date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    
    return { 
        start: monday.toISOString().split('T')[0], 
        end: sunday.toISOString().split('T')[0] 
    };
};

// 1. MIGRATION LOCAL V1 (Unscoped) -> V2 (Scoped)
const migrateLocalV1ToScoped = (uid: string) => {
    const bases = [
        BASE_KEYS.TASKS,
        BASE_KEYS.SESSION,
        BASE_KEYS.HISTORY,
        BASE_KEYS.WORKLOADS,
        BASE_KEYS.PREFS,
        BASE_KEYS.PROFILE,
    ];

    let migratedCount = 0;
    for (const base of bases) {
        const v1Value = localStorage.getItem(base);
        const v2Key = `${base}_${uid}`; 
        const v2Value = localStorage.getItem(v2Key);

        if (v1Value && !v2Value) {
            localStorage.setItem(v2Key, v1Value);
            migratedCount++;
        }
    }
    if (migratedCount > 0) {
        console.log(`[Storage] Migrated ${migratedCount} local V1 keys to scoped V2 keys for ${uid}`);
    }
};

// 2. MIGRATION SCOPED ANON -> SCOPED AUTH
const migrateScopedLocal = (fromUid: string, toUid: string) => {
    const bases = [
        BASE_KEYS.TASKS,
        BASE_KEYS.PROJECTS,
        BASE_KEYS.CYCLES,
        BASE_KEYS.SESSION,
        BASE_KEYS.HISTORY,
        BASE_KEYS.WORKLOADS,
        BASE_KEYS.PREFS,
        BASE_KEYS.PROFILE,
        BASE_KEYS.REPORTS, 
        BASE_KEYS.ADVICE,
    ];

    console.log(`[Storage] Migrating local cache from ${fromUid} to ${toUid}`);
    for (const base of bases) {
        const fromKey = `${base}_${fromUid}`;
        const toKey = `${base}_${toUid}`;
        const val = localStorage.getItem(fromKey);
        
        if (val && !localStorage.getItem(toKey)) {
            localStorage.setItem(toKey, val);
        }
    }
};

// 3. ROBUST USER ID RESOLUTION
const getUserId = () => {
    // Priority 1: Legacy Tester Mode
    const storedUid = localStorage.getItem(LEGACY_UID_KEY);
    if (storedUid === 'tester_mode_user') {
        return storedUid;
    }

    // Priority 2: Firebase Auth
    const authUid = auth?.currentUser?.uid;
    const storedActive = readStoredActiveUid();

    if (authUid) {
        if (storedActive && storedActive !== authUid) {
            migrateScopedLocal(storedActive, authUid);
        }
        migrateLocalV1ToScoped(authUid);
        writeStoredActiveUid(authUid);
        return authUid;
    }

    // Priority 3: Stored ID (Offline/Anon)
    if (storedActive) {
        migrateLocalV1ToScoped(storedActive);
        return storedActive;
    }

    // Priority 4: Generate new Anon ID
    const newAnon = 'anon_' + Date.now() + Math.random().toString(36).slice(2);
    writeStoredActiveUid(newAnon);
    migrateLocalV1ToScoped(newAnon);
    
    return newAnon;
};

const getScopedKey = (baseKey: string): string => {
    const uid = getUserId();
    return `${baseKey}_${uid}`;
};

const ensureId = (id?: string) => id || `legacy_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const commitChunks = async (ops: Array<(batch: firebase.firestore.WriteBatch) => void>, chunkSize = 400) => {
    if (ops.length === 0) return;
    console.log(`[Storage] Committing ${ops.length} operations in chunks...`);
    
    for (let i = 0; i < ops.length; i += chunkSize) {
        const batch = db.batch();
        ops.slice(i, i + chunkSize).forEach(apply => apply(batch));
        await batch.commit();
    }
};

// --- MIGRATION LOGIC CLOUD V1 -> V2 (ROBUST) ---

const migrationPromises = new Map<string, Promise<void>>();

const ensureMigratedOnce = (uid: string) => {
    if (!db || !auth?.currentUser) return Promise.resolve();
    
    if (!migrationPromises.has(uid)) {
        migrationPromises.set(uid, migrateCloudV1ToV2(uid));
    }
    return migrationPromises.get(uid)!;
};

const migrateCloudV1ToV2 = async (uid: string) => {
    if (!auth.currentUser) return;

    try {
        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (userSnap.exists && (userSnap.data()?.schemaVersion ?? 0) >= 2) {
            return;
        }

        console.log(`[Migration] Starting Cloud migration V1 -> V2 for ${uid}...`);

        const oldDocRef = db.collection('user_data').doc(uid);
        const oldDocSnap = await oldDocRef.get();

        const ops: Array<(batch: firebase.firestore.WriteBatch) => void> = [];
        const now = firebase.firestore.FieldValue.serverTimestamp();

        ops.push((batch) => {
            batch.set(userRef, {
                schemaVersion: 2,
                migratedFromV1: oldDocSnap.exists,
                migratedAt: now,
                updatedAt: now,
                createdAt: userSnap.exists ? (userSnap.data()?.createdAt ?? now) : now
            }, { merge: true });
        });

        if (oldDocSnap.exists) {
            const v1Data = oldDocSnap.data();

            if (v1Data?.profile) {
                ops.push((batch) => batch.set(userRef, { 
                    profile: v1Data.profile,
                    mentorId: v1Data.profile.mentorId || null,
                    onboardingStatus: v1Data.profile.onboardingStatus || null
                }, { merge: true }));
            }
            if (v1Data?.workloads) {
                 ops.push((batch) => batch.set(userRef, { workloads: v1Data.workloads }, { merge: true }));
            }

            if (Array.isArray(v1Data?.tasks)) {
                v1Data.tasks.forEach((task: Task) => {
                    const taskId = ensureId(task.id);
                    const taskRef = userRef.collection('tasks').doc(taskId);
                    // IMPORTANT: use merge: true to avoid overwriting projectId if task already exists in V2
                    ops.push((batch) => batch.set(taskRef, { 
                        ...task, 
                        id: taskId,
                        updatedAt: now 
                    }, { merge: true }));
                });
            }
            ops.push((batch) => batch.set(oldDocRef, { migratedToV2: true, migratedAt: now }, { merge: true }));
        }

        await commitChunks(ops);
        console.log("[Migration] Successfully migrated Cloud to Schema V2.");

    } catch (error) {
        console.error("[Migration] Failed:", error);
        migrationPromises.delete(uid);
    }
};


// --- STORAGE SERVICE (V2 ARCHITECTURE) ---

export const storageService = {
  isCloudActive: (): boolean => {
    // EXPLICITLY DISABLE CLOUD IF IN TESTER MODE
    if (localStorage.getItem(LEGACY_UID_KEY) === 'tester_mode_user') {
        return false;
    }
    return !!db && !!auth?.currentUser;
  },

  // --- CYCLES (WEEKLY) ---

  getCurrentWeekCycle: async (): Promise<WeekCycle> => {
      const currentId = getISOWeekId();
      const isCloud = storageService.isCloudActive();
      let cycle: WeekCycle | null = null;

      // 1. Try Cloud
      if (isCloud) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const doc = await db.collection('users').doc(uid).collection('cycles').doc(currentId).get();
              if (doc.exists) {
                  cycle = doc.data() as WeekCycle;
              }
          } catch(e) { console.error("Cloud cycle fetch error", e); }
      }

      // 2. Try Local
      if (!cycle) {
          const key = getScopedKey(BASE_KEYS.CYCLES);
          const cycles: WeekCycle[] = JSON.parse(localStorage.getItem(key) || '[]');
          cycle = cycles.find(c => c.id === currentId) || null;
      }

      // 3. Create Draft if missing
      if (!cycle) {
          const range = getWeekRange();
          cycle = {
              id: currentId,
              theme: "",
              status: 'DRAFT',
              startDate: range.start,
              endDate: range.end,
              capacityTarget: 20, // Default 20 points
              capacityUsed: 0
          };
          await storageService.saveWeekCycle(cycle);
      }
      
      return cycle;
  },
  
  // NEW: Get all cycles (for history/reporting)
  getCycles: async (): Promise<WeekCycle[]> => {
      const isCloud = storageService.isCloudActive();
      if (isCloud) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const snap = await db.collection('users').doc(uid).collection('cycles').get();
              return snap.docs.map((d: any) => d.data() as WeekCycle);
          } catch(e) { console.error("Cloud cycles fetch error", e); }
      }
      
      const key = getScopedKey(BASE_KEYS.CYCLES);
      return JSON.parse(localStorage.getItem(key) || '[]');
  },

  saveWeekCycle: async (cycle: WeekCycle): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.CYCLES);
      const cycles: WeekCycle[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [cycle, ...cycles.filter(c => c.id !== cycle.id)];
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('cycles').doc(cycle.id).set({
              ...cycle,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
      }
  },

  closeWeekCycle: async (
      cycle: WeekCycle, 
      tasks: Task[], 
      decisions: Record<string, RolloverDecision>
  ): Promise<{ nextCycle: WeekCycle, updatedTasks: Task[] }> => {
      
      const isCloud = storageService.isCloudActive();
      const uid = getUserId();
      const now = new Date();
      const nextCycleId = getNextWeekId(cycle.id);
      
      // 1. Calculate final metrics
      const cycleTasks = tasks.filter(t => t.cycleId === cycle.id);
      const totalPoints = cycleTasks.reduce((acc, t) => acc + (t.effort || 1), 0);
      const completedPoints = cycleTasks.filter(t => t.status === 'DONE').reduce((acc, t) => acc + (t.effort || 1), 0);
      
      const closedCycle: WeekCycle = {
          ...cycle,
          status: 'CLOSED',
          metrics: {
              reliability: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
              output: completedPoints
          },
          updatedAt: now.toISOString()
      };
      
      // 2. Prepare Next Cycle
      const range = getWeekRange(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)); // Roughly next week dates
      const nextCycle: WeekCycle = {
          id: nextCycleId,
          theme: "",
          status: 'ACTIVE', // Auto-activate
          startDate: range.start,
          endDate: range.end,
          capacityTarget: cycle.capacityTarget, // Carry over capacity
          capacityUsed: 0
      };

      // 3. Process Tasks
      const updatedTasks = [...tasks];
      const tasksToDelete: string[] = [];

      // Cloud Batch
      let batch = isCloud ? db.batch() : null;

      cycleTasks.forEach(task => {
          if (task.status === 'DONE') return; // Completed tasks stay in old cycle (Archive)
          
          const decision = decisions[task.id];
          if (!decision) return;

          const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
          if (taskIndex === -1) return;
          const t = updatedTasks[taskIndex];

          if (decision.action === 'DELETE') {
              updatedTasks.splice(taskIndex, 1);
              tasksToDelete.push(task.id);
              if (batch) {
                  const ref = db.collection('users').doc(uid).collection('tasks').doc(task.id);
                  batch.delete(ref);
              }
          } else {
              // Modify Task
              const updatedTask = { ...t };
              
              if (decision.action === 'ROLLOVER') {
                  updatedTask.cycleId = nextCycleId;
                  // Add Log
                  const log: RolloverLog = {
                      date: now.toISOString(),
                      fromCycleId: cycle.id,
                      reason: decision.reason || 'OTHER'
                  };
                  updatedTask.rolloverHistory = [...(updatedTask.rolloverHistory || []), log];
              } else if (decision.action === 'BACKLOG') {
                  updatedTask.cycleId = undefined; // Back to fridge
              }

              updatedTasks[taskIndex] = updatedTask;
              
              if (batch) {
                  const ref = db.collection('users').doc(uid).collection('tasks').doc(task.id);
                  batch.set(ref, { ...updatedTask, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
              }
          }
      });

      // 4. Save Everything
      
      // Local Save
      const cycleKey = getScopedKey(BASE_KEYS.CYCLES);
      const cycles: WeekCycle[] = JSON.parse(localStorage.getItem(cycleKey) || '[]');
      // Update old, add new
      const updatedCycles = [nextCycle, closedCycle, ...cycles.filter(c => c.id !== cycle.id && c.id !== nextCycleId)];
      localStorage.setItem(cycleKey, JSON.stringify(updatedCycles));
      
      const taskKey = getScopedKey(BASE_KEYS.TASKS);
      localStorage.setItem(taskKey, JSON.stringify(updatedTasks)); // Note: deleted tasks already removed from array

      // Cloud Save
      if (batch) {
          // Save Cycles
          const oldCycleRef = db.collection('users').doc(uid).collection('cycles').doc(closedCycle.id);
          batch.set(oldCycleRef, closedCycle, { merge: true });
          
          const newCycleRef = db.collection('users').doc(uid).collection('cycles').doc(nextCycle.id);
          batch.set(newCycleRef, { ...nextCycle, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });

          await batch.commit();
      }

      return { nextCycle, updatedTasks };
  },

  // --- PROJECTS (CRUD) ---

  getProjects: async (): Promise<Project[]> => {
      const isCloud = storageService.isCloudActive();
      
      if (isCloud) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const snapshot = await db.collection('users').doc(uid).collection('projects').orderBy('createdAt', 'desc').get();
              const projects = snapshot.docs.map((doc: any) => doc.data() as Project);
              localStorage.setItem(getScopedKey(BASE_KEYS.PROJECTS), JSON.stringify(projects));
              return projects;
          } catch (e) { console.error("Cloud project fetch error", e); }
      }
      
      try {
          const local = localStorage.getItem(getScopedKey(BASE_KEYS.PROJECTS));
          return local ? JSON.parse(local) : [];
      } catch { return []; }
  },

  addProject: async (project: Project): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.PROJECTS);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([project, ...current]));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('projects').doc(project.id).set({
              ...project,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      }
  },

  updateProject: async (project: Project): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.PROJECTS);
      const current: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.map(p => p.id === project.id ? project : p);
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('projects').doc(project.id).set({
              ...project,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
      }
  },

  deleteProject: async (projectId: string): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.PROJECTS);
      const current: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter(p => p.id !== projectId);
      localStorage.setItem(key, JSON.stringify(updated));

      const taskKey = getScopedKey(BASE_KEYS.TASKS);
      const tasks: Task[] = JSON.parse(localStorage.getItem(taskKey) || '[]');
      const tasksUpdated = tasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t);
      localStorage.setItem(taskKey, JSON.stringify(tasksUpdated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('projects').doc(projectId).delete();
      }
  },

  // --- TASKS (CRUD Atomique) ---

  getTasks: async (): Promise<Task[]> => {
    const isCloud = storageService.isCloudActive();
    
    if (isCloud) {
        try {
            const uid = getUserId();
            await ensureMigratedOnce(uid);

            const snapshot = await db.collection('users').doc(uid).collection('tasks').get();
            const tasks = snapshot.docs.map((doc: any) => doc.data() as Task);
            
            localStorage.setItem(getScopedKey(BASE_KEYS.TASKS), JSON.stringify(tasks));
            return tasks;
        } catch (error) {
            console.error("Firebase V2 task read error, falling back to local:", error);
        }
    }

    try {
        const local = localStorage.getItem(getScopedKey(BASE_KEYS.TASKS));
        return local ? JSON.parse(local) : [];
    } catch { return []; }
  },

  addTask: async (task: Task): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.TASKS);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([task, ...current]));

      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await db.collection('users').doc(uid).collection('tasks').doc(task.id).set({
                  ...task,
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
          } catch (e) { console.error("Cloud add task error", e); }
      }
  },

  updateTask: async (task: Task): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.TASKS);
      const current: Task[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.map(t => t.id === task.id ? task : t);
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await db.collection('users').doc(uid).collection('tasks').doc(task.id).set({
                  ...task,
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
          } catch (e) { console.error("Cloud update task error", e); }
      }
  },

  deleteTask: async (taskId: string): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.TASKS);
      const current: Task[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter(t => t.id !== taskId);
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await db.collection('users').doc(uid).collection('tasks').doc(taskId).delete();
          } catch (e) { console.error("Cloud delete task error", e); }
      }
  },

  // --- SESSION ---

  getSession: async (): Promise<DaySession | null> => {
    if (storageService.isCloudActive()) {
        try {
            const uid = getUserId();
            await ensureMigratedOnce(uid);

            const doc = await db.collection('users').doc(uid).collection('sessions').doc('current').get();
            if (doc.exists) {
                const session = doc.data() as DaySession;
                localStorage.setItem(getScopedKey(BASE_KEYS.SESSION), JSON.stringify(session));
                return session;
            }
        } catch (e) {}
    }
    const local = localStorage.getItem(getScopedKey(BASE_KEYS.SESSION));
    return local ? JSON.parse(local) : null;
  },

  saveSession: async (session: DaySession): Promise<void> => {
    localStorage.setItem(getScopedKey(BASE_KEYS.SESSION), JSON.stringify(session));

    if (storageService.isCloudActive()) {
         try {
            const uid = getUserId();
            await db.collection('users').doc(uid).collection('sessions').doc('current').set({
                ...session,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) { console.error(error); }
    }
  },

  // --- HISTORY / LOGS ---

  getHistory: async (): Promise<DailyLog[]> => {
    if (storageService.isCloudActive()) {
        try {
            const uid = getUserId();
            await ensureMigratedOnce(uid);

            const snap = await db.collection('users').doc(uid)
                .collection('logs')
                .orderBy(firebase.firestore.FieldPath.documentId(), 'desc') 
                .limit(30)
                .get();

            const logs = snap.docs.map((d: any) => d.data() as DailyLog);
            localStorage.setItem(getScopedKey(BASE_KEYS.HISTORY), JSON.stringify(logs));
            return logs;
        } catch (e) { console.error("Cloud history fetch error", e); }
    }
    const local = localStorage.getItem(getScopedKey(BASE_KEYS.HISTORY));
    return local ? JSON.parse(local) : [];
  },

  saveLog: async (log: DailyLog): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.HISTORY);
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      history.push(log);
      localStorage.setItem(key, JSON.stringify(history));

      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              const datePart = log.date ? new Date(log.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
              const safeId = ensureId(log.id);
              const docId = `${datePart}_${safeId}`;
              
              await db.collection('users').doc(uid).collection('logs').doc(docId).set({
                  ...log,
                  id: docId,
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
          } catch (e) { console.error("Cloud log save error", e); }
      }
  },

  // --- WORKLOADS ---
  
  getWorkloads: async (): Promise<{ initial: WorkloadAnalysis | null, current: WorkloadAnalysis | null } | null> => {
      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const doc = await db.collection('users').doc(uid).get();
              if (doc.exists && doc.data().workloads) {
                   const workloads = doc.data().workloads;
                   localStorage.setItem(getScopedKey(BASE_KEYS.WORKLOADS), JSON.stringify(workloads));
                   return workloads;
              }
          } catch (e) {}
      }
      const local = localStorage.getItem(getScopedKey(BASE_KEYS.WORKLOADS));
      return local ? JSON.parse(local) : null;
  },

  saveWorkloads: async (initial: WorkloadAnalysis | null, current: WorkloadAnalysis | null): Promise<void> => {
      const workloads = { initial, current };
      localStorage.setItem(getScopedKey(BASE_KEYS.WORKLOADS), JSON.stringify(workloads));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).set({ 
              workloads,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
          }, { merge: true });
      }
  },

  // --- USER PROFILE ---
  getUserProfile: async (): Promise<UserProfile | null> => {
      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const doc = await db.collection('users').doc(uid).get();
              if (doc.exists && doc.data().profile) {
                   const profile = doc.data().profile;
                   localStorage.setItem(getScopedKey(BASE_KEYS.PROFILE), JSON.stringify(profile));
                   return profile;
              }
          } catch (e) {}
      }
      const local = localStorage.getItem(getScopedKey(BASE_KEYS.PROFILE));
      return local ? JSON.parse(local) : null;
  },

  saveUserProfile: async (profile: UserProfile): Promise<void> => {
      localStorage.setItem(getScopedKey(BASE_KEYS.PROFILE), JSON.stringify(profile));
      
      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).set({ 
              profile,
              mentorId: profile.mentorId,
              onboardingStatus: profile.onboardingStatus,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
          }, { merge: true });
      }
  },

  saveUserPreferences: async (prefs: UserPreferences): Promise<void> => {
      localStorage.setItem(getScopedKey(BASE_KEYS.PREFS), JSON.stringify(prefs));
  },
  
  // --- REPORTS ---
  
  getWeeklyReports: async (): Promise<WeeklyReportData[]> => {
      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const snap = await db.collection('users').doc(uid).collection('reports').orderBy('createdAt', 'desc').get();
              return snap.docs.map((d: any) => d.data() as WeeklyReportData);
          } catch(e) {}
      }
      const local = localStorage.getItem(getScopedKey(BASE_KEYS.REPORTS));
      return local ? JSON.parse(local) : [];
  },

  saveWeeklyReport: async (report: WeeklyReportData): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.REPORTS);
      const reports = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [report, ...reports.filter((r: WeeklyReportData) => r.id !== report.id)];
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('reports').doc(report.id!).set({
              ...report,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      }
  },

  deleteReport: async (reportId: string): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.REPORTS);
      const reports = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = reports.filter((r: WeeklyReportData) => r.id !== reportId);
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('reports').doc(reportId).delete();
      }
  },
  
  // --- ADVICE HISTORY ---
  
  getAdviceHistory: async (): Promise<AdviceLog[]> => {
      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);
              const snap = await db.collection('users').doc(uid).collection('advice').orderBy('date', 'desc').get();
              return snap.docs.map((d: any) => d.data() as AdviceLog);
          } catch(e) {}
      }
      const local = localStorage.getItem(getScopedKey(BASE_KEYS.ADVICE));
      return local ? JSON.parse(local) : [];
  },

  saveAdvice: async (log: AdviceLog): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.ADVICE);
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [log, ...history];
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('advice').doc(log.id).set({
              ...log,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      }
  },

  clearAll: () => {
      // Do not call getUserId() here to avoid side-effects (creating new anon user during logout)
      localStorage.removeItem(BASE_KEYS.USER_ID);
      localStorage.removeItem(LEGACY_UID_KEY);
  }
};