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

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string, context?: any) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  userProfile: UserProfile;
  onLogout?: () => void;
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
  onLogout 
}) => {
  const { currentPalette, paletteId } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDialloOSOpen, setIsDialloOSOpen] = useState(false);
  const [dialloInitialPrompt, setDialloInitialPrompt] = useState<string | undefined>(undefined);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modals state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isTickerPaused, setIsTickerPaused] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const previousTabRef = useRef(activeTab);

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
  const activeNavItem = MAIN_NAV_ITEMS.find((item) => item.id === activeTab);

  // Save favorites
  const toggleFavorite = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId];
      localStorage.setItem('lmav_nav_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Track recent tabs on change
  useEffect(() => {
    if (activeTab && activeTab !== 'home') {
      setRecentTabs(prev => {
        const filtered = prev.filter(t => t !== activeTab);
        const updated = [activeTab, ...filtered].slice(0, 4);
        localStorage.setItem('lmav_nav_recents', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (previousTabRef.current === activeTab) return;
    previousTabRef.current = activeTab;
    const frame = window.requestAnimationFrame(() => mainContentRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  useEffect(() => {
    if (!isLanguageMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) setIsLanguageMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLanguageMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isLanguageMenuOpen]);

  useEffect(() => {
    if (!isNotifOpen && !isProfileMenuOpen) return;
    const closePopover = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isNotifOpen) {
        setIsNotifOpen(false);
        notificationButtonRef.current?.focus();
      }
      if (isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closePopover);
    return () => document.removeEventListener('keydown', closePopover);
  }, [isNotifOpen, isProfileMenuOpen]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenDialloOSWithPrompt = (prompt?: string) => {
    setDialloInitialPrompt(prompt);
    setIsDialloOSOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden font-sans text-slate-900" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Espace affiché : {activeNavItem?.label || activeTab}
      </div>
      
      {/* ─── DESKTOP HEADER ─── */}
      <header className="hidden md:block bg-white/90 backdrop-blur-md border-b border-gray-200 z-20 sticky top-0">
        <div className="max-w-[1920px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <button type="button" className="flex items-center gap-3 cursor-pointer group rounded-xl text-left" onClick={() => onTabChange('home')} aria-label="Le Monde à Vous — revenir à l’accueil">
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
          </button>
          
          {/* Central Universal Search Bar / Command Palette Trigger */}
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="flex-1 bg-slate-100/90 hover:bg-white hover:ring-2 ring-brand-200 text-slate-500 hover:text-brand-700 flex items-center justify-between px-4 py-2 rounded-full border border-slate-200/60 hover:border-brand-300 transition-all group shadow-inner"
              aria-label="Ouvrir la recherche universelle"
              aria-keyshortcuts="Control+K Meta+K"
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
              onClick={() => setIsSearchModalOpen(true)}
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
            <button
              type="button"
              onClick={() => onTabChange('wallet')}
              className="hidden xl:flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 cursor-pointer px-3 py-1.5 rounded-full border border-yellow-200 text-xs font-bold text-yellow-700 transition"
              title="Ouvrir Finance & Wallet"
            >
              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] text-white font-black">Ⓒ</div>
              {userProfile.credits.toLocaleString()}
            </button>

            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((open) => !open)}
                className="a11y-touch-target rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-xs"
                aria-label={`Langue de l’interface : ${SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name}. Changer de langue`}
                aria-haspopup="menu"
                aria-expanded={isLanguageMenuOpen}
                aria-controls="language-menu"
              >
                <span className="text-base" aria-hidden="true">{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.flag}</span>
              </button>
              {isLanguageMenuOpen && <div id="language-menu" role="menu" aria-label="Choisir la langue" className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-44 animate-fade-up p-1.5 z-30">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => { setCurrentLang(lang.code); setIsLanguageMenuOpen(false); }}
                    role="menuitemradio"
                    aria-checked={currentLang === lang.code}
                    className="a11y-touch-target w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
                  >
                    <span aria-hidden="true">{lang.flag}</span> {lang.name}
                  </button>
                ))}
              </div>}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                ref={notificationButtonRef}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="a11y-touch-target rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors relative shadow-xs"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
                aria-haspopup="true"
                aria-expanded={isNotifOpen}
                aria-controls="notification-panel"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {isNotifOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-10 border-0 bg-transparent p-0" onClick={() => setIsNotifOpen(false)} aria-label="Fermer les notifications"></button>
                  <div id="notification-panel" role="region" aria-label="Notifications" className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-fade-up">
                    <div className="p-3.5 border-b border-gray-50 flex justify-between items-center bg-slate-50/70">
                      <span className="font-bold text-xs text-slate-800">Notifications</span>
                      <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-600 font-bold">{unreadCount} nouvelles</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">Rien à signaler</div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            type="button"
                            key={notif.id} 
                            className={`w-full p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                            onClick={() => onMarkRead(notif.id)}
                            aria-label={`${notif.read ? '' : 'Non lue. '}${notif.title}. ${notif.message}`}
                          >
                            <div className="flex gap-2.5">
                              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              <div>
                                <div className="font-semibold text-xs text-slate-800">{notif.title}</div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                              </div>
                            </div>
                          </button>
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
                ref={profileButtonRef}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="a11y-touch-target rounded-full overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-brand-300 transition-all"
                aria-label={`Menu du profil de ${userProfile.name}`}
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
                aria-controls="profile-menu"
              >
                <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
              </button>
              {isProfileMenuOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-10 border-0 bg-transparent p-0" onClick={() => setIsProfileMenuOpen(false)} aria-label="Fermer le menu du profil"></button>
                  <div id="profile-menu" role="region" aria-label="Menu du profil" className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-up p-2">
                    <div className="p-2 border-b border-gray-50 mb-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{userProfile.email}</p>
                      {userProfile.role === 'admin' && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">ADMIN PRINCIPAL</span>
                      )}
                    </div>
                    
                    <button onClick={() => {onTabChange('profile'); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-2 text-slate-700 font-medium">
                      <User size={14} /> Mon Profil
                    </button>
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
        <div className="bg-slate-900 text-white text-[10px] font-bold py-1 overflow-hidden whitespace-nowrap flex items-center border-t border-slate-800" role="region" aria-label="Actualités en continu">
          <span className="bg-red-600 px-2 py-0.5 ml-4 mr-2 rounded text-[8px] uppercase tracking-wider motion-safe:animate-pulse flex-shrink-0">Direct</span>
          <button type="button" onClick={() => setIsTickerPaused((paused) => !paused)} className="mr-3 rounded border border-white/30 px-2 py-0.5 text-[9px] hover:bg-white/10" aria-pressed={isTickerPaused}>
            {isTickerPaused ? 'Reprendre' : 'Pause'}
          </button>
          <div className={`inline-block w-full opacity-80 motion-reduce:animate-none ${isTickerPaused ? '' : 'motion-safe:animate-[slide-across_35s_linear_infinite]'}`} aria-live="off">
            {NEWS_ITEMS.map((item, i) => (
              <span key={i} className="mr-14">{item}</span>
            ))}
          </div>
        </div>
      </header>

      {/* ─── MOBILE HEADER ─── */}
      <header className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 py-2.5 flex justify-between items-center sticky top-0 z-30">
        <button type="button" className="flex items-center gap-2 rounded-lg" onClick={() => onTabChange('home')} aria-label="Revenir à l’accueil">
          <div className="bg-gradient-to-tr from-brand-600 to-purple-600 p-1.5 rounded-lg">
            <Globe className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Le Monde à Vous</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Search trigger */}
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="a11y-touch-target rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            aria-label="Ouvrir la recherche universelle"
          >
            <Search size={16} />
          </button>
          
          <div className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
            {userProfile.credits} Ⓒ
          </div>

          <button onClick={() => onTabChange('profile')} className="a11y-touch-target rounded-full overflow-hidden border border-gray-200" aria-label={`Ouvrir le profil de ${userProfile.name}`}>
            <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
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
          aria-label="Navigation principale"
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
              aria-label={isSidebarCollapsed ? "Déployer le menu principal" : "Réduire le menu principal"}
              aria-expanded={!isSidebarCollapsed}
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
                          aria-current={isActive ? 'page' : undefined}
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
                        aria-current={activeTab === tabId ? 'page' : undefined}
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
                              aria-current={isActive ? 'page' : undefined}
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
                                    : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                                }`}
                                aria-label={isFav ? `Retirer ${item.label} des favoris` : `Ajouter ${item.label} aux favoris`}
                                aria-pressed={isFav}
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
                <img src={userProfile.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
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
        <main id="main-content" ref={mainContentRef} tabIndex={-1} aria-label={activeNavItem?.label || 'Contenu principal'} className="flex-1 overflow-y-auto relative w-full bg-[#f8fafc] scroll-smooth pb-36 md:pb-0 focus:outline-none">
          <div className="max-w-[1700px] mx-auto h-full flex flex-col">
            {activeTab !== 'home' && (() => {
              const currentItem = MAIN_NAV_ITEMS.find(item => item.id === activeTab);
              return (
                <ContextActionBar
                  activeTabId={activeTab}
                  activeTabLabel={currentItem?.label || activeTab}
                  pillarLabel={currentItem?.category || 'Espace LMAV'}
                  description={currentItem?.description}
                  onBack={() => onTabChange('home')}
                  onOpenDialloOS={(prompt) => {
                    setDialloInitialPrompt(prompt);
                    setIsDialloOSOpen(true);
                  }}
                  onOpenTransversal={() => setIsTransversalModalOpen(true)}
                  onOpenSearch={() => setIsSearchModalOpen(true)}
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
            id="mobile-nav-drawer"
            role="navigation"
            aria-label="Tous les espaces"
            aria-hidden={!isMobileMenuExpanded}
            className={`bg-white/95 backdrop-blur-2xl border-t border-gray-200 transition-all duration-300 ease-in-out overflow-hidden pointer-events-auto ${
              isMobileMenuExpanded ? 'h-auto max-h-[85vh] opacity-100 shadow-[0_-10px_40px_rgba(0,0,0,0.25)]' : 'h-0 opacity-0'
            }`}
          >
            {isMobileMenuExpanded && <div className="p-4 pb-28 flex flex-col h-full">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Espaces & Piliers de Vie</h2>
                  <button
                    onClick={() => { setIsGoalModalOpen(true); setIsMobileMenuExpanded(false); }}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-200"
                    aria-label="Définir ou changer mon cap"
                  >
                    Mon Cap
                  </button>
                </div>
                <button onClick={() => setIsMobileMenuExpanded(false)} className="a11y-touch-target bg-slate-100 rounded-full text-slate-500 flex items-center justify-center" aria-label="Fermer le menu des espaces">
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
              
              <div className="space-y-4 overflow-y-auto flex-1">
                {categoryOrder.map((category) => {
                  const items = groupedNavItems[category] || [];
                  return (
                    <div key={`mob-cat-${category}`}>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{category}</h3>
                      <div className="grid grid-cols-3 min-[420px]:grid-cols-4 gap-2">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={`mob-item-${item.id}`}
                              onClick={() => { onTabChange(item.id); setIsMobileMenuExpanded(false); }}
                              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95
                                ${isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 shadow-xs' : 'text-slate-700 hover:bg-slate-50'}`}
                              aria-current={isActive ? 'page' : undefined}
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
                <button onClick={() => {onTabChange('settings'); setIsMobileMenuExpanded(false);}} className="flex-1 py-2 bg-slate-100 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2">
                  <Settings size={14} /> Paramètres
                </button>
                {onLogout && (
                  <button onClick={onLogout} className="a11y-touch-target px-3 py-2 border border-red-200 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1" aria-label="Se déconnecter">
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            </div>}
          </div>

          {/* Bottom Dock Bar (5 Essential Actions) */}
          <div className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 bg-gradient-to-t from-[#f0f2f5] via-[#f0f2f5]/90 to-transparent pointer-events-auto">
            <nav className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2.5rem] p-2 flex items-center justify-between relative px-3 sm:px-6 h-16" aria-label="Navigation mobile principale">
              
              {/* 1. Home */}
              <button 
                onClick={() => {onTabChange('home'); setIsMobileMenuExpanded(false);}} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${activeTab === 'home' ? 'text-brand-600' : 'text-slate-400'}`}
                aria-label="Accueil"
                aria-current={activeTab === 'home' ? 'page' : undefined}
              >
                <LayoutGrid size={22} className={activeTab === 'home' ? 'stroke-[2.5]' : ''} />
              </button>

              {/* 2. Mon Parcours */}
              <button 
                onClick={() => {onTabChange('parcours'); setIsMobileMenuExpanded(false);}} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${activeTab === 'parcours' || activeTab === 'dossiers' ? 'text-brand-600' : 'text-slate-400'}`}
                aria-label="Mon parcours"
                aria-current={activeTab === 'parcours' || activeTab === 'dossiers' ? 'page' : undefined}
              >
                <FolderKanban size={22} className={activeTab === 'parcours' ? 'stroke-[2.5]' : ''} />
              </button>

              {/* 3. Central Diallo OS Button */}
              <button 
                onClick={() => setIsDialloOSOpen(true)}
                className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 rounded-full shadow-lg shadow-brand-500/40 text-white transform -translate-y-5 hover:scale-110 active:scale-95 transition-transform border-4 border-[#f0f2f5] z-20 shrink-0"
                aria-label="Ouvrir Diallo OS"
              >
                <Sparkles size={22} className="animate-pulse" />
              </button>

              {/* 4. Réseau MOC */}
              <button 
                onClick={() => {onTabChange('social'); setIsMobileMenuExpanded(false);}} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${activeTab === 'social' ? 'text-brand-600' : 'text-slate-400'}`}
                aria-label="Réseau Mok"
                aria-current={activeTab === 'social' ? 'page' : undefined}
              >
                <Users size={22} className={activeTab === 'social' ? 'stroke-[2.5]' : ''} />
              </button>

              {/* 5. Menu Drawer Toggle */}
              <button 
                onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)} 
                className={`flex flex-col items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-full transition-all ${isMobileMenuExpanded ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                aria-label={isMobileMenuExpanded ? 'Fermer le menu des espaces' : 'Ouvrir le menu des espaces'}
                aria-expanded={isMobileMenuExpanded}
                aria-controls="mobile-nav-drawer"
              >
                {isMobileMenuExpanded ? <ChevronDown size={22} /> : <Menu size={22} />}
              </button>
            </nav>
          </div>
        </div>
        
        {/* ─── MODALS & ORCHESTRATION OVERLAYS ─── */}
        <DialloOS 
          isOpen={isDialloOSOpen}
          onClose={() => { setIsDialloOSOpen(false); setDialloInitialPrompt(undefined); }}
          onNavigate={onTabChange}
          userProfile={userProfile}
        />

        <UniversalSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
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
