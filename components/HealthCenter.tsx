
import React, { useState } from 'react';
import { HeartPulse, ShieldAlert, Stethoscope, AlertTriangle, Phone, Activity, Globe, Thermometer, User, FileText, CheckCircle, Volume2 } from 'lucide-react';
import { aiService } from '../services/ai'; // Import du Service Central
import { SymptomAnalysis, UserProfile, Country } from '../types';
import { COUNTRIES } from '../constants';
import { EmptyStateGuide } from './ui/EmptyStateGuide';

interface HealthCenterProps {
    userProfile: UserProfile;
}

type GeoState = {
    status: 'idle' | 'loading' | 'success' | 'error';
    lat?: number;
    lon?: number;
    accuracy?: number;
    message?: string;
};

export const HealthCenter: React.FC<HealthCenterProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'check' | 'sos' | 'profile'>('check');

    // Symptom Checker State
    const [symptoms, setSymptoms] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SymptomAnalysis | null>(null);

    // SOS State
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(COUNTRIES[0]); // Default France
    const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });

    // Translation State (TTS for Allergies)
    const [isTranslating, setIsTranslating] = useState(false);

    const handleSymptomAnalysis = async () => {
        if (!symptoms.trim()) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            // Utilisation du Service IA Centralisé
            const prompt = `Agis comme Docteur Diallo (Expert Santé - Info seulement).
            Analyse ces symptômes décrits par un utilisateur : "${symptoms}".
            
            Règles de sécurité :
            - Si douleur poitrine, difficulté respiratoire ou signes AVC -> "high"
            - Si doute -> "medium"
            - Sinon -> "low"
            `;

            // Utilisation de la méthode typée et sécurisée generateJson
            const result = await aiService.generateJson<SymptomAnalysis>(
                'gemini-2.5-flash',
                prompt,
                `{
                    "urgencyLevel": "low" | "medium" | "high",
                    "summary": "Résumé en 1 phrase",
                    "advice": "Conseils pratiques immédiats",
                    "specialist": "Quel type de médecin voir (Généraliste, Urgences, Dentiste...)",
                    "disclaimer": "Rappel que ceci n'est pas un diagnostic médical réel."
                }`
            );

            setAnalysisResult(result);
        } catch (e) {
            console.error("Health Analysis Error", e);
            alert("Erreur d'analyse. Veuillez réessayer plus tard.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSpeakMedicalInfo = () => {
        if (!userProfile.medical) return;

        const { bloodType, allergies, conditions } = userProfile.medical;
        const spokenParts = [
            bloodType ? `Groupe sanguin : ${bloodType}.` : '',
            allergies.length > 0 ? `Allergies : ${allergies.join(', ')}.` : 'Aucune allergie connue.',
            conditions.length > 0 ? `Conditions médicales : ${conditions.join(', ')}.` : ''
        ].filter(Boolean).join(' ');

        if (!('speechSynthesis' in window)) {
            alert("La lecture à voix haute n'est pas prise en charge par ce navigateur.");
            return;
        }

        setIsTranslating(true);
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenParts);
        utterance.lang = 'fr-FR';
        utterance.onend = () => setIsTranslating(false);
        utterance.onerror = () => setIsTranslating(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleLocateMe = () => {
        if (!('geolocation' in navigator)) {
            setGeoState({ status: 'error', message: "Géolocalisation non disponible sur cet appareil." });
            return;
        }
        setGeoState({ status: 'loading' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGeoState({
                    status: 'success',
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                });
            },
            () => {
                setGeoState({ status: 'error', message: "Position indisponible. Vérifiez l'autorisation de localisation dans votre navigateur." });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            {/* Header Unified Institutional */}
            <div className="bg-white border-b border-slate-200 text-slate-900 px-6 py-6 shadow-xs">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-blue-900 font-bold uppercase text-[11px] tracking-wider mb-1">
                            <Activity size={14} className="text-blue-700 animate-pulse" /> Santé & Urgences Mondiales
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Santé & Accompagnement Médical</h1>
                        <p className="text-xs text-slate-600 max-w-xl mt-1">
                            Orientation santé, triage intelligent et accès immédiat aux numéros d'urgence internationaux.
                        </p>
                    </div>
                    
                    <div role="tablist" aria-label="Sections Santé" className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          role="tab"
                          aria-selected={activeTab === 'check'}
                          onClick={() => setActiveTab('check')}
                          className={`min-h-11 px-4 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${activeTab === 'check' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                        >
                            Triage & Conseils
                        </button>
                        <button
                          role="tab"
                          aria-selected={activeTab === 'sos'}
                          onClick={() => setActiveTab('sos')}
                          className={`min-h-11 px-4 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600 ${activeTab === 'sos' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                        >
                            SOS Monde
                        </button>
                        <button
                          role="tab"
                          aria-selected={activeTab === 'profile'}
                          onClick={() => setActiveTab('profile')}
                          className={`min-h-11 px-4 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${activeTab === 'profile' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                        >
                            Mon Carnet
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    
                    {/* SYMPTOM CHECKER TAB */}
                    {activeTab === 'check' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm">
                                    <h2 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-2">
                                        <Stethoscope size={24} /> Décrivez vos symptômes
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-4">
                                        L'IA analyse vos symptômes pour évaluer l'urgence. <span className="font-bold text-red-500">En cas d'urgence vitale, appelez le 15 ou 112 immédiatement.</span>
                                    </p>
                                    <textarea 
                                        value={symptoms}
                                        onChange={(e) => setSymptoms(e.target.value)}
                                        placeholder="Ex: J'ai une fièvre de 39°C depuis 2 jours, mal à la gorge et des courbatures..."
                                        className="w-full h-40 p-4 bg-teal-50 border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none"
                                    />
                                    <button
                                        onClick={handleSymptomAnalysis}
                                        disabled={isAnalyzing || !symptoms}
                                        className={`w-full mt-4 min-h-11 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600
                                            ${isAnalyzing || !symptoms
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                                    >
                                        {isAnalyzing ? <Activity className="animate-spin" /> : <HeartPulse />}
                                        {isAnalyzing ? 'Analyse médicale en cours...' : 'Lancer l\'Analyse'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {!analysisResult ? (
                                    <div className="h-full bg-white/50 border-2 border-dashed border-teal-200 rounded-2xl flex flex-col items-center justify-center text-teal-400 p-8 text-center min-h-[300px]">
                                        <Thermometer size={48} className="mb-4 opacity-50" />
                                        <p>En attente de description...</p>
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-md animate-fade-up">
                                        <div className={`p-4 rounded-xl mb-6 flex items-center gap-4 text-white shadow-sm
                                            ${analysisResult.urgencyLevel === 'high' ? 'bg-red-600' : 
                                              analysisResult.urgencyLevel === 'medium' ? 'bg-orange-500' : 'bg-green-600'}`}>
                                            <div className="p-3 bg-white/20 rounded-full">
                                                <AlertTriangle size={32} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider opacity-90">Niveau d'Urgence</div>
                                                <div className="text-2xl font-bold">
                                                    {analysisResult.urgencyLevel === 'high' ? 'URGENCE POSSIBLE' : 
                                                     analysisResult.urgencyLevel === 'medium' ? 'CONSULTATION REQUISE' : 'CONSEILS SIMPLES'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-1">Résumé</h3>
                                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{analysisResult.summary}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 mb-1">Conseils</h3>
                                                    <p className="text-sm text-gray-600">{analysisResult.advice}</p>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 mb-1">Spécialiste</h3>
                                                    <p className="text-sm text-teal-700 font-medium bg-teal-50 px-2 py-1 rounded w-fit">{analysisResult.specialist}</p>
                                                </div>
                                            </div>

                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 flex gap-2 items-start mt-4">
                                                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                                                <p>{analysisResult.disclaimer}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SOS TAB */}
                    {activeTab === 'sos' && (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="text-center">
                                <div className="inline-block p-4 bg-red-100 rounded-full mb-4 animate-pulse">
                                    <Phone size={48} className="text-red-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Centre d'Appel d'Urgence</h2>
                                <p className="text-gray-500 mt-2">Localisez les secours instantanément où que vous soyez.</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-100">
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-4 text-center">Sélectionnez votre pays actuel</label>
                                <select 
                                    className="w-full p-4 text-lg bg-gray-50 border border-gray-200 rounded-xl mb-8 focus:ring-2 focus:ring-red-500 outline-none font-bold"
                                    value={selectedCountry?.code || ''}
                                    onChange={(e) => setSelectedCountry(COUNTRIES.find(c => c.code === e.target.value) || null)}
                                >
                                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                </select>

                                {selectedCountry?.emergencyNumbers && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <a
                                            href={`tel:${selectedCountry.emergencyNumbers.police.replace(/[^0-9+]/g, '')}`}
                                            className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center hover:bg-blue-100 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 block"
                                        >
                                            <div className="text-xs font-bold text-blue-400 uppercase mb-2">Police</div>
                                            <div className="text-4xl font-black text-blue-900 group-hover:scale-110 transition-transform">{selectedCountry.emergencyNumbers.police}</div>
                                            <div className="mt-2 text-[10px] text-blue-400">Appuyer pour appeler</div>
                                        </a>
                                        <a
                                            href={`tel:${selectedCountry.emergencyNumbers.ambulance.replace(/[^0-9+]/g, '')}`}
                                            className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center hover:bg-red-100 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600 block"
                                        >
                                            <div className="text-xs font-bold text-red-400 uppercase mb-2">Ambulance</div>
                                            <div className="text-4xl font-black text-red-900 group-hover:scale-110 transition-transform">{selectedCountry.emergencyNumbers.ambulance}</div>
                                            <div className="mt-2 text-[10px] text-red-400">Appuyer pour appeler</div>
                                        </a>
                                        <a
                                            href={`tel:${selectedCountry.emergencyNumbers.fire.replace(/[^0-9+]/g, '')}`}
                                            className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-center hover:bg-orange-100 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-600 block"
                                        >
                                            <div className="text-xs font-bold text-orange-400 uppercase mb-2">Pompiers</div>
                                            <div className="text-4xl font-black text-orange-900 group-hover:scale-110 transition-transform">{selectedCountry.emergencyNumbers.fire}</div>
                                            <div className="mt-2 text-[10px] text-orange-400">Appuyer pour appeler</div>
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 text-white p-6 rounded-2xl flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="font-bold text-lg">Position GPS Actuelle</div>
                                    <div className="text-sm text-gray-400 break-words">
                                        {geoState.status === 'idle' && "Non localisée — appuyez sur le bouton pour la transmettre aux secours."}
                                        {geoState.status === 'loading' && "Localisation en cours..."}
                                        {geoState.status === 'success' && `${geoState.lat?.toFixed(4)}° N, ${geoState.lon?.toFixed(4)}° E (précision ~${Math.round(geoState.accuracy || 0)} m)`}
                                        {geoState.status === 'error' && geoState.message}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLocateMe}
                                    disabled={geoState.status === 'loading'}
                                    aria-label="Localiser ma position actuelle"
                                    className="min-w-11 min-h-11 shrink-0 bg-white/20 hover:bg-white/30 disabled:opacity-50 p-2 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                                >
                                    {geoState.status === 'loading' ? <Activity size={24} className="animate-spin" /> : <Globe size={24} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && !userProfile.medical && (
                        <EmptyStateGuide
                            icon={<FileText size={28} />}
                            title="Aucune fiche médicale enregistrée"
                            description="Ajoutez votre groupe sanguin, vos allergies, vos traitements et un contact d'urgence pour que les secours disposent des bonnes informations en cas de besoin."
                            className="mt-6"
                        />
                    )}

                    {activeTab === 'profile' && userProfile.medical && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                                <div className="bg-teal-600 p-6 text-white flex justify-between items-center">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <FileText /> Fiche Médicale d'Urgence
                                    </h2>
                                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                                        Groupe: {userProfile.medical.bloodType}
                                    </div>
                                </div>
                                
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Allergies & Conditions</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {userProfile.medical.allergies.map((a, i) => (
                                                <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100">
                                                    ⚠️ {a}
                                                </span>
                                            ))}
                                            {userProfile.medical.conditions.map((c, i) => (
                                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold border border-blue-100">
                                                    ℹ️ {c}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 mt-6">Médicaments</h3>
                                        <ul className="space-y-2">
                                            {userProfile.medical.medications.map((m, i) => (
                                                <li key={i} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                                                    <div className="w-2 h-2 bg-teal-500 rounded-full" /> {m}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Contact d'Urgence</h3>
                                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <div className="bg-green-100 p-2 rounded-full text-green-600">
                                                    <Phone size={20} />
                                                </div>
                                                <div className="font-bold text-gray-800">{userProfile.medical.emergencyContact}</div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                            <h3 className="font-bold mb-2 flex items-center gap-2">
                                                <Globe size={18} /> Mode Voyage
                                            </h3>
                                            <p className="text-indigo-100 text-sm mb-4">
                                                Faire lire à voix haute mon groupe sanguin et mes allergies pour les secouristes présents.
                                            </p>
                                            <button
                                                onClick={handleSpeakMedicalInfo}
                                                disabled={isTranslating}
                                                className="w-full min-h-11 bg-white text-indigo-600 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                                            >
                                                {isTranslating ? <Activity className="animate-spin" size={16} /> : <Volume2 size={16} />}
                                                {isTranslating ? 'Lecture en cours...' : 'Écouter mes informations'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
