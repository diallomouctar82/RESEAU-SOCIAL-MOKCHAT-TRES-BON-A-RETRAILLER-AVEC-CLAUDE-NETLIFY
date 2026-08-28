import React, { useState } from 'react';
import { 
  Target, Sparkles, CheckCircle2, ArrowRight, X, Globe, DollarSign, 
  Calendar, ShieldCheck, FileText, Users, Bot, Layers, AlertTriangle, 
  Compass, ChevronRight, Play, RefreshCw 
} from 'lucide-react';
import { generateJSON } from '../services/aiGateway';

interface TradeCommercialOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onObjectiveCreated?: (objective: any) => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const TradeCommercialOrchestratorModal: React.FC<TradeCommercialOrchestratorModalProps> = ({
  isOpen,
  onClose,
  initialQuery = "Je veux vendre mon miel pur de Guinée en Allemagne et trouver 5 distributeurs",
  onObjectiveCreated,
  onNavigateToSection
}) => {
  const [objectivePrompt, setObjectivePrompt] = useState(initialQuery);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    title: string;
    category: string;
    targetMarket: string;
    estimatedBudget: string;
    timelineWeeks: number;
    nextBestAction: string;
    assignedAgents: { name: string; role: string; task: string }[];
    supervisingExperts: string[];
    phases: {
      phaseNumber: number;
      title: string;
      description: string;
      tasks: string[];
      requiredDocs: string[];
      targetModule: string;
      status: 'pending' | 'in_progress' | 'completed';
    }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Tu es l'Orchestrateur Commercial Suprême de Diallo OS pour la plateforme 'Le Monde à Vous'.
      L'utilisateur exprime l'intention commerciale suivante :
      "${objectivePrompt}"

      Génère un PARCOURS COMMERCIAL COMPLET de bout en bout (de l'intention au résultat et suivi récurrent).
      Structure le résultat en JSON strict :
      {
        "title": "Nom de l'Objectif Commercial",
        "category": "Exportation Agroalimentaire / Sourcing / etc.",
        "targetMarket": "Allemagne / Union Européenne",
        "estimatedBudget": "2 500 - 5 000 EUR",
        "timelineWeeks": 6,
        "nextBestAction": "Valider la fiche produit et lancer le test de conformité norme UE CE 834/2007",
        "assignedAgents": [
          { "name": "Agent Sourcing & Acheteurs", "role": "Prospection ciblée", "task": "Identifier 15 distributeurs bio à Hambourg" },
          { "name": "Agent Logistique & Douane", "role": "Calcul Incoterm", "task": "Comparer fret maritime vs aérien DDP" },
          { "name": "Agent Négociation", "role": "Offres commerciales", "task": "Rédiger les propositions pro forma multilingues" }
        ],
        "supervisingExperts": ["Dr. Moussa Traoré (Commerce)", "Me. Catherine Laurent (Juridique)"],
        "phases": [
          {
            "phaseNumber": 1,
            "title": "1. Fiche Produit & Étude Réglementaire",
            "description": "Packaging, étiquetage bilingue Allemand/Français et conformité labellisation",
            "tasks": ["Rédiger la fiche technique", "Vérifier le taux d'humidité (<18%)", "Calculer le prix FOB & CIF"],
            "requiredDocs": ["Fiche Technique", "Certificat de Non-Contamination"],
            "targetModule": "catalog",
            "status": "in_progress"
          },
          {
            "phaseNumber": 2,
            "title": "2. Sourcing & Prospection B2B Ciblée",
            "description": "Identification des acheteurs grossistes et importateurs spécialisés",
            "tasks": ["Rechercher dans l'annuaire B2B", "Envoyer 15 dossiers de présentation", "Planifier des visioconférences Mok Meet"],
            "requiredDocs": ["Dossier Commercial Export", "Catalogue Produits"],
            "targetModule": "sourcing",
            "status": "pending"
          },
          {
            "phaseNumber": 3,
            "title": "3. Envoi d'Échantillons Certifiés & Tests",
            "description": "Validation gustative et analytique par les acheteurs allemands",
            "tasks": ["Conditionner les pots témoins 250g", "Émettre la pro forma échantillon", "Suivre le tracking express"],
            "requiredDocs": ["Pro Forma Échantillon", "Bordereau Express"],
            "targetModule": "deals",
            "status": "pending"
          },
          {
            "phaseNumber": 4,
            "title": "4. Négociation & Contrat Cadre",
            "description": "Fixation des volumes annuels, paliers de remises et conditions de paiement",
            "tasks": ["Verrouiller les Incoterms (CIF Hambourg)", "Activer le séquestre Mok Trust", "Signer le contrat B2B"],
            "requiredDocs": ["Contrat Commercial B2B", "Accord de Séquestre"],
            "targetModule": "disputes",
            "status": "pending"
          },
          {
            "phaseNumber": 5,
            "title": "5. Commande, Logistique & Fret Maritime",
            "description": "Empotage conteneur, passage douane port de Conakry et expédition",
            "tasks": ["Réserver l'espace conteneur maritime", "Établir le connaissement B/L", "Souscrire l'assurance fret"],
            "requiredDocs": ["Bill of Lading B/L", "Certificat d'Origine EUR.1", "Police d'Assurance"],
            "targetModule": "import_export",
            "status": "pending"
          },
          {
            "phaseNumber": 6,
            "title": "6. Dédouanement Hambourg & Livraison",
            "description": "Formalités import UE, déchargement et livraison chez les 5 distributeurs",
            "tasks": ["Inspection phytosanitaire d'entrée UE", "Livraison dernier kilomètre", "Émargement du bon de réception"],
            "requiredDocs": ["Déclaration Douane Import", "Bon de Livraison"],
            "targetModule": "business",
            "status": "pending"
          },
          {
            "phaseNumber": 7,
            "title": "7. Paiement Sécurisé & Déblocage Séquestre",
            "description": "Libération des fonds après confirmation de conformité acheteur",
            "tasks": ["Constat de réception", "Déblocage des fonds escrow", "Émission de la facture acquittée"],
            "requiredDocs": ["Facture Définitive Acquittée", "Reçu de Paiement"],
            "targetModule": "business",
            "status": "pending"
          },
          {
            "phaseNumber": 8,
            "title": "8. Fidélisation & Réapprovisionnement",
            "description": "Mise en place de commandes récurrentes trimestrielles",
            "tasks": ["Collecte des avis certifiés", "Suivi des stocks distributeurs", "Reconduction des commandes"],
            "requiredDocs": ["Planning Prévisionnel de Réappro"],
            "targetModule": "reputation",
            "status": "pending"
          }
        ]
      }`;

      const parsed = await generateJSON<any>(prompt);
      setGeneratedPlan(parsed);
    } catch (e) {
      console.error(e);
      setGeneratedPlan({
        title: "Exportation & Distribution Miel de Guinée en Allemagne",
        category: "Exportation Agroalimentaire",
        targetMarket: "Allemagne & Marché Européen",
        estimatedBudget: "3 200 EUR",
        timelineWeeks: 6,
        nextBestAction: "Vérifier la conformité de l'étiquetage en langue allemande et émettre le certificat d'origine",
        assignedAgents: [
          { name: "Agent Sourcing & Acheteurs", role: "Prospection", task: "Identifier 10 distributeurs spécialisés bio à Hambourg et Berlin" },
          { name: "Agent Logistique & Fret", role: "Incoterms", task: "Optimiser le coût de transport maritime conteneurisé CIF" },
          { name: "Agent Juridique & Contrat", role: "Conformité", task: "Rédiger le contrat type avec clause de séquestre" }
        ],
        supervisingExperts: ["Dr. Moussa Traoré (Commerce)", "Me. Catherine Laurent (Juridique)"],
        phases: [
          {
            phaseNumber: 1,
            title: "1. Fiche Produit & Normes d'Exportation",
            description: "Labellisation, analyses d'humidité et certificat d'origine",
            tasks: ["Créer la fiche produit multilingue", "Obtenir les analyses phytosanitaires"],
            requiredDocs: ["Fiche Produit", "Certificat d'Origine"],
            targetModule: "catalog",
            status: "in_progress"
          },
          {
            phaseNumber: 2,
            title: "2. Prospection & Mises en Relation B2B",
            description: "Campagne de prospection auprès des importateurs allemands",
            tasks: ["Contacter les 10 distributeurs cibles", "Organiser des rendez-vous Mok Meet"],
            requiredDocs: ["Dossier Commercial"],
            targetModule: "sourcing",
            status: "pending"
          },
          {
            phaseNumber: 3,
            title: "3. Négociation & Sécurisation Escrow",
            description: "Accords sur les prix, Incoterms et paiement échelonné",
            tasks: ["Valider le prix unitaire CIF", "Activer la garantie de paiement"],
            requiredDocs: ["Pro Forma", "Contrat Séquestre"],
            targetModule: "disputes",
            status: "pending"
          },
          {
            phaseNumber: 4,
            title: "4. Expédition, Dédouanement & Livraison",
            description: "Fret maritime, passage en douane et remise des lots",
            tasks: ["Empotage conteneur", "Suivi en mer Conakry-Hambourg", "Confirmation de livraison"],
            requiredDocs: ["Bill of Lading", "Déclaration Douanière"],
            targetModule: "import_export",
            status: "pending"
          }
        ]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartParcours = (targetModule: string) => {
    if (onObjectiveCreated && generatedPlan) {
      onObjectiveCreated(generatedPlan);
    }
    if (onNavigateToSection) {
      onNavigateToSection(targetModule);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full p-6 sm:p-7 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Target size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                  Orchestrateur Diallo OS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-400">Intention → Résultat Réel</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                CRÉER MON OBJECTIF COMMERCIAL & PARCOURS
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Natural Language Objective Input */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            Formulez votre intention ou projet commercial :
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={objectivePrompt}
              onChange={(e) => setObjectivePrompt(e.target.value)}
              placeholder="Ex : Je veux importer 2 conteneurs de panneaux solaires de Chine avec dédouanement et garantie..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleGenerateRoadmap}
              disabled={isGenerating || !objectivePrompt.trim()}
              className="px-5 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Orchestration en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Générer le Parcours 8 Phases</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Plan */}
        {generatedPlan ? (
          <div className="space-y-6 animate-fade-down">
            {/* Summary Banner */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-brand-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block">
                    {generatedPlan.category} • Marché : {generatedPlan.targetMarket}
                  </span>
                  <h3 className="text-lg font-black text-white">{generatedPlan.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold border border-emerald-500/30">
                    Budget : {generatedPlan.estimatedBudget}
                  </span>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-xl font-bold border border-indigo-500/30">
                    Délai : ~{generatedPlan.timelineWeeks} sem.
                  </span>
                </div>
              </div>

              {/* Next Best Action */}
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl flex items-start gap-2.5 text-xs">
                <span className="p-1 rounded bg-indigo-500/30 text-indigo-300 shrink-0 font-bold text-[10px] uppercase">
                  Prochaine Action
                </span>
                <span className="text-indigo-200 font-semibold">{generatedPlan.nextBestAction}</span>
              </div>
            </div>

            {/* Assigned Autonomous Agents & Supervising Experts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agents */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bot size={15} className="text-brand-400" />
                  <span>Agents Commerciaux Autonomes Mobilisés :</span>
                </h4>
                <div className="space-y-2">
                  {generatedPlan.assignedAgents.map((ag, i) => (
                    <div key={i} className="p-2.5 bg-slate-900 rounded-xl border border-white/5 text-xs flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white">{ag.name}</div>
                        <div className="text-[11px] text-slate-400">{ag.task}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-semibold whitespace-nowrap">
                        {ag.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experts */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users size={15} className="text-emerald-400" />
                  <span>Collège d'Experts Superviseurs :</span>
                </h4>
                <div className="space-y-2">
                  {generatedPlan.supervisingExperts.map((exp, i) => (
                    <div key={i} className="p-2.5 bg-slate-900 rounded-xl border border-white/5 text-xs flex items-center justify-between">
                      <span className="font-bold text-white">{exp}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Supervision Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 8-Phase Roadmap */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Feuille de Route Structurée (8 Étapes de l'Intention au Résultat) :
              </h4>
              <div className="space-y-3">
                {generatedPlan.phases.map((phase) => (
                  <div key={phase.phaseNumber} className="p-4 bg-slate-950 rounded-2xl border border-white/5 hover:border-white/15 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-black">
                          {phase.phaseNumber}
                        </span>
                        <h5 className="font-bold text-white text-sm">{phase.title}</h5>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        phase.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 text-slate-400'
                      }`}>
                        {phase.status === 'in_progress' ? 'Phase Active' : 'En Attente'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{phase.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tâches Clés :</span>
                        {phase.tasks.map((t, idx) => (
                          <div key={idx} className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                            <span className="text-emerald-400">✓</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Documents Requis :</span>
                        <div className="flex flex-wrap gap-1">
                          {phase.requiredDocs.map((doc, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 text-[10px]">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={() => handleStartParcours(generatedPlan.phases[0].targetModule)}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
              >
                <Play size={14} />
                <span>Activer cet Objectif Commercial & Démarrer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400 space-y-2">
            <p>Saisissez votre intention commerciale pour générer automatiquement le parcours d'exécution et mobiliser les agents dédiés.</p>
          </div>
        )}
      </div>
    </div>
  );
};
