import React, { useState } from 'react';
import { 
    APIProvider, 
    Map, 
    AdvancedMarker, 
    Pin, 
    InfoWindow,
    useMap
} from '@vis.gl/react-google-maps';
import { 
    MapPin, Navigation, Compass, Globe, Search, Building2, 
    GraduationCap, HeartPulse, Briefcase, Home, Phone, Globe2, 
    ExternalLink, Sparkles, Layers, ZoomIn, ZoomOut, Check, ArrowRight
} from 'lucide-react';

// Global Places of Interest for Mobility, Employment, Healthcare, and Education
export interface PlaceOfInterest {
    id: string;
    name: string;
    category: 'embassy' | 'university' | 'hospital' | 'techhub' | 'housing';
    city: string;
    country: string;
    position: { lat: number; lng: number };
    address: string;
    phone?: string;
    website?: string;
    description: string;
    highlights: string[];
    aiAdvice?: string;
}

const PLACES_DATA: PlaceOfInterest[] = [
    // PARIS
    {
        id: 'paris-sorbonne',
        name: 'Sorbonne Université & Campus Pierre et Marie Curie',
        category: 'university',
        city: 'Paris',
        country: 'France',
        position: { lat: 48.8471, lng: 2.3574 },
        address: '4 Place Jussieu, 75005 Paris, France',
        phone: '+33 1 44 27 44 27',
        website: 'https://www.sorbonne-universite.fr',
        description: 'Pôle universitaire d\'excellence mondiale en sciences, lettres et médecine.',
        highlights: ['Programmes Masters & Doctorats', 'Bourses d\'études internationales', 'Service accueil étudiants étrangers'],
        aiAdvice: 'Idéal pour les étudiants en mobilité académique. Préparez votre dossier Campus France dès novembre.'
    },
    {
        id: 'paris-stationf',
        name: 'Station F - Pôle d\'Innovation & Hub Mondial',
        category: 'techhub',
        city: 'Paris',
        country: 'France',
        position: { lat: 48.8344, lng: 2.3712 },
        address: '5 Parvis Alan Turing, 75013 Paris, France',
        website: 'https://stationf.co',
        description: 'Le plus grand campus de startups et d\'entrepreneurs d\'Europe.',
        highlights: ['Incubateurs Tech & IA', 'Visa French Tech', 'Offres d\'emploi développeurs & ingénieurs'],
        aiAdvice: 'Accès privilégié aux opportunités de travail et financement startup via le programme French Tech Visa.'
    },
    {
        id: 'paris-necker',
        name: 'Hôpital Universitaire Necker-Enfants Malades',
        category: 'hospital',
        city: 'Paris',
        country: 'France',
        position: { lat: 48.8451, lng: 2.3160 },
        address: '149 Rue de Sèvres, 75015 Paris, France',
        phone: '+33 1 44 49 40 00',
        website: 'https://hopital-necker.aphp.fr',
        description: 'Centre hospitalier de renommée internationale pour la pédiatrie et les soins spécialisés.',
        highlights: ['Urgences 24/7', 'Centre de référence maladies rares', 'Téléconsultation internationale'],
        aiAdvice: 'Vérifiez votre couverture AME ou convention de sécurité sociale internationale avant consultation.'
    },
    {
        id: 'paris-ambassade-gn',
        name: 'Ambassade de la République de Guinée en France',
        category: 'embassy',
        city: 'Paris',
        country: 'France',
        position: { lat: 48.8744, lng: 2.2789 },
        address: '51 Rue de la Faisanderie, 75116 Paris, France',
        phone: '+33 1 47 04 81 48',
        website: 'https://ambaguinee-france.org',
        description: 'Représentation diplomatique et service consulaire pour visas, passeports et légalisations.',
        highlights: ['Délivrance de passeports biométriques', 'Légalisation de documents', 'Assistance consulaire'],
        aiAdvice: 'Prenez rendez-vous en ligne sur la plateforme consulaire pour vos renouvellements de passeport.'
    },

    // DAKAR
    {
        id: 'dakar-ucad',
        name: 'Université Cheikh Anta Diop (UCAD)',
        category: 'university',
        city: 'Dakar',
        country: 'Sénégal',
        position: { lat: 14.6937, lng: -17.4674 },
        address: 'Avenue Cheikh Anta Diop, Fann, Dakar, Sénégal',
        phone: '+221 33 825 05 30',
        website: 'https://www.ucad.sn',
        description: 'L\'une des universités les plus prestigieuses d\'Afrique de l\'Ouest.',
        highlights: ['Faculté de Médecine réputée', 'Pôle de recherche panafricain', 'Campus numérique'],
        aiAdvice: 'Réseau très actif pour les échanges inter-universitaires en Afrique francophone.'
    },
    {
        id: 'dakar-tech-hub',
        name: 'Dakar Digital City & Centre d\'Innovation',
        category: 'techhub',
        city: 'Dakar',
        country: 'Sénégal',
        position: { lat: 14.7167, lng: -17.4677 },
        address: 'Point E, Dakar, Sénégal',
        website: 'https://innovation.sn',
        description: 'Carrefour de l\'écosystème numérique africain et des talents technologiques.',
        highlights: ['Incubation Fintech', 'Coworking international', 'Hackathons & Formations IA'],
        aiAdvice: 'Idéal pour le recrutement de développeurs fullstack et le développement de partenariats sud-nord.'
    },
    {
        id: 'dakar-ambassade-fr',
        name: 'Consulat Général de France à Dakar',
        category: 'embassy',
        city: 'Dakar',
        country: 'Sénégal',
        position: { lat: 14.6713, lng: -17.4334 },
        address: '1 Rue El Hadji Amadou Assane Ndoye, Dakar, Sénégal',
        phone: '+221 33 839 51 00',
        website: 'https://sn.ambafrance.org',
        description: 'Traitement des demandes de visa Schengen, études en France et services aux ressortissants.',
        highlights: ['Centre de visas VFS Global', 'Espace Campus France Sénégal', 'État civil'],
        aiAdvice: 'Déposez votre demande de visa au minimum 1 mois avant la date prévue de votre départ.'
    },

    // CONAKRY
    {
        id: 'conakry-donka',
        name: 'Centre Hospitalier Universitaire (CHU) de Donka',
        category: 'hospital',
        city: 'Conakry',
        country: 'Guinée',
        position: { lat: 9.5372, lng: -13.6785 },
        address: 'Commune de Dixinn, Conakry, Guinée',
        phone: '+224 622 00 00 00',
        description: 'Hôpital national moderne rénové avec équipements de pointe et centre de traumatologie.',
        highlights: ['Bloc opératoire ultra-moderne', 'Consultations spécialisées', 'Pharmacie centrale'],
        aiAdvice: 'Principal centre hospitalier universitaire de référence en République de Guinée.'
    },
    {
        id: 'conakry-ambassade-fr',
        name: 'Ambassade de France en Guinée et en Sierra Leone',
        category: 'embassy',
        city: 'Conakry',
        country: 'Guinée',
        position: { lat: 9.5168, lng: -13.7087 },
        address: 'Boulevard du Commerce, BP 373, Kaloum, Conakry, Guinée',
        phone: '+224 621 00 00 10',
        website: 'https://gn.ambafrance.org',
        description: 'Services diplomatiques, visas étudiants et projets de coopération économique.',
        highlights: ['Campus France Guinée', 'Coopération bilatérale', 'Service des visas'],
        aiAdvice: 'Passez par Campus France Conakry pour toute candidature vers les universités françaises.'
    },

    // MONTREAL
    {
        id: 'montreal-mcgill',
        name: 'McGill University & Université de Montréal',
        category: 'university',
        city: 'Montréal',
        country: 'Canada',
        position: { lat: 45.5048, lng: -73.5772 },
        address: '845 Sherbrooke St W, Montreal, Quebec H3A 0G4, Canada',
        phone: '+1 514-398-4455',
        website: 'https://www.mcgill.ca',
        description: 'Pôle universitaire bilingue d\'envergure internationale avec programme de bourses.',
        highlights: ['Permis d\'études Canada', 'Bourses d\'excellence', 'Accès direct permis de travail post-diplôme (PTPD)'],
        aiAdvice: 'Le Québec offre des passerelles d\'immigration rapide (PEQ) après l\'obtention du diplôme.'
    },

    // NEW YORK / WASHINGTON / TOKYO / DUBAI
    {
        id: 'dubai-internet-city',
        name: 'Dubai Internet City & Future Hub',
        category: 'techhub',
        city: 'Dubaï',
        country: 'Émirats Arabes Unis',
        position: { lat: 25.0931, lng: 55.1565 },
        address: 'Al Bourooj St, Dubai Internet City, Dubai, UAE',
        website: 'https://dic.ae',
        description: 'Zone franche technologique pour les talents internationaux et entreprises numériques.',
        highlights: ['Golden Visa Émirats (10 ans)', 'Exonération fiscale 100%', 'Hub technologique international'],
        aiAdvice: 'Programme Golden Visa très accessible pour les ingénieurs, docteurs et profils technologiques.'
    }
];

const CITIES = [
    { name: 'Tous', lat: 30.0, lng: 0.0, zoom: 2 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, zoom: 12 },
    { name: 'Dakar', lat: 14.7167, lng: -17.4677, zoom: 12 },
    { name: 'Conakry', lat: 9.5372, lng: -13.6785, zoom: 12 },
    { name: 'Montréal', lat: 45.5017, lng: -73.5673, zoom: 12 },
    { name: 'Dubaï', lat: 25.2048, lng: 55.2708, zoom: 12 },
];

const CATEGORIES = [
    { id: 'all', label: 'Tous les Lieux', icon: Globe },
    { id: 'embassy', label: 'Ambassades & Visas', icon: Building2, color: '#dc2626' },
    { id: 'university', label: 'Universités & Campus', icon: GraduationCap, color: '#2563eb' },
    { id: 'hospital', label: 'Centres de Santé', icon: HeartPulse, color: '#16a34a' },
    { id: 'techhub', label: 'Hubs Emploi & Tech', icon: Briefcase, color: '#9333ea' },
];

export const GoogleMapsExplorer: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('Paris');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlace, setSelectedPlace] = useState<PlaceOfInterest | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 });
    const [mapZoom, setMapZoom] = useState(12);

    const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

    const handleCityChange = (city: typeof CITIES[0]) => {
        setSelectedCity(city.name);
        setMapCenter({ lat: city.lat, lng: city.lng });
        setMapZoom(city.zoom);
    };

    const filteredPlaces = PLACES_DATA.filter(place => {
        const matchesCat = selectedCategory === 'all' || place.category === selectedCategory;
        const matchesCity = selectedCity === 'Tous' || place.city.toLowerCase() === selectedCity.toLowerCase();
        const matchesSearch = searchQuery === '' || 
            place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.country.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && (selectedCity === 'Tous' ? true : matchesCity) && matchesSearch;
    });

    const getPinColor = (category: PlaceOfInterest['category']) => {
        switch (category) {
            case 'embassy': return '#ef4444';
            case 'university': return '#3b82f6';
            case 'hospital': return '#10b981';
            case 'techhub': return '#8b5cf6';
            case 'housing': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    const handleSelectPlace = (place: PlaceOfInterest) => {
        setSelectedPlace(place);
        setMapCenter(place.position);
        setMapZoom(15);
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Explorateur Mondial Google Maps</h1>
                            <p className="text-sm text-slate-500">
                                Cartographie interactive des ambassades, universités, hôpitaux et pôles d'emploi à l'échelle internationale
                            </p>
                        </div>
                    </div>
                </div>

                {/* City quick buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {CITIES.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => handleCityChange(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                selectedCity === c.name
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                    isSelected 
                                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un lieu, ville..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                </div>
            </div>

            {/* Map and Places Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Interactive Google Map */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[540px] relative">
                    <APIProvider apiKey={apiKey} language="fr">
                        <Map
                            mapId="DEMO_MAP_ID"
                            center={mapCenter}
                            zoom={mapZoom}
                            gestureHandling="greedy"
                            disableDefaultUI={false}
                            className="w-full h-full"
                            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                        >
                            {filteredPlaces.map((place) => (
                                <AdvancedMarker
                                    key={place.id}
                                    position={place.position}
                                    onClick={() => setSelectedPlace(place)}
                                    title={place.name}
                                >
                                    <Pin
                                        background={getPinColor(place.category)}
                                        borderColor="#ffffff"
                                        glyphColor="#ffffff"
                                        scale={1.15}
                                    />
                                </AdvancedMarker>
                            ))}

                            {selectedPlace && (
                                <InfoWindow
                                    position={selectedPlace.position}
                                    onCloseClick={() => setSelectedPlace(null)}
                                >
                                    <div className="p-2 max-w-xs font-sans text-slate-800">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600 mb-1">
                                            <MapPin size={12} /> {selectedPlace.city}, {selectedPlace.country}
                                        </div>
                                        <h4 className="font-bold text-xs text-slate-900 leading-snug">{selectedPlace.name}</h4>
                                        <p className="text-[11px] text-slate-500 mt-1">{selectedPlace.address}</p>
                                        
                                        {selectedPlace.phone && (
                                            <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                                                <Phone size={10} className="text-slate-400" /> {selectedPlace.phone}
                                            </div>
                                        )}

                                        {selectedPlace.website && (
                                            <a
                                                href={selectedPlace.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline mt-2"
                                            >
                                                Site officiel <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </InfoWindow>
                            )}
                        </Map>
                    </APIProvider>
                </div>

                {/* Places Details & Listing Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Selected Place Card or AI Mobility Advisor */}
                    {selectedPlace ? (
                        <div className="bg-gradient-to-br from-slate-900 to-brand-900 text-white rounded-3xl p-5 shadow-xl border border-brand-500/30 animate-fade-up">
                            <div className="flex items-center justify-between gap-2">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-blue-300">
                                    {selectedPlace.category}
                                </span>
                                <span className="text-xs text-slate-300 font-medium">
                                    {selectedPlace.city}, {selectedPlace.country}
                                </span>
                            </div>

                            <h3 className="text-base font-bold text-white mt-3 leading-snug">
                                {selectedPlace.name}
                            </h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                {selectedPlace.description}
                            </p>

                            <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                                <div className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
                                    <Sparkles size={12} /> Points Clés & Services
                                </div>
                                <div className="space-y-1">
                                    {selectedPlace.highlights.map((h, i) => (
                                        <div key={i} className="text-xs text-slate-200 flex items-start gap-1.5">
                                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedPlace.aiAdvice && (
                                <div className="mt-4 p-3 bg-brand-900/40 border border-brand-500/30 rounded-2xl text-xs text-brand-100">
                                    <strong className="text-white block font-semibold mb-1">Conseil Mobilité :</strong>
                                    {selectedPlace.aiAdvice}
                                </div>
                            )}

                            <div className="mt-4 pt-2 flex items-center gap-2">
                                {selectedPlace.website && (
                                    <a
                                        href={selectedPlace.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-2 min-h-11 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                    >
                                        <span>Consulter le site</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.position.lat},${selectedPlace.position.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 min-h-11 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                >
                                    <Navigation size={12} />
                                    <span>Itinéraire</span>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                                <Compass size={24} />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">Sélectionnez un point sur la carte</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Cliquez sur un repère ou choisissez un lieu ci-dessous pour afficher les détails consulaires, universitaires et d'emploi.
                            </p>
                        </div>
                    )}

                    {/* Places List */}
                    <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                                Lieux Disponibles ({filteredPlaces.length})
                            </h4>
                            <span className="text-[11px] text-slate-400">Google Maps</span>
                        </div>

                        <div className="space-y-2 mt-3 max-h-[260px] overflow-y-auto pr-1">
                            {filteredPlaces.map(place => (
                                <div
                                    key={place.id}
                                    onClick={() => handleSelectPlace(place)}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={selectedPlace?.id === place.id}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectPlace(place); } }}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                                        selectedPlace?.id === place.id
                                            ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-xs text-slate-900 leading-snug">
                                            {place.name}
                                        </h5>
                                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                            {place.city}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                                        {place.address}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
