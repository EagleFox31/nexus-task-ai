
// src/components/MentorSelector.tsx
import React from "react";
import type { MentorId } from "../types";
import { Check } from "lucide-react";
import { MENTOR_PROFILES, MENTOR_ICONS } from "../data/mentors";
import { useLanguage } from "../contexts/LanguageContext";

interface MentorSelectorProps {
  onSelect: (id: MentorId) => void;
  selectedId?: MentorId;
}

export const MentorSelector: React.FC<MentorSelectorProps> = ({ onSelect, selectedId }) => {
  const { language } = useLanguage();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        Qui va vous coacher cette semaine ?
      </h2>
      <p className="text-slate-400 text-center mb-8 max-w-2xl mx-auto">
        Choisissez le mentor qui correspond à votre besoin du moment. Vous pourrez changer à tout moment selon l'évolution de vos priorités.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MENTOR_PROFILES.map((mentor) => {
          const isSelected = selectedId === mentor.id;
          const description = typeof mentor.description === 'string' ? mentor.description : mentor.description[language];

          return (
            <button
              key={mentor.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(mentor.id)}
              className={`group relative overflow-hidden rounded-xl p-6 text-left border transition-all duration-300 hover:shadow-xl flex flex-col focus:outline-none focus:ring-2 focus:ring-nexus-400/60 ${
                isSelected
                  ? "bg-slate-800 border-nexus-400 ring-1 ring-nexus-400"
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${mentor.color} opacity-10 rounded-bl-full transition-opacity group-hover:opacity-20`}
              />

              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${mentor.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    {MENTOR_ICONS[mentor.id]}
                  </div>

                  {isSelected && (
                    <div className="bg-nexus-500 text-white p-1 rounded-full shadow-lg">
                      <Check size={14} />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-nexus-200 transition-colors">
                  {mentor.name}
                </h3>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {mentor.tagline}
                </div>
                <p className="text-xs font-bold text-nexus-400 mb-3 uppercase tracking-wide">
                  {mentor.role}
                </p>

                <div className="border-t border-slate-700/50 pt-3 mt-auto">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
