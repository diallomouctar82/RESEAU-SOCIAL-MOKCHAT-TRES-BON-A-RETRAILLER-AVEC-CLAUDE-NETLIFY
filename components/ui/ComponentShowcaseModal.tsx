import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Layers, 
  FileCheck, 
  ShieldCheck, 
  Bookmark, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  ListTodo,
  ExternalLink,
  Code,
  Palette
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { SourceCitationCard } from './SourceCitationCard';
import { KnowledgeCard } from './KnowledgeCard';
import { AISynthesisCard } from './AISynthesisCard';
import { ActionableAISuggestion } from './ActionableAISuggestion';
import { PointAToBPathway } from './PointAToBPathway';
import { EmptyStateGuide } from './EmptyStateGuide';

interface ComponentShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComponentShowcaseModal: React.FC<ComponentShowcaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<'tokens' | 'cards' | 'badges' | 'pathway' | 'ai'>('cards');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="showcase-title"
    >
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-md">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  LMAV Design System 1.0
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Conforme UI Constitution
                </span>
              </div>
              <h2 id="showcase-title" className="text-lg font-bold text-white tracking-tight">
                Galerie des Composants & Tokens Normalisés
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer la galerie"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'cards', label: 'Cartes & Fiches Synthèses' },
            { id: 'badges', label: 'Badges de Statut & Sources' },
            { id: 'ai', label: 'Composants Actionable AI' },
            { id: 'pathway', label: 'Trajectoire Point A ➔ Point B' },
            { id: 'tokens', label: 'Tokens & Typographie' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === tab.id 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Showcase Canvas Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-100/50">
          
          {/* CARDS */}
          {activeCategory === 'cards' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KnowledgeCard
                  category="Immigration & Visas"
                  title="Permis d'Études Canada : Procédure SDS 2026"
                  takeaway="Le volet direct pour les études (SDS) permet un traitement accéléré en 20 jours sous réserve d'un compte CPG certifié de 20 635 $ CAD."
                  source={{
                    institution: "IRCC Canada",
                    verifiedDate: "Vérifié le 26 Août 2026"
                  }}
                  onDeepDive={() => alert("Ouverture fiche détaillée")}
                  onUseInProject={() => alert("Ajouté au dossier de démarche")}
                />

                <KnowledgeCard
                  category="Santé Internationale"
                  title="Couverture CFE & Mutuelle Expatrié"
                  takeaway="La Caisse des Français de l'Étranger permet la continuité des droits de Sécurité Sociale avec un remboursement au tarif de convention français."
                  source={{
                    institution: "Docteur Diallo / CFE",
                    verifiedDate: "Vérifié le 25 Août 2026"
                  }}
                  onDeepDive={() => alert("Ouverture fiche détaillée")}
                  onUseInProject={() => alert("Ajouté au dossier de santé")}
                />
              </div>

              <AISynthesisCard
                topic="Plan Stratégique d'Installation à Montréal"
                sourceContext="Consultation Démarches & Habitat avec Ibrahima Diallo"
                summary="Validation du calendrier d'arrivée pour fin Août 2026. Logement présélectionné dans le quartier Côte-des-Neiges et confirmation de conformité du dossier de permis d'études."
                keyDecisions={[
                  "Bail signé avec garantie séquestre LMAV",
                  "Souscription de l'assurance santé internationale validée",
                  "Vérification des équivalences de diplômes complétée"
                ]}
                actionItems={[
                  { task: "Transmettre le reçu CPG à l'ambassade", due: "Sous 48h" },
                  { task: "Planifier l'accueil aéroport avec le mentor MOC", due: "Avant le 15 Août" }
                ]}
                openQuestions={[
                  "Option d'ouverture de compte bancaire en ligne avant départ"
                ]}
                onSaveToDrive={() => alert("Sauvegardé dans Google Drive")}
              />
            </div>
          )}

          {/* BADGES & SOURCES */}
          {activeCategory === 'badges' && (
            <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Badges de Statut (Conformité WCAG AA)
              </h3>
              
              <div className="flex flex-wrap gap-3">
                <StatusBadge status="verified" label="Vérifié & Certifié LMAV" />
                <StatusBadge status="official" label="Référentiel Officiel" />
                <StatusBadge status="in_progress" label="Démarche en cours" />
                <StatusBadge status="pending_review" label="Relecture Conseiller Requise" />
                <StatusBadge status="action_required" label="Action Immédiate Requise" />
                <StatusBadge status="completed" label="Point B Atteint" />
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Source Citations Vérifiables
                </h3>
                <SourceCitationCard
                  sourceName="Journal Officiel de la République Française"
                  institution="Ministère de l'Intérieur & DGEF"
                  verifiedDate="27 Août 2026"
                  referenceCode="JORF-2026-ART-42"
                  verifiedUrl="https://legifrance.gouv.fr"
                />
              </div>
            </div>
          )}

          {/* ACTIONABLE AI */}
          {activeCategory === 'ai' && (
            <div className="space-y-6">
              <ActionableAISuggestion
                title="Votre CV Maître peut être optimisé pour l'offre Tech Lead Canada"
                recommendation="L'offre exige une mention explicite de votre maîtrise des architectures Cloud et des certifications Kubernetes. 2 compétences clés détectées dans votre portfolio peuvent être valorisées."
                whyExplanation="L'algorithme de présélection consulaire et employeur valorise un alignement à 92% des mots-clés de la fiche de poste officielle."
                confidenceScore={96}
                primaryActionLabel="Optimiser mon CV avec l'expert"
                onPrimaryAction={() => alert("Action déclenchée !")}
              />
            </div>
          )}

          {/* PATHWAY */}
          {activeCategory === 'pathway' && (
            <div className="space-y-6">
              <PointAToBPathway
                currentPointALabel="Étudiant / Diplômé à Conakry"
                targetPointBLabel="Ingénieur Système Certifié à Montréal"
                progressPercent={65}
                steps={[
                  { id: '1', title: 'Bilan de Compétences', status: 'completed' },
                  { id: '2', title: 'Certification Campus', status: 'completed' },
                  { id: '3', title: 'Permis d\'Études & Visa', status: 'current' },
                  { id: '4', title: 'Installation & Logement', status: 'upcoming' },
                  { id: '5', title: 'Prise de Poste', status: 'upcoming' }
                ]}
                onOrientationClick={() => alert("Orientation ouverte")}
              />
            </div>
          )}

          {/* TOKENS */}
          {activeCategory === 'tokens' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase">Palette Chromatique Institutionnelle</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="p-3 bg-[#070D1E] text-white rounded-xl text-xs font-mono font-bold">
                    Navy Deep #070D1E
                  </div>
                  <div className="p-3 bg-[#0B132B] text-white rounded-xl text-xs font-mono font-bold">
                    Navy Primary #0B132B
                  </div>
                  <div className="p-3 bg-[#EA580C] text-white rounded-xl text-xs font-mono font-bold">
                    Orange #EA580C
                  </div>
                  <div className="p-3 bg-[#059669] text-white rounded-xl text-xs font-mono font-bold">
                    Emerald #059669
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase">Typographie Hiérarchisée</h4>
                <p className="font-['Outfit'] text-2xl font-black text-slate-900 mt-2">
                  Outfit Display — 800 ExtraBold
                </p>
                <p className="font-['Plus_Jakarta_Sans'] text-sm text-slate-600 mt-1 font-medium">
                  Plus Jakarta Sans — Corps de texte, tableaux de bord et lecture continue (Line height 1.6).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all"
          >
            Fermer la Galerie
          </button>
        </div>

      </div>
    </div>
  );
};
