import { GoogleGenAI, Type } from "@google/genai";
import { Task, WorkloadAnalysis } from "../types";

// Initialize Gemini Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWorkload = async (tasks: Task[]): Promise<WorkloadAnalysis> => {
  if (tasks.length === 0) {
    return { score: 0, level: 'Light', advice: "Votre semaine est vide. C'est le moment idéal pour planifier des objectifs ambitieux." };
  }

  const taskSummaries = tasks.map(t => `- ${t.title} (Priorité: ${t.priority}, Statut: ${t.status})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyse cette liste de tâches hebdomadaire. Estime la charge de travail globale pour un professionnel créatif.
      
      Tasks:
      ${taskSummaries}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Un score de 0 à 100, où 100 est une surcharge extrême." },
            level: { type: Type.STRING, enum: ["Light", "Balanced", "Heavy", "Overload"] },
            advice: { type: Type.STRING, description: "Un conseil court (max 2 phrases) motivant ou d'avertissement en français." }
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
    return { score: 50, level: 'Balanced', advice: "Impossible d'analyser la charge pour le moment. Vérifiez votre clé API." };
  }
};

export const breakDownTask = async (taskTitle: string, taskDescription: string): Promise<string[]> => {
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