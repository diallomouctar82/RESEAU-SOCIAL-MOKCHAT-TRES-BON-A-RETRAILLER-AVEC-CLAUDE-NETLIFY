import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Globe, 
  Video, 
  Mic, 
  MessageSquare, 
  ShoppingBag, 
  GraduationCap, 
  LayoutGrid, 
  HeartPulse, 
  Home as HomeIcon, 
  Scale, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Wallet, 
  Bell, 
  Check, 
  X, 
  Briefcase, 
  Users, 
  Languages, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  LogOut, 
  Settings, 
  HardDrive, 
  MapPin,
  Star,
  Clock,
  Layers,
  Compass,
  Palette,
  Lock,
  User,
  Shield,
  HelpCircle,
  FolderKanban
} from 'lucide-react';
import { Notification, UserProfile, Language } from '../types';
import { DialloOS } from './DialloOS';
import { GoogleWorkspaceBanner } from './GoogleWorkspaceBanner';
import { MoocChatFloating } from './MoocChatFloating';
import { MAIN_NAV_ITEMS, NavItemDef } from './navigation/NavigationItems';
import { TransversalServicesModal } from './navigation/TransversalServicesModal';
import { UniversalSearchModal } from './navigation/UniversalSearchModal';
import { GoalOrientationModal } from './navigation/GoalOrientationModal';
import { ContextActionBar } from './ui/ContextActionBar';
import { GuidedModeModal } from './accessibility/GuidedModeModal';
import { UniversalScannerModal, ScannerContext } from './scanner/UniversalScannerModal';
import { BilingualConversationModal } from './translation/BilingualConversationModal';
import { UnifiedSettingsModal } from './settings/UnifiedSettingsModal';
import { BrandColorLabModal } from './settings/BrandColorLabModal';
import { ComponentShowcaseModal } from './ui/ComponentShowcaseModal';
import { FocusAndPresentationControls } from './ui/FocusAndPresentationControls';
import { useTheme } from '../contexts/ThemeContext';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../constants';
import { voiceEngine } from '../services/voiceEngine';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string, context?: any) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  userProfile: UserProfile;
  onLogout?: () => void;
  // Remonté à App.tsx : Dashboard a aussi besoin d'ouvrir la recherche
  // universelle depuis sa zone d'actions rapides, ce qu'un état purement
  // interne à Layout ne permettait pas.
  isSearchModalOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
}

const NEWS_ITEMS = [
  "🌍 FLASH INFO : Nouveaux visas 'Nomade Digital' disponibles au Japon dès le mois prochain.",
  "⚠️ SANTÉ : Campagne de vaccination grippe lancée en France (gratuite pour les résidents).",
  "🚀 TECH : L'Afrique de l'Ouest lance un grand plan de formation numérique pour 2026.",
  "✈️ VOYAGE : Baisse des prix des billets vers le Canada pour la saison estivale.",
  "⚖️ DROIT : Simplification des démarches de regroupement familial en Belgique annoncée."
];

const DEFAULT_FAVORITES = ['career', 'campus', 'housing', 'shop'];

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  notifications,
  onMarkRead,
  userProfile,
  onLogout,
  isSearchModalOpen,
  onOpenSearch,
  onCloseSearch,
}) => {
  const { currentPalette, paletteId } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDialloOSOpen, setIsDialloOSOpen] = useState(false);
  const [dialloInitialPrompt, setDialloInitialPrompt] = useState<string | undefined>(undefined);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modals state (isSearchModalOpen vient désormais de App.tsx — voir LayoutProps)
  const [isTransversalModalOpen, setIsTransversalModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isGuidedModeOpen, setIsGuidedModeOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerContext, setScannerContext] = useState<ScannerContext>('general');
  const [isBilingualModalOpen, setIsBilingualModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isColorLabOpen, setIsColorLabOpen] = useState(false);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lmav_nav_favorites');
      return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  // Recents state
  const [recentTabs, setRecentTabs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lmav_nav_recents');
      return stored ? JSON.parse(stored) : ['career', 'campus', 'shop'];
    } catch {
      return ['career', 'campus', 'shop'];
    }
  });

  // Language State
  const [currentLang, setCurrentLang] = useState<Language>('fr');

  const unreadCount = notifications.filter(n => !n.read).length;
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Save favorites
  const toggleFavorite = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId];
      localStorage.setItem('lmav_nav_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Track recent tabs on change & cancel voice speech
  useEffect(() => {
    voiceEngine.stopSpeaking();
    if (activeTab && activeTab !== 'home') {
      setRecentTabs(prev => {
        const filtered = prev.filter(t => t !== activeTab);
        const updated = [activeTab, ...filtered].slice(0, 4);
        localStorage.setItem('lmav_nav_recents', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeTab]);

  // Grouped Navigation
  const categoryOrder: Array<NavItemDef['category']> = [
    'Accueil & Cap',
    'Apprendre & Évoluer',
    'Vie & Services',
    'Créer & Entreprendre',
    'Communauté & Conseil'
  ];

  const groupedNavItems = categoryOrder.reduce((acc, cat) => {
    acc[cat] = MAIN_NAV_ITEMS.filter(item => item.category === cat);
    return acc;
  }, {} as Record<NavItemDef['category'], NavItemDef[]>);

  // Keyboard shortcuts (Ctrl/Cmd + K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSearchModalOpen) onCloseSearch(); else onOpenSearch();
      } else if (e.key === 'Escape') {
        onCloseSearch();
        setIsNotifOpen(false);
        setIsProfileMenuOpen(false);
        setIsTransversalModalOpen(false);
        setIsGoalModalOpen(false);
        setIsGuidedModeOpen(false);
        setIsScannerOpen(false);
        setIsBilingualModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsColorLabOpen(false);
        setIsShowcaseModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, onOpenSearch, onCloseSearch]);

  const handleOpenDialloOSWithPrompt = (prompt?: string) => {
    setDialloInitialPrompt(prompt);
    setIsDialloOSOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden font-sans text-slate-900" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ─── DESKTOP HEADER ─── */}
      <header className="hidden md:block bg-white/90 backdrop-blur-md border-b border-gray-200 z-20 sticky top-0">
        <div className="max-w-[1920px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onTabChange('home')}>
            <div className="bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 p-2 rounded-xl shadow-md group-hover:shadow-brand-500/30 transition-all duration-300 transform group-hover:scale-105">
              <Globe className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-700">
                  Le Monde à Vous
                </h1>
                <span className="px-1.5 py-0.2 rounded-md bg-brand-50 border border-brand-200/60 text-[9px] font-extrabold text-brand-700 uppercase tracking-wide">
                  v5.12
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Plateforme Universelle d’Accomplissement</p>
            </div>
          </div>
          
          {/* Central Universal Search Bar / Command Palette Trigger */}
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <button 
              onClick={onOpenSearch}
              className="flex-1 bg-slate-100/90 hover:bg-white hover:ring-2 ring-brand-200 text-slate-500 hover:text-brand-700 flex items-center justify-between px-4 py-2 rounded-full border border-slate-200/60 hover:border-brand-300 transition-all group shadow-inner"
            >
              <div className="flex items-center gap-2.5">
                <Search size={16} className="text-slate-400 group-hover:text-brand-600 transition" />
                <span className="text-xs font-medium text-slate-600">Rechercher un espace, cours, visa, démarche, CV...</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-400 group-hover:text-brand-700">
                ⌘ K
              </div>
            </button>

            {/* Guide-Moi Trigger */}
            <button
              onClick={() => setIsGuidedModeOpen(true)}
              className="px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Activer le mode guidé pas à pas"
              aria-label="Mode guidé"
            >
              <Compass size={15} className="text-white" />
              <span>Guide-moi</span>
            </button>

            {/* Quick Goal Compass Trigger */}
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="hidden lg:flex px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold items-center gap-1.5 transition shrink-0 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Définir ou changer mon cap"
            >
              <Compass size={15} className="text-white" />
              <span>Mon Cap</span>
            </button>

            {/* Scanner Trigger */}
            <button
              onClick={() => {
                const ctxMap: Record<string, ScannerContext> = {
                  languages: 'languages',
                  'admin-procedures': 'procedures',
                  health: 'health',
                  shop: 'shop',
                  studio: 'studio'
                };
                setScannerContext(ctxMap[activeTab] || 'general');
                setIsScannerOpen(true);
              }}
              className="p-2 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 transition shrink-0 shadow-xs"
              title="Scanner un document, texte ou QR Code"
              aria-label="Scanner avec Le Monde à Vous"
            >
              <Search size={16} />
            </button>

            {/* Diallo OS Micro Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 transition shrink-0 shadow-xs"
              title="Commande vocale de navigation"
              aria-label="Commande vocale"
            >
              <Mic size={16} />
            </button>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            
            {/* Focus & Presentation Controls */}
            <div className="hidden xl:block">
              <FocusAndPresentationControls
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                isPresentationMode={isPresentationMode}
                onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
              />
            </div>

            {/* Super-Admin Dashboard Trigger */}
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                activeTab === 'admin' 
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' 
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40'
              }`}
              title="Ouvrir le Tableau de Bord Super-Admin Souverain (Gestion des comptes, rôles, modules & système)"
            >
              <Shield size={14} className="text-amber-400 fill-amber-400/20" />
              <span>Super-Admin</span>
              <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded font-extrabold">Tous Comptes</span>
            </button>

            {/* Brand Color Lab (10 Palettes) Trigger */}
            <button
              onClick={() => setIsColorLabOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Ouvrir le Laboratoire des 10 Palettes Chromatiques"
            >
              <Palette size={14} className="text-white" />
              <span className="hidden md:inline">Nuancier</span>
              <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-extrabold">10</span>
            </button>

            {/* Bilingual Mode Trigger */}
            <button
              onClick={() => setIsBilingualModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Ouvrir le Mode Conversation Bilingue Direct"
            >
              <Languages size={14} className="text-white" />
              <span>Bilingue</span>
            </button>

            {/* Transversal Google Services Hub Button */}
            <button
              onClick={() => setIsTransversalModalOpen(true)}
              className="hidden 2xl:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Ouvrir le Hub des Capacités Transversales (Maps, Drive, Meet, Chat)"
            >
              <Layers size={14} className="text-white" />
              <span>Services</span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            </button>

            {/* Google Workspace Connection Banner (compact) */}
            <div className="hidden sm:block">
              <GoogleWorkspaceBanner compact />
            </div>

            {/* Credits Counter */}
            <div 
              onClick={() => onTabChange('wallet')}
              className="hidden xl:flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 cursor-pointer px-3 py-1.5 rounded-full border border-yellow-200 text-xs font-bold text-yellow-700 transition"
              title="Ouvrir Finance & Wallet"
            >
              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] text-white font-black">Ⓒ</div>
              {userProfile.credits.toLocaleString()}
            </div>

            {/* Language Selector */}
            <div className="relative group">
              <button className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-xs">
                <span className="text-base">{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.flag}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block w-36 animate-fade-up p-1.5 z-30">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => setCurrentLang(lang.code)}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
                  >
                    <span>{lang.flag}</span> {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors relative shadow-xs"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-fade-up">
                    <div className="p-3.5 border-b border-gray-50 flex justify-between items-center bg-slate-50/70">
                      <span className="font-bold text-xs text-slate-800">Notifications</span>
                      <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-600 font-bold">{unreadCount} nouvelles</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">Rien à signaler</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                            onClick={() => onMarkRead(notif.id)}
                          >
                            <div className="flex gap-2.5">
                              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              <div>
                                <div className="font-semibold text-xs text-slate-800">{notif.title}</div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* User Profile Avatar & Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-brand-300 transition-all"
              >
                <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </button>
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-up p-2">
                    <div className="p-2 border-b border-gray-50 mb-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{userProfile.email}</p>
                      {userProfile.role === 'admin' && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">ADMIN PRINCIPAL</span>
                      )}
                    </div>
                    
                    <button onClick={() => {onTabChange('admin'); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 rounded-xl text-xs flex items-center gap-2 font-black border border-amber-200/80 shadow-2xs mb-1">
                      <Shield size={15} className="text-amber-600 fill-amber-500/20" /> 
                      <span>Tableau de Bord Super-Admin</span>
                    </button>
                    <button onClick={() => {onTabChange('profile'); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-2 text-slate-700 font-medium">
                      <User size={14} /> Mon Profil
                    </button>
                    {(userProfile.role === 'admin' || (userProfile.role as string) === 'super_admin') && (
                      <button onClick={() => {onTabChange('admin'); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 font-bold">
                        <Shield size={14} /> Console d'Administration
                      </button>
                    )}
                    <button onClick={() => {setIsSettingsModalOpen(true); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-2 text-slate-700 font-medium">
                      <Settings size={14} /> Paramètres & Connecteurs
                    </button>
                    <button onClick={() => {setIsColorLabOpen(true); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-blue-900 rounded-xl text-xs flex items-center gap-2 font-bold">
                      <Palette size={14} className="text-blue-600" /> Nuancier 10 Palettes
                    </button>
                    <button onClick={() => {setIsShowcaseModalOpen(true); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-2 text-slate-700 font-medium">
                      <Layers size={14} /> Galerie Design System
                    </button>
                    
                    {onLogout && (
                      <button onClick={() => { onLogout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border-t border-gray-50 mt-1">
                        <LogOut size={14} /> Se déconnecter
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* News Ticker */}
        <div className="bg-slate-900 text-white text-[10px] font-bold py-1 overflow-hidden whitespace-nowrap flex items-center border-t border-slate-800">
          <span className="bg-red-600 px-2 py-0.2 ml-4 mr-3 rounded text-[8px] uppercase tracking-wider animate-pulse flex-shrink-0">Direct</span>
          <div className="inline-block animate-[slide-across_35s_linear_infinite] w-full opacity-80">
            {NEWS_ITEMS.map((item, i) => (
              <span key={i} className="mr-14">{item}</span>
            ))}
          </div>
        </div>
      </header>

      {/* ─── MOBILE HEADER ─── */}
      <header className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 py-2.5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2" onClick={() => onTabChange('home')}>
          <div className="bg-gradient-to-tr from-brand-600 to-purple-600 p-1.5 rounded-lg">
            <Globe className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Le Monde à Vous</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search trigger */}
          <button 
            onClick={onOpenSearch}
            className="p-1.5 rounded-full bg-slate-100 text-slate-600"
          >
            <Search size={16} />
          </button>
          
          <div className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
            {userProfile.credits} Ⓒ
          </div>

          <button onClick={() => onTabChange('profile')} className="w-7 h-7 rounded-full overflow-hidden border border-gray-200">
            <img src={userProfile.avatarUrl} className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      {/* ─── MAIN APP CONTAINER ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ─── DESKTOP SIDEBAR (Categorized by Human Goals) ─── */}
        <aside 
          className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-72'} h-full overflow-hidden flex-shrink-0 z-10 transition-all duration-300 ease-in-out border-r`}
          style={{ 
            backgroundColor: currentPalette.colors.sidebarBg,
            borderColor: currentPalette.colors.sidebarBorder,
            color: currentPalette.colors.sidebarText
          }}
        >
          
          {/* Collapse Toggle & Quick Goal Button */}
          <div 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 border-b`}
            style={{ 
              backgroundColor: currentPalette.colors.sidebarSurface,
              borderColor: currentPalette.colors.sidebarBorder 
            }}
          >
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition shadow-2xs text-white"
                  style={{ backgroundColor: currentPalette.colors.sidebarActiveBg }}
                >
                  <Compass size={13} />
                  <span>Mon Cap</span>
                </button>
                <span className="text-[10px] opacity-70 font-medium" style={{ color: currentPalette.colors.sidebarTextMuted }}>
                  Besoins de Vie
                </span>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
              style={{ color: currentPalette.colors.sidebarText }}
              title={isSidebarCollapsed ? "Déployer le menu" : "Réduire le menu"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Scrollable Body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
            
            {/* 🌟 1. MES FAVORIS ÉPINGLÉS (si existants) */}
            {favorites.length > 0 && (
              <div>
                {!isSidebarCollapsed ? (
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span 
                      className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                      style={{ color: currentPalette.colors.sidebarHighlight }}
                    >
                      <Star size={11} className="fill-current" />
                      Mes Favoris
                    </span>
                    <span className="text-[9px] opacity-60" style={{ color: currentPalette.colors.sidebarTextMuted }}>
                      {favorites.length}
                    </span>
                  </div>
                ) : (
                  <div className="h-px my-2 mx-2 opacity-20 bg-white"></div>
                )}

                <div className="space-y-0.5">
                  {MAIN_NAV_ITEMS.filter(item => favorites.includes(item.id)).map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <div key={`fav-${item.id}`} className="relative group">
                        <button
                          onClick={() => onTabChange(item.id)}
                          title={isSidebarCollapsed ? item.label : ''}
                          className={`
                            w-full flex items-center gap-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150
                            ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2.5'}
                          `}
                          style={isActive ? {
                            backgroundColor: currentPalette.colors.sidebarActiveBg,
                            color: currentPalette.colors.sidebarActiveText,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          } : {
                            color: currentPalette.colors.sidebarText,
                          }}
                        >
                          <Icon 
                            size={16} 
                            className="shrink-0" 
                            style={{ color: isActive ? currentPalette.colors.sidebarActiveText : currentPalette.colors.sidebarHighlight }} 
                          />
                          {!isSidebarCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🕒 2. ACCÈS RÉCENTS */}
            {!isSidebarCollapsed && recentTabs.length > 0 && (
              <div>
                <div className="flex items-center gap-1 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: currentPalette.colors.sidebarTextMuted }}>
                  <Clock size={10} />
                  <span>Récents</span>
                </div>
                <div className="flex flex-wrap gap-1 px-1">
                  {recentTabs.map(tabId => {
                    const found = MAIN_NAV_ITEMS.find(m => m.id === tabId);
                    if (!found) return null;
                    return (
                      <button
                        key={`rec-${tabId}`}
                        onClick={() => onTabChange(tabId)}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-medium border transition truncate max-w-[120px]"
                        style={activeTab === tabId ? {
                          backgroundColor: currentPalette.colors.sidebarActiveBg,
                          color: '#ffffff',
                          borderColor: currentPalette.colors.sidebarActiveBg
                        } : {
                          backgroundColor: currentPalette.colors.sidebarSurface,
                          color: currentPalette.colors.sidebarText,
                          borderColor: currentPalette.colors.sidebarBorder
                        }}
                      >
                        {found.shortLabel || found.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🏛️ 3. GRANDS PILIERS DE VIE PAR BESOINS HUMAINS */}
            <div className="space-y-4 pt-1">
              {categoryOrder.map((category) => {
                const items = groupedNavItems[category] || [];
                return (
                  <div key={category}>
                    {!isSidebarCollapsed ? (
                      <h3 
                        className="text-[10px] font-black uppercase tracking-widest px-2.5 mb-1.5 opacity-60"
                        style={{ color: currentPalette.colors.sidebarTextMuted }}
                      >
                        {category}
                      </h3>
                    ) : (
                      <div className="h-px my-2.5 mx-2 opacity-20 bg-white"></div>
                    )}
                    
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isFav = favorites.includes(item.id);

                        return (
                          <div key={item.id} className="relative group flex items-center">
                            <button
                              onClick={() => onTabChange(item.id)}
                              title={isSidebarCollapsed ? `${item.label} — ${item.description}` : ''}
                              className={`
                                flex-1 flex items-center gap-2.5 py-1.5 rounded-xl text-xs transition-all duration-150 relative overflow-hidden
                                ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2.5'}
                              `}
                              style={isActive ? {
                                backgroundColor: currentPalette.colors.sidebarActiveBg,
                                color: currentPalette.colors.sidebarActiveText,
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              } : {
                                color: currentPalette.colors.sidebarText,
                                fontWeight: 500,
                              }}
                            >
                              <Icon 
                                size={16} 
                                className="shrink-0"
                                style={{ color: isActive ? currentPalette.colors.sidebarActiveText : currentPalette.colors.sidebarTextMuted }} 
                              />
                              
                              {!isSidebarCollapsed && (
                                <span className="truncate flex-1 text-left">{item.label}</span>
                              )}
                              
                              {!isSidebarCollapsed && item.badge && (
                                <span 
                                  className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase shrink-0"
                                  style={isActive ? {
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: '#ffffff'
                                  } : {
                                    backgroundColor: currentPalette.colors.sidebarSurface,
                                    color: currentPalette.colors.sidebarTextMuted
                                  }}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>

                            {/* Pin Favorite Star Button on Hover */}
                            {!isSidebarCollapsed && (
                              <button
                                onClick={(e) => toggleFavorite(item.id, e)}
                                title={isFav ? "Retirer des favoris" : "Épingler dans mes favoris"}
                                className={`p-1 rounded-md transition ${
                                  isFav 
                                    ? 'opacity-100' 
                                    : 'opacity-0 group-hover:opacity-100'
                                }`}
                                style={{ color: currentPalette.colors.sidebarHighlight }}
                              >
                                <Star size={13} className={isFav ? "fill-current" : ""} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Sidebar Footer — Transversal Hub & User Profile */}
          <div 
            className="p-3 border-t space-y-2"
            style={{ 
              backgroundColor: currentPalette.colors.sidebarSurface,
              borderColor: currentPalette.colors.sidebarBorder 
            }}
          >
            
            {/* Transversal Services Quick Access */}
            <button
              onClick={() => setIsTransversalModalOpen(true)}
              className={`w-full py-2 px-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition shadow-2xs ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              style={{
                backgroundColor: currentPalette.colors.sidebarBg,
                borderColor: currentPalette.colors.sidebarBorder,
                color: currentPalette.colors.sidebarText
              }}
              title="Outils & Services Google Workspace"
            >
              <div className="flex items-center gap-2">
                <Layers size={15} style={{ color: currentPalette.colors.sidebarHighlight }} className="shrink-0" />
                {!isSidebarCollapsed && <span>Services Transversaux</span>}
              </div>
              {!isSidebarCollapsed && (
                <span 
                  className="text-[9px] px-1.5 py-0.2 rounded-md font-extrabold text-white"
                  style={{ backgroundColor: currentPalette.colors.sidebarActiveBg }}
                >
                  Google
                </span>
              )}
            </button>

            {/* User Compact Card */}
            <div 
              className={`rounded-xl border shadow-2xs flex items-center ${isSidebarCollapsed ? 'justify-center p-1.5' : 'p-2 gap-2.5'}`}
              style={{
                backgroundColor: currentPalette.colors.sidebarBg,
                borderColor: currentPalette.colors.sidebarBorder,
                color: currentPalette.colors.sidebarText
              }}
            >
              <div className="relative shrink-0">
                <img src={userProfile.avatarUrl} className="w-7 h-7 rounded-full border border-white/20 object-cover" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden flex-1">
                  <div className="text-[11px] font-bold truncate" style={{ color: currentPalette.colors.sidebarText }}>
                    {userProfile.name}
                  </div>
                  <div className="text-[9px] truncate opacity-70" style={{ color: currentPalette.colors.sidebarTextMuted }}>
                    {userProfile.title || 'Citoyen du Monde'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEWPORT ─── */}
        <main className="flex-1 overflow-y-auto relative w-full bg-[#f8fafc] scroll-smooth pb-36 md:pb-0">
          <div className="max-w-[1700px] mx-auto h-full flex flex-col">
            {activeTab !== 'home' && (() => {
              const currentItem = MAIN_NAV_ITEMS.find(item => item.id === activeTab);
              return (
                <ContextActionBar
                  activeTabLabel={currentItem?.label || activeTab}
                  pillarLabel={currentItem?.category || 'Espace LMAV'}
                  description={currentItem?.description}
                  onBack={() => onTabChange('home')}
                  onOpenDialloOS={(prompt) => {
                    setDialloInitialPrompt(prompt);
                    setIsDialloOSOpen(true);
                  }}
                  onOpenTransversal={() => setIsTransversalModalOpen(true)}
                  onOpenSearch={onOpenSearch}
                />
              );
            })()}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </main>

        {/* ─── MOBILE SMART DOCK (COMPACT & EXPANDABLE) ─── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          
          {/* Expanded Menu Drawer */}
          <div 
            className={`bg-white/95 backdrop-blur-2xl border-t border-gray-200 transition-all duration-300 ease-in-out overflow-hidden pointer-events-auto ${
              isMobileMenuExpanded ? 'h-auto max-h-[85vh] opacity-100 shadow-[0_-10px_40px_rgba(0,0,0,0.25)]' : 'h-0 opacity-0'
            }`}
          >
            <div className="p-4 pb-28 flex flex-col h-full">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Espaces & Piliers de Vie</h2>
                  <button
                    onClick={() => { setIsGoalModalOpen(true); setIsMobileMenuExpanded(false); }}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-200"
                  >
                    Mon Cap
                  </button>
                </div>
                <button onClick={() => setIsMobileMenuExpanded(false)} className="p-1.5 bg-slate-100 rounded-full text-slate-500">
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Transversal Banner on Mobile */}
              <button
                onClick={() => { setIsTransversalModalOpen(true); setIsMobileMenuExpanded(false); }}
                className="w-full mb-3 p-2.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-300" />
                  <span>Services Transversaux Google & Sécurité</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              {/* Outils rapides — desktop-only jusqu'ici (Notifications,
                  Scanner, Bilingue n'avaient aucun déclencheur mobile). */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => { setIsNotifOpen(true); setIsMobileMenuExpanded(false); }}
                  className="relative flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1/2 translate-x-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  )}
                  <span className="text-[9px] font-bold">Notifications</span>
                </button>
                <button
                  onClick={() => {
                    const ctxMap: Record<string, ScannerContext> = {
                      languages: 'languages',
                      'admin-procedures': 'procedures',
                      health: 'health',
                      shop: 'shop',
                      studio: 'studio'
                    };
                    setScannerContext(ctxMap[activeTab] || 'general');
                    setIsScannerOpen(true);
                    setIsMobileMenuExpanded(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700"
                >
                  <Search size={16} />
                  <span className="text-[9px] font-bold">Scanner</span>
                </button>
                <button
                  onClick={() => { setIsBilingualModalOpen(true); setIsMobileMenuExpanded(false); }}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700"
                >
                  <Languages size={16} />
                  <span className="text-[9px] font-bold">Bilingue</span>
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                {categoryOrder.map((category) => {
                  const items = groupedNavItems[category] || [];
                  return (
                    <div key={`mob-cat-${category}`}>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{category}</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={`mob-item-${item.id}`}
                              onClick={() => { onTabChange(item.id); setIsMobileMenuExpanded(false); }}
                              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95
                                ${isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 shadow-xs' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                <Icon size={18} />
                              </div>
                              <span className="text-[9px] font-bold text-center leading-tight line-clamp-1 w-full">{item.shortLabel || item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-100 shrink-0 flex gap-2">
                <button onClick={() => {onTabChange('admin'); setIsMobileMenuExpanded(false);}} className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                  <Shield size={14} /> Super-Admin (IA & Comptes)
                </button>
                {/* Ouvre la même UnifiedSettingsModal que le desktop — le
                    tab 'settings'/Settings.tsx était une implémentation
                    séparée, propre au mobile, sans équivalent desktop. */}
                <button onClick={() => {setIsSettingsModalOpen(true); setIsMobileMenuExpanded(false);}} className="px-3 py-2 bg-slate-100 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5">
                  <Settings size={14} /> Paramètres
                </button>
                {onLogout && (
                  <button onClick={onLogout} className="px-3 py-2 border border-red-200 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Dock Bar (5 Essential Actions) */}
          <div className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 bg-gradient-to-t from-[#f0f2f5] via-[#f0f2f5]/90 to-transparent pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2.5rem] p-2 flex items-center justify-between relative px-3 sm:px-6 h-16">
              
              {/* 1. Home */}
              <button 
                onClick={() => {onTabChange('home'); setIsMobileMenuExpanded(false);}} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${activeTab === 'home' ? 'text-brand-600' : 'text-slate-400'}`}
              >
                <LayoutGrid size={22} className={activeTab === 'home' ? 'stroke-[2.5]' : ''} />
              </button>

              {/* 2. Mon Parcours */}
              <button 
                onClick={() => {onTabChange('parcours'); setIsMobileMenuExpanded(false);}} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${activeTab === 'parcours' || activeTab === 'dossiers' ? 'text-brand-600' : 'text-slate-400'}`}
              >
                <FolderKanban size={22} className={activeTab === 'parcours' ? 'stroke-[2.5]' : ''} />
              </button>

              {/* 3. Central Diallo OS Button */}
              <button 
                onClick={() => setIsDialloOSOpen(true)}
                className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 rounded-full shadow-lg shadow-brand-500/40 text-white transform -translate-y-5 hover:scale-110 active:scale-95 transition-transform border-4 border-[#f0f2f5] z-20 shrink-0"
              >
                <Sparkles size={22} className="animate-pulse" />
              </button>

              {/* 4. Réseau MOC */}
              <button 
                onClick={() => {onTabChange('social'); setIsMobileMenuExpanded(false);}} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${activeTab === 'social' ? 'text-brand-600' : 'text-slate-400'}`}
              >
                <Users size={22} className={activeTab === 'social' ? 'stroke-[2.5]' : ''} />
              </button>

              {/* 5. Menu Drawer Toggle */}
              <button 
                onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${isMobileMenuExpanded ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
              >
                {isMobileMenuExpanded ? <ChevronDown size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* ─── MODALS & ORCHESTRATION OVERLAYS ─── */}
        <DialloOS 
          isOpen={isDialloOSOpen}
          onClose={() => { setIsDialloOSOpen(false); setDialloInitialPrompt(undefined); }}
          onNavigate={onTabChange}
          userProfile={userProfile}
        />

        {/* Notifications — panneau mobile. Le panneau desktop (ci-dessus,
            dans le header) est positionné en absolu par rapport à un
            conteneur masqué sur mobile (hidden md:block) : sans cet
            équivalent, activer isNotifOpen depuis le tiroir mobile n'aurait
            eu aucun effet visible. */}
        {isNotifOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50" onClick={() => setIsNotifOpen(false)}>
            <div
              className="w-full max-h-[75vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/70 shrink-0">
                <span className="font-bold text-sm text-slate-800">Notifications</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-600 font-bold">{unreadCount} nouvelles</span>
                  <button onClick={() => setIsNotifOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-500">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">Rien à signaler</div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => onMarkRead(notif.id)}
                    >
                      <div className="flex gap-2.5">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div>
                          <div className="font-semibold text-xs text-slate-800">{notif.title}</div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <UniversalSearchModal
          isOpen={isSearchModalOpen}
          onClose={onCloseSearch}
          onNavigate={onTabChange}
          onOpenDialloOS={handleOpenDialloOSWithPrompt}
        />

        <TransversalServicesModal
          isOpen={isTransversalModalOpen}
          onClose={() => setIsTransversalModalOpen(false)}
          onNavigate={onTabChange}
          onOpenDialloOS={() => handleOpenDialloOSWithPrompt()}
        />

        <GoalOrientationModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onNavigate={onTabChange}
          onOpenDialloOS={handleOpenDialloOSWithPrompt}
        />

        {/* Guided Step-by-Step Mode (Req 96-97) */}
        <GuidedModeModal
          isOpen={isGuidedModeOpen}
          onClose={() => setIsGuidedModeOpen(false)}
          onNavigate={onTabChange}
          onOpenDialloOS={handleOpenDialloOSWithPrompt}
        />

        {/* Universal OCR / Document / Camera Scanner (Req 103-105) */}
        <UniversalScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          context={scannerContext}
          onNavigate={onTabChange}
          onOpenDialloOS={handleOpenDialloOSWithPrompt}
        />

        {/* Direct Face-to-Face Bilingual Translation (Req 107-108) */}
        <BilingualConversationModal
          isOpen={isBilingualModalOpen}
          onClose={() => setIsBilingualModalOpen(false)}
        />

        {/* Unified Settings & Connectors Hub (Req 187-190) */}
        <UnifiedSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          userProfile={userProfile}
        />

        {/* Brand Color Lab — 10 Palettes Chromatiques */}
        <BrandColorLabModal
          isOpen={isColorLabOpen}
          onClose={() => setIsColorLabOpen(false)}
        />

        {/* Design System Component Showcase (Req 138, 140) */}
        <ComponentShowcaseModal
          isOpen={isShowcaseModalOpen}
          onClose={() => setIsShowcaseModalOpen(false)}
        />

        {/* Floating Mooc Chat */}
        <MoocChatFloating 
          currentUser={userProfile} 
        />

      </div>
    </div>
  );
};
