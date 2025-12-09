
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Landing Page
  'hero.tag': { fr: 'La méthode des Top Performers', en: 'Top Performers Method' },
  'hero.title.1': { fr: 'Ne laissez plus votre', en: 'Stop letting your' },
  'hero.title.2': { fr: 'To-Do List vous écraser.', en: 'To-Do List crush you.' },
  'hero.subtitle': { 
    fr: "La plupart des gestionnaires de tâches ne sont que des listes de culpabilité. NexusTask est différent. Il analyse votre énergie, planifie pour vous et vous coache.", 
    en: "Most task managers are just guilt lists. NexusTask is different. It analyzes your energy, plans for you, and coaches you to finish what you start." 
  },
  'cta.start': { fr: 'Reprendre le contrôle', en: 'Take back control' },
  'cta.loading': { fr: 'Connexion...', en: 'Connecting...' },
  'cta.free': { fr: 'Démarrer Gratuitement', en: 'Start for Free' },
  'privacy': { fr: 'Pas de carte bancaire requise • Données privées', en: 'No credit card required • Private data' },
  'why.title': { fr: 'Pourquoi changer ?', en: 'Why switch?' },
  'why.subtitle': { fr: "Arrêtez d'utiliser des outils qui augmentent votre anxiété.", en: 'Stop using tools that increase your anxiety.' },
  
  // Comparison
  'comp.old': { fr: 'Les autres Apps', en: 'Other Apps' },
  'comp.old.1.t': { fr: 'Listes infinies', en: 'Endless Lists' },
  'comp.old.1.d': { fr: 'Une accumulation de tâches qui génère de la culpabilité.', en: 'Piles of tasks generating guilt.' },
  'comp.old.2.t': { fr: 'Planification manuelle', en: 'Manual Planning' },
  'comp.old.2.d': { fr: 'Vous passez plus de temps à organiser qu\'à faire.', en: 'You spend more time organizing than doing.' },
  'comp.new.1.t': { fr: 'Tri Intelligent', en: 'Smart Triage' },
  'comp.new.1.d': { fr: "L'IA sépare l'essentiel du bruit.", en: 'AI separates signal from noise.' },
  'comp.new.2.t': { fr: 'Planification Auto', en: 'Auto Planning' },
  'comp.new.3.t': { fr: 'Protection Cognitive', en: 'Cognitive Protection' },

  // Benefits
  'ben.burnout.t': { fr: 'Fini le Burnout', en: 'No More Burnout' },
  'ben.burnout.d': { fr: 'Votre jauge de Charge Mentale se met à jour en temps réel.', en: 'Your Mental Load gauge updates in real-time.' },
  'ben.clarity.t': { fr: 'Clarté Immédiate', en: 'Instant Clarity' },
  'ben.clarity.d': { fr: 'Transformez un projet flou en plan de bataille.', en: 'Turn vague projects into a battle plan.' },
  'ben.coach.t': { fr: 'Coaching Expert', en: 'Expert Coaching' },
  'ben.coach.d': { fr: 'Recevez un rapport hebdomadaire digne d\'un consultant.', en: 'Get a weekly report worthy of a consultant.' },

  // App Header
  'nav.cloud': { fr: 'Cloud', en: 'Cloud' },
  'nav.offline': { fr: 'Offline', en: 'Offline' },
  'nav.report': { fr: 'Rapport Hebdo', en: 'Weekly Report' },
  'nav.coach': { fr: 'Coach', en: 'Coach' },

  // Dashboard
  'dash.daily': { fr: 'Suivi Journalier', en: 'Daily Tracking' },
  'dash.ready': { fr: 'Prêt à commencer ?', en: 'Ready to start?' },
  'dash.paused': { fr: 'Session en pause', en: 'Session paused' },
  'dash.focus': { fr: 'Focus activé', en: 'Focus active' },
  'dash.load': { fr: 'Charge Cognitive', en: 'Cognitive Load' },
  'dash.analyze': { fr: 'Analyser', en: 'Analyze' },
  'dash.projects': { fr: 'Projets', en: 'Projects' },
  'dash.planning': { fr: 'Planification', en: 'Planning' },
  'dash.completed': { fr: 'complété', en: 'completed' },
  'dash.empty': { fr: 'Semaine Vide ?', en: 'Empty Week?' },
  'dash.empty.sub': { fr: 'Allez dans "Planification" pour ajouter des tâches.', en: 'Go to "Planning" to add tasks.' },
  
  // Inputs
  'input.newtask': { fr: 'Nouvelle tâche...', en: 'New task...' },
  'btn.add': { fr: 'Ajouter', en: 'Add' },
  'filter.all': { fr: 'Tout', en: 'All' },

  // Planning Page
  'plan.title': { fr: 'Planification Hebdo', en: 'Weekly Planning' },
  'plan.close': { fr: 'Clôturer la Semaine', en: 'Close Week' },
  'plan.budget': { fr: 'BUDGET TEMPS', en: 'TIME BUDGET' },
  'plan.inbox': { fr: 'INBOX', en: 'INBOX' },
  'plan.projects': { fr: 'PROJETS', en: 'PROJECTS' },
  'plan.empty.bucket': { fr: 'Rien ici pour le moment.', en: 'Nothing here yet.' },
  'plan.week.title': { fr: 'Semaine Active', en: 'Active Week' },
  'plan.week.empty.title': { fr: 'Votre semaine est vide', en: 'Your week is empty' },
  'plan.week.empty.desc': { fr: 'Glissez des tâches depuis l\'Inbox ou vos Projets pour construire votre plan.', en: 'Drag tasks from Inbox or Projects to build your plan.' },
  'plan.theme.placeholder': { fr: 'Définir un thème (ex: Focus Produit)', en: 'Set a theme (ex: Product Focus)' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nexus_lang');
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });

  useEffect(() => {
    localStorage.setItem('nexus_lang', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
