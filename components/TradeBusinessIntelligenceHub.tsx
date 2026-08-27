import React, { useState } from 'react';
import {
  TrendingUp,
  Globe2,
  Sparkles,
  Bot,
  Compass,
  Building,
  Users,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Search,
  BookOpen,
  PieChart,
  DollarSign,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  ExportOpportunityAnalysis, 
  BusinessClubCommunity 
} from '../types';
import { 
  MOCK_EXPORT_OPPORTUNITY_ANALYSIS, 
  MOCK_BUSINESS_CLUBS,
  MOCK_RELATIONSHIP_NODES,
  MOCK_WATCHDOG_ALERTS
} from '../constants';

interface TradeBusinessIntelligenceHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenLiveRoom?: (sessionTitle: string, participantName: string) => void;
  onNavigateSection?: (section: string) => void;
}

export const TradeBusinessIntelligenceHub: React.FC<TradeBusinessIntelligenceHubProps> = ({
  onOpenExpertChat,
  onOpenLiveRoom,
  onNavigateSection
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'where_to_sell' | 'clubs' | 'world_map'>('briefing');
  
  // Export Opportunity Analysis State
  const [analysisData, setAnalysisData] = useState<ExportOpportunityAnalysis>(MOCK_EXPORT_OPPORTUNITY_ANALYSIS);
  const [selectedProductQuery, setSelectedProductQuery] = useState('Café Arabica & Cacao Bio de Guinée Forestière');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Business Clubs State
  const [clubsList, setClubsList] = useState<BusinessClubCommunity[]>(MOCK_BUSINESS_CLUBS);

  const handleToggleJoinClub = (clubId: string) => {
    setClubsList(clubsList.map(c => {
      if (c.id === clubId) {
        return {
          ...c,
          isJoined: !c.isJoined,
          membersCount: c.isJoined ? c.membersCount - 1 : c.membersCount + 1
        };
      }
      return c;
    }));
  };

  const handleRunNewProductAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisData({
        ...analysisData,
        userProduct: selectedProductQuery,
        targetMarkets: [
          {
            country: 'Émirats Arabes Unis & Arabie Saoudite',
            flag: '🇦🇪',
            demandIndex: 96,
            tariffRate: '5% (Droit Douanier Standard CCG)',
            marketSizeEstimate: '180 M$ / an (Consommation premium & Hôtellerie de luxe à Dubaï & Riyad)',
            regulatoryRequirements: ['Certificat Halal officiel', 'Certificat d\'Origine Chambre de Commerce', 'Traçabilité lot par lot'],
            recommendedStrategy: 'Partenariat avec un distributeur basé à Dubaï Free Zone pour réexportation régionale.',
            isSourceFactOrEstimation: 'source_verifiee'
          },
          ...analysisData.targetMarkets
        ]
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} />
                Business Intelligence & Stratégie Export
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <Globe2 size={13} />
                Couverture 195 Pays & Corridors Commerciaux
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Mon Business International & Décisions Stratégiques
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Briefing matinal IA, identification des marchés porteurs (« Où vendre mon produit ? »), analyse tarifaire factuelle et clubs d'affaires mondiaux.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je souhaite obtenir une analyse stratégique pour l\'exportation de mes produits.')}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/20 flex items-center gap-1.5 transition-all"
            >
              <Bot size={15} />
              Conseiller Stratégie Diallo OS
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'briefing'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles size={15} />
            Briefing Matinal & Tableau de Synthèse
          </button>

          <button
            onClick={() => setActiveTab('where_to_sell')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'where_to_sell'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Search size={15} />
            Où vendre mon produit ? / Analyse Marchés
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'clubs'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users size={15} />
            Clubs d'Affaires & Tribus ({clubsList.length})
          </button>

          <button
            onClick={() => setActiveTab('world_map')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'world_map'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Globe2 size={15} />
            Carte des Opportunités & Flux
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: BRIEFING BUSINESS MATINAL IA & SYNTHÈSE
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          {/* Daily AI Briefing Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Sparkles size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Diallo OS Business Intelligence</span>
                  <h3 className="text-base font-bold text-white">Briefing Commercial du Jour</h3>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Aujourd'hui, 08:30 GMT</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <p>
                <strong className="text-cyan-300">Bonjour Amadou.</strong> Voici vos 3 priorités d'action recommandées pour aujourd'hui :
              </p>
              <ul className="space-y-1.5 text-slate-300 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>3 prospects chauds à relancer</strong> dans la campagne <em>Pharmacies au Sénégal</em> (notamment Pharmacie du Point E pour le créneau Live B2B).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Appel d'offres public Ministère de la Santé :</strong> Date limite de dépôt dans 14 jours, offre technique rédigée à 85%.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Taux de fret maritime Asie-Afrique :</strong> Baisse de 6.5% observée ce matin, moment opportun pour confirmer la commande de machines.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateSection && onNavigateSection('prospection')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                Gérer les Prospects
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => onNavigateSection && onNavigateSection('tenders')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
              >
                Voir l'Appel d'Offres
              </button>
            </div>
          </div>

          {/* Quick Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Réseau Partenaires & Clients</span>
              <div className="text-2xl font-black text-white">{MOCK_RELATIONSHIP_NODES.length}</div>
              <p className="text-[11px] text-emerald-400 font-medium">+2 nouveaux ce mois-ci</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Chiffre d'Affaires Négocié</span>
              <div className="text-2xl font-black text-white">133 500 €</div>
              <p className="text-[11px] text-indigo-400 font-medium">5 contrats en cours</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Appels d'Offres Suivis</span>
              <div className="text-2xl font-black text-amber-400">3</div>
              <p className="text-[11px] text-slate-400 font-medium">Valeur cumulée : 490 k€</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Missions Sur le Terrain</span>
              <div className="text-2xl font-black text-cyan-400">1</div>
              <p className="text-[11px] text-cyan-400 font-medium">Mission Chine active</p>
            </div>
          </div>

          {/* Network Ecosystem Quick Glance */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 size={16} className="text-indigo-400" />
              Nœuds Stratégiques du Réseau Commercial
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOCK_RELATIONSHIP_NODES.map(node => (
                <div key={node.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>{node.flag}</span>
                      <span className="text-xs font-bold text-white">{node.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{node.sector} • {node.type.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-400">{node.totalDealsVolume.toLocaleString()} {node.currency}</span>
                    <span className="block text-[10px] text-emerald-400">{node.relationshipStrength}% score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: OÙ VENDRE MON PRODUIT ? & ANALYSE DE MARCHÉ
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'where_to_sell' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Search size={18} className="text-cyan-400" />
                Assistant d'Orientation Export : « Où Vendre Mon Produit ? »
              </h3>
              <p className="text-xs text-slate-400">
                Saisissez votre produit ou commodité pour obtenir une comparaison des marchés les plus demandeurs, les droits de douane applicables (accords préférentiels) et les règles sanitaires impératives.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                value={selectedProductQuery}
                onChange={(e) => setSelectedProductQuery(e.target.value)}
                placeholder="Ex: Mangues séchées, Beurre de Karité, Logiciel SaaS..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRunNewProductAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all shrink-0"
              >
                <Compass size={15} />
                {isAnalyzing ? 'Calcul IA en cours...' : 'Analyser les Marchés Cibles'}
              </button>
            </div>
          </div>

          {/* Results Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">
                Marchés Mondiaux Prioritaires pour : <span className="text-cyan-400">{analysisData.userProduct}</span>
              </h4>
              <span className="text-xs text-slate-500">Origine : {analysisData.originCountry}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analysisData.targetMarkets.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{m.flag}</span>
                        <div>
                          <h5 className="font-bold text-white text-sm">{m.country}</h5>
                          <span className="text-[10px] text-slate-400">Marché Recommandé</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                        {m.demandIndex}/100 Demande
                      </span>
                    </div>

                    {/* Douane & Taille */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Tarif Douanier :</span>
                        <div className="font-bold text-emerald-400">{m.tariffRate}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Volume / Potentiel :</span>
                        <div className="text-slate-300">{m.marketSizeEstimate}</div>
                      </div>
                    </div>

                    {/* Exigences */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Normes & Certificats :</span>
                      <ul className="space-y-1">
                        {m.regulatoryRequirements.map((r, ri) => (
                          <li key={ri} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <ShieldCheck size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Stratégie */}
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200">
                      <strong>Conseil Diallo OS :</strong> {m.recommendedStrategy}
                    </div>
                  </div>

                  {/* Fact vs Estimation Source Badge */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Info size={11} />
                      {m.isSourceFactOrEstimation === 'source_verifiee' ? (
                        <span className="text-emerald-400 font-semibold">Source Douanière Vérifiée</span>
                      ) : (
                        <span className="text-amber-400 font-semibold">Estimation Statistique IA</span>
                      )}
                    </span>

                    <button
                      onClick={() => onNavigateSection && onNavigateSection('prospection')}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      Prospecter
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: CLUBS D'AFFAIRES & TRIBUS MONDIALES
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'clubs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-cyan-400" />
              Clubs d'Affaires & Cercles d'Échanges B2B
            </h3>
            <p className="text-xs text-slate-400">
              Rejoignez des communautés d'importateurs, exportateurs, directeurs d'usines et professionnels par corridor ou filière sectorielle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clubsList.map(club => (
              <div
                key={club.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="h-32 w-full relative">
                    <img src={club.bannerUrl} alt={club.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-cyan-500/80 text-white text-[10px] font-bold">
                      {club.corridorOrSector}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="font-bold text-white text-base">{club.name}</h4>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {club.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {club.tags.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>👥 {club.membersCount} membres</span>
                      <span>📅 {club.upcomingEventsCount} lives prévus</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleToggleJoinClub(club.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      club.isJoined
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                    }`}
                  >
                    {club.isJoined ? (
                      <>
                        <CheckCircle2 size={14} /> Membre du Club
                      </>
                    ) : (
                      <>
                        <Users size={14} /> Rejoindre le Club
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: CARTE DES FLUX MONDIAUX
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'world_map' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe2 size={18} className="text-cyan-400" />
              Cartographie des Corridors Commerciaux Stratégiques
            </h3>
            <p className="text-xs text-slate-400">
              Visualisation des flux commerciaux actifs connectant l'Afrique de l'Ouest, l'Asie, l'Europe, les Amériques et le Moyen-Orient.
            </p>
          </div>

          {/* Interactive Corridors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white">🇨🇳 Asie ↔ 🇬🇳 Afrique</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Fret Actif</span>
              </div>
              <p className="text-xs text-slate-400">Lignes de production, outillage, emballages et énergie solaire vers Conakry & Dakar.</p>
              <div className="text-[11px] text-cyan-400 font-semibold">Délai maritime moyen : 28-35 jours</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white">🇬🇳 Guinée ↔ 🇪🇺 Europe</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Export Bio</span>
              </div>
              <p className="text-xs text-slate-400">Café Arabica, fèves de cacao et ananas vers Le Havre, Hambourg et Anvers.</p>
              <div className="text-[11px] text-cyan-400 font-semibold">Accords Douaniers : 0% Droit TSA/APE</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white">🌍 Corridor ZLECAF</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">Régional</span>
              </div>
              <p className="text-xs text-slate-400">Commerce intra-africain (Sénégal, Côte d'Ivoire, Guinée, Ghana) sans barrières douanières.</p>
              <div className="text-[11px] text-cyan-400 font-semibold">Tarif TEC CEDEAO : 0%</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white">🇦🇪 Golfe ↔ 🌍 Afrique</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">Hub Transit</span>
              </div>
              <p className="text-xs text-slate-400">Financement d'infrastructures, fret aérien express et négoce de commodités.</p>
              <div className="text-[11px] text-cyan-400 font-semibold">Hub : Dubaï DWC & Jebel Ali</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
