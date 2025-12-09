
import React, { useEffect, useState } from 'react';
import { Rocket, BrainCircuit, ShieldCheck, Zap, Layout, ArrowRight, Check, X as XIcon, Target, Users, Globe } from 'lucide-react';
import { StarfieldBackground } from './StarfieldBackground';
import { MENTOR_ICONS } from '../data/mentors';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  onLogin: () => void;
  onTestLogin?: () => void;
  loading: boolean;
  error?: string | null;
  theme?: 'dark' | 'light';
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onTestLogin, loading, error, theme = 'dark' }) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProduction = currentDomain === 'nexus-task-ai.vercel.app';
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-nexus-900 text-slate-900 dark:text-white selection:bg-nexus-500 selection:text-white overflow-x-hidden font-sans transition-colors duration-300">
      
      <div className="fixed inset-0 z-0">
         <div className="absolute inset-0 bg-slate-50 dark:bg-nexus-900 transition-colors duration-300"></div>
         {/* Stars on top of background color */}
         <StarfieldBackground theme={theme} />
         
         <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
         <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-nexus-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-nexus-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-nexus-500/20">
                    <Rocket className="text-white fill-white/20" size={18} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nexus<span className="text-nexus-500 dark:text-nexus-400">Task</span> AI</span>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Language Toggle */}
                <button 
                    onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                    <Globe size={14} />
                    {language.toUpperCase()}
                </button>

                <button 
                    onClick={onLogin}
                    disabled={loading}
                    className="hidden md:flex bg-nexus-600 dark:bg-white text-white dark:text-nexus-900 hover:bg-nexus-500 dark:hover:bg-slate-100 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? t('cta.loading') : t('cta.free')}
                </button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 border border-nexus-500/30 text-nexus-600 dark:text-nexus-300 text-xs font-medium uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-nexus-500"></span>
                  </span>
                  {t('hero.tag')}
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-slate-900 dark:text-white animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                  {t('hero.title.1')} <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-500 via-indigo-500 to-purple-500 dark:from-nexus-400 dark:via-indigo-400 dark:to-purple-400">
                      {t('hero.title.2')}
                  </span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                  {t('hero.subtitle')}
              </p>

              {/* CTA AREA */}
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700 delay-300 pt-8">
                  <button
                      onClick={onLogin}
                      disabled={loading}
                      className="group relative bg-nexus-600 dark:bg-white text-white dark:text-nexus-900 hover:bg-nexus-500 dark:hover:bg-slate-50 font-bold py-4 px-10 rounded-2xl text-lg transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:-translate-y-1 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed min-w-[300px] justify-center"
                  >
                      {loading ? (
                         <div className="w-6 h-6 border-2 border-white dark:border-nexus-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                         <>
                            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 opacity-80" />
                            {t('cta.start')}
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                         </>
                      )}
                  </button>

                  {!isStandalone && (
                    <div className="w-full flex flex-col items-center gap-3">
                      <button
                        onClick={handleInstall}
                        disabled={!installPrompt}
                        className="w-full md:w-auto bg-gradient-to-r from-nexus-500 via-indigo-500 to-purple-500 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-[0_15px_40px_rgba(99,102,241,0.35)] hover:shadow-[0_20px_45px_rgba(99,102,241,0.45)] hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Installer NexusTask sur mon mobile
                      </button>
                      {!installPrompt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-snug">
                          Sur mobile, ouvrez le menu « Ajouter à l’écran d’accueil » pour installer l’app. Ce bouton s’activera si votre navigateur autorise l’installation.
                        </p>
                      )}
                    </div>
                  )}

                  {error && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                          <span className="font-bold">Erreur :</span> {error}
                      </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                      {t('privacy')}
                  </p>
              </div>
          </div>
      </section>

      {/* --- COMPARISON SECTION (THE KILLER FEATURE) --- */}
      <section className="relative z-10 py-16 px-6">
          <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('why.title')}</h2>
                  <p className="text-slate-500 dark:text-slate-400">{t('why.subtitle')}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* The Old Way */}
                  <div className="bg-white/50 dark:bg-slate-800/30 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-red-500/10 px-4 py-2 rounded-bl-2xl text-red-500 dark:text-red-400 text-xs font-bold uppercase tracking-wider border-l border-b border-red-500/20">
                          {t('comp.old')}
                      </div>
                      <ul className="space-y-6 mt-4">
                          <li className="flex items-start gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                              <XIcon className="text-red-500 shrink-0 mt-1" />
                              <div>
                                  <strong className="block text-red-700 dark:text-red-200">{t('comp.old.1.t')}</strong>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('comp.old.1.d')}</span>
                              </div>
                          </li>
                          <li className="flex items-start gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                              <XIcon className="text-red-500 shrink-0 mt-1" />
                              <div>
                                  <strong className="block text-red-700 dark:text-red-200">{t('comp.old.2.t')}</strong>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('comp.old.2.d')}</span>
                              </div>
                          </li>
                      </ul>
                  </div>

                  {/* The Nexus Way */}
                  <div className="bg-white dark:bg-slate-900 border border-nexus-200 dark:border-nexus-500/50 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-nexus-500/10 transform md:scale-105">
                      <div className="absolute top-0 right-0 bg-nexus-500 px-4 py-2 rounded-bl-2xl text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                          NexusTask AI
                      </div>
                      <ul className="space-y-6 mt-4">
                          <li className="flex items-start gap-4">
                              <div className="p-1 bg-emerald-500/20 rounded-full text-emerald-500 dark:text-emerald-400"><Check size={16} /></div>
                              <div>
                                  <strong className="block text-slate-900 dark:text-white">{t('comp.new.1.t')}</strong>
                                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('comp.new.1.d')}</span>
                              </div>
                          </li>
                          <li className="flex items-start gap-4">
                              <div className="p-1 bg-blue-500/20 rounded-full text-blue-500 dark:text-blue-400"><BrainCircuit size={16} /></div>
                              <div>
                                  <strong className="block text-slate-900 dark:text-white">{t('comp.new.2.t')}</strong>
                              </div>
                          </li>
                          <li className="flex items-start gap-4">
                              <div className="p-1 bg-orange-500/20 rounded-full text-orange-500 dark:text-orange-400"><Zap size={16} /></div>
                              <div>
                                  <strong className="block text-slate-900 dark:text-white">{t('comp.new.3.t')}</strong>
                              </div>
                          </li>
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* --- BENEFITS GRID --- */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  {
                      icon: <ShieldCheck size={32} className="text-emerald-500 dark:text-emerald-400" />,
                      title: t('ben.burnout.t'),
                      desc: t('ben.burnout.d')
                  },
                  {
                      icon: <Layout size={32} className="text-nexus-500 dark:text-nexus-400" />,
                      title: t('ben.clarity.t'),
                      desc: t('ben.clarity.d')
                  },
                  {
                      icon: <Users size={32} className="text-orange-500 dark:text-orange-400" />,
                      title: t('ben.coach.t'),
                      desc: t('ben.coach.d')
                  }
              ].map((feature, i) => (
                  <div 
                    key={i}
                    onMouseEnter={() => setHoveredFeature(i)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-nexus-500/30 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group bg-white/70 dark:bg-slate-800/50"
                  >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-nexus-500/10 to-transparent rounded-bl-full transition-opacity duration-500 ${hoveredFeature === i ? 'opacity-100' : 'opacity-0'}`} />
                      
                      <div className="bg-slate-100 dark:bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-white/5 group-hover:scale-110 transition-transform">
                          {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* --- MENTORS TEASER --- */}
      <section className="relative z-10 py-24 px-6">
          <div className="max-w-5xl mx-auto text-center">
              <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-90">
                  <div className="flex flex-col items-center gap-4 group cursor-default">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                          {MENTOR_ICONS['aya_operator']}
                      </div>
                      <div className="text-center">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">Aya</span>
                      </div>
                  </div>
                  <div className="flex flex-col items-center gap-4 group cursor-default">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                          {MENTOR_ICONS['elias_strategist']}
                      </div>
                      <div className="text-center">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">Elias</span>
                      </div>
                  </div>
                  <div className="flex flex-col items-center gap-4 group cursor-default">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-2xl shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                          {MENTOR_ICONS['mina_deepwork']}
                      </div>
                      <div className="text-center">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">Mina</span>
                      </div>
                  </div>
                   <div className="flex flex-col items-center gap-4 group cursor-default">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-600 to-zinc-500 flex items-center justify-center text-white shadow-2xl shadow-slate-500/20 group-hover:scale-110 transition-transform duration-300">
                          {MENTOR_ICONS['kassi_stoic']}
                      </div>
                      <div className="text-center">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">Kassi</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-8 text-center relative z-10 bg-slate-100 dark:bg-black/20">
          <p className="text-slate-500 text-sm mb-4">
              © {new Date().getFullYear()} NexusTask AI.
          </p>
          
          {onTestLogin && !isProduction && (
              <button 
                  onClick={onTestLogin}
                  className="text-xs text-slate-600 dark:text-slate-600 hover:text-nexus-500 underline transition-colors"
              >
                  Mode Démo / Test Mode
              </button>
          )}
      </footer>

    </div>
  );
};

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
