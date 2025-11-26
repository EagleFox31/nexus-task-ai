



import { Task, DaySession, DailyLog, WorkloadAnalysis, UserPreferences, UserProfile, WeeklyReportData, AdviceLog, Project } from '../types';
import { db, auth } from './firebase';
import firebase from 'firebase/compat/app';

// Base keys for LocalStorage (Cache)
const BASE_KEYS = {
  TASKS: 'nexus_tasks',
  PROJECTS: 'nexus_projects', // New Key
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

// 1. MIGRATION LOCAL V1 (Unscoped) -> V2 (Scoped)
const migrateLocalV1ToScoped = (uid: string) => {
    const bases = [
        BASE_KEYS.TASKS,
        BASE_KEYS.SESSION,
        BASE_KEYS.HISTORY,
        BASE_KEYS.WORKLOADS,
        BASE_KEYS.PREFS,
        BASE_KEYS.PROFILE,
        // Projects, Reports, Advice don't need V1 migration as they didn't exist in V1
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

    if (storedActive) {
        migrateLocalV1ToScoped(storedActive);
        return storedActive;
    }

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
                    ops.push((batch) => batch.set(taskRef, { 
                        ...task, 
                        id: taskId,
                        updatedAt: now 
                    }));
                });
            }

            if (Array.isArray(v1Data?.history)) {
                v1Data.history.forEach((log: DailyLog) => {
                    const dateStr = log.date ? new Date(log.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                    const safeId = ensureId(log.id);
                    const docId = `${dateStr}_${safeId}`;
                    
                    const logRef = userRef.collection('logs').doc(docId);
                    ops.push((batch) => batch.set(logRef, { 
                        ...log, 
                        id: docId, 
                        date: log.date || new Date().toISOString(),
                        updatedAt: now 
                    }, { merge: true }));
                });
            }

            if (v1Data?.session) {
                const sessionRef = userRef.collection('sessions').doc('current');
                ops.push((batch) => batch.set(sessionRef, { 
                    ...v1Data.session,
                    updatedAt: now
                }));
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
    return !!db && !!auth?.currentUser;
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

      // Also need to clear projectId from associated tasks in local storage
      const taskKey = getScopedKey(BASE_KEYS.TASKS);
      const tasks: Task[] = JSON.parse(localStorage.getItem(taskKey) || '[]');
      const tasksUpdated = tasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t);
      localStorage.setItem(taskKey, JSON.stringify(tasksUpdated));

      if (storageService.isCloudActive()) {
          const uid = getUserId();
          await db.collection('users').doc(uid).collection('projects').doc(projectId).delete();
          // Note: Cloud tasks won't be automatically updated for perf reasons.
          // They will keep a dead projectId or handled by logic.
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

  // --- WEEKLY REPORTS ---

  getWeeklyReports: async (): Promise<WeeklyReportData[]> => {
      const isCloud = storageService.isCloudActive();

      if (isCloud) {
          try {
              const uid = getUserId();
              await ensureMigratedOnce(uid);

              const snapshot = await db.collection('users').doc(uid)
                  .collection('reports')
                  .orderBy('createdAt', 'desc')
                  .get();

              const reports = snapshot.docs.map((doc: any) => doc.data() as WeeklyReportData);
              localStorage.setItem(getScopedKey(BASE_KEYS.REPORTS), JSON.stringify(reports));
              return reports;
          } catch (error) {
              console.error("Cloud reports fetch error:", error);
          }
      }

      try {
          const local = localStorage.getItem(getScopedKey(BASE_KEYS.REPORTS));
          return local ? JSON.parse(local) : [];
      } catch { return []; }
  },

  saveWeeklyReport: async (report: WeeklyReportData): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.REPORTS);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [report, ...current.filter((r: WeeklyReportData) => r.id !== report.id)];
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              const reportId = report.id || Date.now().toString();
              await db.collection('users').doc(uid).collection('reports').doc(reportId).set({
                  ...report,
                  id: reportId,
                  createdAt: report.createdAt || new Date().toISOString(),
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
          } catch (e) { console.error("Cloud report save error", e); }
      }
  },

  deleteReport: async (reportId: string): Promise<void> => {
      const key = getScopedKey(BASE_KEYS.REPORTS);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((r: WeeklyReportData) => r.id !== reportId);
      localStorage.setItem(key, JSON.stringify(updated));

      if (storageService.isCloudActive()) {
          try {
              const uid = getUserId();
              await db.collection('users').doc(uid).collection('reports').doc(reportId).delete();
          } catch (e) { console.error("Cloud delete report error", e); }
      }
  },

  // --- ADVICE HISTORY ---

  getAdviceHistory: async (): Promise<AdviceLog[]> => {
    const isCloud = storageService.isCloudActive();

    if (isCloud) {
        try {
            const uid = getUserId();
            await ensureMigratedOnce(uid);

            const snapshot = await db.collection('users').doc(uid)
                .collection('advice')
                .orderBy('date', 'desc')
                .get();

            const adviceList = snapshot.docs.map((doc: any) => doc.data() as AdviceLog);
            localStorage.setItem(getScopedKey(BASE_KEYS.ADVICE), JSON.stringify(adviceList));
            return adviceList;
        } catch (error) { console.error("Cloud advice fetch error", error); }
    }
    try {
        const local = localStorage.getItem(getScopedKey(BASE_KEYS.ADVICE));
        return local ? JSON.parse(local) : [];
    } catch { return []; }
  },

  saveAdvice: async (advice: AdviceLog): Promise<void> => {
    const key = getScopedKey(BASE_KEYS.ADVICE);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [advice, ...current]; 
    localStorage.setItem(key, JSON.stringify(updated));

    if (storageService.isCloudActive()) {
        try {
            const uid = getUserId();
            await db.collection('users').doc(uid).collection('advice').doc(advice.id).set({
                ...advice,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) { console.error("Cloud advice save error", e); }
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
                  return profile as UserProfile;
              }
          } catch(e) {}
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
              onboardingStatus: profile.onboardingStatus,
              mentorId: profile.mentorId,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
      }
  },

  saveUserPreferences: async (prefs: UserPreferences) => {
      if (storageService.isCloudActive()) {
           const uid = getUserId();
           await db.collection('users').doc(uid).set({ 
               prefs,
               updatedAt: firebase.firestore.FieldValue.serverTimestamp()
           }, { merge: true });
      }
  },

  clearAll: (): void => {
      const uid = getUserId();
      console.log("Cleaning up local data for user:", uid);
      localStorage.removeItem(getScopedKey(BASE_KEYS.TASKS));
      localStorage.removeItem(getScopedKey(BASE_KEYS.PROJECTS));
      localStorage.removeItem(getScopedKey(BASE_KEYS.SESSION));
      localStorage.removeItem(getScopedKey(BASE_KEYS.HISTORY));
      localStorage.removeItem(getScopedKey(BASE_KEYS.WORKLOADS));
      localStorage.removeItem(getScopedKey(BASE_KEYS.PREFS));
      localStorage.removeItem(getScopedKey(BASE_KEYS.PROFILE));
      localStorage.removeItem(getScopedKey(BASE_KEYS.REPORTS));
      localStorage.removeItem(getScopedKey(BASE_KEYS.ADVICE));
      
      localStorage.removeItem(BASE_KEYS.USER_ID);
      localStorage.removeItem(LEGACY_UID_KEY);
  }
};
