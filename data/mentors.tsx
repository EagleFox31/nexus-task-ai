
// src/data/mentors.tsx
import type { MentorId, MentorProfile } from "../types";
import { Zap, Target, Brain, Box, Shield } from "lucide-react";
import type { ReactNode } from "react";

export const MENTOR_PROFILES = [
  {
    id: "aya_operator",
    name: "Aya N'Diaye",
    tagline: "The Operator",
    role: "Delivery & Exécution",
    color: "from-blue-600 to-cyan-500",
    description:
      "Vous avez trop de tâches en cours ? Aya vous aide à finir ce que vous commencez. Son mantra : « Done is better than perfect. » Elle transforme le chaos en liste claire d'actions.",
  },
  {
    id: "elias_strategist",
    name: "Dr. Elias Morel",
    tagline: "The Strategist",
    role: "ROI & Carrière",
    color: "from-emerald-600 to-teal-500",
    description:
      "Votre temps est précieux. Elias vous montre comment identifier les tâches qui comptent vraiment et abandonner celles qui vous font perdre du temps. Focus sur l'impact, pas l'activité.",
  },
  {
    id: "mina_deepwork",
    name: "Mina Kwon",
    tagline: "Deep Work",
    role: "Focus & Énergie",
    color: "from-violet-600 to-fuchsia-500",
    description:
      "Trop de distractions ? Mina vous apprend à protéger votre concentration. Elle vous guide pour créer des moments de travail profond où vous produisez votre meilleur travail.",
  },
  {
    id: "salma_systems",
    name: "Salma Benali",
    tagline: "Systems Thinker",
    role: "Automatisation & Ops",
    color: "from-orange-500 to-amber-500",
    description:
      "Marre de refaire les mêmes choses ? Salma vous montre comment automatiser, créer des templates et systématiser votre travail. Travaillez une fois, profitez à l'infini.",
  },
  {
    id: "kassi_stoic",
    name: "Jean-Baptiste Kassi",
    tagline: "Stoic Guardian",
    role: "Discipline & Limites",
    color: "from-slate-600 to-zinc-500",
    description:
      "Débordé par les demandes ? Jean-Baptiste Kassi vous aide à dire non sans culpabilité. Il renforce votre discipline et vous garde concentré sur vos vraies priorités, peu importe le chaos.",
  },
] as const satisfies readonly MentorProfile[];

export const MENTOR_ICONS: Record<MentorId, ReactNode> = {
  aya_operator: <Zap size={24} />,
  elias_strategist: <Target size={24} />,
  mina_deepwork: <Brain size={24} />,
  salma_systems: <Box size={24} />,
  kassi_stoic: <Shield size={24} />,
};
