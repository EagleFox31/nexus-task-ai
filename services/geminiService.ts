import { GoogleGenAI, Type } from "@google/genai";
import { Task, WorkloadAnalysis } from "../types";

// Initialize Gemini Client
// Utilisation de l'optional chaining (?.) pour éviter le crash si import.meta.env est indéfini
// Cela garantit que l'app se charge même si la configuration d'environnement échoue
const apiKey = import.meta.env?.VITE_API_KEY || "";

let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Erreur d'initialisation Gemini:", e);
  }
} else {
  console.warn("⚠️ Clé API Gemini (VITE_API_KEY) manquante. L'IA est désactivée.");
}

export const analyzeWorkload = async (tasks: Task[]): Promise<WorkloadAnalysis> => {
  if (!ai) {
      return { score: 0, level: 'Light', advice: "IA inactive. Ajoutez VITE_API_KEY dans les réglages Vercel pour activer l'analyse." };
  }

  if (tasks.length === 0) {
    return { score: 0, level: 'Light', advice: "Votre semaine est vide. C'est le moment idéal pour planifier des objectifs ambitieux." };
  }

  // Improved context: Include subtasks for accurate 'Adjusted' load calculation
  const taskSummaries = tasks.map(t => {
    let summary = `- ${t.title} (Priorité: ${t.priority}, Statut: ${t.status})`;
    if (t.subTasks && t.subTasks.length > 0) {
        summary += `\n    [Détail: ${t.subTasks.length} sous-tâches: ${t.subTasks.map(st => st.title).join(', ')}]`;
    }
    return summary;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyse cette liste de tâches hebdomadaire pour un professionnel.
      Si des sous-tâches sont présentes, considère-les comme une charge cognitive supplémentaire significative.
      
      Tasks:
      ${taskSummaries}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Un score de 0 à 100. Augmente le score si beaucoup de sous-tâches." },
            level: { type: Type.STRING, enum: ["Light", "Balanced", "Heavy", "Overload"] },
            advice: { type: Type.STRING, description: "Un conseil court (max 2 phrases) orienté productivité et gestion d'énergie." }
          },
          required: ["score", "level", "advice"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as WorkloadAnalysis;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Erreur Gemini Workload:", error);
    return { score: 50, level: 'Balanced', advice: "Impossible d'analyser la charge pour le moment." };
  }
};

export const breakDownTask = async (taskTitle: string, taskDescription: string): Promise<string[]> => {
  if (!ai) return ["Configuration Requise", "Ajoutez VITE_API_KEY", "Dans Vercel"];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Cette tâche est trop vague : "${taskTitle}". Description : "${taskDescription}".
      Découpe-la en 3 à 5 sous-tâches concrètes et actionnables pour une journée de travail.
      Réponds uniquement avec les titres des sous-tâches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as string[];
    }
    return ["Définir le périmètre", "Première ébauche", "Revue finale"];
  } catch (error) {
    console.error("Erreur Gemini Breakdown:", error);
    return [];
  }
};

export const suggestEvolution = async (task: Task): Promise<string> => {
    if (!ai) return "IA désactivée (Clé manquante)";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Agis comme un coach de productivité senior. Voici une tâche : "${task.title}".
            Suggère une évolution intelligente ou une meilleure façon d'aborder cette tâche pour maximiser l'impact ou gagner du temps.
            Sois concis (1 phrase).`,
        });
        return response.text || "Optimisez cette tâche en déléguant ou en automatisant.";
    } catch (error) {
        return "Concentre-toi sur l'essentiel.";
    }
}