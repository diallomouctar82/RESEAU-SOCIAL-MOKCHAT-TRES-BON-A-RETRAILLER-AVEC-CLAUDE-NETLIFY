import React, { useState } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Compass, 
  Sparkles,
  ArrowRight,
  Video
} from 'lucide-react';
import { CareerJournalEntry } from '../../../types';

interface CareerUniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: CareerJournalEntry[];
  onSelectResult: (tabTarget: string) => void;
}

export const CareerUniversalSearchModal: React.FC<CareerUniversalSearchModalProps> = ({
  isOpen,
  onClose,
  journal,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  // Index de recherche construit à partir du véritable journal de parcours de l'utilisateur
  // (plus de contenu fictif déconnecté des données réelles de l'application).
  const TYPE_TAB_MAP: Record<CareerJournalEntry['type'], string> = {
    decision: 'strategic',
    formation: 'campus',
    competence: 'twin',
    opportunite: 'hunter',
    candidature: 'pipeline',
    rencontre: 'network',
    resultat: 'twin',
    echec_utile: 'strategic',
    pivot_strategie: 'strategic',
    realisation: 'gps'
  };

  const TYPE_LABEL_MAP: Record<CareerJournalEntry['type'], string> = {
    decision: 'Décision Stratégique',
    formation: 'Formation & Compétences',
    competence: 'Compétence Certifiée',
    opportunite: 'Opportunité',
    candidature: 'Candidature / Dossier',
    rencontre: 'Réseau & Contact',
    resultat: 'Résultat Certifié',
    echec_utile: 'Retour d\'Expérience',
    pivot_strategie: 'Pivot Stratégique',
    realisation: 'Réalisation'
  };

  const searchIndex = journal.map(entry => ({
    id: entry.id,
    title: entry.title,
    category: TYPE_LABEL_MAP[entry.type] || 'Parcours',
    tab: TYPE_TAB_MAP[entry.type] || 'gps',
    desc: entry.description
  }));

  const filtered = query.trim() === ''
    ? searchIndex
    : searchIndex.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-md p-4 pt-16 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="p-4 md:p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Search size={22} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une candidature, un CV, un contact, une compétence, un entretien..."
            className="w-full bg-transparent border-none text-slate-900 text-sm md:text-base focus:outline-hidden font-medium placeholder-slate-400"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors" aria-label="Effacer la recherche">
              <X size={18} />
            </button>
          )}
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500 transition-colors" aria-label="Fermer la recherche">
            <X size={20} />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 md:p-6 space-y-2 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Résultats trouvés ({filtered.length})
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Aucun résultat correspondant dans votre Dossier Maître.
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectResult(item.tab);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    <h4 className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
          Astuce : Tapez « entretien », « Saliou », « CV » ou « anglais » pour naviguer instantanément.
        </div>

      </div>
    </div>
  );
};
