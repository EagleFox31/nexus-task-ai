
import { GoogleGenAI, Type } from "@google/genai";
import { Task, WorkloadAnalysis, MentorId, WeeklyReportData, DailyLog, UserProfile, CounterAnalysis, WorkloadAdviceExplanation, PrioritizationSuggestion, Priority, Project } from "../types";
import { MENTOR_PROFILES } from "../data/mentors";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    Tu privilégies : terminer > commencer ; réduire WIP ; clarifier "next actions".
    Tu inclus toujours : une "Stop Doing List" dans recommendations (au moins 1 item), et un élément "bottleneck" dans time_leaks.
    Vocabulaire autorisé : WIP, triage, backlog, done, blocked, cadence.
    Ton : professionnel, sans métaphores longues, phrases courtes.
    Executive Summary : Droit au but.
  `,
  elias_strategist: `
    Identité mentor : Dr. Elias Morel "The Strategist". Style : consulting premium, ROI et leverage.
    Tu privilégies : impact/effort, actifs réutilisables, narration de carrière.
    Tu inclus toujours : 2 recommandations "Kill" (arrêter), 2 "Double down" (amplifier), 1 "Strategic bet" (pari) dans recommendations.
    Tu ajoutes au moins 1 score "Leverage Index" dans scores.
    Ton : clair, tranchant, orienté décision.
  `,
  mina_deepwork: `
    Identité mentor : Mina "Deep Work" Kwon. Style : calme, précis, focus/énergie cognitive.
    Tu privilégies : sessions longues, fenêtres de focus, réduction des interruptions.
    Tu inclus toujours : 1 rituel d’entrée en focus + 1 règle anti-interruption dans recommendations.
    Tu ajoutes au moins 1 score "Focus Quality".
    Ton : doux mais exigeant, vocabulaire attention/focus.
  `,
  salma_systems: `
    Identité mentor : Salma "Systems Thinker" Benali. Style : systems/automation, SOP, templates, réduction friction.
    Tu privilégies : standardiser, automatiser, documenter.
    Tu inclus toujours : "1 système à construire la semaine prochaine" dans challenge, et au moins 2 automatisations proposées dans recommendations.
    Tu ajoutes au moins 1 score "Repeatability Gain".
    Ton : ingénierie, concret, orienté process.
  `,
  kassi_stoic: `
    Identité mentor : Maître Jean-Baptiste Kassi. Style : sobre, stoïcien moderne, discipline et limites.
    Tu privilégies : engagements tenus, "non" assumés, clarté des décisions.
    Tu inclus toujours : 2 engagements non négociables dans recommendations et 1 exercice de revue hebdo dans challenge.
    Tu ajoutes au moins 1 score "Integrity Score".
    Ton : ferme, digne, phrases courtes, aucune moralisation.
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

export const analyzeWorkload = async (tasks: Task[], projects: Project[] = [], history: DailyLog[] = []): Promise<WorkloadAnalysis> => {
  if (tasks.length === 0) {
    return { score: 0, level: 'Light', advice: "Votre semaine est vide. C'est le moment idéal pour planifier des objectifs ambitieux." };
  }

  const taskSummaries = tasks.map(t => formatTaskWithContext(t, projects)).join('\n');
  const activeTaskCount = tasks.filter(t => t.status !== 'DONE').length;

  // --- VELOCITY CALCULATION (MEMORY) ---
  // Calcul de la moyenne sur les 30 derniers jours
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const relevantLogs = history.filter(log => new Date(log.date) >= thirtyDaysAgo);
  const totalCompletedIn30Days = relevantLogs.reduce((sum, log) => sum + log.completedTasks, 0);
  // Moyenne par jour (en supposant 5 jours travaillés par semaine, ou brut divisé par nombre de jours loggués)
  const uniqueDaysLogged = new Set(relevantLogs.map(l => l.date.split('T')[0])).size || 1;
  const avgTasksPerDay = parseFloat((totalCompletedIn30Days / uniqueDaysLogged).toFixed(1));
  const avgTasksPerWeek = avgTasksPerDay * 5; // Estimation semaine ouvrée

  const velocityContext = history.length > 0 
    ? `CAPACITÉ PROUVÉE (MÉMOIRE) : L'utilisateur complète en moyenne ${avgTasksPerDay} tâches/jour (env. ${avgTasksPerWeek} tâches/semaine).`
    : `CAPACITÉ PROUVÉE : Pas d'historique (Nouvel utilisateur). Considère une capacité standard.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tu es un expert en charge cognitive et planification. Analyse cette liste de tâches pour la semaine.
      
      RÈGLES DE CALCUL DU SCORE (0-100) :
      
      1. ADAPTATION À L'HISTORIQUE (CRITIQUE) :
         - ${velocityContext}
         - Si le nombre de tâches actives (${activeTaskCount}) est inférieur ou égal à sa moyenne historique hebdo, le score DOIT baisser (ex: passer de Heavy à Balanced). L'utilisateur est habitué à ce rythme.
         - Si le nombre explose sa moyenne (> 150%), c'est un risque d'Overload réel.
      
      2. VOLUME vs INTENSITÉ : 
         - Si l'utilisateur a PEU de tâches (1 à 3), le score ne peut PAS dépasser 75% (Overload impossible), sauf si ce sont des projets titanesques.
      
      3. CONTEXTE PROJET :
         - Les projets "HIGH" ou domaines techniques (IT, Auto) ajoutent du poids mental.
      
      4. VISIBILITÉ :
         - Si des sous-tâches sont présentes, cela précise l'effort.

      ÉCHELLE :
      - 0-30 (Light) : Semaine légère par rapport à ses habitudes.
      - 31-60 (Balanced) : Dans sa moyenne de productivité (Zone de Flow).
      - 61-85 (Heavy) : Au-dessus de sa moyenne, challengeant.
      - 86-100 (Overload) : Irréaliste par rapport à son historique.

      Tasks (${activeTaskCount} tâches actives):
      ${taskSummaries}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Un score de 0 à 100. Adapté à la vélocité de l'utilisateur." },
            level: { type: Type.STRING, enum: ["Light", "Balanced", "Heavy", "Overload"] },
            advice: { type: Type.STRING, description: "Un conseil court (max 2 phrases) qui tient compte de s'il est au-dessus ou en-dessous de sa moyenne." }
          },
          required: ["score", "level", "advice"]
        }
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
  projects: Project[] = []
): Promise<WeeklyReportData | null> => {

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const plannedTasks = tasks.length;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentLogs = history.filter(log => new Date(log.date) >= oneWeekAgo);
  const totalFocusMinutes = Math.floor(recentLogs.reduce((acc, log) => acc + log.totalTime, 0) / (1000 * 60));

  // Determine Active Projects
  const activeProjectIds = new Set(tasks.map(t => t.projectId).filter(Boolean));
  const activeProjects = projects.filter(p => activeProjectIds.has(p.id)).map(p => `${p.title} (${p.priority || 'LOW'})`).join(', ');

  const promptData = {
    mentor: mentorId,
    user_context: userProfile ? {
        profile_type: userProfile.profilePrimary,
        primary_goal: userProfile.primaryGoal,
        constraints: userProfile.constraints
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
        "cognitive_load_level": "Level"
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
