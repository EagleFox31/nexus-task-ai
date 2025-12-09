

import type {
  MentorId,
  ProfileOption,
  GoalOption,
  ConstraintOption,
  FrustrationOption,
  WorkModeOption,
  TimeBudgetOption,
  RecommendationResult,
} from "../types";

// --- CONFIGURATION : POIDS DES ARBRES ---
const TREE_WEIGHTS = {
  profilePrimary: 1.30,
  profileSecondary: 0.60,
  goal: 1.55,
  constraints: 1.55,
  frustration: 1.20,
  workMode: 1.05,
  timeBudget: 0.85,
} as const;

// --- CONFIGURATION : MAPS DE VOTES (Phrases Humanisées) ---
interface Vote {
  m: MentorId;
  w: number;
  r: string;
}

const PROFILE_VOTES: Record<ProfileOption, Vote[]> = {
  student: [
    { m: "mina_deepwork", w: 1.10, r: "Vos études exigent une capacité de concentration intense et régulière." },
    { m: "aya_operator", w: 0.70, r: "Il est crucial d'apprendre à livrer vos devoirs et projets sans attendre la dernière minute." },
  ],
  intern: [
    { m: "aya_operator", w: 1.00, r: "En stage, votre capacité à exécuter rapidement et à vous adapter est votre meilleur atout." },
    { m: "mina_deepwork", w: 0.70, r: "Vous devez absorber une grande quantité d'informations en peu de temps." },
    { m: "elias_strategist", w: 0.45, r: "C'est le moment idéal pour commencer à définir votre positionnement professionnel." },
  ],
  employee_ic: [
    { m: "aya_operator", w: 0.95, r: "Votre poste demande une exécution fluide et des résultats visibles au quotidien." },
    { m: "elias_strategist", w: 0.85, r: "Il est important de savoir prioriser les tâches qui ont un réel impact sur l'entreprise." },
    { m: "mina_deepwork", w: 0.20, r: "Protéger votre temps de concentration est un défi constant en open-space ou en télétravail." },
  ],
  employee_manager: [
    { m: "elias_strategist", w: 1.05, r: "Le management exige des arbitrages constants pour maximiser l'impact de l'équipe." },
    { m: "kassi_stoic", w: 0.80, r: "Vous devez poser des limites claires pour ne pas être submergé par les demandes de votre équipe." },
    { m: "aya_operator", w: 0.40, r: "Maintenir la cadence d'exécution de l'équipe est vital pour la réussite des projets." },
    { m: "salma_systems", w: 0.25, r: "Des rituels d'équipe bien huilés vous sauveront un temps précieux." },
  ],
  executive: [
    { m: "elias_strategist", w: 1.20, r: "Diriger nécessite une vision stratégique claire et des décisions tranchées." },
    { m: "kassi_stoic", w: 1.00, r: "Votre gouvernance personnelle doit être inébranlable face à la pression." },
    { m: "salma_systems", w: 0.60, r: "Déléguer via des systèmes robustes est la seule façon de passer à l'échelle." },
  ],
  freelance: [
    { m: "elias_strategist", w: 1.10, r: "En freelance, votre priorité absolue doit être la rentabilité et la valeur perçue par le client." },
    { m: "salma_systems", w: 0.80, r: "Créer des processus réutilisables augmentera votre marge horaire drastiquement." },
    { m: "aya_operator", w: 0.70, r: "La régularité et la vitesse des livraisons sont ce qui fidélise vos clients." },
  ],
  founder: [
    { m: "salma_systems", w: 1.20, r: "Un fondateur doit construire des systèmes pour pouvoir s'extraire de l'opérationnel." },
    { m: "elias_strategist", w: 0.95, r: "Vous ne pouvez pas tout faire : la stratégie doit primer sur l'exécution pure." },
    { m: "aya_operator", w: 0.60, r: "Au démarrage, seule l'exécution terrain valide votre marché (Do things that don't scale)." },
  ],
  solopreneur: [
    { m: "salma_systems", w: 1.00, r: "Seul, l'automatisation est votre principal levier de croissance (Clonez-vous)." },
    { m: "mina_deepwork", w: 0.60, r: "La création de valeur (produit/contenu) demande des blocs de travail profond ininterrompus." },
    { m: "elias_strategist", w: 0.65, r: "Il faut maximiser l'effet de levier de chaque action car votre temps est limité." },
  ],
  public_sector: [
    { m: "salma_systems", w: 0.95, r: "L'administratif lourd se gère mieux avec des templates et des procédures strictes." },
    { m: "aya_operator", w: 0.70, r: "Fluidifier l'exécution est essentiel pour avancer dans un environnement complexe." },
    { m: "kassi_stoic", w: 0.60, r: "La patience et la discipline sont vos atouts majeurs face à l'inertie institutionnelle." },
  ],
  ngo_association: [
    { m: "elias_strategist", w: 0.80, r: "Maximiser l'impact social avec peu de ressources demande une priorisation impitoyable." },
    { m: "aya_operator", w: 0.75, r: "La coordination des bénévoles et des actions nécessite une organisation carrée." },
    { m: "kassi_stoic", w: 0.55, r: "Garder le cap et la motivation malgré le manque de moyens demande du stoïcisme." },
  ],
  career_switch: [
    { m: "mina_deepwork", w: 0.85, r: "Apprendre un nouveau métier demande une concentration totale et une grande plasticité cérébrale." },
    { m: "aya_operator", w: 0.85, r: "Il faut produire des projets concrets rapidement pour prouver votre valeur aux recruteurs." },
    { m: "elias_strategist", w: 0.55, r: "Votre trajectoire de reconversion doit être planifiée stratégiquement." },
  ],
  job_seeker: [
    { m: "elias_strategist", w: 1.25, r: "La recherche d'emploi est une campagne marketing stratégique de vous-même." },
    { m: "aya_operator", w: 0.80, r: "Traiter les candidatures comme une production industrielle : volume et régularité." },
    { m: "mina_deepwork", w: 0.55, r: "La préparation des entretiens et des tests demande du focus." },
  ],
  other: [
    { m: "aya_operator", w: 0.25, r: "Structurer votre approche par l'action vous aidera à y voir plus clair." },
    { m: "elias_strategist", w: 0.25, r: "Clarifier vos priorités est un bon point de départ." },
    { m: "mina_deepwork", w: 0.25, r: "Protéger votre attention est toujours bénéfique, peu importe le contexte." },
    { m: "salma_systems", w: 0.25, r: "Mettre en place des habitudes stables est universellement utile." },
    { m: "kassi_stoic", w: 0.25, r: "Instaurer une discipline quotidienne est la base de tout progrès." },
  ],
  none: [],
};

const GOAL_VOTES: Record<GoalOption, Vote[]> = {
  certification_exam: [
    { m: "mina_deepwork", w: 1.25, r: "Réussir un examen complexe exige des sessions de révision ininterrompues (Deep Work)." },
    { m: "aya_operator", w: 0.65, r: "Un plan de révision efficace s'exécute jour après jour, sans faille." },
  ],
  deliver_work_project: [
    { m: "aya_operator", w: 1.05, r: "Pour livrer ce projet, il faut arrêter de réfléchir et passer en mode 'exécution massive'." },
    { m: "elias_strategist", w: 0.95, r: "Assurez-vous que ce livrable serve réellement vos objectifs à long terme." },
    { m: "salma_systems", w: 0.70, r: "La qualité du rendu final dépendra de la rigueur de votre processus de production." },
  ],
  build_portfolio: [
    { m: "aya_operator", w: 0.95, r: "Un portfolio ne vaut rien s'il n'est pas terminé : il faut 'shipper' (livrer) vos créations." },
    { m: "elias_strategist", w: 0.90, r: "Votre portfolio doit raconter une histoire stratégique qui cible vos clients idéaux." },
  ],
  grow_freelance_income: [
    { m: "elias_strategist", w: 1.20, r: "Augmenter ses revenus demande de repenser votre pricing et votre offre, pas juste travailler plus." },
    { m: "salma_systems", w: 0.75, r: "Optimiser votre production pour facturer plus en passant moins de temps par projet." },
    { m: "aya_operator", w: 0.55, r: "Livrer plus vite permet d'encaisser plus vite et d'augmenter votre volume." },
  ],
  launch_or_scale_business: [
    { m: "salma_systems", w: 1.15, r: "Un business qui scale est un business qui ne dépend pas de votre présence 24/7." },
    { m: "elias_strategist", w: 1.00, r: "Chaque décision doit être un pari stratégique calculé (Asymétrie du risque)." },
  ],
  reduce_mental_load: [
    { m: "mina_deepwork", w: 0.95, r: "Réduire la charge mentale passe par une meilleure gestion de votre attention et des interruptions." },
    { m: "kassi_stoic", w: 0.95, r: "Apprendre à dire non et poser des limites claires est le seul remède durable." },
    { m: "aya_operator", w: 0.45, r: "Sortir les idées de votre tête pour les mettre dans un système fiable libère l'esprit." },
  ],
  level_up_leadership: [
    { m: "elias_strategist", w: 1.05, r: "Le leadership, c'est savoir arbitrer, déléguer et influencer la stratégie." },
    { m: "kassi_stoic", w: 0.90, r: "La constance émotionnelle et la maîtrise de soi inspirent naturellement le respect." },
  ],
  get_hired: [
    { m: "elias_strategist", w: 1.25, r: "Se faire embaucher demande de se positionner comme la solution idéale à un problème d'entreprise." },
    { m: "aya_operator", w: 0.70, r: "Il faut maintenir une cadence élevée de candidatures et de relances." },
    { m: "mina_deepwork", w: 0.45, r: "Préparer vos entretiens demande une recherche approfondie et du focus." },
  ],
  personal_organization: [
    { m: "aya_operator", w: 0.70, r: "L'organisation commence par l'action. Une to-do list imparfaite vaut mieux qu'un plan parfait." },
    { m: "kassi_stoic", w: 0.75, r: "La discipline quotidienne bat les outils complexes sur le long terme." },
    { m: "salma_systems", w: 0.75, r: "Des systèmes simples et répétables sont plus faciles à maintenir que la volonté pure." },
    { m: "mina_deepwork", w: 0.35, r: "Une bonne organisation a pour seul but de protéger votre attention." },
  ],
  other: [
    { m: "aya_operator", w: 0.25, r: "Focus sur l'action concrète." },
    { m: "elias_strategist", w: 0.25, r: "Focus sur la vision long terme." },
    { m: "mina_deepwork", w: 0.25, r: "Focus sur la concentration." },
    { m: "salma_systems", w: 0.25, r: "Focus sur les méthodes." },
    { m: "kassi_stoic", w: 0.25, r: "Focus sur la résilience." },
  ],
};

const CONSTRAINT_VOTES: Record<ConstraintOption, Vote[]> = {
  low_time: [
    { m: "elias_strategist", w: 0.95, r: "Peu de temps ? La priorisation radicale (80/20) est votre seule option viable." },
    { m: "salma_systems", w: 0.85, r: "Si vous manquez de temps, automatisez tout ce qui peut l'être pour gagner de précieuses minutes." },
    { m: "aya_operator", w: 0.55, r: "Il faut optimiser chaque créneau disponible pour agir sans hésiter." },
  ],
  procrastination: [
    { m: "kassi_stoic", w: 1.35, r: "Le stoïcisme est l'antidote idéal à la procrastination émotionnelle (peur, ennui)." },
    { m: "mina_deepwork", w: 0.70, r: "Des rituels de démarrage précis vous aideront à surmonter la friction initiale." },
  ],
  distractions: [
    { m: "mina_deepwork", w: 1.45, r: "Contre les distractions, il faut reconstruire votre 'muscle' de l'attention progressivement." },
    { m: "kassi_stoic", w: 0.55, r: "Posez des règles strictes pour protéger votre environnement de travail." },
  ],
  vague_tasks: [
    { m: "aya_operator", w: 1.05, r: "Le flou paralyse. Il faut découper chaque tâche vague en actions physiques concrètes." },
    { m: "salma_systems", w: 0.95, r: "Utilisez des templates pour transformer le flou en checklist standardisée." },
  ],
  unplanned_interruptions: [
    { m: "aya_operator", w: 0.95, r: "Face aux imprévus, il faut savoir trier rapidement et ajuster le tir sans état d'âme." },
    { m: "kassi_stoic", w: 0.95, r: "Acceptez le chaos extérieur avec calme, mais gardez votre ordre intérieur." },
  ],
  mental_fatigue: [
    { m: "mina_deepwork", w: 0.95, r: "La fatigue signale un besoin de mieux gérer votre énergie cognitive, pas votre temps." },
    { m: "kassi_stoic", w: 0.95, r: "Respectez vos limites physiologiques sans culpabilité, c'est une preuve de sagesse." },
  ],
  prioritization: [
    { m: "elias_strategist", w: 1.30, r: "Tout ne se vaut pas. Il faut apprendre à identifier le 20% d'actions qui apporte 80% des résultats." },
    { m: "aya_operator", w: 0.45, r: "Nettoyer votre liste de tâches et jeter le superflu aidera à y voir plus clair." },
  ],
  too_repetitive_admin: [
    { m: "salma_systems", w: 1.45, r: "Les tâches répétitives sont des candidates parfaites pour l'automatisation ou la délégation." },
    { m: "aya_operator", w: 0.30, r: "Groupez ces tâches en blocs (Batching) pour les expédier plus vite." },
  ],
  too_many_meetings: [
    { m: "elias_strategist", w: 1.15, r: "Trop de réunions ? Il faut questionner leur utilité stratégique et refuser les inutiles." },
    { m: "mina_deepwork", w: 0.70, r: "Il est vital de sanctuariser des plages horaires sans réunions pour avancer." },
    { m: "aya_operator", w: 0.35, r: "Faites le tri pour libérer du temps de production réelle." },
    { m: "kassi_stoic", w: 0.25, r: "Savoir dire 'non' à une invitation est une compétence professionnelle indispensable." },
  ],
  tool_sprawl: [
    { m: "salma_systems", w: 1.25, r: "Simplifiez votre stack d'outils pour centraliser l'information en un seul endroit fiable." },
    { m: "aya_operator", w: 0.40, r: "L'outil importe peu, seule l'exécution compte. Revenez aux basiques." },
    { m: "elias_strategist", w: 0.25, r: "La complexité des outils nuit à votre clarté stratégique. Simplifiez." },
  ],
};

const FRUSTRATION_VOTES: Record<FrustrationOption, Vote[]> = {
  start_not_finish: [
    { m: "aya_operator", w: 1.20, r: "Vous commencez trop de choses. On va se concentrer sur 'finir' avant de commencer autre chose." },
    { m: "kassi_stoic", w: 0.60, r: "Tenir ses engagements envers soi-même est une question de discipline personnelle." },
  ],
  lose_focus: [{ m: "mina_deepwork", w: 1.25, r: "Votre frustration vient d'une attention fragmentée. On va réparer votre capacité de focus." }],
  drowning_in_admin: [{ m: "salma_systems", w: 1.20, r: "La gestion administrative ne devrait pas vous noyer. On va la mettre en boîte et l'automatiser." }],
  cant_say_no: [
    { m: "kassi_stoic", w: 1.10, r: "Dire 'oui' à tout, c'est dire 'non' à vos propres priorités. Il faut inverser ça." },
    { m: "elias_strategist", w: 0.55, r: "Chaque engagement a un coût d'opportunité que vous ne pouvez plus ignorer." },
  ],
  low_visible_impact: [
    { m: "elias_strategist", w: 1.25, r: "Travailler dur ne suffit pas. Il faut travailler sur les bonnes choses (Leverage)." },
    { m: "aya_operator", w: 0.25, r: "Rendre votre travail visible par des livrables fréquents augmentera votre impact perçu." },
  ],
  plans_always_explode: [
    { m: "kassi_stoic", w: 0.90, r: "Si tout explose, c'est que vous résistez à la réalité. Adaptez-vous avec calme." },
    { m: "aya_operator", w: 0.80, r: "Arrêtez de planifier l'idéal, gérez le réel. Prévoyez de la marge." },
  ],
  none: [
    { m: "aya_operator", w: 0.10, r: "Votre profil est équilibré, focus sur l'action." },
    { m: "elias_strategist", w: 0.10, r: "Votre profil est équilibré, focus sur la stratégie." },
    { m: "mina_deepwork", w: 0.10, r: "Votre profil est équilibré, focus sur la profondeur." },
    { m: "salma_systems", w: 0.10, r: "Votre profil est équilibré, focus sur l'organisation." },
    { m: "kassi_stoic", w: 0.10, r: "Votre profil est équilibré, focus sur la discipline." },
  ],
};

const WORKMODE_VOTES: Record<WorkModeOption, Vote[]> = {
  deep_work_heavy: [
    { m: "mina_deepwork", w: 0.85, r: "Votre mode de travail naturel est le Deep Work, il faut le protéger." },
    { m: "aya_operator", w: 0.55, r: "Même le travail profond a besoin d'une cadence de sortie régulière." },
  ],
  ops_firefighting: [
    { m: "aya_operator", w: 0.85, r: "En mode pompier, l'efficacité opérationnelle et la vitesse sont votre survie." },
    { m: "kassi_stoic", w: 0.55, r: "Il faut garder la tête froide et les émotions stables dans l'urgence." },
  ],
  meetings_coordination: [
    { m: "elias_strategist", w: 0.95, r: "La coordination demande une vision claire des enjeux pour ne pas se disperser." },
    { m: "aya_operator", w: 0.35, r: "Ne laissez pas les réunions stopper la production. Gardez du temps pour 'faire'." },
    { m: "kassi_stoic", w: 0.25, r: "Protégez votre temps personnel au milieu de toutes ces interactions." },
  ],
  mixed: [
    { m: "aya_operator", w: 0.35, r: "Pour gérer un peu de tout, il faut une structure flexible orientée action." },
    { m: "elias_strategist", w: 0.35, r: "Arbitrez en permanence selon la valeur de la tâche, ne subissez pas." },
    { m: "mina_deepwork", w: 0.25, r: "Trouvez des îlots de calme dans la tempête pour avancer sur le fond." },
    { m: "salma_systems", w: 0.25, r: "Identifiez les récurrences pour vous soulager mentalement." },
    { m: "kassi_stoic", w: 0.20, r: "Restez constant peu importe la météo de votre journée." },
  ],
};

const TIMEBUDGET_VOTES: Record<TimeBudgetOption, Vote[]> = {
  "<5h": [
    { m: "elias_strategist", w: 0.75, r: "Avec très peu de temps, l'erreur de priorisation coûte très cher." },
    { m: "salma_systems", w: 0.35, r: "Automatisez le maximum pour gagner de précieuses minutes." },
  ],
  "5-10h": [
    { m: "aya_operator", w: 0.45, r: "Un créneau court demande une mise en action immédiate, sans procrastination." },
    { m: "mina_deepwork", w: 0.45, r: "Faites de ces heures des heures de haute qualité (Focus total)." },
  ],
  "10-20h": [
    { m: "aya_operator", w: 0.45, r: "C'est un bon volume pour construire une régularité de production." },
    { m: "mina_deepwork", w: 0.35, r: "Vous avez l'espace pour du travail de fond, profitez-en." },
  ],
  "20h+": [
    { m: "salma_systems", w: 0.35, r: "Avec ce volume, vous devez construire des systèmes durables pour ne pas vous épuiser." },
    { m: "aya_operator", w: 0.35, r: "Attention à ne pas remplir le temps vide : restez efficace (Loi de Parkinson)." },
  ],
};

// --- ALGORITHME DE RECOMMANDATION ---

export interface CalcInputs {
  profilePrimary: ProfileOption;
  profileSecondary?: ProfileOption[]; 
  secondaryWeight: number;
  goal: GoalOption;
  constraints: ConstraintOption[];
  frustration: FrustrationOption;
  workMode: WorkModeOption;
  timeBudget: TimeBudgetOption;
}


const MENTORS: MentorId[] = [
  "aya_operator",
  "elias_strategist",
  "mina_deepwork",
  "salma_systems",
  "kassi_stoic",
];

const softmax = (scores: Record<MentorId, number>): Record<MentorId, number> => {
  const vals = MENTORS.map((m) => scores[m]);
  const max = Math.max(...vals);
  const exps = vals.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);

  const out = {} as Record<MentorId, number>;
  MENTORS.forEach((m, i) => (out[m] = sum > 0 ? exps[i] / sum : 1 / MENTORS.length));
  return out;
};

export const calculateMentorRecommendation = (inputs: CalcInputs): RecommendationResult => {
  const scores: Record<MentorId, number> = {
    aya_operator: 0,
    elias_strategist: 0,
    mina_deepwork: 0,
    salma_systems: 0,
    kassi_stoic: 0,
  };

  const reasons: { m: MentorId; w: number; r: string; src: string }[] = [];

  const processVotes = (votes: Vote[] | undefined, treeWeight: number, modifier = 1, src = "unknown") => {
    if (!votes?.length) return;
    votes.forEach((vote) => {
      const finalWeight = vote.w * treeWeight * modifier;
      scores[vote.m] += finalWeight;
      reasons.push({ m: vote.m, w: finalWeight, r: vote.r, src });
    });
  };

  // clamp safety
  const secondaryWeight = Math.max(0, Math.min(0.5, inputs.secondaryWeight)); // 0..0.5
  const constraints = inputs.constraints.slice(0, 2);

  // 1) Profile primary
  if (inputs.profilePrimary !== "none") {
    processVotes(PROFILE_VOTES[inputs.profilePrimary], TREE_WEIGHTS.profilePrimary, 1, "profilePrimary");
  }

  // 2) Profile secondary (max 2)
  const secondaryProfiles: ProfileOption[] = inputs.profileSecondary || [];

  if (secondaryProfiles.length) {
    secondaryProfiles
      .filter(p => p && p !== "none" && p !== inputs.profilePrimary)
      .slice(0, 2)
      .forEach(p => {
        processVotes(PROFILE_VOTES[p], TREE_WEIGHTS.profileSecondary, secondaryWeight, "profileSecondary");
      });
  }

  // 3) Goal
  processVotes(GOAL_VOTES[inputs.goal], TREE_WEIGHTS.goal, 1, "goal");

  // 4) Constraints (1..2)
  constraints.forEach((c) => processVotes(CONSTRAINT_VOTES[c], TREE_WEIGHTS.constraints, 1, "constraints"));

  // 5) Frustration
  processVotes(FRUSTRATION_VOTES[inputs.frustration], TREE_WEIGHTS.frustration, 1, "frustration");

  // 6) WorkMode
  processVotes(WORKMODE_VOTES[inputs.workMode], TREE_WEIGHTS.workMode, 1, "workMode");

  // 7) TimeBudget
  processVotes(TIMEBUDGET_VOTES[inputs.timeBudget], TREE_WEIGHTS.timeBudget, 1, "timeBudget");

  // Winner
  const probs = softmax(scores);
  const sortedMentors = [...MENTORS].sort((a, b) => probs[b] - probs[a]);
  const winner = sortedMentors[0];

  // Confidence
  const topProb = probs[winner];
  let confidence: "High" | "Medium" | "Low" = "Medium";
  if (topProb >= 0.55) confidence = "High";
  else if (topProb < 0.40) confidence = "Low";

  // Top 3 reasons for winner
  const winnerReasons = reasons
    .filter((r) => r.m === winner)
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .map((r) => r.r);

  return {
    mentorId: winner,
    confidence,
    reasons: Array.from(new Set(winnerReasons)),
    scores,
  };
};

/**
 * Récupère les raisons spécifiques pour lesquelles un mentor (même non recommandé)
 * a reçu des points. Utilisé pour l'affichage "Analyse Comparative".
 */
export const getMentorStrengths = (mentorId: MentorId, inputs: CalcInputs): string[] => {
    // On relance une simulation de vote légère pour extraire les raisons
    const reasons: { w: number; r: string }[] = [];

    const check = (votes: Vote[] | undefined) => {
        if (!votes) return;
        const match = votes.find(v => v.m === mentorId);
        if (match) reasons.push({ w: match.w, r: match.r });
    };

    if (inputs.profilePrimary !== "none") check(PROFILE_VOTES[inputs.profilePrimary]);
    inputs.profileSecondary?.forEach(p => check(PROFILE_VOTES[p]));
    check(GOAL_VOTES[inputs.goal]);
    inputs.constraints.slice(0, 2).forEach(c => check(CONSTRAINT_VOTES[c]));
    check(FRUSTRATION_VOTES[inputs.frustration]);
    
    // On retourne les 3 meilleures raisons
    return reasons
        .sort((a, b) => b.w - a.w)
        .slice(0, 3)
        .map(x => x.r);
};

/**
 * Génère une "mise en garde" spécifique basée sur le conflit entre :
 * - Ce que l'utilisateur DEVRAIT faire (Recommandé)
 * - Ce que l'utilisateur VEUT faire (Sélectionné)
 */
export const getComparisonCaveat = (selectedId: MentorId, recommendedId: MentorId): string => {
    // Si c'est le même, pas de caveat
    if (selectedId === recommendedId) return "";

    const matrix: Record<MentorId, Partial<Record<MentorId, string>>> = {
        // --- SI L'IA RECOMMANDE AYA (ACTION) MAIS VOUS CHOISISSEZ... ---
        aya_operator: {
            elias_strategist: "Votre profil réclame de l'action immédiate. Avec Elias, le risque est d'intellectualiser vos tâches pour éviter de les faire (Paralysie par l'analyse).",
            mina_deepwork: "Vous avez besoin de volume et de vitesse. Avec Mina, le risque est de vous isoler pour peaufiner des détails qui n'ont pas encore d'importance.",
            salma_systems: "Vous devez faire le travail manuel d'abord. Avec Salma, le risque est de passer la semaine à configurer l'outil parfait sans rien livrer (Optimisation prématurée).",
            kassi_stoic: "Vous avez besoin d'attaquer vos tâches. Avec Jean-Baptiste Kassi, le risque est d'être trop passif ou dans l'acceptation, alors que la situation demande du mouvement.",
        },
        // --- SI L'IA RECOMMANDE ELIAS (STRATEGIE) MAIS VOUS CHOISISSEZ... ---
        elias_strategist: {
            aya_operator: "Vous manquez de direction claire. Avec Aya, le risque est de courir très vite... mais dans la mauvaise direction (Agitation stérile).",
            mina_deepwork: "Le focus est bien, mais sur quoi ? Sans la vision d'Elias, vous risquez de travailler dur sur des tâches à faible valeur ajoutée.",
            salma_systems: "Automatiser le chaos ne crée pas de l'ordre. Vous devez d'abord définir la stratégie avant de construire les systèmes de Salma.",
            kassi_stoic: "La discipline ne remplace pas la vision. Dire 'non' (Jean-Baptiste Kassi) est utile, mais il faut d'abord savoir à quoi dire 'oui' (Elias).",
        },
        // --- SI L'IA RECOMMANDE MINA (DEEP WORK) MAIS VOUS CHOISISSEZ... ---
        mina_deepwork: {
            aya_operator: "Votre cerveau est fatigué ou fragmenté. Avec Aya, vous allez multiplier les petites tâches et aggraver votre charge mentale sans jamais avancer sur le fond.",
            elias_strategist: "Planifier (Elias) peut devenir une forme de procrastination sophistiquée pour éviter la douleur du travail difficile (Deep Work).",
            salma_systems: "Chercher l'outil parfait (Salma) est souvent une fuite devant l'effort mental nécessaire. Aucun système ne fera le travail de concentration à votre place.",
            kassi_stoic: "Se forcer avec discipline (Jean-Baptiste Kassi) sans respecter votre rythme cognitif (Mina) mène souvent à l'épuisement plutôt qu'à la productivité.",
        },
        // --- SI L'IA RECOMMANDE SALMA (SYSTEMES) MAIS VOUS CHOISISSEZ... ---
        salma_systems: {
            aya_operator: "Vous vous noyez dans le répétitif. Faire plus vite (Aya) ne règle pas le problème : vous devez construire le tuyau, pas juste porter l'eau plus vite.",
            elias_strategist: "Avoir de grandes idées (Elias) sans processus d'exécution (Salma) crée du chaos. L'intendance ne suivra pas.",
            mina_deepwork: "Le Deep Work ne suffit pas si tout s'effondre quand vous n'êtes pas là. Vous avez besoin de processus délégables, pas juste de concentration.",
            kassi_stoic: "Supporter la douleur du chaos administratif avec stoïcisme (Jean-Baptiste Kassi) n'est pas une solution durable. Organisez le chaos.",
        },
        // --- SI L'IA RECOMMANDE KASSI (STOICISME/LIMITES) MAIS VOUS CHOISISSEZ... ---
        kassi_stoic: {
            aya_operator: "Vous êtes déjà débordé. En faire plus (Aya) va accélérer votre burnout. Vous avez besoin de freins, pas d'un accélérateur.",
            elias_strategist: "Rationaliser (Elias) pourquoi on accepte tout ne change rien au problème. Il faut savoir dire non fermement, pas juste y réfléchir.",
            mina_deepwork: "S'isoler (Mina) ne règle pas le problème des interruptions si vous ne posez pas de limites claires aux autres (Jean-Baptiste Kassi).",
            salma_systems: "Un nouvel outil (Salma) ne résoudra pas un problème de limites personnelles. C'est un problème humain, pas technique.",
        }
    };

    return matrix[recommendedId]?.[selectedId] || "Ce mentor a une approche très différente de celle suggérée par votre profil. Assurez-vous que cela ne renforce pas vos biais existants.";
};
