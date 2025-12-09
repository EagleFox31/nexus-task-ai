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
import { PROFILES, GOALS, CONSTRAINTS, FRUSTRATIONS, WORKMODES, TIMEBUDGETS } from '../data/onboardingOptions';
import { useLanguage } from '../contexts/LanguageContext';

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

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { language } = useLanguage();
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
    <div className="max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-500 px-4 relative z-50">
        <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden bg-slate-900/60 backdrop-blur-xl">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-64 h-64 bg-nexus-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-nexus-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-nexus-500/30 mb-6 group">
                    <Sparkles size={32} className="text-white group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                    Configuration <span className="text-nexus-400">Intelligente</span>
                </h1>
                
                <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-8 max-w-lg mx-auto">
                    Nous allons configurer votre mentor IA. Cela prend 60 secondes.
                    <span className="text-xs md:text-sm text-slate-500 mt-2 block font-medium">Pas de questions pièges. Juste la réalité de votre quotidien.</span>
                </p>
                
                <button 
                    type="button"
                    onClick={nextStep}
                    className="w-full md:w-auto bg-white text-nexus-900 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 mx-auto cursor-pointer relative z-50"
                >
                    Configurer mon Mentor <ChevronRight size={20} />
                </button>
            </div>
        </div>
    </div>
  );

  // New Identity Step
  const renderIdentity = () => (
      <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-300 px-4 relative z-50">
          <div className="bg-slate-900/90 border border-slate-700/80 p-6 md:p-8 rounded-3xl shadow-2xl relative backdrop-blur-xl">
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
                    type="button"
                    onClick={nextStep}
                    disabled={!displayName.trim()}
                    className="w-full md:w-auto bg-nexus-500 text-white px-8 py-3 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-nexus-400 transition-all shadow-lg shadow-nexus-500/20 flex items-center justify-center gap-2 cursor-pointer"
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
      <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-300 px-4 relative z-50 pb-8">
          <div className="bg-slate-900/90 border border-slate-700/80 p-5 md:p-8 rounded-3xl shadow-2xl relative backdrop-blur-xl">
              <div className="mb-6 text-center">
                 <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h2>
                 <p className="text-slate-400 text-sm leading-snug">{subtitle}</p>
              </div>
              
              <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                  {content}
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
                  <button type="button" onClick={prevStep} className="w-full md:w-auto text-slate-400 hover:text-white px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors rounded-lg hover:bg-white/5 cursor-pointer">
                      <ArrowLeft size={16} /> Retour
                  </button>
                  <button 
                    type="button"
                    onClick={onNextOverride || nextStep}
                    disabled={!canNext}
                    className="w-full md:w-auto bg-nexus-500 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-nexus-400 transition-all shadow-lg shadow-nexus-500/20 cursor-pointer"
                  >
                      Suivant
                  </button>
              </div>
          </div>
      </div>
  );

  const renderOption = (id: string, label: string, selected: boolean, onClick: () => void) => (
      <button
        type="button"
        key={id}
        onClick={onClick}
        className={`w-full p-4 rounded-xl border text-left font-medium transition-all cursor-pointer relative z-50 text-sm md:text-base ${
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
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-white relative z-50">
              <Loader2 className="animate-spin" size={40} />
              <p>Analyse de votre profil...</p>
          </div>
      );
      
      const currentMentorId = selectedMentorOverride || recommendation.mentorId;
      const mentor = MENTOR_PROFILES.find(m => m.id === currentMentorId)!;
      const isRecommended = mentor.id === recommendation.mentorId;
      const description = typeof mentor.description === 'string' ? mentor.description : mentor.description[language];
      
      const strengths = isRecommended 
          ? recommendation.reasons 
          : getMentorStrengths(currentMentorId, {
               profilePrimary, profileSecondary, secondaryWeight, goal, constraints, frustration, workMode, timeBudget
            });
            
      const caveat = !isRecommended 
          ? getComparisonCaveat(currentMentorId, recommendation.mentorId) 
          : null;

      return (
        <div className="max-w-5xl mx-auto w-full animate-in fade-in zoom-in duration-500 px-3 sm:px-4 pb-24 relative z-50">
             <div className="text-center mb-6 md:mb-8 mt-4 md:mt-0">
                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                     {isRecommended ? "Votre Mentor Idéal" : "Autre Option Sélectionnée"}
                 </h2>
                 <p className="text-slate-400 text-sm md:text-base">
                     {isRecommended 
                         ? "Basé sur vos réponses, nous avons calculé la meilleure correspondance." 
                         : "Vous avez choisi manuellement ce mentor."}
                 </p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 items-start">
                 {/* Main Card */}
                 <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-nexus-500/50 bg-slate-800 shadow-2xl flex flex-col order-1 lg:order-1 min-w-0">
                      <div className={`absolute top-0 w-full h-2 bg-gradient-to-r ${mentor.color}`} />
                      <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                              <div className="flex items-center gap-3 md:gap-4">
                                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${mentor.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                      {MENTOR_ICONS[mentor.id]}
                                  </div>
                                  <div>
                                      <h3 className="text-xl md:text-2xl font-bold text-white">{mentor.name}</h3>
                                      <p className="text-nexus-300 font-medium uppercase tracking-wide text-xs md:text-sm">{mentor.tagline}</p>
                                  </div>
                              </div>
                              {isRecommended ? (
                                  <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
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
                                  <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                                       <span className="bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                          Choix Manuel
                                      </span>
                                  </div>
                              )}
                          </div>

                          <div className="space-y-4 mb-6 md:mb-8 flex-1">
                              <p className="text-sm md:text-lg text-slate-300 italic border-l-4 border-slate-600 pl-4">
                                  {description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs font-bold text-nexus-400 uppercase tracking-wide">
                                <Target size={14} />
                                {mentor.role}
                              </div>

                              {isRecommended ? (
                                  <div className="bg-slate-700/30 rounded-xl p-4 md:p-5 mt-4 md:mt-6 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                      <div className="flex items-center gap-2 mb-3">
                                          <HeartHandshake size={18} className="text-nexus-400" />
                                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Pourquoi ce match ?</h4>
                                      </div>
                                      <ul className="space-y-2 md:space-y-3">
                                          {strengths.map((r, i) => (
                                              <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                                                  <Check size={16} className="text-emerald-400 mt-1 shrink-0" />
                                                  <span>{r}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              ) : (
                                  <div className="bg-slate-700/30 rounded-xl p-4 md:p-5 mt-4 md:mt-6 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                      <div className="flex items-center gap-2 mb-3">
                                          <TrendingUp size={18} className="text-orange-400" />
                                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Analyse comparative</h4>
                                      </div>
                                      
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
                            type="button"
                            onClick={handleFinish}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg mt-auto cursor-pointer ${
                                isRecommended 
                                ? 'bg-white text-nexus-900 hover:bg-slate-100' 
                                : 'bg-nexus-600 text-white hover:bg-nexus-500 border border-white/10'
                            }`}
                          >
                              {isRecommended ? "Confirmer & Commencer" : `Choisir ${mentor.name.split(' ')[0]} malgré tout`}
                          </button>
                      </div>
                 </div>

                 {/* Sidebar List */}
                 <div className="lg:col-span-1 space-y-3 bg-slate-900/50 p-3 sm:p-4 rounded-2xl border border-slate-800 order-2 lg:order-2 overflow-visible max-h-none lg:overflow-y-auto lg:max-h-[600px] custom-scrollbar w-full">
                     <h3 className="text-sm font-bold text-slate-500 uppercase sticky top-0 bg-slate-900/90 backdrop-blur-sm py-2 z-10">Autres options</h3>
                     {MENTOR_PROFILES.filter(m => m.id !== mentor.id).map(m => (
                         <button
                            type="button"
                            key={m.id}
                            onClick={() => setSelectedMentorOverride(m.id)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 transition-all text-left group cursor-pointer"
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
                                 <div className="text-xs text-slate-400 leading-snug line-clamp-2">
                                     {typeof m.description === 'string' ? m.description : m.description[language]}
                                 </div>
                             </div>
                         </button>
                     ))}
                 </div>
             </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-nexus-900 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-nexus-900 to-black overflow-hidden">
        {/* Background Animation - Force behind everything */}
        <StarfieldBackground />

        {step > 0 && step < STEPS.RESULT && (
             <div className="w-full h-1 bg-slate-800/50 relative z-[250]">
                 <div className="h-full bg-nexus-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(step / 9) * 100}%` }} />
             </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 sm:p-4 relative z-50 flex flex-col justify-start lg:justify-center min-h-0">
            {step === STEPS.WELCOME && renderWelcome()}
            
            {step === STEPS.IDENTITY && renderIdentity()}
            
            {step === STEPS.PROFILE_PRIMARY && renderStep(
                "Votre situation principale ?",
                "Celle qui définit 80% de votre semaine.",
                PROFILES.map(p => renderOption(p.id, p.label[language], profilePrimary === p.id, () => setProfilePrimary(p.id as ProfileOption)))
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
                      p.label[language],
                      profileSecondary.includes(p.id),
                      () => toggleSecondary(p.id as ProfileOption)
                    )
                  )
                }

                {profileSecondary.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 relative z-50">
                    <label className="text-sm text-slate-400 block mb-3">Répartition de votre temps</label>
                    <div className="flex gap-2">
                      {[0.1, 0.2, 0.3, 0.4].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSecondaryWeight(w)}
                          className={`flex-1 py-2 rounded text-sm font-bold border cursor-pointer ${
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
                GOALS.map(g => renderOption(g.id, g.label[language], goal === g.id, () => setGoal(g.id)))
            )}

            {step === STEPS.CONSTRAINTS && renderStep(
                "Vos freins majeurs ?",
                "Sélectionnez-en 2 maximum.",
                <div className="grid grid-cols-1 gap-2">
                    {CONSTRAINTS.map(c => renderOption(c.id, c.label[language], constraints.includes(c.id), () => handleConstraintToggle(c.id)))}
                </div>,
                constraints.length > 0 && constraints.length <= 2
            )}

            {step === STEPS.FRUSTRATION && renderStep(
                "Le symptôme visible ?",
                "Ce qui vous énerve le plus au quotidien.",
                FRUSTRATIONS.map(f => renderOption(f.id, f.label[language], frustration === f.id, () => setFrustration(f.id)))
            )}

            {step === STEPS.WORKMODE && renderStep(
                "Votre quotidien ressemble à...",
                "Comment se passent vos journées ?",
                WORKMODES.map(w => renderOption(w.id, w.label[language], workMode === w.id, () => setWorkMode(w.id)))
            )}

            {step === STEPS.TIME && renderStep(
                "Budget temps hebdo ?",
                "Combien de temps pouvez-vous consacrer à NexusTask / vos objectifs ?",
                TIMEBUDGETS.map(t => renderOption(t.id, t.label[language], timeBudget === t.id, () => setTimeBudget(t.id))),
                true,
                calculateAndShowResult 
            )}

            {step === STEPS.RESULT && renderResult()}
        </div>
    </div>
  );
};
