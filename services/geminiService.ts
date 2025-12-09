

import { GoogleGenAI, Type } from "@google/genai";
import { Task, WorkloadAnalysis, MentorId, WeeklyReportData, DailyLog, UserProfile, CounterAnalysis, WorkloadAdviceExplanation, PrioritizationSuggestion, Priority, Project, WeekCycle, RolloverLog } from "../types";
import { MENTOR_PROFILES } from "../data/mentors";
import { PROFILES, GOALS, CONSTRAINTS } from "../data/onboardingOptions";

// Helper to safely get AI client or throw meaningful error
const getAiClient = () => {
  // Access process.env.API_KEY safely. In Vite via 'define', this is replaced by the string literal.
  const apiKey = process.env.API_KEY;
  
  // Robust check: ensure it's a non-empty string
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    console.warn("NexusTask AI: API Key is missing or invalid. AI features will be disabled.");
    return null;
  }

  try {
      return new GoogleGenAI({ apiKey });
  } catch (error) {
      console.error("NexusTask AI: Failed to initialize GoogleGenAI client.", error);
      return null;
  }
};

// Initialize client lazily and safely
const ai = getAiClient();

// Helper to translate IDs to Labels
const getLabel = (options: {id: string, label: string | {fr: string, en: string}}[], id: string): string => {
    const found = options.find(o => o.id === id);
    if (!found) return id;
    if (typeof found.label === 'string') return found.label;
    return found.label.fr;
};

// --- MENTOR SYSTEM PROMPTS ---

const BASE_SYSTEM_PROMPT = `
Tu génères un rapport hebdomadaire de productivité basé sur des métriques et un contexte utilisateur.
Objectifs : (1) être concret, (2) proposer des actions réalistes, (3) éviter le blabla, (4) exploiter les données fournies.
Contraintes :
Sortie STRICTEMENT en JSON valide, conforme au schéma fourni.
Aucune mise en forme Markdown.
Aucune mention de "prompt", "système", "LLM", "Gemini", "IA".
Ne donne pas de conseils médicaux/psychologiques. Reste sur organisation, priorisation, méthodes de travail.
Si une donnée manque, fais une hypothèse minimale.
`;

const MENTOR_PROMPTS: Record<MentorId, string> = {
  aya_operator: `
    Identité mentor : Aya "The Operator" N’Diaye. Style : direct, opérationnel, orienté livraison.
    PHILOSOPHIE CHARGE MENTALE : Pour toi, avoir beaucoup de tâches n'est pas grave TANT QUE les tâches avancent (Velocity). Ce qui te stresse, c'est la stagnation, pas le volume.
    Ton conseil doit pousser à l'exécution immédiate ("Kill list").
  `,
  elias_strategist: `
    Identité mentor : Dr. Elias Morel "The Strategist". Style : consulting premium, ROI et leverage.
    PHILOSOPHIE CHARGE MENTALE : La surcharge vient du manque de clarté, pas du nombre de tâches. Si c'est le chaos, il faut s'arrêter et planifier.
    Ton conseil doit pousser à la priorisation et à l'élimination (80/20).
  `,
  mina_deepwork: `
    Identité mentor : Mina "Deep Work" Kwon. Style : calme, précis, focus/énergie cognitive.
    PHILOSOPHIE CHARGE MENTALE : Chaque tâche ouverte est une "dette d'attention". Même si la vélocité est bonne, trop de contexte switch épuise. Tu préfères peu de tâches mais intenses.
    Ton conseil doit pousser à réduire le "Work In Progress".
  `,
  salma_systems: `
    Identité mentor : Salma "Systems Thinker" Benali. Style : systems/automation, SOP, templates, réduction friction.
    PHILOSOPHIE CHARGE MENTALE : La surcharge est le symptôme d'un manque de process. Si on est débordé, c'est qu'on fait trop de manuel.
    Ton conseil doit pousser à standardiser ou automatiser.
  `,
  kassi_stoic: `
    Identité mentor : Maître Jean-Baptiste Kassi. Style : sobre, stoïcien moderne, discipline et limites.
    PHILOSOPHIE CHARGE MENTALE : La charge mentale est une réaction émotionnelle aux engagements. Il faut accepter la réalité du travail et poser des limites fermes.
    Ton conseil doit pousser à la discipline et au refus de nouvelles tâches.
  `
};

const cleanJson = (text: string): string => {
  // 1. Enlever les blocs markdown
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  // 2. Trouver le début du JSON (soit { soit [)
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');

  // Si aucun JSON trouvé
  if (firstBrace === -1 && firstBracket === -1) return clean;

  // Si c'est un tableau qui commence en premier (ou si y'a pas d'objet)
  // On priorise le tableau si l'intention est de parser une liste
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      const lastBracket = clean.lastIndexOf(']');
      if (lastBracket !== -1) {
          return clean.substring(firstBracket, lastBracket + 1);
      }
  }

  // Sinon si c'est un objet
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = clean.lastIndexOf('}');
      if (lastBrace !== -1) {
          return clean.substring(firstBrace, lastBrace + 1);
      }
  }

  return clean;
};

// HELPER: Enrich tasks with project context
const formatTaskWithContext = (task: Task, projects: Project[]): string => {
    let summary = `- ${task.title} (Priorité Tâche: ${task.priority}, Statut: ${task.status})`;
    
    // Inject Project Info
    if (task.projectId) {
        const proj = projects.find(p => p.id === task.projectId);
        if (proj) {
            summary += ` | Projet Parent: "${proj.title}" [Priorité Projet: ${proj.priority || 'LOW'}] [Domaines: ${proj.domains.join(', ')}] [Contexte: ${proj.description}]`;
        }
    } else {
        summary += ` | Projet: Aucun (Inbox)`;
    }

    if (task.subTasks && task.subTasks.length > 0) {
        summary += `\n    [Détail: ${task.subTasks.length} sous-tâches: ${task.subTasks.map(st => st.title).join(', ')}]`;
    }
    return summary;
};

export const analyzeWorkload = async (
  tasks: Task[], 
  projects: Project[] = [], 
  history: DailyLog[] = [],
  mentorId: MentorId = 'aya_operator' // Default mentor
): Promise<WorkloadAnalysis> => {
  if (!ai) return { score: 50, level: 'Balanced', advice: "Service IA indisponible (Clé API manquante)." };
  
  const activeTasks = tasks.filter(t => t.status !== 'DONE');
  const completedTasksList = tasks.filter(t => t.status === 'DONE');
  
  if (tasks.length === 0) {
    return { score: 0, level: 'Light', advice: "Votre semaine est vide. C'est le moment idéal pour planifier des objectifs ambitieux." };
  }

  const taskSummaries = activeTasks.map(t => formatTaskWithContext(t, projects)).join('\n');
  const activeCount = activeTasks.length;

  // --- 1. CALCUL DE LA VÉLOCITÉ (HISTORIQUE) ---
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  // On filtre l'historique pertinent
  const relevantLogs = history.filter(log => new Date(log.date) >= thirtyDaysAgo);
  
  // Total tâches finies sur 30 jours (Logs + Tâches actuelles marquées DONE si pas encore archivées)
  // Note: history contient les logs archivés. completedTasksList contient les tâches DONE non encore archivées.
  // Pour la vélocité moyenne, on se base surtout sur l'historique validé.
  const totalArchived = relevantLogs.reduce((sum, log) => sum + log.completedTasks, 0);
  const uniqueDaysLogged = new Set(relevantLogs.map(l => l.date.split('T')[0])).size || 1;
  const avgVelocityPerDay = parseFloat((totalArchived / uniqueDaysLogged).toFixed(1)) || 2; // Fallback à 2/jour par défaut
  
  // --- 2. CALCUL DU MOMENTUM (RÉCENT) ---
  // Est-ce qu'on a beaucoup avancé ces dernières 24h/48h ?
  // On regarde les tâches DONE non archivées (completedTasksList) + les logs d'hier/aujourd'hui
  const recentCompletionCount = completedTasksList.length; // Tâches DONE dans la vue actuelle
  
  // Ratio Charge vs Capacité
  // Combien de jours de travail représente le backlog actuel ?
  const daysToClearBacklog = activeCount / (avgVelocityPerDay || 1);
  
  const contextData = {
    stats: {
        active_tasks: activeCount,
        avg_velocity_per_day: avgVelocityPerDay,
        recent_completed_in_view: recentCompletionCount,
        estimated_days_to_clear: daysToClearBacklog.toFixed(1)
    },
    mentor_persona: MENTOR_PROMPTS[mentorId]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      Tu es l'algorithme "Cognitive Load Engine" de l'application NexusTask.
      Ton rôle : Calculer un score de charge mentale (0-100) en comparant le TRAVAIL À FAIRE vs LA CAPACITÉ PROUVÉE de l'utilisateur.

      DONNÉES ANALYTIQUES :
      ${JSON.stringify(contextData, null, 2)}

      LISTE DES TÂCHES ACTIVES :
      ${taskSummaries}

      RÈGLES DE CALCUL DU SCORE (CRITIQUE) :
      
      1. LA RÈGLE DE RELATIVITÉ (VÉLOCITÉ) :
         - Si l'utilisateur a 20 tâches mais une vélocité de 10 tâches/jour => C'est gérable (Score ~40-60).
         - Si l'utilisateur a 20 tâches mais une vélocité de 2 tâches/jour => C'est la noyade (Score > 90).
         - Le score doit refléter le "Poids Ressenti" par rapport à SA capacité, pas un chiffre absolu.
      
      2. L'EFFET MOMENTUM (DYNAMIQUE) :
         - Si "recent_completed_in_view" est élevé (ex: > 30% du total), l'utilisateur est en "Flow".
         - DANS CE CAS : Réduis le score de 10 à 20 points. L'action tue l'anxiété.
         - Si "recent_completed_in_view" est 0, augmente le score (Stagnation = Stress).

      3. LE FILTRE DU MENTOR (${mentorId}) :
         - Utilise la philosophie du mentor fournie ci-dessus pour ajuster le score et surtout le CONSEIL.
         - Aya tolère le volume si ça bouge.
         - Mina déteste le volume même si ça bouge.

      FORMAT DE SORTIE (JSON) :
      {
        "score": number (0-100),
        "level": "Light" | "Balanced" | "Heavy" | "Overload",
        "advice": "Phrase percutante et spécifique au mentor qui prend en compte l'évolution (ex: 'Tu as abattu beaucoup de travail hier, continue' ou 'Le backlog s'accumule dangereusement...')."
      }
      `,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
        return JSON.parse(cleanJson(response.text)) as WorkloadAnalysis;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Erreur Gemini Workload:", error);
    return { score: 50, level: 'Balanced', advice: "Impossible d'analyser la charge pour le moment." };
  }
};

export const explainWorkloadAdvice = async (advice: string, tasks: Task[], mentorId?: MentorId): Promise<WorkloadAdviceExplanation | null> => {
    if (!ai) return null;
    
    // Note: For simple explanation, we just pass the titles, deep project context might be overkill but can be added if needed
    const taskList = tasks.map(t => `- ${t.title} (${t.priority})`).join('\n');
    const mentorContext = mentorId ? MENTOR_PROMPTS[mentorId] : "Agis comme un expert en productivité pragmatique.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
            CONTEXTE :
            L'utilisateur a reçu ce conseil : "${advice}"
            Tâches :
            ${taskList}

            IDENTITÉ DU COACH :
            ${mentorContext}
            Consigne : Utilise le ton, le vocabulaire et la philosophie spécifique de ce mentor. Ne sois pas générique.

            MISSION :
            Explique le concept et l'application concrète aux tâches.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        concept_name: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        concrete_application: { type: Type.ARRAY, items: { type: Type.STRING } },
                        why_it_works: { type: Type.STRING }
                    },
                    required: ["concept_name", "definition", "concrete_application", "why_it_works"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(cleanJson(response.text)) as WorkloadAdviceExplanation;
        }
        return null;

    } catch (error) {
        console.error("Gemini Explain Advice Error:", error);
        return null;
    }
};

export const breakDownTask = async (task: Task, project?: Project): Promise<string[]> => {
  if (!ai) return ["Définir le périmètre", "Première ébauche", "Revue finale"];
  
  const context = project 
    ? `Projet: ${project.title} (Priorité: ${project.priority || 'LOW'}, Domaines: ${project.domains.join(', ')}). Contexte: ${project.description}` 
    : "Aucun contexte projet spécifique.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Cette tâche est trop vague : "${task.title}". Description : "${task.description}".
      Contexte du projet parent : ${context}.
      Découpe-la en 3 à 5 sous-tâches concrètes et techniques adaptées au domaine du projet.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
        return JSON.parse(cleanJson(response.text)) as string[];
    }
    return ["Définir le périmètre", "Première ébauche", "Revue finale"];
  } catch (error) {
    return ["Définir le périmètre", "Première ébauche", "Revue finale"];
  }
};

export const suggestEvolution = async (task: Task, project?: Project): Promise<string> => {
    if (!ai) return "Optimisez cette tâche.";
    
    const context = project 
        ? `Projet: ${project.title} (Priorité: ${project.priority || 'LOW'}, Domaines: ${project.domains.join(', ')}).` 
        : "";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Agis comme un coach de productivité senior. Tâche : "${task.title}".
            ${context}
            Suggère une amélioration ou une approche stratégique pour cette tâche.
            
            IMPORTANT :
            - Si la tâche est complexe, propose une structure courte (liste à puces).
            - Si la tâche est simple, sois concis (max 2 phrases).
            - Ne fais PAS un cours magistral. Reste actionnable.
            `,
        });
        // Remove markdown formatting chars that might break display if not parsed
        let cleanText = response.text || "Optimisez cette tâche.";
        cleanText = cleanText.replace(/[*]{2}/g, '').replace(/[#]+/g, ''); 
        return cleanText;
    } catch (error) {
        return "Concentre-toi sur l'essentiel.";
    }
}

export const suggestProjectTasks = async (project: Project): Promise<{ title: string; priority: Priority }[]> => {
    if (!ai) return [];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
            RÔLE : Chef de projet expert.
            PROJET CIBLE :
            - Titre : ${project.title}
            - Domaines : ${project.domains.join(', ')}
            - Description / Contexte : ${project.description}
            - Priorité globale : ${project.priority}

            MISSION :
            Génère une liste de 5 à 10 tâches concrètes et actionnables pour démarrer ou avancer ce projet.
            Les tâches doivent être techniques et spécifiques aux domaines mentionnés.
            Suggère une priorité (LOW/MEDIUM/HIGH) pour chaque tâche.

            FORMAT JSON ATTENDU :
            Array d'objets : { "title": "...", "priority": "..." }
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
                        },
                        required: ["title", "priority"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(cleanJson(response.text));
        }
        return [];
    } catch (error) {
        console.error("Gemini Project Plan Error:", error);
        return [];
    }
};

export const suggestTaskPriorities = async (tasks: Task[], projects: Project[], userGoal: string): Promise<PrioritizationSuggestion[] | null> => {
    if (!ai) return null;

    const taskList = tasks.map(t => formatTaskWithContext(t, projects)).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
            Stratège en productivité. 
            OBJECTIF UTILISATEUR : "${userGoal}".
            
            MISSION :
            Réévalue la priorité des tâches (LOW, MEDIUM, HIGH).
            Retourne UNIQUEMENT un tableau JSON.
            
            RÈGLES IMPORTANTES :
            1. Une tâche liée à un "Projet Parent" de priorité HIGH doit souvent être montée en HIGH ou MEDIUM, sauf si elle est triviale.
            2. Une tâche d'un projet LOW peut souvent être descendue en LOW.
            3. L'objectif utilisateur "${userGoal}" est le filtre final.
            
            TÂCHES À ANALYSER :
            ${taskList}
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            taskId: { type: Type.STRING },
                            suggestedPriority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                            reason: { type: Type.STRING }
                        },
                        required: ["taskId", "suggestedPriority", "reason"]
                    }
                }
            }
        });

        if (response.text) {
            const rawSuggestions = JSON.parse(cleanJson(response.text));
            // Ensure result is an array
            if (!Array.isArray(rawSuggestions)) return [];

            return rawSuggestions.map((s: any) => ({
                taskId: s.taskId,
                suggestedPriority: s.suggestedPriority as Priority,
                reason: s.reason,
                currentPriority: Priority.LOW 
            }));
        }
        return [];
    } catch (error) {
        console.error("Gemini Prioritization Error:", error);
        return null; // Return null to signal error
    }
};

export const generateWeeklyReport = async (
  mentorId: MentorId,
  tasks: Task[],
  history: DailyLog[],
  workloadScore: number,
  userProfile?: UserProfile,
  projects: Project[] = [],
  lastCycle?: WeekCycle // NEW: Context from the just-closed cycle
): Promise<WeeklyReportData | null> => {
  if (!ai) return null;

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const plannedTasks = tasks.length;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentLogs = history.filter(log => new Date(log.date) >= oneWeekAgo);
  const totalFocusMinutes = Math.floor(recentLogs.reduce((acc, log) => acc + log.totalTime, 0) / (1000 * 60));

  // Determine Active Projects
  const activeProjectIds = new Set(tasks.map(t => t.projectId).filter(Boolean));
  const activeProjects = projects.filter(p => activeProjectIds.has(p.id)).map(p => `${p.title} (${p.priority || 'LOW'})`).join(', ');

  // Extract Rollover Data from Cycle
  let rolloverContext = "";
  let rolloverReasons = {};
  
  if (lastCycle && lastCycle.metrics) {
      // Find tasks that were rolled over from this cycle
      const rolledOverTasks = tasks.filter(t => 
        t.rolloverHistory && 
        t.rolloverHistory.some(log => log.fromCycleId === lastCycle.id)
      );

      const reasonsCount: Record<string, number> = {};
      rolledOverTasks.forEach(t => {
          const log = t.rolloverHistory?.find(l => l.fromCycleId === lastCycle.id);
          if (log) {
              reasonsCount[log.reason] = (reasonsCount[log.reason] || 0) + 1;
          }
      });
      rolloverReasons = reasonsCount;

      rolloverContext = `
      DONNÉES DU CYCLE CLÔTURÉ (${lastCycle.id}):
      - Thème de la semaine : "${lastCycle.theme || 'Non défini'}"
      - Score de Fiabilité (Réalisé/Prévu) : ${lastCycle.metrics.reliability}%
      - Points d'effort abattus : ${lastCycle.metrics.output}
      - Tâches reportées : ${rolledOverTasks.length}
      - Raisons principales des reports : ${JSON.stringify(reasonsCount)}
      
      INSTRUCTION SPÉCIALE : Analyse pourquoi le score est de ${lastCycle.metrics.reliability}%. 
      Si < 80%, critique sévèrement les raisons des reports (ex: si 'UNDERESTIMATED', conseille de doubler les temps).
      Si > 100%, félicite pour la sous-promesse/sur-délivrance.
      `;
  }

  const promptData = {
    mentor: mentorId,
    user_context: userProfile ? {
        profile_type: getLabel(PROFILES, userProfile.profilePrimary),
        primary_goal: getLabel(GOALS, userProfile.primaryGoal),
        constraints: userProfile.constraints.map(c => getLabel(CONSTRAINTS, c))
    } : { note: "Profil non spécifié" },
    week: { start: oneWeekAgo.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    active_projects: activeProjects || "Général",
    data: {
      tasks: {
        planned: plannedTasks,
        completed: completedTasks,
        top_projects_context: activeProjects,
      },
      focus: { minutes: totalFocusMinutes },
      cognitive_load: { score: workloadScore }
    }
  };

  let extraInstructions = "";
  if (userProfile) {
      extraInstructions = `
      CONTEXTE UTILISATEUR :
      Profil: ${userProfile.profilePrimary}. Objectif: "${userProfile.primaryGoal}".
      Projets Actifs cette semaine (avec priorité) : ${activeProjects}.
      Adapte tes conseils aux domaines de ces projets et concentre l'effort sur les projets HIGH priority.
      `;
  }

  // Inject Rollover Context
  extraInstructions += rolloverContext;

  const systemPrompt = BASE_SYSTEM_PROMPT + "\n" + MENTOR_PROMPTS[mentorId] + "\n" + extraInstructions;
  
  const expectedStructure = `
  {
    "mentor": { "id": "${mentorId}", "name": "Nom", "tagline": "Tag" },
    "week": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
    "executive_summary": "Résumé",
    "scores": [{ "label": "Metric", "value": 0, "note": "Note" }],
    "wins": [{ "title": "Win", "evidence": "Proof" }],
    "time_leaks": [{ "title": "Leak", "cause": "Cause", "fix": "Fix" }],
    "metrics_snapshot": {
        "focus_minutes": 0,
        "tasks_completed": 0,
        "tasks_planned": 0,
        "planned_vs_adjusted_gap": 0,
        "cognitive_load_level": "Level",
        "reliability_score": ${lastCycle?.metrics?.reliability || 0}
    },
    "recommendations": [{ "title": "Rec", "why": "Why", "steps": [], "effort": "S", "impact": "L" }],
    "challenge": { "name": "Chal", "rules": [], "success_metric": "Metric" },
    "closing": "Bye"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `DATA: ${JSON.stringify(promptData)}. OUTPUT JSON: ${expectedStructure}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
        const parsedReport = JSON.parse(cleanJson(response.text));
        if (!parsedReport.week) parsedReport.week = promptData.week;
        if (!parsedReport.mentor || !parsedReport.mentor.name) {
             parsedReport.mentor = { id: mentorId, name: "Votre Mentor", tagline: "Nexus AI Coach" }; 
        }
        
        // Ensure reliability score is present in output even if AI forgot
        if (lastCycle && parsedReport.metrics_snapshot) {
            parsedReport.metrics_snapshot.reliability_score = lastCycle.metrics?.reliability || 0;
            parsedReport.cycle_context = {
                theme: lastCycle.theme,
                rollover_reasons_summary: JSON.stringify(rolloverReasons)
            };
        }

        return parsedReport as WeeklyReportData;
    }
    return null;
  } catch (error) {
    console.error("Gemini Report Generation Error:", error);
    return null;
  }
};

export const generateCounterAnalysis = async (
    originalReport: WeeklyReportData,
    newMentorId: MentorId
): Promise<CounterAnalysis | null> => {
    if (!ai) return null;
    
    // Find Mentor details manually to ensure they exist
    const mentorProfile = MENTOR_PROFILES.find(m => m.id === newMentorId);
    if (!mentorProfile) return null;

    const systemPrompt = `
    Tu es ${mentorProfile.name} (${mentorProfile.tagline}). 
    TON STYLE : ${MENTOR_PROMPTS[newMentorId]}
    
    TA MISSION : 
    Analyse le rapport hebdomadaire fourni (généré par un autre mentor).
    Apporte une critique constructive mais ferme, basée sur TA philosophie.
    Propose une perspective alternative concrète.
    
    Si le rapport dit "Fais plus de tâches", et que tu es Mina (Deep Work), critique la superficialité.
    Si le rapport dit "Prends ton temps", et que tu es Aya (Operator), critique la lenteur.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `RAPPORT ORIGINAL: ${JSON.stringify(originalReport)}`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        critique: { type: Type.STRING },
                        alternative_perspective: { type: Type.STRING }
                    },
                    required: ["critique", "alternative_perspective"]
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(cleanJson(response.text));
            // FORCE INJECTION OF MENTOR DATA TO PREVENT UNDEFINED ERRORS
            result.mentor = {
                id: mentorProfile.id,
                name: mentorProfile.name,
                tagline: mentorProfile.tagline
            };
            return result as CounterAnalysis;
        }
        return null;
    } catch (error) {
        console.error("Gemini Counter Analysis Error:", error);
        return null;
    }
};