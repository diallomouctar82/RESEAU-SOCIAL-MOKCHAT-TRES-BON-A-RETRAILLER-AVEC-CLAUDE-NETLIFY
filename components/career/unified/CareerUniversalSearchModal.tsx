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

  const mockIndex = [
    { id: '1', title: 'Candidature OmniLogistics International', category: 'Candidature / Dossier', tab: 'pipeline', desc: 'Dossier de conquête transmis, entretien de closing à 14h30.' },
    { id: '2', title: 'CV Maître Bilingue (Français / Anglais)', category: 'Documents & Preuves', tab: 'twin', desc: 'CV certifié Mok Trust avec références vérifiées.' },
    { id: '3', title: 'Contact Saliou Kéita (VP Supply Chain)', category: 'Réseau & ICP', tab: 'network', desc: 'Dernier contact il y a 5 jours, mandat pilote en négociation.' },
    { id: '4', title: 'Module Campus : Négociation B2B Grands Comptes', category: 'Formation & Compétences', tab: 'campus', desc: 'Validé à 94/100 avec simulation d\'objections.' },
    { id: '5', title: 'Boussole Stratégique 4D & Trajectoire Export', category: 'Stratégie', tab: 'strategic', desc: 'Horizon 18 mois, Point B : Direction Commerciale.' },
    { id: '6', title: 'Antisèche Flash Négociation Salariale', category: 'Coach 3D / Préparation', tab: 'simulator', desc: 'Arguments chocs pour prétentions 68k€ + variable.' }
  ];

  const filtered = query.trim() === '' 
    ? mockIndex 
    : mockIndex.filter(item => 
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
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
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
