import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Wand2, Globe, Hash, Type, Image as ImageIcon, Check, Copy, ArrowRight, X, Loader2, RefreshCw, Layers, ShieldCheck, Heart } from 'lucide-react';
import { aiService } from '../services/ai';

// DEC-2026-080 — sur téléphone, le pied de la modale (« Annuler »,
// « Appliquer à ma publication ») était recouvert par le dock du bas (fixed,
// z-index 50, rendu après la modale dans le DOM) et par la barre flottante de
// l'Architecte (z-index 60). La modale vit désormais dans un portail sur
// <body>, au-dessus de toute la coquille (bloc « ASSISTANT IA » d'index.html),
// et la racine de l'application devient inerte pendant l'ouverture — même
// motif que le studio « Visuel IA » (DEC-2026-061), prouvé sur téléphone.
const racineApplication = () => (typeof document === 'undefined' ? null : document.getElementById('root'));

export type AIPostAssistantTool = 'style' | 'translate' | 'hashtags' | 'visual' | 'headline';

interface AIPostAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApply: (enhancedText: string, tags?: string[], generatedImageUrl?: string) => void;
  // DEC-2026-061 — les orbes « Améliorer le style », « Traduire » et
  // « Hashtags » du composeur ouvrent la modale directement sur leur onglet.
  // Sans cette prop, l'ouverture reste celle d'avant (onglet « style »).
  initialTool?: AIPostAssistantTool;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'Anglais (English)', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol (Español)', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabe (العربية)', flag: '🇸🇦' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
  { code: 'bm', name: 'Bambara', flag: '🇲🇱' },
  { code: 'ff', name: 'Poular / Peul', flag: '🇬🇳' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinois', flag: '🇨🇳' },
  { code: 'de', name: 'Allemand', flag: '🇩🇪' },
  { code: 'ln', name: 'Lingala', flag: '🇨🇩' },
];

const STYLE_PRESETS = [
  { id: 'pro', label: 'Professionnel & Clair', icon: '👔', desc: 'Ton rigoureux, soigné et orienté business' },
  { id: 'viral', label: 'Percutant & Engageant', icon: '🔥', desc: 'Accroche forte, émojis ciblés et call-to-action' },
  { id: 'academic', label: 'Académique & Pédagogique', icon: '🎓', desc: 'Structure détaillée, démonstrative et claire' },
  { id: 'warm', label: 'Chaleureux & Communautaire', icon: '🤝', desc: 'Bienveillant, authentique et rassembleur' },
  { id: 'summary', label: 'Synthétique & Bullet-points', icon: '⚡', desc: '3 points clés essentiels pour lecture rapide' },
];

const VISUAL_TEMPLATES = [
  { id: 'tech', label: 'Tech & IA Future', prompt: 'Modern futuristic technology digital network interface abstract illustration', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&fit=crop' },
  { id: 'business', label: 'Entrepreneuriat & Succès', prompt: 'African tech business entrepreneur innovation leadership modern studio', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&fit=crop' },
  { id: 'education', label: 'Éducation & Savoir', prompt: 'Global education digital learning community vibrant library', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&fit=crop' },
  { id: 'legal', label: 'Mobilité & Droit International', prompt: 'International global diplomacy travel passport freedom aesthetic', url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&fit=crop' },
];

export const AIPostAssistantModal: React.FC<AIPostAssistantModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApply,
  initialTool
}) => {
  const [activeTool, setActiveTool] = useState<AIPostAssistantTool>('style');
  // À chaque ouverture, l'onglet demandé par l'orbe prend la main ; entre deux
  // ouvertures sans consigne, l'onglet courant est conservé comme avant.
  useEffect(() => {
    if (isOpen && initialTool) setActiveTool(initialTool);
  }, [isOpen, initialTool]);
  const [selectedStyle, setSelectedStyle] = useState('pro');
  const [targetLang, setTargetLang] = useState('en');
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // DEC-2026-080 — ouverture : racine inerte, focus sur « Fermer », Échap ;
  // fermeture : focus rendu au déclencheur. `onClose` est lu par une ref pour
  // qu'un re-rendu du parent (fonction inline) ne rejoue pas l'effet.
  const feuilleRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const declencheur = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const racine = racineApplication();
    racine?.setAttribute('inert', '');
    // DEC-2026-082 : la modale suit la zone reellement visible (zoom de page
    // d'iOS au focus d'un champ, clavier ouvert) ; sans visualViewport, le
    // inset-0 de la feuille suffit et rien n'est ecrit en ligne.
    const zoneVisible = window.visualViewport;
    const suivreLaZoneVisible = () => {
      const f = feuilleRef.current;
      if (!f) return;
      if (!zoneVisible) { f.style.top = ''; f.style.left = ''; f.style.width = ''; f.style.height = ''; return; }
      f.style.top = `${zoneVisible.offsetTop}px`;
      f.style.left = `${zoneVisible.offsetLeft}px`;
      f.style.width = `${zoneVisible.width}px`;
      f.style.height = `${zoneVisible.height}px`;
    };
    suivreLaZoneVisible();
    zoneVisible?.addEventListener('resize', suivreLaZoneVisible);
    zoneVisible?.addEventListener('scroll', suivreLaZoneVisible);
    const t = window.setTimeout(() => {
      feuilleRef.current?.querySelector<HTMLElement>('.ia-fermer')?.focus();
    }, 30);
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && feuilleRef.current?.contains(document.activeElement)) { e.stopPropagation(); onCloseRef.current(); }
    };
    document.addEventListener('keydown', surTouche, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', surTouche, true);
      zoneVisible?.removeEventListener('resize', suivreLaZoneVisible); zoneVisible?.removeEventListener('scroll', suivreLaZoneVisible); racine?.removeAttribute('inert');
      if (declencheur && declencheur.isConnected) declencheur.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnhanceStyle = async (styleId: string) => {
    setSelectedStyle(styleId);
    setIsLoading(true);
    try {
      const prompt = `Tu es l'Assistant IA Mooc du réseau Le Monde à Vous.
Améliore et réécris le texte de publication suivant selon le style "${styleId}" :
"${originalText || "Partage de compétences et opportunités au sein de notre communauté Mooc."}"

Consignes :
- Conserve le sens original mais sublime le style, le vocabulaire et la mise en forme (avec sauts de ligne élégants et émojis discrets).
- Fournis directement le texte prêt à être publié, sans commentaires meta.`;

      const res = await aiService.generateText('gemini-2.5-flash', prompt);
      setGeneratedResult(res.trim());
    } catch (e) {
      // Fallback
      if (styleId === 'viral') {
        setGeneratedResult(`🚀 **CAP SUR L'IMPACT !**\n\n${originalText || "Partage d'expériences et d'innovations."}\n\n💡 *Et vous, quelles sont vos astuces ? Partagez vos retours en commentaire !* 👇`);
      } else if (styleId === 'summary') {
        setGeneratedResult(`📌 **L'ESSENTIEL EN 3 POINTS :**\n\n• 🎯 **Objectif** : Valoriser les compétences et l'entraide communautaire.\n• 💡 **Innovation** : Intégration de l'intelligence artificielle à chaque étape.\n• 🤝 **Action** : Échangeons et collaborons ensemble.`);
      } else {
        setGeneratedResult(`✨ **${originalText || "Excellente opportunité de partage au sein du réseau Mooc."}**\n\nNous continuons à développer des solutions pérennes pour accompagner nos membres dans leur parcours professionnel et académique.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (langCode: string) => {
    setTargetLang(langCode);
    setIsLoading(true);
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const langName = langObj ? langObj.name : langCode;
    try {
      const prompt = `Traduis fidèlement et élégamment le texte suivant en ${langName} pour une publication sur le réseau social Mooc :
"${originalText || generatedResult || "Bienvenue sur le réseau social collaboratif et intelligent Mooc."}"

Fournis uniquement la traduction directe.`;
      const res = await aiService.generateText('gemini-2.5-flash', prompt);
      setGeneratedResult(res.trim());
    } catch (e) {
      if (langCode === 'en') {
        setGeneratedResult(`🌍 **Welcome to Mooc Network**\n\n${originalText || "Collaborative intelligence and global talent empowerment."}`);
      } else if (langCode === 'es') {
        setGeneratedResult(`🌍 **Bienvenidos a la Red Mooc**\n\n${originalText || "Inteligencia colaborativa y empoderamiento de talentos mundiales."}`);
      } else if (langCode === 'wo') {
        setGeneratedResult(`🌍 **Dalal ak jamm ci Réseau Mooc**\n\n${originalText || "Liggéeyando ak xam-xam yu bees ngir askan wi."}`);
      } else {
        setGeneratedResult(`[${langName}] ${originalText}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    setIsLoading(true);
    try {
      const prompt = `Génère 6 hashtags tendance et hautement pertinents pour cette publication sur le réseau professionnel et éducatif Mooc :
"${originalText || generatedResult}"
Retourne uniquement les hashtags séparés par des espaces, exemple: #Mooc #Innovation #Tech #Carriere #Afrique2026 #Entraide`;
      const res = await aiService.generateText('gemini-2.5-flash', prompt);
      const tags = res.match(/#[a-zA-Z0-9_À-ÿ]+/g) || ['#MoocNetwork', '#IntelligenceArtificielle', '#Collaboration', '#Talents', '#Innovation'];
      setSuggestedTags(tags);
      setSelectedTags(tags.slice(0, 4));
    } catch (e) {
      const defaultTags = ['#MoocNetwork', '#InnovationTech', '#DiasporaTalents', '#Entraide', '#Avenir2026'];
      setSuggestedTags(defaultTags);
      setSelectedTags(defaultTags);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateHeadline = async () => {
    setIsLoading(true);
    try {
      const prompt = `Génère 3 titres d'accroche captivants et percutants pour cette publication :
"${originalText || generatedResult}"`;
      const res = await aiService.generateText('gemini-2.5-flash', prompt);
      setGeneratedResult(`🔥 **${res.split('\n')[0].replace(/^[0-9.-]\s*/, '')}**\n\n${originalText || generatedResult}`);
    } catch (e) {
      setGeneratedResult(`🚀 **RÉSEAU MOOC : NOUVELLE PERSPECTIVE**\n\n${originalText}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleApplyFinal = () => {
    const finalContent = generatedResult.trim() || originalText;
    onApply(finalContent, selectedTags.length > 0 ? selectedTags : undefined, selectedImage || undefined);
    onClose();
  };

  const handleCopy = () => {
    const textToCopy = (generatedResult || originalText) + (selectedTags.length > 0 ? '\n\n' + selectedTags.join(' ') : '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Portail sur <body> : la modale n'est plus un enfant de la page (et donc
  // plus derrière le dock mobile) ; en environnement sans document, rendu tel quel.
  const portail = typeof document === 'undefined' ? null : document.body;
  // DEC-2026-080 : portée sur <body>, la modale sort du périmètre [data-miroir] de
  // Layout ; elle porte donc elle-même data-miroir pour garder l habillage aqua
  // (en-tête, matière de la carte) identique à avant, seulement au-dessus du dock.
  const feuille = (
    <div ref={feuilleRef} data-miroir role="dialog" aria-modal="true" aria-labelledby="ia-modale-titre" className="ia-fond fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="ia-carte bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col animate-scale-up">

        {/* Header — DEC-2026-082 : retrecissable et repliable pour les cartes etroites (zoom de page, petits ecrans) */}
        <div className="ia-tete p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <Wand2 size={22} className="text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 id="ia-modale-titre" className="font-bold text-lg text-white break-words min-w-0">Assistant IA Pré-Publication Mooc</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-white/20 rounded-full text-white tracking-wider">Multimodal</span>
              </div>
              <p className="text-xs text-blue-100">Améliorez, traduisez, enrichissez et générez des visuels avant de partager.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'assistant"
            className="ia-fermer shrink-0 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="ia-onglets flex border-b border-slate-100 bg-slate-50/80 px-4 gap-2 overflow-x-auto scrollbar-hide py-2">
          <button 
            onClick={() => { setActiveTool('style'); if (!generatedResult) handleEnhanceStyle('pro'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTool === 'style' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Sparkles size={15} />
            Style & Clarté
          </button>

          <button 
            onClick={() => { setActiveTool('translate'); if (!generatedResult) handleTranslate('en'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTool === 'translate' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Globe size={15} />
            Traduire (10+ Langues)
          </button>

          <button 
            onClick={() => { setActiveTool('hashtags'); handleGenerateHashtags(); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTool === 'hashtags' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Hash size={15} />
            Hashtags & Clés
          </button>

          <button 
            onClick={() => { setActiveTool('headline'); handleGenerateHeadline(); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTool === 'headline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Type size={15} />
            Accroche Forte
          </button>

          <button 
            onClick={() => setActiveTool('visual')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTool === 'visual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <ImageIcon size={15} />
            Visuel & Bannière IA
          </button>
        </div>

        {/* Body Content */}
        <div className="ia-corps p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Tool Options Bar */}
          {activeTool === 'style' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sélectionnez le ton souhaité :</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleEnhanceStyle(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${selectedStyle === preset.id ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-200 bg-white'}`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'translate' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Choisissez la langue cible :</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleTranslate(lang.code)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 text-xs font-semibold ${targetLang === lang.code ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'}`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'hashtags' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Hashtags suggérés par l'IA :</span>
                <button 
                  onClick={handleGenerateHashtags}
                  className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw size={12} /> Régénérer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTool === 'visual' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sélectionnez une illustration thématique IA :</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VISUAL_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedImage(selectedImage === tpl.url ? null : tpl.url)}
                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer group transition-all aspect-video ${selectedImage === tpl.url ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-slate-300'}`}
                  >
                    <img src={tpl.url} alt={tpl.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[11px] font-bold text-white leading-tight">{tpl.label}</span>
                    </div>
                    {selectedImage === tpl.url && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before / After Comparison Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Texte initial :</span>
                <span className="text-[10px] text-slate-400">{originalText.length} caractères</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {originalText || <span className="italic text-slate-400">Aucun texte saisi</span>}
              </div>
            </div>

            {/* AI Enhanced Result */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <Sparkles size={14} /> Version Optimisée par l'IA :
                </span>
                {generatedResult && (
                  <button onClick={handleCopy} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                    {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                )}
              </div>
              
              <div className="relative p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-200 text-xs text-slate-800 leading-relaxed min-h-[120px] max-h-48 overflow-y-auto whitespace-pre-wrap shadow-inner">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-28 text-indigo-600 gap-2">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-semibold">Génération IA en cours...</span>
                  </div>
                ) : (
                  <div>
                    {generatedResult || originalText || <span className="text-slate-400 italic">Cliquez sur un outil ci-dessus pour générer une amélioration.</span>}
                    {selectedTags.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-indigo-100 flex flex-wrap gap-1">
                        {selectedTags.map(t => (
                          <span key={t} className="text-[11px] font-bold text-indigo-600">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer — DEC-2026-080 : toujours visible (la carte est bornee par la
            fenetre visible) et jamais sous le dock (portail + bloc CSS). */}
        <div className="ia-pied p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyFinal}
              disabled={isLoading || (!generatedResult && !originalText && !selectedImage)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={16} />
              Appliquer à ma publication
            </button>
          </div>
        </div>

      </div>
    </div>
  );
  return portail ? createPortal(feuille, portail) : feuille;
};
