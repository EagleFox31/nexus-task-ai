
import React, { useState } from 'react';
import { 
    MentorId, UserProfile, 
    ProfileOption, GoalOption, ConstraintOption, 
    FrustrationOption, WorkModeOption, TimeBudgetOption,
    RecommendationResult
} from '../types';
import { MENTOR_PROFILES, MENTOR_ICONS } from '../data/mentors';
import { calculateMentorRecommendation, getMentorStrengths, getComparisonCaveat } from '../services/mentorLogic';
import { Check, ChevronRight, ArrowLeft, Loader2, Sparkles, Target, User, HeartHandshake, AlertCircle, TrendingUp } from 'lucide-react';
import { StarfieldBackground } from './StarfieldBackground';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = {
  WELCOME: 0,
  IDENTITY: 1,
  PROFILE_PRIMARY: 2,
  PROFILE_SECONDARY: 3,
  GOAL: 4,
  CONSTRAINTS: 5,
  FRUSTRATION: 6,
  WORKMODE: 7,
  TIME: 8,
  RESULT: 9
};

// --- DATA OPTIONS ---

const PROFILES: { id: ProfileOption; label: string }[] = [
    { id: 'student', label: 'Étudiant(e)' },
    { id: 'intern', label: 'Stagiaire / Alternant' },
    { id: 'employee_ic', label: 'Salarié (Contributeur)' },
    { id: 'employee_manager', label: 'Manager / Team Lead' },
    { id: 'executive', label: 'Dirigeant / C-Level' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'founder', label: 'Fondateur / Entrepreneur' },
    { id: 'solopreneur', label: 'Solopreneur / Créateur' },
    { id: 'public_sector', label: 'Secteur Public' },
    { id: 'ngo_association', label: 'ONG / Association' },
    { id: 'job_seeker', label: 'En recherche d\'emploi' },
    { id: 'career_switch', label: 'En reconversion' },
    { id: 'other', label: 'Autre' }
];

const GOALS: { id: GoalOption; label: string }[] = [
    { id: 'deliver_work_project', label: 'Boucler un gros projet pro' },
    { id: 'certification_exam', label: 'Réussir un examen / certif' },
    { id: 'build_portfolio', label: 'Construire mon portfolio' },
    { id: 'grow_freelance_income', label: 'Augmenter mes revenus' },
    { id: 'launch_or_scale_business', label: 'Lancer / Scaler un business' },
    { id: 'reduce_mental_load', label: 'Réduire ma charge mentale' },
    { id: 'level_up_leadership', label: 'Prendre du leadership' },
    { id: 'get_hired', label: 'Trouver un emploi' },
    { id: 'personal_organization', label: 'Mieux m\'organiser (général)' },
    { id: 'other', label: 'Autre' }
];

const CONSTRAINTS: { id: ConstraintOption; label: string }[] = [
    { id: 'low_time', label: 'Manque de temps (< 2h/jour)' },
    { id: 'procrastination', label: 'Procrastination' },
    { id: 'distractions', label: 'Distractions / Notifications' },
    { id: 'vague_tasks', label: 'Tâches floues' },
    { id: 'unplanned_interruptions', label: 'Imprévus constants' },
    { id: 'mental_fatigue', label: 'Fatigue mentale' },
    { id: 'prioritization', label: 'Difficulté à prioriser' },
    { id: 'too_repetitive_admin', label: 'Trop d\'administratif' },
    { id: 'too_many_meetings', label: 'Trop de réunions' },
    { id: 'tool_sprawl', label: 'Outils dispersés' }
];

const FRUSTRATIONS: { id: FrustrationOption; label: string }[] = [
    { id: 'start_not_finish', label: 'Je commence tout, je ne finis rien' },
    { id: 'lose_focus', label: 'Je perds ma concentration trop vite' },
    { id: 'drowning_in_admin', label: 'Je me noie sous l\'administratif' },
    { id: 'cant_say_no', label: 'Je ne sais pas dire non' },
    { id: 'low_visible_impact', label: 'Je bosse dur mais peu d\'impact' },
    { id: 'plans_always_explode', label: 'Mon planning explose toujours' },
    { id: 'none', label: 'Aucune' }
];

const WORKMODES: { id: WorkModeOption; label: string }[] = [
    { id: 'deep_work_heavy', label: 'Focus Profond (Dev, Écriture...)' },
    { id: 'ops_firefighting', label: 'Pompier (Support, Urgences)' },
    { id: 'meetings_coordination', label: 'Coordination (Réunions, Mails)' },
    { id: 'mixed', label: 'Un peu de tout' }
];

const TIMEBUDGETS: { id: TimeBudgetOption; label: string }[] = [
    { id: '<5h', label: 'Moins de 5h' },
    { id: '5-10h', label: '5 - 10h' },
    { id: '10-20h', label: '10 - 20h' },
    { id: '20h+', label: 'Plus de 20h' }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(STEPS.WELCOME);
  
  // State
  const [displayName, setDisplayName] = useState('');
  const [profilePrimary, setProfilePrimary] = useState<ProfileOption>('student');
  const [profileSecondary, setProfileSecondary] = useState<ProfileOption[]>([]);
  const [secondaryWeight, setSecondaryWeight] = useState<number>(0.2); 
  
  const [goal, setGoal] = useState<GoalOption>('personal_organization');
  const [constraints, setConstraints] = useState<ConstraintOption[]>([]);
  const [frustration, setFrustration] = useState<FrustrationOption>('none');
  const [workMode, setWorkMode] = useState<WorkModeOption>('mixed');
  const [timeBudget, setTimeBudget] = useState<TimeBudgetOption>('10-20h');
  
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [selectedMentorOverride, setSelectedMentorOverride] = useState<MentorId | null>(null);

  // --- Handlers ---

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  const clearSecondary = () => setProfileSecondary([]);

  const toggleSecondary = (p: ProfileOption) => {
    if (p === profilePrimary) return; 
    setProfileSecondary(prev => {
      if (prev.includes(p)) return prev.filter(x => x !== p);
      if (prev.length >= 2) return prev; 
      return [...prev, p];
    });
  };

  const handleConstraintToggle = (c: ConstraintOption) => {
      if (constraints.includes(c)) setConstraints(constraints.filter(i => i !== c));
      else if (constraints.length < 2) setConstraints([...constraints, c]);
  };

  const calculateAndShowResult = () => {
    const secondaryCount = profileSecondary.length;
    const perSecondaryWeight = secondaryCount > 0 ? secondaryWeight / secondaryCount : 0;

    const result = calculateMentorRecommendation({
      profilePrimary,
      profileSecondary: secondaryCount > 0 ? profileSecondary : undefined, 
      secondaryWeight: perSecondaryWeight, 
      goal,
      constraints,
      frustration,
      workMode,
      timeBudget,
    });

    setRecommendation(result);
    setStep(STEPS.RESULT);
  };

  const handleFinish = () => {
    const finalMentor = selectedMentorOverride || recommendation?.mentorId || "aya_operator";
    const secondaryCount = profileSecondary.length;

    const profile: UserProfile = {
      displayName: displayName.trim() || "User",
      profilePrimary,
      profileSecondary: secondaryCount > 0 ? profileSecondary : undefined,
      roleWeights: { primary: 1 - secondaryWeight, secondary: secondaryWeight },
      primaryGoal: goal,
      constraints,
      frustration,
      workMode,
      timeBudget,
      mentorId: finalMentor,
      onboardingStatus: "complete",
      completedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Douala",
    };

    onComplete(profile);
  };


  // --- RENDERERS ---

  const renderWelcome = () => (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-500 px-4">
        <div className="glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden bg-slate-900/60 backdrop-blur-xl">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-64 h-64 bg-nexus-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-nexus-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-nexus-500/30 mb-6 group">
                    <Sparkles size={32} className="text-white group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                    Configuration <span className="text-nexus-400">Intelligente</span>
                </h1>
                
                <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-lg mx-auto">
                    Nous allons configurer votre mentor IA. Cela prend 60 secondes.
                    <span className="text-sm text-slate-500 mt-2 block font-medium">Pas de questions pièges. Juste la réalité de votre quotidien.</span>
                </p>
                
                <button 
                    onClick={nextStep}
                    className="bg-white text-nexus-900 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 mx-auto"
                >
                    Configurer mon Mentor <ChevronRight size={20} />
                </button>
            </div>
        </div>
    </div>
  );

  // New Identity Step
  const renderIdentity = () => (
      <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-300 px-4">
          <div className="bg-slate-900/90 border border-slate-700/80 p-8 rounded-3xl shadow-2xl relative backdrop-blur-xl">
              <div className="mb-8 text-center">
                 <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-nexus-400">
                    <User size={24} />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Comment doit-on vous appeler ?</h2>
                 <p className="text-slate-400 text-sm">Pour que votre mentor puisse vous parler personnellement.</p>
              </div>

              <div className="mb-8">
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Votre Prénom ou Surnom"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-4 text-center text-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-nexus-500 focus:border-nexus-500 outline-none transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && displayName.trim()) nextStep();
                    }}
                  />
              </div>

              <div className="flex justify-center">
                  <button 
                    onClick={nextStep}
                    disabled={!displayName.trim()}
                    className="bg-nexus-500 text-white px-8 py-3 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-nexus-400 transition-all shadow-lg shadow-nexus-500/20 flex items-center gap-2"
                  >
                      Continuer <ChevronRight size={18} />
                  </button>
              </div>
          </div>
      </div>
  );

  const renderStep = (
      title: string, 
      subtitle: string, 
      content: React.ReactNode, 
      canNext: boolean = true,
      onNextOverride?: () => void
  ) => (
      <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-300 px-4">
          <div className="bg-slate-900/90 border border-slate-700/80 p-6 md:p-8 rounded-3xl shadow-2xl relative backdrop-blur-xl">
              <div className="mb-6 text-center">
                 <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                 <p className="text-slate-400 text-sm leading-snug">{subtitle}</p>
              </div>
              
              <div className="space-y-3 mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  {content}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={prevStep} className="text-slate-400 hover:text-white px-3 py-2 flex items-center gap-2 text-sm transition-colors rounded-lg hover:bg-white/5">
                      <ArrowLeft size={16} /> Retour
                  </button>
                  <button 
                    onClick={onNextOverride || nextStep}
                    disabled={!canNext}
                    className="bg-nexus-500 text-white px-6 py-2 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-nexus-400 transition-all shadow-lg shadow-nexus-500/20"
                  >
                      Suivant
                  </button>
              </div>
          </div>
      </div>
  );

  const renderOption = (id: string, label: string, selected: boolean, onClick: () => void) => (
      <button
        key={id}
        onClick={onClick}
        className={`w-full p-4 rounded-xl border text-left font-medium transition-all ${
            selected
            ? 'bg-nexus-500 border-nexus-400 text-white ring-2 ring-nexus-400/50 shadow-lg'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
        }`}
      >
          {label}
      </button>
  );

  const renderResult = () => {
      if (!recommendation) return (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-white">
              <Loader2 className="animate-spin" size={40} />
              <p>Analyse de votre profil...</p>
          </div>
      );
      
      const currentMentorId = selectedMentorOverride || recommendation.mentorId;
      const mentor = MENTOR_PROFILES.find(m => m.id === currentMentorId)!;
      const isRecommended = mentor.id === recommendation.mentorId;
      
      // Data preparation for comparative analysis
      const strengths = isRecommended 
          ? recommendation.reasons 
          : getMentorStrengths(currentMentorId, {
               profilePrimary, profileSecondary, secondaryWeight, goal, constraints, frustration, workMode, timeBudget
            });
            
      const caveat = !isRecommended 
          ? getComparisonCaveat(currentMentorId, recommendation.mentorId) 
          : null;

      return (
        <div className="max-w-5xl mx-auto w-full animate-in fade-in zoom-in duration-500 px-4">
             <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold text-white mb-2">
                     {isRecommended ? "Votre Mentor Idéal" : "Autre Option Sélectionnée"}
                 </h2>
                 <p className="text-slate-400">
                     {isRecommended 
                         ? "Basé sur vos réponses, nous avons calculé la meilleure correspondance." 
                         : "Vous avez choisi manuellement ce mentor."}
                 </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-nexus-500/50 bg-slate-800 shadow-2xl flex flex-col">
                      <div className={`absolute top-0 w-full h-2 bg-gradient-to-r ${mentor.color}`} />
                      <div className="p-8 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4">
                                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${mentor.color} flex items-center justify-center text-white shadow-lg`}>
                                      {MENTOR_ICONS[mentor.id]}
                                  </div>
                                  <div>
                                      <h3 className="text-2xl font-bold text-white">{mentor.name}</h3>
                                      <p className="text-nexus-300 font-medium uppercase tracking-wide text-sm">{mentor.tagline}</p>
                                  </div>
                              </div>
                              {isRecommended ? (
                                  <div className="flex flex-col items-end">
                                      <span className="bg-nexus-500/20 text-nexus-300 border border-nexus-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                          Recommandé
                                      </span>
                                      <span className="text-slate-500 text-xs mt-1">
                                          Confiance:{" "}
                                            <span className="text-white">
                                              {recommendation.confidence === "High"
                                                ? "Élevée"
                                                : recommendation.confidence === "Low"
                                                ? "Faible"
                                                : "Moyenne"}
                                            </span>

                                      </span>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-end">
                                       <span className="bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                          Choix Manuel
                                      </span>
                                  </div>
                              )}
                          </div>

                          <div className="space-y-4 mb-8 flex-1">
                              <p className="text-lg text-slate-300 italic border-l-4 border-slate-600 pl-4">
                                  {mentor.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs font-bold text-nexus-400 uppercase tracking-wide">
                                <Target size={14} />
                                {mentor.role}
                              </div>

                              {isRecommended ? (
                                  // BLOC RECOMMANDÉ
                                  <div className="bg-slate-700/30 rounded-xl p-5 mt-6 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                      <div className="flex items-center gap-2 mb-3">
                                          <HeartHandshake size={18} className="text-nexus-400" />
                                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Pourquoi ce match ?</h4>
                                      </div>
                                      <ul className="space-y-3">
                                          {strengths.map((r, i) => (
                                              <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                                                  <Check size={16} className="text-emerald-400 mt-1 shrink-0" />
                                                  <span>{r}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              ) : (
                                  // BLOC ANALYSE COMPARATIVE (MANUEL)
                                  <div className="bg-slate-700/30 rounded-xl p-5 mt-6 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                      <div className="flex items-center gap-2 mb-3">
                                          <TrendingUp size={18} className="text-orange-400" />
                                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Analyse comparative</h4>
                                      </div>
                                      
                                      {/* Points Positifs (si existants) */}
                                      {strengths.length > 0 && (
                                          <div className="mb-4">
                                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Ce que {mentor.name.split(' ')[0]} vous apporterait :</p>
                                            <ul className="space-y-2">
                                                {strengths.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
                                                        <Check size={14} className="text-slate-500 mt-1 shrink-0" />
                                                        <span>{r}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                          </div>
                                      )}

                                      {/* Mise en garde */}
                                      {caveat && (
                                          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
                                               <div className="flex items-start gap-2">
                                                   <AlertCircle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                                                   <p className="text-sm text-orange-200/80 leading-relaxed">
                                                       <span className="font-bold text-orange-300 block mb-1">Attention :</span>
                                                       {caveat}
                                                   </p>
                                               </div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>

                          <button 
                            onClick={handleFinish}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg mt-auto ${
                                isRecommended 
                                ? 'bg-white text-nexus-900 hover:bg-slate-100' 
                                : 'bg-nexus-600 text-white hover:bg-nexus-500 border border-white/10'
                            }`}
                          >
                              {isRecommended ? "Confirmer & Commencer" : `Choisir ${mentor.name.split(' ')[0]} malgré tout`}
                          </button>
                      </div>
                 </div>

                 <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                     <h3 className="text-sm font-bold text-slate-500 uppercase sticky top-0 bg-transparent py-2">Autres options</h3>
                     {MENTOR_PROFILES.filter(m => m.id !== mentor.id).map(m => (
                         <button
                            key={m.id}
                            onClick={() => setSelectedMentorOverride(m.id)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 transition-all text-left group"
                         >
                             <div className={`w-8 h-8 rounded bg-gradient-to-br ${m.color} flex items-center justify-center text-white opacity-70 group-hover:opacity-100 shrink-0 mt-1`}>
                                 {MENTOR_ICONS[m.id]}
                             </div>
                             <div className="min-w-0 flex-1">
                                 <div className="flex justify-between items-center mb-0.5">
                                    <div className="text-sm font-bold text-slate-300 group-hover:text-white truncate">{m.name}</div>
                                    {m.id === recommendation.mentorId && (
                                        <div className="w-2 h-2 rounded-full bg-nexus-500 shadow-[0_0_5px_rgba(99,102,241,1)]"></div>
                                    )}
                                 </div>
                                 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{m.tagline}</div>
                                 <div className="text-xs text-slate-400 leading-snug line-clamp-2">{m.description}</div>
                             </div>
                         </button>
                     ))}
                 </div>
             </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-nexus-900 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-nexus-900 to-black">
        {/* Background Animation */}
        <StarfieldBackground />

        {step > 0 && step < STEPS.RESULT && (
             <div className="w-full h-1 bg-slate-800/50 relative z-50">
                 <div className="h-full bg-nexus-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(step / 9) * 100}%` }} />
             </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-6 relative z-10">
            {step === STEPS.WELCOME && renderWelcome()}
            
            {step === STEPS.IDENTITY && renderIdentity()}
            
            {step === STEPS.PROFILE_PRIMARY && renderStep(
                "Votre situation principale ?",
                "Celle qui définit 80% de votre semaine.",
                PROFILES.map(p => renderOption(p.id, p.label, profilePrimary === p.id, () => setProfilePrimary(p.id as ProfileOption)))
            )}

            {step === STEPS.PROFILE_SECONDARY && renderStep(
              "Une autre casquette ?",
              "Optionnel. Sélectionnez jusqu’à 2 rôles secondaires (on répartit le poids à parts égales).",
              <>
                {renderOption(
                  "none",
                  "Aucune (100%)",
                  profileSecondary.length === 0,
                  () => clearSecondary()
                )}

                {PROFILES
                  .filter(p => p.id !== profilePrimary)
                  .map(p =>
                    renderOption(
                      p.id,
                      p.label,
                      profileSecondary.includes(p.id),
                      () => toggleSecondary(p.id as ProfileOption)
                    )
                  )
                }

                {profileSecondary.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <label className="text-sm text-slate-400 block mb-3">Répartition de votre temps</label>
                    <div className="flex gap-2">
                      {[0.1, 0.2, 0.3, 0.4].map(w => (
                        <button
                          key={w}
                          onClick={() => setSecondaryWeight(w)}
                          className={`flex-1 py-2 rounded text-sm font-bold border ${
                            secondaryWeight === w
                              ? "bg-nexus-500 border-nexus-400 text-white"
                              : "border-slate-600 text-slate-400"
                          }`}
                        >
                          {100 - w * 100} / {w * 100}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Principal / Secondaire total {profileSecondary.length === 2 ? "(partagé 50/50 entre les 2 rôles)" : ""}
                    </p>
                  </div>
                )}
              </>,
              true
            )}


            {step === STEPS.GOAL && renderStep(
                "Votre Objectif #1 ?",
                "Sur les 4 prochaines semaines.",
                GOALS.map(g => renderOption(g.id, g.label, goal === g.id, () => setGoal(g.id)))
            )}

            {step === STEPS.CONSTRAINTS && renderStep(
                "Vos freins majeurs ?",
                "Sélectionnez-en 2 maximum.",
                <div className="grid grid-cols-1 gap-2">
                    {CONSTRAINTS.map(c => renderOption(c.id, c.label, constraints.includes(c.id), () => handleConstraintToggle(c.id)))}
                </div>,
                constraints.length > 0 && constraints.length <= 2
            )}

            {step === STEPS.FRUSTRATION && renderStep(
                "Le symptôme visible ?",
                "Ce qui vous énerve le plus au quotidien.",
                FRUSTRATIONS.map(f => renderOption(f.id, f.label, frustration === f.id, () => setFrustration(f.id)))
            )}

            {step === STEPS.WORKMODE && renderStep(
                "Votre quotidien ressemble à...",
                "Comment se passent vos journées ?",
                WORKMODES.map(w => renderOption(w.id, w.label, workMode === w.id, () => setWorkMode(w.id)))
            )}

            {step === STEPS.TIME && renderStep(
                "Budget temps hebdo ?",
                "Combien de temps pouvez-vous consacrer à NexusTask / vos objectifs ?",
                TIMEBUDGETS.map(t => renderOption(t.id, t.label, timeBudget === t.id, () => setTimeBudget(t.id))),
                true,
                calculateAndShowResult 
            )}

            {step === STEPS.RESULT && renderResult()}
        </div>
    </div>
  );
};
