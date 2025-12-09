
import { ProfileOption, GoalOption, ConstraintOption, FrustrationOption, WorkModeOption, TimeBudgetOption } from '../types';

export const PROFILES: { id: ProfileOption; label: { fr: string, en: string } }[] = [
    { id: 'student', label: { fr: 'Étudiant(e)', en: 'Student' } },
    { id: 'intern', label: { fr: 'Stagiaire / Alternant', en: 'Intern' } },
    { id: 'employee_ic', label: { fr: 'Salarié (Contributeur)', en: 'Employee (IC)' } },
    { id: 'employee_manager', label: { fr: 'Manager / Team Lead', en: 'Manager / Team Lead' } },
    { id: 'executive', label: { fr: 'Dirigeant / C-Level', en: 'Executive / C-Level' } },
    { id: 'freelance', label: { fr: 'Freelance', en: 'Freelancer' } },
    { id: 'founder', label: { fr: 'Fondateur / Entrepreneur', en: 'Founder' } },
    { id: 'solopreneur', label: { fr: 'Solopreneur / Créateur', en: 'Solopreneur / Creator' } },
    { id: 'public_sector', label: { fr: 'Secteur Public', en: 'Public Sector' } },
    { id: 'ngo_association', label: { fr: 'ONG / Association', en: 'NGO / Non-profit' } },
    { id: 'job_seeker', label: { fr: 'En recherche d\'emploi', en: 'Job Seeker' } },
    { id: 'career_switch', label: { fr: 'En reconversion', en: 'Career Switcher' } },
    { id: 'other', label: { fr: 'Autre', en: 'Other' } }
];

export const GOALS: { id: GoalOption; label: { fr: string, en: string } }[] = [
    { id: 'deliver_work_project', label: { fr: 'Boucler un gros projet pro', en: 'Ship a big work project' } },
    { id: 'certification_exam', label: { fr: 'Réussir un examen / certif', en: 'Pass an exam / cert' } },
    { id: 'build_portfolio', label: { fr: 'Construire mon portfolio', en: 'Build my portfolio' } },
    { id: 'grow_freelance_income', label: { fr: 'Augmenter mes revenus', en: 'Grow freelance income' } },
    { id: 'launch_or_scale_business', label: { fr: 'Lancer / Scaler un business', en: 'Launch / Scale business' } },
    { id: 'reduce_mental_load', label: { fr: 'Réduire ma charge mentale', en: 'Reduce mental load' } },
    { id: 'level_up_leadership', label: { fr: 'Prendre du leadership', en: 'Level up leadership' } },
    { id: 'get_hired', label: { fr: 'Trouver un emploi', en: 'Get hired' } },
    { id: 'personal_organization', label: { fr: 'Mieux m\'organiser (général)', en: 'Better organization (general)' } },
    { id: 'other', label: { fr: 'Autre', en: 'Other' } }
];

export const CONSTRAINTS: { id: ConstraintOption; label: { fr: string, en: string } }[] = [
    { id: 'low_time', label: { fr: 'Manque de temps (< 2h/jour)', en: 'Low time (< 2h/day)' } },
    { id: 'procrastination', label: { fr: 'Procrastination', en: 'Procrastination' } },
    { id: 'distractions', label: { fr: 'Distractions / Notifications', en: 'Distractions' } },
    { id: 'vague_tasks', label: { fr: 'Tâches floues', en: 'Vague tasks' } },
    { id: 'unplanned_interruptions', label: { fr: 'Imprévus constants', en: 'Constant interruptions' } },
    { id: 'mental_fatigue', label: { fr: 'Fatigue mentale', en: 'Mental fatigue' } },
    { id: 'prioritization', label: { fr: 'Difficulté à prioriser', en: 'Hard to prioritize' } },
    { id: 'too_repetitive_admin', label: { fr: 'Trop d\'administratif', en: 'Too much admin' } },
    { id: 'too_many_meetings', label: { fr: 'Trop de réunions', en: 'Too many meetings' } },
    { id: 'tool_sprawl', label: { fr: 'Outils dispersés', en: 'Tool sprawl' } }
];

export const FRUSTRATIONS: { id: FrustrationOption; label: { fr: string, en: string } }[] = [
    { id: 'start_not_finish', label: { fr: 'Je commence tout, je ne finis rien', en: 'Start everything, finish nothing' } },
    { id: 'lose_focus', label: { fr: 'Je perds ma concentration trop vite', en: 'Lose focus too fast' } },
    { id: 'drowning_in_admin', label: { fr: 'Je me noie sous l\'administratif', en: 'Drowning in admin' } },
    { id: 'cant_say_no', label: { fr: 'Je ne sais pas dire non', en: 'Can\'t say no' } },
    { id: 'low_visible_impact', label: { fr: 'Je bosse dur mais peu d\'impact', en: 'Work hard, low impact' } },
    { id: 'plans_always_explode', label: { fr: 'Mon planning explose toujours', en: 'Plans always explode' } },
    { id: 'none', label: { fr: 'Aucune', en: 'None' } }
];

export const WORKMODES: { id: WorkModeOption; label: { fr: string, en: string } }[] = [
    { id: 'deep_work_heavy', label: { fr: 'Focus Profond (Dev, Écriture...)', en: 'Deep Work (Dev, Writing...)' } },
    { id: 'ops_firefighting', label: { fr: 'Pompier (Support, Urgences)', en: 'Firefighting (Support)' } },
    { id: 'meetings_coordination', label: { fr: 'Coordination (Réunions, Mails)', en: 'Coordination (Meetings)' } },
    { id: 'mixed', label: { fr: 'Un peu de tout', en: 'Mixed' } }
];

export const TIMEBUDGETS: { id: TimeBudgetOption; label: { fr: string, en: string } }[] = [
    { id: '<5h', label: { fr: 'Moins de 5h', en: '< 5h' } },
    { id: '5-10h', label: { fr: '5 - 10h', en: '5 - 10h' } },
    { id: '10-20h', label: { fr: '10 - 20h', en: '10 - 20h' } },
    { id: '20h+', label: { fr: 'Plus de 20h', en: '20h+' } }
];
