import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Share2, 
  Download, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Shuffle, 
  Briefcase, 
  ExternalLink,
  Lock,
  Eye
} from 'lucide-react';
import { SkillGraphItem, TransferableSkillMapping, SkillProofLevel } from '../../types';

interface CareerSkillsPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillGraph: SkillGraphItem[];
  transferableSkills: TransferableSkillMapping[];
  userName: string;
  userRole: string;
  onOpenReconversion?: () => void;
}

export const CareerSkillsPassportModal: React.FC<CareerSkillsPassportModalProps> = ({
  isOpen,
  onClose,
  skillGraph,
  transferableSkills,
  userName,
  userRole,
  onOpenReconversion
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'transferable'>('passport');
  const [isExported, setIsExported] = useState(false);

  if (!isOpen) return null;

  const proofLevelsMap: Record<SkillProofLevel, { label: string; badgeColor: string; description: string }> = {
    declaree: { label: 'Déclarée', badgeColor: 'bg-slate-800 text-slate-400 border-slate-700', description: 'Auto-déclarée par l\'utilisateur' },
    en_apprentissage: { label: 'En Apprentissage', badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-500/30', description: 'Cours ou parcours en cours de suivi sur Campus' },
    evaluee: { label: 'Évaluée', badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-500/30', description: 'Test de niveau ou évaluation diagnostique validée' },
    demontree: { label: 'Démontrée', badgeColor: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30', description: 'Projet pratique ou cas d\'étude audité' },
    utilisee_professionnellement: { label: 'Utilisée Professionnellement', badgeColor: 'bg-teal-950/60 text-teal-300 border-teal-500/30', description: 'Mise en pratique attestée en entreprise ou contrat' },
    confirmee_par_realisation: { label: 'Confirmée par Réalisation', badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40', description: 'Résultat chiffré et vérifié par tiers ou certificat' }
  };

  const handleExportPassport = () => {
    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600/20 border border-teal-500/30 rounded-2xl text-teal-400">
              <Award size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-400">Passeport de Compétences Portable</span>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-[11px] font-bold border border-teal-500/30">
                  Preuves & Portabilité MOK
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Passeport & Compétences Transférables
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex gap-3">
          <button
            onClick={() => setActiveTab('passport')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'passport'
                ? 'border-teal-500 text-teal-300 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={15} /> Passeport & 6 Niveaux de Preuve
          </button>
          <button
            onClick={() => setActiveTab('transferable')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'transferable'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shuffle size={15} /> Compétences Transférables & Passerelles
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* TAB 1: PASSPORT & PROOF LEVELS */}
          {activeTab === 'passport' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* Top User Passport Identity Card */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/90 border border-teal-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xl">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {userName}
                      <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded font-semibold border border-teal-500/30">
                        Passeport Actif
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">{userRole}</p>
                    <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
                      <Lock size={12} /> Confidentialité totale : vous contrôlez chaque élément partagé.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPassport}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-teal-600/20"
                  >
                    {isExported ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
                    <span>{isExported ? 'Lien Sécurisé Généré !' : 'Partager mon Passeport'}</span>
                  </button>
                </div>
              </div>

              {/* 6 Proof Levels Legend */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Échelle des 6 Niveaux de Preuve Mok Trust :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                  {Object.entries(proofLevelsMap).map(([key, info], idx) => (
                    <div key={key} className={`p-2 rounded-xl border ${info.badgeColor} flex flex-col justify-between`}>
                      <span className="font-bold text-[11px]">{(idx + 1)}. {info.label}</span>
                      <span className="text-[9px] text-slate-400 mt-1 line-clamp-2">{info.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills List with Proofs */}
              <div className="space-y-3">
                {skillGraph.map(skill => {
                  const proofInfo = proofLevelsMap[skill.proofLevel];
                  return (
                    <div 
                      key={skill.id}
                      className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-600 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{skill.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${proofInfo.badgeColor}`}>
                            {proofInfo.label}
                          </span>
                        </div>
                        {skill.proofDetails && (
                          <p className="text-xs text-slate-400">
                            <strong>Preuve : </strong>{skill.proofDetails.proofType} — <span className="text-slate-300">{skill.proofDetails.contextDescription}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                        {skill.proofDetails?.evaluatorOrCertificate && (
                          <span className="px-2.5 py-1 bg-slate-900/80 rounded-lg text-slate-300 border border-slate-700 text-[11px]">
                            🏅 {skill.proofDetails.evaluatorOrCertificate}
                          </span>
                        )}
                        <span className="text-emerald-400 font-semibold">{skill.roiPotential}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: COMPÉTENCES TRANSFÉRABLES & PASSERELLES */}
          {activeTab === 'transferable' && (
            <div className="space-y-6 animate-fade-up">
              
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
                <Sparkles size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-200">Innovation des Compétences Transférables : </strong>
                  Vous possédez des compétences à forte valeur qui s'appliquent directement à d'autres secteurs sans repartir de zéro. L'IA cartographie ces passerelles invisibles.
                </div>
              </div>

              {/* Transferable Mappings */}
              <div className="space-y-4">
                {transferableSkills.map((trans, idx) => (
                  <div key={idx} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-700">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Compétence Capitalisée :</span>
                        <h4 className="text-base font-bold text-white">{trans.skillName}</h4>
                        <span className="text-xs text-slate-400">Acquise dans le contexte : {trans.acquiredInContext}</span>
                      </div>
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/30">
                        {trans.transfersToRoles.length} Passerelles Métiers Détectées
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {trans.transfersToRoles.map((role, rIdx) => (
                        <div key={rIdx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-indigo-400 font-bold">{role.sector}</span>
                              <span className="font-bold text-emerald-400">Match {role.matchRelevanceScore}%</span>
                            </div>
                            <h5 className="text-sm font-bold text-white">{role.roleTitle}</h5>
                            <p className="text-xs text-slate-400 leading-relaxed mt-2">{role.whyItApplies}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[11px] text-slate-500">Passerelle activable</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bouton Mode Reconversion */}
              {onOpenReconversion && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Vous envisagez un changement complet de métier ?</h4>
                    <p className="text-xs text-slate-400">Le Mode Reconversion calcule les chemins optimaux avec temps de préparation et contraintes.</p>
                  </div>
                  <button
                    onClick={onOpenReconversion}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <span>Lancer le Mode Reconversion</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Passeport certifié & vérifiable sur le Réseau MOK</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer le Passeport
          </button>
        </div>

      </div>
    </div>
  );
};
