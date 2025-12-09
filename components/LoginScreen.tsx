

import React, { useState } from 'react';
import { Rocket, ShieldCheck, ArrowRight, AlertTriangle, Copy, Check, TestTube } from 'lucide-react';
import { StarfieldBackground } from './StarfieldBackground';

interface LoginScreenProps {
  onLogin: () => void;
  onTestLogin?: () => void;
  loading: boolean;
  error?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onTestLogin, loading, error }) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = window.location.hostname;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDomainError = error && error.includes('auth/unauthorized-domain');
  // Safely detect local development environment (True on localhost, False on Vercel)
  const isDev = (import.meta as any).env && (import.meta as any).env.DEV;
  
  // Hide tester button on production domain
  const isProduction = currentDomain === 'nexus-task-ai.vercel.app';

  return (
    <div className="min-h-screen bg-nexus-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Component */}
      <StarfieldBackground />

      <div className="glass-panel max-w-md w-full p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl shadow-nexus-900/50 border border-white/10 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="w-16 h-16 bg-gradient-to-br from-nexus-500 to-nexus-400 rounded-2xl flex items-center justify-center shadow-lg shadow-nexus-500/30 mb-6 transform rotate-3 hover:rotate-6 transition-transform">
            <Rocket className="text-white fill-white/20" size={32} />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Nexus<span className="text-nexus-400">Task</span> AI
        </h1>
        <p className="text-slate-400 mb-8">
          Optimisez votre charge mentale et sécurisez vos données dans le cloud.
        </p>

        {/* Error Display Box */}
        {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-400 mb-1">Erreur de connexion</h3>
                        <p className="text-xs text-red-300/80 mb-2">
                            {isDomainError 
                                ? "Ce domaine n'est pas autorisé par Firebase." 
                                : "Une erreur est survenue lors de l'authentification."}
                        </p>
                        
                        {isDomainError && (
                            <div className="bg-nexus-900/50 rounded-lg p-2 border border-red-500/10 flex items-center justify-between gap-2">
                                <code className="text-[10px] text-slate-300 font-mono truncate max-w-[200px]">
                                    {currentDomain}
                                </code>
                                <button 
                                    onClick={handleCopy}
                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                    title="Copier le domaine"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        )}
                         {isDomainError && (
                            <p className="text-[10px] text-slate-500 mt-2">
                                Ajoutez ce lien dans : Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains
                            </p>
                         )}
                    </div>
                </div>
            </div>
        )}

        <div className="w-full space-y-4">
            <button
                onClick={onLogin}
                disabled={loading}
                className="w-full group relative bg-white text-slate-900 hover:bg-slate-50 font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-white/10 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                         <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 4.6c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continuer avec Google</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                )}
            </button>
            
            {/* Bouton Testeur - Toujours visible pour permettre le test en environnement restreint */}
            {onTestLogin && !isProduction && (
                <button
                    onClick={onTestLogin}
                    disabled={loading}
                    className="w-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 py-3 px-6 rounded-xl transition-all border border-slate-700 hover:border-slate-500 flex items-center justify-center gap-2 text-sm"
                >
                    <TestTube size={16} />
                    <span>Mode Testeur (Hors-Ligne)</span>
                </button>
            )}
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-nexus-500/60 bg-nexus-500/5 px-3 py-1 rounded-full border border-nexus-500/10">
            <ShieldCheck size={12} />
            <span>Vos données sont chiffrées et sauvegardées.</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-slate-600 text-xs text-center">
         v1.2.1 • Cloud Sync Ready<br/>
         {isDev ? 'Local Development' : 'Production Build'}
      </div>
    </div>
  );
};