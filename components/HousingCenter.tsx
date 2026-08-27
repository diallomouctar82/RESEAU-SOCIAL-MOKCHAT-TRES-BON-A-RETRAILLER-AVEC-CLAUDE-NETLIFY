
import React, { useState } from 'react';
import { Home, Search, MapPin, DollarSign, ShieldAlert, FileText, CheckCircle, AlertTriangle, Loader2, Sparkles, AlertOctagon } from 'lucide-react';
import { HOUSING_LISTINGS } from '../constants';
import { UserProfile, ScamAnalysis } from '../types';
import { GoogleGenAI } from '@google/genai';

interface HousingCenterProps {
    userProfile: UserProfile;
}

export const HousingCenter: React.FC<HousingCenterProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'scam-check' | 'dossier'>('search');
    
    // Scam Check State
    const [adText, setAdText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scamResult, setScamResult] = useState<ScamAnalysis | null>(null);

    // Dossier State
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [dossierText, setDossierText] = useState<string | null>(null);

    const handleScamCheck = async () => {
        if (!adText.trim()) return;
        setIsScanning(true);
        setScamResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Agis comme Monsieur Diallo (Expert Logement). Analyse cette annonce immobilière :
            "${adText.slice(0, 1000)}..."
            
            Détecte les signes d'arnaque (mandat cash, propriétaire absent, fautes, prix irréaliste).
            Réponds en JSON strict :
            {
                "riskScore": number (0-100),
                "verdict": "Safe" | "Suspicious" | "Scam",
                "redFlags": ["drapeau rouge 1", "drapeau rouge 2"],
                "advice": "Conseil de sécurité"
            }`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const result = JSON.parse(response.text || '{}');
            setScamResult(result);
        } catch (e) {
            console.error(e);
            alert("Erreur d'analyse.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleGenerateDossier = async () => {
        setIsGeneratingDossier(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Agis comme Monsieur Diallo. Rédige une lettre de présentation pour un dossier de location pour ce profil :
            Nom: ${userProfile.name}
            Titre: ${userProfile.title}
            Nationalité/ID: ${userProfile.citizenshipId}
            
            Ton: Professionnel, rassurant, sérieux. Souligne la stabilité et le sérieux.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setDossierText(response.text || "Erreur de génération.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingDossier(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white p-8 shadow-lg">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-orange-200 font-bold uppercase text-xs tracking-wider mb-2">
                            <Home size={14} /> Espace Logement
                        </div>
                        <h1 className="text-3xl font-bold">Trouvez votre Chez-Vous</h1>
                        <p className="text-orange-100 max-w-xl mt-2">
                            Recherche intelligente, dossiers solides et protection anti-arnaques.
                        </p>
                    </div>
                    
                    <div className="flex gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
                        <button 
                          onClick={() => setActiveTab('search')}
                          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'search' ? 'bg-white text-orange-800 shadow-md' : 'text-white hover:bg-white/10'}`}
                        >
                            Recherche
                        </button>
                        <button 
                          onClick={() => setActiveTab('scam-check')}
                          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'scam-check' ? 'bg-white text-orange-800 shadow-md' : 'text-white hover:bg-white/10'}`}
                        >
                            Anti-Arnaque
                        </button>
                        <button 
                          onClick={() => setActiveTab('dossier')}
                          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'dossier' ? 'bg-white text-orange-800 shadow-md' : 'text-white hover:bg-white/10'}`}
                        >
                            Mon Dossier
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    
                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {HOUSING_LISTINGS.map(house => (
                                    <div key={house.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group cursor-pointer">
                                        <div className="md:w-48 h-48 md:h-auto bg-gray-200 relative">
                                            <img src={house.imageUrl} className="w-full h-full object-cover" />
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                                                {house.type}
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{house.title}</h3>
                                                    <span className="font-bold text-orange-600 text-lg">{house.price} {house.currency}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                                    <MapPin size={14} /> {house.location}
                                                </div>
                                                <div className="flex gap-4 mt-4 text-sm text-gray-600">
                                                    <span><b>{house.rooms}</b> Pièces</span>
                                                    <span><b>{house.surface}</b> m²</span>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    {house.tags.map(tag => (
                                                        <span key={tag} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Simulator Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <DollarSign size={20} className="text-green-600" /> Simulateur Aides
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">Estimez vos droits (APL, CAF) en fonction de votre situation.</p>
                                    <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100 mb-4">
                                        <div className="text-xs font-bold text-green-600 uppercase">Estimation</div>
                                        <div className="text-3xl font-black text-green-700">~240 €</div>
                                        <div className="text-[10px] text-green-500">par mois</div>
                                    </div>
                                    <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold">
                                        Détails du calcul
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SCAM CHECK TAB */}
                    {activeTab === 'scam-check' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                        <ShieldAlert size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Détecteur d'Arnaques</h2>
                                    <p className="text-gray-500">Collez le texte d'une annonce pour vérifier sa fiabilité.</p>
                                </div>

                                <textarea 
                                    value={adText}
                                    onChange={(e) => setAdText(e.target.value)}
                                    className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none mb-4"
                                    placeholder="Ex: Superbe appartement pas cher, contactez-moi uniquement par mail..."
                                />

                                <button 
                                    onClick={handleScamCheck}
                                    disabled={!adText || isScanning}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!adText || isScanning ? 'bg-gray-200 text-gray-400' : 'bg-red-600 text-white hover:bg-red-700 shadow-lg'}`}
                                >
                                    {isScanning ? <Loader2 className="animate-spin" /> : <AlertOctagon />}
                                    {isScanning ? 'Analyse en cours...' : 'Vérifier l\'Annonce'}
                                </button>

                                {scamResult && (
                                    <div className="mt-8 animate-fade-up">
                                        <div className={`p-6 rounded-2xl mb-6 text-white text-center ${scamResult.verdict === 'Safe' ? 'bg-green-600' : scamResult.verdict === 'Suspicious' ? 'bg-orange-500' : 'bg-red-600'}`}>
                                            <div className="text-xs font-bold uppercase opacity-80 mb-1">Verdict de l'Expert</div>
                                            <div className="text-3xl font-black">{scamResult.verdict === 'Safe' ? 'ANNONCE FIABLE' : scamResult.verdict === 'Suspicious' ? 'SOYEZ VIGILANT' : 'ARNAQUE PROBABLE'}</div>
                                            <div className="mt-2 text-sm font-medium bg-black/20 inline-block px-3 py-1 rounded-full">Risque: {scamResult.riskScore}/100</div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <h3 className="font-bold text-gray-900 mb-4">Analyse Détaillée</h3>
                                            <ul className="space-y-2 mb-4">
                                                {scamResult.redFlags.map((flag, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-red-600 font-medium">
                                                        <AlertTriangle size={14} /> {flag}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm italic border border-blue-100">
                                                "{scamResult.advice}"
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DOSSIER TAB */}
                    {activeTab === 'dossier' && (
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre Dossier Locataire</h2>
                                <p className="text-gray-500 mb-6">
                                    Générez une lettre de présentation professionnelle qui rassure les propriétaires et augmente vos chances.
                                </p>
                                
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src={userProfile.avatarUrl} className="w-12 h-12 rounded-full" />
                                        <div>
                                            <div className="font-bold">{userProfile.name}</div>
                                            <div className="text-xs text-gray-500">{userProfile.title}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Revenus (estimés)</span>
                                            <span className="font-bold">2800 € / mois</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Garant</span>
                                            <span className="font-bold text-green-600">Oui (Visale)</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerateDossier}
                                    disabled={isGeneratingDossier}
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                                >
                                    {isGeneratingDossier ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    {isGeneratingDossier ? 'Rédaction...' : 'Générer ma Lettre'}
                                </button>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
                                {dossierText ? (
                                    <div className="prose prose-sm animate-fade-up">
                                        <h3 className="font-bold mb-4 flex items-center gap-2 text-orange-600"><FileText size={18} /> Lettre de Motivation</h3>
                                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-serif">
                                            {dossierText}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                                        <FileText size={48} className="mb-4 opacity-20" />
                                        <p>Votre lettre générée apparaîtra ici.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
