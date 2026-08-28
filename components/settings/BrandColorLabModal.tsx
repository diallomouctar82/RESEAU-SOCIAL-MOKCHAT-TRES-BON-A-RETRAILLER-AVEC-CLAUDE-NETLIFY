import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Star, 
  Eye, 
  Layers, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  ArrowRight, 
  Sun, 
  Moon, 
  Sliders, 
  Copy, 
  Monitor, 
  Smartphone,
  ChevronRight,
  Home,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  Bell,
  Search
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND_PALETTES, PaletteDefinition, LMAV_BLUE_SCALE } from '../ui/DesignTokens';

interface BrandColorLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandColorLabModal: React.FC<BrandColorLabModalProps> = ({ isOpen, onClose }) => {
  const { currentPalette, paletteId, setPaletteId, isDarkMode, toggleDarkMode, availablePalettes } = useTheme();
  const [previewPaletteId, setPreviewPaletteId] = useState<string>(paletteId);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'grid' | 'scale' | 'wcag'>('cockpit');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!isOpen) return null;

  const previewPalette = availablePalettes.find(p => p.id === previewPaletteId) || currentPalette;
  const colors = previewPalette.colors;

  const handleApplyPalette = (id: string) => {
    setPaletteId(id);
    setPreviewPaletteId(id);
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-lg animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-lab-title"
    >
      <div className="bg-white w-full max-w-7xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh]">
        
        {/* ─── MODAL TOP BAR ─── */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
              <Palette size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="color-lab-title" className="text-lg font-black text-white tracking-tight">
                  Brand Color Lab — Le Monde à Vous
                </h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  10 Palettes Proposées
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direction : Bleu Profond + Premium + International + Institutionnel + Épuré
              </p>
            </div>
          </div>

          {/* Sub Navigation & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setActiveTab('cockpit')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'cockpit' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                Aperçu Réel
              </button>
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                Matrice 10 Palettes
              </button>
              <button
                onClick={() => setActiveTab('scale')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'scale' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                Nuancier LMAV Blue
              </button>
            </div>

            <button
              onClick={() => handleApplyPalette(previewPaletteId)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition"
              title="Activer cette palette sur toute l'application"
            >
              <Check size={14} />
              <span>{paletteId === previewPaletteId ? 'Palette Active' : 'Appliquer au Site'}</span>
            </button>

            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
              aria-label="Fermer le laboratoire"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── MODAL BODY CONTAINER ─── */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50">
          
          {/* LEFT: 10 PALETTES SELECTOR LIST */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 overflow-y-auto p-4 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                10 Directions Créatives
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                Sélectionnez pour tester
              </span>
            </div>

            {availablePalettes.map((p) => {
              const isSelected = previewPaletteId === p.id;
              const isCurrentActive = paletteId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setPreviewPaletteId(p.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-600/20 shadow-sm' 
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                        {p.number}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-xs">
                        {p.name}
                      </h3>
                    </div>

                    {isCurrentActive && (
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> Active
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2.5 line-clamp-2 leading-relaxed">
                    {p.subtitle}
                  </p>

                  {/* Palette Swatches Preview */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/70 rounded-xl">
                    <div 
                      className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" 
                      style={{ backgroundColor: p.colors.sidebarBg }}
                      title={`Sidebar: ${p.colors.sidebarBg}`}
                    />
                    <div 
                      className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" 
                      style={{ backgroundColor: p.colors.primary }}
                      title={`Primary: ${p.colors.primary}`}
                    />
                    <div 
                      className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" 
                      style={{ backgroundColor: p.colors.accent }}
                      title={`Accent: ${p.colors.accent}`}
                    />
                    <div 
                      className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" 
                      style={{ backgroundColor: p.colors.accentGold }}
                      title={`Or/Highlight: ${p.colors.accentGold}`}
                    />
                    <div 
                      className="w-5 h-5 rounded-lg border border-slate-300 shadow-2xs" 
                      style={{ backgroundColor: p.colors.surface }}
                      title={`Surface: ${p.colors.surface}`}
                    />
                    <div className="ml-auto text-[10px] font-bold text-slate-500">
                      {p.wcagRating} • {p.wcagContrastRatio}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: INTERACTIVE PREVIEW COCKPIT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {/* Header Banner of Selected Palette */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-white" style={{ backgroundColor: colors.sidebarBg }}>
                    Palette #{previewPalette.number}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{previewPalette.name}</h3>
                  <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    Contraste {previewPalette.wcagContrastRatio} ({previewPalette.wcagRating})
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {previewPalette.description}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleApplyPalette(previewPalette.id)}
                  className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Check size={14} />
                  <span>{paletteId === previewPalette.id ? 'Actuellement appliquée' : 'Sélectionner cette direction'}</span>
                </button>
              </div>
            </div>

            {/* TAB: COCKPIT REAL PREVIEW */}
            {activeTab === 'cockpit' && (
              <div className="space-y-6">
                
                {/* 1. MOCK INTERFACE (Sidebar + Header + Content Area) */}
                <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-slate-100">
                  <div className="bg-slate-800 text-slate-400 px-4 py-2 text-[11px] font-bold flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                      <span className="ml-2 text-slate-300">Simulation d’Écran Réel — Le Monde à Vous</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Sidebar : <code className="text-blue-300">{colors.sidebarBg}</code> | Header : <code className="text-blue-300">{colors.headerBg}</code>
                    </div>
                  </div>

                  <div className="flex h-[420px] bg-slate-50">
                    {/* Simulated Deep Blue Sidebar */}
                    <div 
                      className="w-60 p-3.5 flex flex-col justify-between border-r shadow-inner shrink-0"
                      style={{ 
                        backgroundColor: colors.sidebarBg,
                        color: colors.sidebarText,
                        borderColor: colors.sidebarBorder 
                      }}
                    >
                      <div className="space-y-4">
                        {/* Brand Logo */}
                        <div className="flex items-center gap-2.5 px-2 py-1">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
                            style={{ backgroundColor: colors.sidebarActiveBg }}
                          >
                            LMAV
                          </div>
                          <div>
                            <div className="text-xs font-black tracking-tight" style={{ color: colors.sidebarText }}>
                              Le Monde à Vous
                            </div>
                            <div className="text-[9px] opacity-70" style={{ color: colors.sidebarTextMuted }}>
                              PREMIUM EXPERIENCE
                            </div>
                          </div>
                        </div>

                        {/* Nav Items Group 1 */}
                        <div className="space-y-1">
                          <div className="text-[9px] font-extrabold uppercase px-2 mb-1 opacity-60 tracking-wider" style={{ color: colors.sidebarTextMuted }}>
                            MA JOURNÉE
                          </div>

                          {/* Active Nav Item */}
                          <div 
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                            style={{ 
                              backgroundColor: colors.sidebarActiveBg,
                              color: colors.sidebarActiveText 
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Compass size={15} />
                              <span>Tableau de Bord</span>
                            </div>
                            <span 
                              className="text-[9px] px-1.5 py-0.2 rounded font-black text-slate-900 shadow-2xs"
                              style={{ backgroundColor: colors.sidebarHighlight }}
                            >
                              CAP
                            </span>
                          </div>

                          {/* Inactive Nav Items */}
                          <div 
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium opacity-85 hover:opacity-100 transition cursor-pointer"
                            style={{ color: colors.sidebarText }}
                          >
                            <div className="flex items-center gap-2">
                              <Briefcase size={15} style={{ color: colors.sidebarTextMuted }} />
                              <span>GPS Carrière</span>
                            </div>
                            <span className="text-[9px] opacity-60">17</span>
                          </div>

                          <div 
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium opacity-85 hover:opacity-100 transition cursor-pointer"
                            style={{ color: colors.sidebarText }}
                          >
                            <div className="flex items-center gap-2">
                              <GraduationCap size={15} style={{ color: colors.sidebarTextMuted }} />
                              <span>Campus Certifiant</span>
                            </div>
                            <span className="text-[9px] opacity-60">MOOC</span>
                          </div>

                          <div 
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium opacity-85 hover:opacity-100 transition cursor-pointer"
                            style={{ color: colors.sidebarText }}
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={15} style={{ color: colors.sidebarTextMuted }} />
                              <span>Marché Mondial</span>
                            </div>
                            <span className="text-[9px] opacity-60">B2B</span>
                          </div>
                        </div>

                        {/* Favorite Section */}
                        <div className="pt-2 border-t" style={{ borderColor: colors.sidebarBorder }}>
                          <div className="flex items-center justify-between px-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: colors.sidebarHighlight }}>
                              <Star size={10} className="fill-current" /> Mes Favoris
                            </span>
                          </div>
                          <div className="text-[11px] px-2 py-1 rounded-lg opacity-80" style={{ color: colors.sidebarText }}>
                            ⭐ 4 modules épinglés
                          </div>
                        </div>
                      </div>

                      {/* User Footer in Sidebar */}
                      <div 
                        className="p-2 rounded-xl border flex items-center gap-2"
                        style={{ 
                          backgroundColor: colors.sidebarSurface,
                          borderColor: colors.sidebarBorder 
                        }}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-800">
                          MD
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="text-[11px] font-bold truncate" style={{ color: colors.sidebarText }}>
                            Mamadou Diallo
                          </div>
                          <div className="text-[9px] truncate" style={{ color: colors.sidebarTextMuted }}>
                            Administrateur Général
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Content Area with Crisp White Header */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                      {/* Crisp Header */}
                      <div 
                        className="px-6 py-3 border-b flex items-center justify-between shrink-0"
                        style={{ 
                          backgroundColor: colors.headerBg,
                          borderColor: colors.headerBorder,
                          color: colors.headerText 
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200">
                            <Search size={14} />
                            <span>Rechercher...</span>
                            <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] border text-slate-500 font-mono">⌘K</kbd>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Services Google Actifs</span>
                          </div>

                          <button 
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition"
                            style={{ backgroundColor: colors.primary }}
                          >
                            Consulter un Expert
                          </button>
                        </div>
                      </div>

                      {/* Mock Content Body */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {/* Point A to B Bar */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">Trajectoire Point A ➔ Point B</span>
                            <span className="font-black" style={{ color: colors.primary }}>68% Accomplis</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ width: '68%', backgroundColor: colors.primary }}
                            />
                          </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Action Stratégique</span>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Recommandé
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Valider l’équivalence de diplôme WES avant le dépôt du dossier consulaire.
                            </p>
                            <button 
                              className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-2xs"
                              style={{ backgroundColor: colors.primary }}
                            >
                              Lancer la Démarche
                            </button>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Fiche de Savoir Certifiée</span>
                              <span 
                                className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-slate-900"
                                style={{ backgroundColor: colors.accentGold }}
                              >
                                Source Officielle
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Législation Mobilité 2026 : Exonération fiscale pour les créateurs d’entreprises.
                            </p>
                            <button className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200">
                              Consulter le Texte Légal
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BUTTON HIERARCHY TEST BENCH */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Hiérarchie des Contrôles & Boutons Normalisés
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Primary */}
                    <button 
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-2 transition"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <span>Bouton Primaire (Bleu Signature)</span>
                      <ArrowRight size={14} />
                    </button>

                    {/* Secondary */}
                    <button className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition">
                      Bouton Secondaire (Neutre)
                    </button>

                    {/* Tertiary */}
                    <button className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition">
                      Bouton Tertiaire
                    </button>

                    {/* Exceptional Gold/Champagne */}
                    <button 
                      className="px-4 py-2.5 rounded-xl font-black text-xs text-slate-950 shadow-sm flex items-center gap-1.5 transition"
                      style={{ backgroundColor: colors.accentGold }}
                    >
                      <Sparkles size={14} />
                      <span>Prestige / Exceptionnel</span>
                    </button>

                    {/* Destructive */}
                    <button className="px-4 py-2.5 rounded-xl font-bold text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition">
                      Destructif
                    </button>
                  </div>
                </div>

                {/* 3. SEMANTIC STATES (Green, Amber, Red, Blue) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    États Sémantiques & Préservation des Signaux Fonctionnels
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5"
                      style={{ 
                        backgroundColor: colors.statusSuccess.bg,
                        borderColor: colors.statusSuccess.border,
                        color: colors.statusSuccess.text 
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <div>
                        <div className="text-xs font-bold">Succès / Vérifié</div>
                        <div className="text-[10px] opacity-80">Document conforme</div>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5"
                      style={{ 
                        backgroundColor: colors.statusWarning.bg,
                        borderColor: colors.statusWarning.border,
                        color: colors.statusWarning.text 
                      }}
                    >
                      <AlertTriangle size={16} />
                      <div>
                        <div className="text-xs font-bold">Avertissement</div>
                        <div className="text-[10px] opacity-80">Délai proche de l’échéance</div>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5"
                      style={{ 
                        backgroundColor: colors.statusDanger.bg,
                        borderColor: colors.statusDanger.border,
                        color: colors.statusDanger.text 
                      }}
                    >
                      <AlertOctagon size={16} />
                      <div>
                        <div className="text-xs font-bold">Danger / Erreur</div>
                        <div className="text-[10px] opacity-80">Pièce manquante requise</div>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5"
                      style={{ 
                        backgroundColor: colors.statusInfo.bg,
                        borderColor: colors.statusInfo.border,
                        color: colors.statusInfo.text 
                      }}
                    >
                      <Info size={16} />
                      <div>
                        <div className="text-xs font-bold">Information</div>
                        <div className="text-[10px] opacity-80">Conseil d’expert Diallo</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DARK MODE VARIANT PREVIEW */}
                <div className="p-5 rounded-2xl border border-slate-800 shadow-md space-y-3" style={{ backgroundColor: colors.darkVariant.background }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-blue-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Déclinaison Mode Sombre Spécifique ({previewPalette.name})
                      </h4>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      Fond : {colors.darkVariant.background}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: colors.darkVariant.surface, borderColor: colors.darkVariant.border }}>
                      <div className="text-xs font-bold text-white">Surface Sombre Élégante</div>
                      <p className="text-[11px]" style={{ color: colors.darkVariant.textSecondary }}>
                        Graphite bleuté sans noir absolu agressif, contrastes AA respectés.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: colors.darkVariant.surfaceElevated, borderColor: colors.darkVariant.border }}>
                      <div className="text-xs font-bold" style={{ color: colors.darkVariant.primary }}>
                        Accent Lumineux Maîtrisé
                      </div>
                      <p className="text-[11px]" style={{ color: colors.darkVariant.textSecondary }}>
                        Boutons et indicateurs actifs calibrés pour la vision nocturne.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: colors.darkVariant.surface, borderColor: colors.darkVariant.border }}>
                      <div className="text-xs font-bold" style={{ color: colors.darkVariant.accentGold }}>
                        Détail Or & Champagne
                      </div>
                      <p className="text-[11px]" style={{ color: colors.darkVariant.textSecondary }}>
                        Subtile distinction prestigieuse pour les badges et certificats.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: GRID OF ALL 10 PALETTES */}
            {activeTab === 'grid' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {availablePalettes.map(p => (
                  <div 
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      previewPaletteId === p.id 
                        ? 'bg-blue-50/40 border-blue-600 shadow-sm' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                          {p.number}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                      </div>
                      <button
                        onClick={() => handleApplyPalette(p.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                          paletteId === p.id 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                        }`}
                      >
                        {paletteId === p.id ? 'Active' : 'Activer'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 mb-3">{p.subtitle}</p>

                    <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-100/80 rounded-xl">
                      <div className="space-y-1 text-center">
                        <div className="h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: p.colors.sidebarBg }} />
                        <span className="text-[9px] font-mono text-slate-500">Sidebar</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: p.colors.primary }} />
                        <span className="text-[9px] font-mono text-slate-500">Primary</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: p.colors.accent }} />
                        <span className="text-[9px] font-mono text-slate-500">Accent</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: p.colors.accentGold }} />
                        <span className="text-[9px] font-mono text-slate-500">Or</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-7 rounded-lg border border-slate-300 shadow-2xs" style={{ backgroundColor: p.colors.surface }} />
                        <span className="text-[9px] font-mono text-slate-500">Surface</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <div className="h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: p.colors.darkVariant.background }} />
                        <span className="text-[9px] font-mono text-slate-500">Dark</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: LMAV BLUE SCALE */}
            {activeTab === 'scale' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Gamme Propriétaire : LMAV Blue Scale (50 à 950)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Nuancier mathématique et optique exclusif à Le Monde à Vous, optimisé pour les applications d’autorité internationale.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                  {Object.entries(LMAV_BLUE_SCALE).map(([step, hex]) => {
                    const isDark = parseInt(step) >= 600;
                    return (
                      <div 
                        key={step} 
                        onClick={() => handleCopyHex(hex)}
                        className="p-4 rounded-xl border border-slate-200 cursor-pointer hover:shadow-md transition relative group"
                        style={{ backgroundColor: hex }}
                      >
                        <div className={`flex justify-between items-start ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span className="text-xs font-black">LMAV Blue {step}</span>
                          <span className="text-[10px] font-mono opacity-80 group-hover:opacity-100">{hex}</span>
                        </div>
                        <div className={`text-[10px] mt-4 font-bold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                          {step === '950' ? 'Midnight Base' :
                           step === '900' ? 'Primary Deep Brand' :
                           step === '600' ? 'Interactive Action' :
                           step === '100' ? 'Soft Tint Pill' :
                           step === '50' ? 'Canvas Highlight' : `Palier ${step}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {copiedHex && (
                  <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-60 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-fade-up">
                    Code couleur copié : {copiedHex}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
