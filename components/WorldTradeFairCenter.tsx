import React, { useState } from 'react';
import {
  Globe,
  Building2,
  Video,
  MessageSquare,
  Download,
  CheckCircle2,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Package,
  Calendar,
  Users,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Bot,
  FileText,
  Play,
  Phone,
  Mail,
  Filter,
  PlusCircle,
  Eye,
  Sliders,
  Check,
  Briefcase,
  Layers,
  Award,
  Radio,
  Share2
} from 'lucide-react';
import { 
  VirtualTradeFairBooth, 
  Product, 
  TradeSector, 
  TradeCorridor, 
  FairEvent, 
  B2BMeetingRequest, 
  RelationshipNetworkNode,
  PhysicalTradeFair
} from '../types';
import { 
  MOCK_VIRTUAL_FAIR_BOOTHS, 
  MOCK_TRADE_SECTORS, 
  MOCK_TRADE_CORRIDORS, 
  MOCK_FAIR_EVENTS, 
  MOCK_RELATIONSHIP_NODES,
  MOCK_PHYSICAL_TRADE_FAIRS,
  PRODUCTS 
} from '../constants';

interface WorldTradeFairCenterProps {
  onStartNegotiationWithBooth?: (booth: VirtualTradeFairBooth, product?: Product) => void;
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
  onOpenLiveRoom?: (sessionTitle: string, participantName: string) => void;
}

export const WorldTradeFairCenter: React.FC<WorldTradeFairCenterProps> = ({
  onStartNegotiationWithBooth,
  onOpenExpertChat,
  onOpenMokChatUser,
  onOpenLiveRoom
}) => {
  // Navigation Tabs inside Salon Mondial
  const [salonTab, setSalonTab] = useState<'pavilions' | 'events' | 'smart_tour' | 'physical_fairs' | 'create_stand' | 'b2b_meetings' | 'network_map'>('pavilions');
  
  // Physical Trade Fairs State
  const [physicalFairsList, setPhysicalFairsList] = useState<PhysicalTradeFair[]>(MOCK_PHYSICAL_TRADE_FAIRS);
  const [selectedPhysicalFair, setSelectedPhysicalFair] = useState<PhysicalTradeFair>(MOCK_PHYSICAL_TRADE_FAIRS[0]);
  const [studioToastMessage, setStudioToastMessage] = useState<string | null>(null);
  
  // Filtering states
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Booth Selection & Detail Modal
  const [activeBoothModal, setActiveBoothModal] = useState<VirtualTradeFairBooth | null>(null);
  
  // Smart Tour AI State
  const [smartTourNeed, setSmartTourNeed] = useState<string>('Je cherche des fabricants d\'emballages pharmaceutiques étanches avec vernis UV en Chine ou en Afrique.');
  const [smartTourResults, setSmartTourResults] = useState<VirtualTradeFairBooth[] | null>(null);
  const [isSearchingTour, setIsSearchingTour] = useState(false);

  // Stand Creator Wizard State (6 steps)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [boothForm, setBoothForm] = useState({
    companyName: 'Agro-Export Guinée Forestière',
    country: 'Guinée',
    city: 'Nzérékoré',
    pavilionSector: 'Agroalimentaire & Transformation',
    corridor: 'Afrique ↔ Europe',
    representativeName: 'Amadou Diallo',
    representativeRole: 'Directeur Général',
    description: 'Coopérative agricole spécialisée dans la production et l\'exportation de café Arabica Bio et fèves de cacao grand cru certifié équitable.',
    moq: '500 kg',
    services: 'Échantillonnage express DHL, conditionnement sous vide GrainPro',
    certifications: 'Ecocert Bio, Fairtrade, RCCM Guinée'
  });
  const [standPublished, setStandPublished] = useState(false);

  // Meeting Booking Modal
  const [meetingModalBooth, setMeetingModalBooth] = useState<VirtualTradeFairBooth | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    subject: 'Négociation commande annuelle & conditions FOB/CIF Conakry',
    date: '2026-05-14',
    time: '14:00 GMT',
    language: 'Français',
    participantsCount: 2
  });
  const [meetingSuccessMessage, setMeetingSuccessMessage] = useState<string | null>(null);
  const [activeLiveB2BMeeting, setActiveLiveB2BMeeting] = useState<B2BMeetingRequest | null>(null);

  // List of all active booths
  const [boothsList, setBoothsList] = useState<VirtualTradeFairBooth[]>(MOCK_VIRTUAL_FAIR_BOOTHS);
  const [meetingsList, setMeetingsList] = useState<B2BMeetingRequest[]>([
    {
      id: 'mtg-1',
      boothId: 'booth-1-sinopack',
      companyName: 'SinoPack Industrial Ltd',
      requesterId: 'u1',
      requesterName: 'Dr. Mamadou Diallo',
      requesterEmail: 'm.diallo@pharma-conakry.gn',
      requesterCountry: 'Guinée',
      requesterFlag: '🇬🇳',
      subject: 'Spécifications techniques boîtes vernis UV tropicalisé & test salle blanche',
      proposedSlotDate: '15 Mai 2026',
      proposedSlotTime: '10:30 GMT',
      language: 'Français & Anglais (Traduction simultanée Diallo OS)',
      participantsCount: 3,
      isLiveMokMeeting: true,
      status: 'accepted',
      createdAt: 'Hier à 14:00'
    }
  ]);

  // Filter booths
  const filteredBooths = boothsList.filter(b => {
    const matchSector = selectedSector === 'all' || b.pavilionSector === selectedSector;
    const matchCorridor = selectedCorridor === 'all' || b.corridor === selectedCorridor;
    const matchCountry = selectedCountry === 'all' || b.country === selectedCountry;
    const matchSearch = b.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.pavilionSector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSector && matchCorridor && matchCountry && matchSearch;
  });

  // Run Smart Tour
  const handleRunSmartTour = () => {
    setIsSearchingTour(true);
    setTimeout(() => {
      setSmartTourResults(boothsList);
      setIsSearchingTour(false);
    }, 800);
  };

  // Submit Stand Wizard
  const handlePublishStand = () => {
    const newBooth: VirtualTradeFairBooth = {
      id: `booth-custom-${Date.now()}`,
      fairName: 'Salon Mondial B2B Export & Machines 2026',
      companyName: boothForm.companyName,
      logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&fit=crop',
      country: boothForm.country,
      countryFlag: boothForm.country === 'Guinée' ? '🇬🇳' : '🌍',
      city: boothForm.city,
      pavilionSector: boothForm.pavilionSector,
      corridor: boothForm.corridor,
      isLiveNow: false,
      boothRepresentativeName: boothForm.representativeName,
      representativeRole: boothForm.representativeRole,
      description: boothForm.description,
      featuredProducts: PRODUCTS.slice(0, 2),
      servicesOffered: boothForm.services.split(','),
      catalogueDownloadUrl: '#',
      instantChatAvailable: true,
      minOrderQuantityGuideline: boothForm.moq,
      isPlatformVerified: true,
      verifiedCertifications: [
        { code: 'CERT-VERIF', label: 'Entreprise Enregistrée', issuer: 'Vérification IA Diallo OS', isVerified: true }
      ]
    };
    setBoothsList([newBooth, ...boothsList]);
    setStandPublished(true);
    setSalonTab('pavilions');
  };

  // Book B2B Meeting
  const handleConfirmMeeting = () => {
    if (!meetingModalBooth) return;
    const newMeeting: B2BMeetingRequest = {
      id: `mtg-${Date.now()}`,
      boothId: meetingModalBooth.id,
      companyName: meetingModalBooth.companyName,
      requesterId: 'u1',
      requesterName: 'Amadou Diallo',
      requesterEmail: 'amadou.diallo@lemondeavous.com',
      requesterCountry: 'Guinée',
      requesterFlag: '🇬🇳',
      subject: meetingForm.subject,
      proposedSlotDate: meetingForm.date,
      proposedSlotTime: meetingForm.time,
      language: meetingForm.language,
      participantsCount: meetingForm.participantsCount,
      isLiveMokMeeting: true,
      status: 'accepted',
      createdAt: 'À l\'instant'
    };
    setMeetingsList([newMeeting, ...meetingsList]);
    setMeetingSuccessMessage(`Rendez-vous B2B confirmé avec ${meetingModalBooth.companyName} ! Créneau ajouté au calendrier et salle Live B2B réservée.`);
    setMeetingModalBooth(null);
    setTimeout(() => setMeetingSuccessMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Top Hero / Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Globe size={320} />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              Infrastructure Économique Globale
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              16 Pavillons Permanents & Salons Événementiels Ouverts
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Salon Mondial Virtuel B2B
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Rencontrez des fabricants, coopératives et acheteurs certifiés du monde entier. Visitez les stands 3D, assistez à des démonstrations Live avec traduction instantanée et concluez vos contrats d'import-export en toute sécurité.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setSalonTab('smart_tour')}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-102"
            >
              <Bot size={16} className="text-amber-300" />
              Visite Intelligente par IA
            </button>
            <button
              onClick={() => {
                setWizardStep(1);
                setSalonTab('create_stand');
              }}
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 backdrop-blur-sm flex items-center gap-2 transition-all"
            >
              <PlusCircle size={16} />
              Créer le Stand de mon Entreprise (6 étapes)
            </button>
            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je souhaite préparer ma prospection et mes négociations pour le Salon Mondial.')}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Briefcase size={14} />
              Conseiller Salon Diallo OS
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {meetingSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs sm:text-sm font-semibold animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span>{meetingSuccessMessage}</span>
          </div>
          <button onClick={() => setMeetingSuccessMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 🧭 Secondary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSalonTab('pavilions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'pavilions'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 size={16} />
          Pavillons & Stands ({filteredBooths.length})
        </button>

        <button
          onClick={() => setSalonTab('events')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'events'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calendar size={16} />
          Salons Événementiels & Conférences ({MOCK_FAIR_EVENTS.length})
        </button>

        <button
          onClick={() => setSalonTab('smart_tour')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'smart_tour'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles size={16} className="text-amber-400" />
          Visite Intelligente IA
        </button>

        <button
          onClick={() => setSalonTab('physical_fairs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'physical_fairs'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award size={16} className="text-amber-400" />
          Foires Physiques Mondiales & Studio ({physicalFairsList.length})
        </button>

        <button
          onClick={() => setSalonTab('b2b_meetings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'b2b_meetings'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Radio size={16} className="text-rose-400" />
          Mes Rendez-vous & Lives B2B ({meetingsList.length})
        </button>

        <button
          onClick={() => setSalonTab('network_map')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'network_map'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Share2 size={16} />
          Carte Relationnelle Entreprise
        </button>

        <button
          onClick={() => setSalonTab('create_stand')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            salonTab === 'create_stand'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PlusCircle size={16} />
          Créer un Stand
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: PAVILLONS & STANDS VIRTUELS
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'pavilions' && (
        <div className="space-y-6">
          {/* Corridors Commercial Filters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-400" />
                Corridors Commerciaux Stratégiques
              </span>
              <span className="text-xs text-indigo-400">Flux d'affaires sécurisés</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCorridor('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCorridor === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tous les Corridors
              </button>
              {MOCK_TRADE_CORRIDORS.map(cor => (
                <button
                  key={cor.id}
                  onClick={() => setSelectedCorridor(cor.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedCorridor === cor.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cor.flags}</span>
                  <span>{cor.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 opacity-70">
                    {cor.activeExhibitors}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sector & Search Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Sector Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-thin">
              <button
                onClick={() => setSelectedSector('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSector === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tous les Secteurs (16)
              </button>
              {MOCK_TRADE_SECTORS.slice(0, 7).map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSector(sec.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedSector === sec.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sec.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher exposant, machine, pays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Stands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooths.map(booth => (
              <div
                key={booth.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden flex flex-col shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Banner & Live Badge */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-800">
                  <img
                    src={booth.bannerUrl}
                    alt={booth.companyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/20 to-transparent" />
                  
                  {booth.isLiveNow && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-lg animate-pulse">
                      <Radio size={12} />
                      Live Stand Démo
                    </div>
                  )}

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold flex items-center gap-1.5">
                    <span>{booth.countryFlag}</span>
                    <span>{booth.country}</span>
                  </div>

                  {/* Logo overlay */}
                  <div className="absolute -bottom-4 left-5 w-12 h-12 rounded-2xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-lg">
                    <img src={booth.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Booth Body */}
                <div className="pt-6 p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                        {booth.companyName}
                      </h3>
                      {booth.isPlatformVerified && (
                        <ShieldCheck size={18} className="text-emerald-400 shrink-0" title="Vérification Entreprise Complète" />
                      )}
                    </div>
                    
                    <p className="text-xs text-indigo-400 font-medium mt-0.5">
                      {booth.pavilionSector} {booth.corridor ? `• ${booth.corridor}` : ''}
                    </p>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {booth.description}
                    </p>

                    {/* Certifications tags */}
                    {booth.verifiedCertifications && booth.verifiedCertifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {booth.verifiedCertifications.slice(0, 2).map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 size={10} />
                            {cert.code}
                          </span>
                        ))}
                        {booth.minOrderQuantityGuideline && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            MOQ: {booth.minOrderQuantityGuideline}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveBoothModal(booth)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye size={14} />
                      Visiter le Stand
                    </button>

                    <button
                      onClick={() => setMeetingModalBooth(booth)}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Calendar size={14} />
                      Prendre RDV
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: SALONS ÉVÉNEMENTIELS & CONFÉRENCES
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'events' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {MOCK_FAIR_EVENTS.map(event => (
              <div
                key={event.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-xl"
              >
                <div className="relative h-48 w-full">
                  <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    {event.isOngoing ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                        <Radio size={12} />
                        En Cours Maintenant
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-indigo-500/80 text-white text-xs font-bold">
                        À Venir
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-xs font-semibold">
                      {event.durationDays} jours
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg sm:text-xl font-black text-white">{event.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{event.subtitle}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg">
                        <Calendar size={13} className="text-indigo-400" />
                        {event.startDate} - {event.endDate}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg">
                        <Building2 size={13} className="text-indigo-400" />
                        {event.exhibitorsCount} exposants
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg">
                        <Video size={13} className="text-rose-400" />
                        {event.liveDemosCount} démos en direct
                      </span>
                    </div>

                    {/* Conferences list */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Conférences & Keynotes du Salon
                      </h4>
                      {event.conferences.map(conf => (
                        <div
                          key={conf.id}
                          className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-400">{conf.time}</span>
                              {conf.isLive && (
                                <span className="px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black animate-pulse">
                                  EN DIRECT
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-white">{conf.title}</p>
                            <p className="text-[11px] text-slate-400">{conf.speaker} • {conf.speakerTitle}</p>
                          </div>
                          
                          <button
                            onClick={() => onOpenLiveRoom && onOpenLiveRoom(conf.title, conf.speaker)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 transition-colors"
                          >
                            <Play size={12} />
                            Assister
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSector(event.sectors[0] || 'all');
                      setSalonTab('pavilions');
                    }}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    Explorer les Stands de ce Salon
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: VISITE INTELLIGENTE IA & ASSISTANT DE SALON
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'smart_tour' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl">
                <Bot size={28} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Assistant Diallo OS — Visite de Salon Sur-Mesure
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Décrivez votre recherche en langage naturel. L'assistant filtre les exposants vérifiés, compare les faits réels (certifications, capacité usine) et prépare vos rendez-vous.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Votre besoin d'approvisionnement ou de partenariat :
              </label>
              <div className="relative">
                <textarea
                  value={smartTourNeed}
                  onChange={(e) => setSmartTourNeed(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none leading-relaxed"
                  placeholder="Ex : Je cherche une ligne d'embouteillage semi-automatique pour jus de fruits avec budget de 25 000€ et livraison à Conakry..."
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Distinction stricte entre faits vérifiés et estimations</span>
              </div>
              <button
                onClick={handleRunSmartTour}
                disabled={isSearchingTour}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                {isSearchingTour ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyse des 16 Pavillons...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-300" />
                    Générer mon Itinéraire de Visite IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results of Smart Tour */}
          {smartTourResults && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Stands Recommandés & Correspondance IA ({smartTourResults.length})
                </h4>
                <span className="text-xs text-indigo-400 font-semibold">Trier par score de pertinence</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {smartTourResults.map(booth => (
                  <div
                    key={booth.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={booth.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <h5 className="font-bold text-white text-sm">{booth.companyName}</h5>
                            <p className="text-xs text-indigo-400">{booth.countryFlag} {booth.country} • {booth.pavilionSector}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black">
                          94% Match
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {booth.description}
                      </p>

                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Faits vérifiés :</span>
                          <span className="text-emerald-400 font-bold">ISO 9001, BPF, Agrément Export</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Capacité déclarée :</span>
                          <span className="text-white font-semibold">200k unités / mois</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setActiveBoothModal(booth)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                      >
                        Voir Fiche Complète
                      </button>
                      <button
                        onClick={() => setMeetingModalBooth(booth)}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        Planifier Entretien B2B
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: CRÉATION DE STAND VIRTUEL (WIZARD 6 ÉTAPES + STUDIO)
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'create_stand' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Créateur de Stand Virtuel — « Diallo, aide-moi à présenter mon entreprise »
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exposez vos produits et services aux acheteurs et partenaires du monde entier.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              Étape {wizardStep} sur 6
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-6 gap-2">
            {[
              '1. Identité',
              '2. Activité',
              '3. Produits',
              '4. Photos & Médias',
              '5. Capacité & MOQ',
              '6. Marchés Cibles'
            ].map((stepLabel, idx) => {
              const stepNum = idx + 1;
              const isDone = stepNum < wizardStep;
              const isCurrent = stepNum === wizardStep;
              return (
                <button
                  key={stepNum}
                  onClick={() => setWizardStep(stepNum)}
                  className={`p-2 rounded-xl text-center text-[11px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  {stepLabel}
                </button>
              );
            })}
          </div>

          {/* Wizard Step Forms */}
          <div className="space-y-4 pt-2">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Étape 1 : Identité de l'entreprise</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Nom de l'entreprise / Coopérative</label>
                    <input
                      type="text"
                      value={boothForm.companyName}
                      onChange={(e) => setBoothForm({ ...boothForm, companyName: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300">Pays & Ville du Siège</label>
                    <input
                      type="text"
                      value={`${boothForm.country} - ${boothForm.city}`}
                      onChange={(e) => setBoothForm({ ...boothForm, city: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Étape 2 : Activité & Pavillon sectoriel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Pavillon Sectoriel</label>
                    <select
                      value={boothForm.pavilionSector}
                      onChange={(e) => setBoothForm({ ...boothForm, pavilionSector: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {MOCK_TRADE_SECTORS.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300">Corridor Stratégique Privilégié</label>
                    <select
                      value={boothForm.corridor}
                      onChange={(e) => setBoothForm({ ...boothForm, corridor: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {MOCK_TRADE_CORRIDORS.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Pitch & Présentation de votre Entreprise</label>
                  <textarea
                    rows={3}
                    value={boothForm.description}
                    onChange={(e) => setBoothForm({ ...boothForm, description: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Étape 3 : Produits & Services proposés</h4>
                <div>
                  <label className="text-xs font-bold text-slate-300">Services & Facilités offertes</label>
                  <input
                    type="text"
                    value={boothForm.services}
                    onChange={(e) => setBoothForm({ ...boothForm, services: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>Lier automatiquement les produits déjà saisis dans Marché Mondial</span>
                  </div>
                  <span className="font-bold">2 produits B2B associés</span>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Étape 4 : Visuels, Bannière & Médias (Studio Créatif)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Bannière HD du Stand</span>
                    <div className="h-28 rounded-xl bg-slate-900 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700">
                      Bannière générée par le Studio
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Vidéo de Démonstration / Reels</span>
                    <div className="h-28 rounded-xl bg-slate-900 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700">
                      Module Reels du Stand activé
                    </div>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Étape 5 : Capacité de production & Quantité Minimale (MOQ)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Quantité Minimale de Commande (MOQ)</label>
                    <input
                      type="text"
                      value={boothForm.moq}
                      onChange={(e) => setBoothForm({ ...boothForm, moq: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300">Certifications & Normes Vérifiables</label>
                    <input
                      type="text"
                      value={boothForm.certifications}
                      onChange={(e) => setBoothForm({ ...boothForm, certifications: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 6 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Étape 6 : Représentant & Validation Finale</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Nom du Représentant au Stand</label>
                    <input
                      type="text"
                      value={boothForm.representativeName}
                      onChange={(e) => setBoothForm({ ...boothForm, representativeName: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300">Fonction Commerciale</label>
                    <input
                      type="text"
                      value={boothForm.representativeRole}
                      onChange={(e) => setBoothForm({ ...boothForm, representativeRole: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
              disabled={wizardStep === 1}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition-colors"
            >
              Précédent
            </button>

            {wizardStep < 6 ? (
              <button
                onClick={() => setWizardStep(wizardStep + 1)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                Suivant
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handlePublishStand}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-all"
              >
                <CheckCircle2 size={16} />
                Publier mon Stand Virtuel au Salon Mondial
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: MES RENDEZ-VOUS & LIVES B2B
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'b2b_meetings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Rencontres B2B & Sessions Live Négociation
              </h3>
              <p className="text-xs text-slate-400">
                Entretiens vidéo/audio avec traduction simultanée Diallo OS, partage de documents et compte-rendu instantané.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              {meetingsList.length} Entretien(s) Programmé(s)
            </span>
          </div>

          <div className="space-y-4">
            {meetingsList.map(mtg => (
              <div
                key={mtg.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                        Rendez-vous Confirmé
                      </span>
                      <span className="text-xs text-slate-400">Réf : {mtg.id}</span>
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Entretien avec {mtg.companyName}
                    </h4>
                    <p className="text-xs text-slate-300">{mtg.subject}</p>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <div className="text-xs font-bold text-indigo-400 flex items-center sm:justify-end gap-1.5">
                      <Calendar size={13} />
                      {mtg.proposedSlotDate} à {mtg.proposedSlotTime}
                    </div>
                    <p className="text-[11px] text-slate-400">{mtg.language}</p>
                  </div>
                </div>

                {/* Features of Live Room */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-rose-400 animate-pulse" />
                    <span>Salle Live B2B Sécurisée avec Traducteur IA activé</span>
                  </div>
                  <span className="text-slate-300 font-semibold">{mtg.participantsCount} participants</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', `Je prépare mon entretien B2B avec ${mtg.companyName} pour le sujet : ${mtg.subject}`)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Briefcase size={14} />
                    Briefing Négociation IA
                  </button>
                  <button
                    onClick={() => onOpenLiveRoom && onOpenLiveRoom(`Salon B2B - ${mtg.companyName}`, mtg.companyName)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Video size={15} />
                    Rejoindre le Live B2B Meeting
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: CARTE RELATIONNELLE ENTREPRISE (RÉSEAU B2B)
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'network_map' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Carte Relationnelle Privée de l'Entreprise
                </h3>
                <p className="text-xs text-slate-400">
                  Cartographie confidentielle de vos clients, fournisseurs, partenaires et distributeurs issus du Salon Mondial.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                5 Nœuds Actifs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_RELATIONSHIP_NODES.map(node => (
                <div
                  key={node.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{node.flag}</span>
                      <span>{node.name}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      node.type === 'client' ? 'bg-emerald-500/20 text-emerald-300' :
                      node.type === 'supplier' ? 'bg-blue-500/20 text-blue-300' :
                      node.type === 'distributor' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {node.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{node.sector} • {node.country}</p>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Force relationnelle :</span>
                      <span className="text-emerald-400 font-bold">{node.relationshipStrength}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume cumulé d'affaires :</span>
                      <span className="text-white font-semibold">{node.totalDealsVolume.toLocaleString()} {node.currency}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Dernier échange : {node.lastInteractionDate}</span>
                    <button
                      onClick={() => onOpenMokChatUser && onOpenMokChatUser(`u-${node.id}`, node.name)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <MessageSquare size={12} />
                      Mok Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: FOIRES PHYSIQUES MONDIALES & STUDIO DE PRÉPARATION
         ══════════════════════════════════════════════════════════════════════ */}
      {salonTab === 'physical_fairs' && (
        <div className="space-y-6">
          {studioToastMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{studioToastMessage}</span>
              </div>
              <button onClick={() => setStudioToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Award size={14} />
                  Salons Professionnels Internationaux Physiques
                </span>
                <h3 className="text-xl font-bold text-white">
                  Participez aux Grandes Foires Mondiales avec Diallo OS Studio
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Préparez vos supports d'exposition (Roll-up, catalogue export bilingue, vidéo teaser, cartes connectées avec QR code stand virtuel) et gérez vos accréditations.
                </p>
              </div>
            </div>
          </div>

          {/* Fairs Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {physicalFairsList.map(fair => (
              <div
                key={fair.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg hover:border-indigo-500/40 transition-all"
              >
                <div className="space-y-4">
                  {/* Fair Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{fair.countryFlag}</span>
                        <div>
                          <h4 className="font-bold text-white text-base">{fair.name}</h4>
                          <p className="text-xs text-indigo-400 font-semibold">{fair.acronym} • {fair.city}, {fair.country}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      fair.isRegistered ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {fair.isRegistered ? '✓ Accrédité' : 'Inscriptions Ouvertes'}
                    </span>
                  </div>

                  {/* Dates & Location */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Dates Officielles :</span>
                      <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                        <Calendar size={13} className="text-amber-400" />
                        {fair.dates}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Lieu & Parc :</span>
                      <span className="text-slate-300 flex items-center gap-1 mt-0.5">
                        <MapPin size={13} className="text-indigo-400" />
                        {fair.venue}
                      </span>
                    </div>
                  </div>

                  {/* Details stats */}
                  <div className="text-xs text-slate-400 space-y-1">
                    <p><strong>Filière :</strong> {fair.sector}</p>
                    <p><strong>Affluence Attendue :</strong> {fair.expectedExhibitors} & {fair.expectedVisitors}</p>
                    <p><strong>Organisateur :</strong> {fair.organizer}</p>
                  </div>

                  {/* Studio Preparation Items Checklist */}
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      Kit de Communication Studio Diallo OS :
                    </span>
                    <div className="space-y-1.5">
                      {fair.studioPreparationItems.map(item => (
                        <div key={item.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.isGenerated ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className="text-white font-medium">{item.label}</span>
                          </div>
                          {item.isGenerated ? (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Prêt
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPhysicalFairsList(physicalFairsList.map(f => {
                                  if (f.id === fair.id) {
                                    return {
                                      ...f,
                                      studioPreparationItems: f.studioPreparationItems.map(it => it.id === item.id ? { ...it, isGenerated: true } : it)
                                    };
                                  }
                                  return f;
                                }));
                                setStudioToastMessage(`Support « ${item.label} » généré avec succès en haute définition avec QR code connecté !`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all"
                            >
                              Générer Studio
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={fair.officialWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Site Officiel
                    <ExternalLink size={12} />
                  </a>

                  <button
                    onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', `Je prépare ma participation physique à la foire ${fair.name} (${fair.city}, ${fair.country}). Pouvez-vous m'accompagner sur la logistique d'échantillons et le planning des RDV ?`)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Bot size={14} />
                    Préparer avec l'IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: VISITE DÉTAILLÉE D'UN STAND
         ══════════════════════════════════════════════════════════════════════ */}
      {activeBoothModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]">
            {/* Modal Header with Banner */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900">
              <img src={activeBoothModal.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/40 to-transparent" />
              
              <button
                onClick={() => setActiveBoothModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={activeBoothModal.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-800 shadow-xl" />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{activeBoothModal.companyName}</h3>
                    <p className="text-xs text-indigo-300">{activeBoothModal.countryFlag} {activeBoothModal.city}, {activeBoothModal.country} • {activeBoothModal.pavilionSector}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Description & Representative */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Présentation du Fabricant</h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {activeBoothModal.description}
                  </p>

                  {/* Services & Facilities */}
                  {activeBoothModal.servicesOffered && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-bold text-slate-400">Services & Atouts Clés :</h5>
                      <div className="flex flex-wrap gap-2">
                        {activeBoothModal.servicesOffered.map((srv, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            ✓ {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Representative Card */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Représentant au Stand</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{activeBoothModal.boothRepresentativeName}</p>
                    <p className="text-xs text-indigo-400">{activeBoothModal.representativeRole || 'Directeur Export'}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    {activeBoothModal.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-indigo-400" />
                        <span>{activeBoothModal.contactPhone}</span>
                      </div>
                    )}
                    {activeBoothModal.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-indigo-400" />
                        <span>{activeBoothModal.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified Certifications */}
              {activeBoothModal.verifiedCertifications && activeBoothModal.verifiedCertifications.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    Certifications Officielles Vérifiées
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeBoothModal.verifiedCertifications.map((cert, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/20 space-y-1">
                        <span className="text-xs font-black text-emerald-300">{cert.code}</span>
                        <p className="text-[11px] text-white font-semibold">{cert.label}</p>
                        <p className="text-[10px] text-slate-400">Délivré par : {cert.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Products */}
              {activeBoothModal.featuredProducts && activeBoothModal.featuredProducts.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Produits Exposés au Stand ({activeBoothModal.featuredProducts.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeBoothModal.featuredProducts.map(prod => (
                      <div key={prod.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={prod.image} alt={prod.title} className="w-12 h-12 rounded-xl object-cover" />
                          <div>
                            <h5 className="font-bold text-white text-xs">{prod.title}</h5>
                            <p className="text-xs text-indigo-400 font-semibold">{prod.price} {prod.currency || 'EUR'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (onStartNegotiationWithBooth) onStartNegotiationWithBooth(activeBoothModal, prod);
                            setActiveBoothModal(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-colors"
                        >
                          Demander Devis
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => onOpenMokChatUser && onOpenMokChatUser(`booth-user-${activeBoothModal.id}`, activeBoothModal.companyName)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <MessageSquare size={16} />
                Mok Chat Instantané
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setMeetingModalBooth(activeBoothModal);
                    setActiveBoothModal(null);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-md"
                >
                  <Calendar size={16} />
                  Réserver un Entretien B2B
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: PRISE DE RENDEZ-VOUS B2B
         ══════════════════════════════════════════════════════════════════════ */}
      {meetingModalBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Planifier un Rendez-vous B2B</h3>
                  <p className="text-xs text-slate-400">Avec {meetingModalBooth.companyName}</p>
                </div>
              </div>
              <button onClick={() => setMeetingModalBooth(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300">Objet de la réunion</label>
                <input
                  type="text"
                  value={meetingForm.subject}
                  onChange={(e) => setMeetingForm({ ...meetingForm, subject: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300">Date souhaitée</label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Heure (GMT)</label>
                  <input
                    type="text"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Langue de l'échange</label>
                <select
                  value={meetingForm.language}
                  onChange={(e) => setMeetingForm({ ...meetingForm, language: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Mandarin">Mandarin (avec Traduction IA)</option>
                  <option value="Bilingue Français/Anglais">Bilingue Français / Anglais</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setMeetingModalBooth(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmMeeting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                Confirmer la Demande de RDV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
