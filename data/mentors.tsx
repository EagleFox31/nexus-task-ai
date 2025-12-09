
// src/data/mentors.tsx
import type { MentorId, MentorProfile } from "../types";
import { Zap, Target, Brain, Box, Shield } from "lucide-react";
import type { ReactNode } from "react";

export const MENTOR_PROFILES: MentorProfile[] = [
  {
    id: "aya_operator",
    name: "Aya N'Diaye",
    tagline: "The Operator",
    role: "Delivery & Exécution",
    color: "from-blue-600 to-cyan-500",
    themeColors: {
        50: "239 246 255", 
        100: "219 234 254", 
        200: "191 219 254", 
        300: "147 197 253", 
        400: "96 165 250", 
        500: "59 130 246", // Blue 500
        600: "37 99 235"
    },
    description: {
        fr: "Vous avez trop de tâches en cours ? Aya vous aide à finir ce que vous commencez. Son mantra : « Done is better than perfect. » Elle transforme le chaos en liste claire d'actions.",
        en: "Too many tasks in progress? Aya helps you finish what you start. Her mantra: 'Done is better than perfect.' She turns chaos into a clear action list."
    }
  },
  {
    id: "elias_strategist",
    name: "Dr. Elias Morel",
    tagline: "The Strategist",
    role: "ROI & Carrière",
    color: "from-emerald-600 to-teal-500",
    themeColors: {
        50: "236 253 245", 
        100: "209 250 229", 
        200: "167 243 208", 
        300: "110 231 183", 
        400: "52 211 153", 
        500: "16 185 129", // Emerald 500
        600: "5 150 105"
    },
    description: {
        fr: "Votre temps est précieux. Elias vous montre comment identifier les tâches qui comptent vraiment et abandonner celles qui vous font perdre du temps. Focus sur l'impact, pas l'activité.",
        en: "Your time is precious. Elias shows you how to identify tasks that matter and drop time-wasters. Focus on impact, not just activity."
    }
  },
  {
    id: "mina_deepwork",
    name: "Mina Kwon",
    tagline: "Deep Work",
    role: "Focus & Énergie",
    color: "from-violet-600 to-fuchsia-500",
    themeColors: {
        50: "245 243 255", 
        100: "237 233 254", 
        200: "221 214 254", 
        300: "196 181 253", 
        400: "167 139 250", 
        500: "139 92 246", // Violet 500
        600: "124 58 237"
    },
    description: {
        fr: "Trop de distractions ? Mina vous apprend à protéger votre concentration. Elle vous guide pour créer des moments de travail profond où vous produisez votre meilleur travail.",
        en: "Too many distractions? Mina teaches you to protect your focus. She guides you to create deep work sessions where you produce your best work."
    }
  },
  {
    id: "salma_systems",
    name: "Salma Benali",
    tagline: "Systems Thinker",
    role: "Automatisation & Ops",
    color: "from-orange-500 to-amber-500",
    themeColors: {
        50: "255 247 237", 
        100: "255 237 213", 
        200: "254 215 170", 
        300: "253 186 116", 
        400: "251 146 60", 
        500: "249 115 22", // Orange 500
        600: "234 88 12"
    },
    description: {
        fr: "Marre de refaire les mêmes choses ? Salma vous montre comment automatiser, créer des templates et systématiser votre travail. Travaillez une fois, profitez à l'infini.",
        en: "Tired of repeating tasks? Salma shows you how to automate, template, and systematize. Work once, benefit forever."
    }
  },
  {
    id: "kassi_stoic",
    name: "Jean-Baptiste Kassi",
    tagline: "Stoic Guardian",
    role: "Discipline & Limites",
    color: "from-slate-600 to-zinc-500",
    themeColors: {
        50: "241 245 249", 
        100: "226 232 240", 
        200: "203 213 225", 
        300: "148 163 184", 
        400: "100 116 139", 
        500: "71 85 105", // Slate 600ish (Darker base for stoic)
        600: "51 65 85"
    },
    description: {
        fr: "Débordé par les demandes ? Jean-Baptiste Kassi vous aide à dire non sans culpabilité. Il renforce votre discipline et vous garde concentré sur vos vraies priorités.",
        en: "Overwhelmed by requests? Kassi helps you say no without guilt. He strengthens your discipline and keeps you focused on true priorities."
    }
  },
];

export const MENTOR_ICONS: Record<MentorId, ReactNode> = {
  aya_operator: <Zap size={24} />,
  elias_strategist: <Target size={24} />,
  mina_deepwork: <Brain size={24} />,
  salma_systems: <Box size={24} />,
  kassi_stoic: <Shield size={24} />,
};
