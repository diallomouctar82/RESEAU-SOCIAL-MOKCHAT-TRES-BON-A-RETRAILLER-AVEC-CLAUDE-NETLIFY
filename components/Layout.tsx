
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Globe, Video, Mic, MessageSquare, ShoppingBag, BookOpen, Home, Activity, Shield, Palette, Bell, Check, Store, X, Briefcase, HeartPulse, Home as HomeIcon, Zap, Radio, Scale, Search, ChevronRight, ChevronLeft, Wallet, Info, Target, Gift, CheckCircle, LayoutGrid, Users, Languages, FileText, Lock, Command, User, Sparkles, ChevronUp, ChevronDown, LogOut, Settings } from 'lucide-react';
import { Notification, UserProfile, Quest, Language } from '../types';
import { GoogleGenAI } from '@google/genai';
import { AGENTS, COURSES, JOBS, PRODUCTS, LEGAL_PROCEDURES, DAILY_QUESTS, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../constants';
import { DialloOS } from './DialloOS';

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

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, notifications, onMarkRead, userProfile, onLogout }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDialloOSOpen, setIsDialloOSOpen] = useState(false);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Language State
  const [currentLang, setCurrentLang] = useState<Language>('fr');

  const unreadCount = notifications.filter(n => !n.read).length;
  const t = (key: string) => TRANSLATIONS[currentLang][key] || key;

  // --- NAVIGATION CONFIGURATION ---
  const navItems = [
    { id: 'home', label: t('nav.home'), icon: LayoutGrid, category: 'Principal' },
    { id: 'chat', label: t('nav.chat'), icon: MessageSquare, category: 'Principal' },
    { id: 'social', label: t('nav.social'), icon: Users, category: 'Principal' },
    { id: 'world', label: t('nav.world'), icon: Globe, category: 'Mon Projet' }, // World includes Safe now
    { id: 'career', label: t('nav.career'), icon: Briefcase, category: 'Mon Projet' },
    { id: 'campus', label: t('nav.campus'), icon: BookOpen, category: 'Mon Projet' },
    { id: 'wallet', label: t('nav.wallet'), icon: Wallet, category: 'Vie Pratique' },
    { id: 'languages', label: 'Langues', icon: Languages, category: 'Vie Pratique' },
    { id: 'admin-procedures', label: 'Admin', icon: FileText, category: 'Vie Pratique' },
    { id: 'legal', label: t('nav.legal'), icon: Scale, category: 'Vie Pratique' },
    { id: 'health', label: t('nav.health'), icon: HeartPulse, category: 'Vie Pratique' },
    { id: 'housing', label: t('nav.housing'), icon: HomeIcon, category: 'Vie Pratique' },
    { id: 'studio', label: 'Studio', icon: Palette, category: 'Outils' },
    { id: 'shop', label: t('nav.shop'), icon: ShoppingBag, category: 'Outils' },
  ];

  const groupedNavItems = navItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
  }, {} as Record<string, typeof navItems>);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  // Keyboard shortcut for Diallo OS
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              setIsDialloOSOpen(prev => !prev);
          }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden font-sans text-slate-900" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
      <header className="hidden md:block bg-white/80 backdrop-blur-md border-b border-gray-200 z-20 sticky top-0">
        <div className="max-w-[1920px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onTabChange('home')}>
            <div className="bg-gradient-to-tr from-brand-600 to-purple-600 p-2 rounded-xl shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300 transform group-hover:scale-105">
              <Globe className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                Le Monde à Vous
            </h1>
          </div>
          
          {/* Central Search / OS Trigger */}
          <div className="flex-1 max-w-xl">
             <button 
                onClick={() => setIsDialloOSOpen(true)}
                className="w-full bg-slate-100 hover:bg-white hover:ring-2 ring-brand-100 text-slate-500 hover:text-brand-600 flex items-center justify-between px-4 py-2.5 rounded-full border border-transparent hover:border-brand-200 transition-all group shadow-inner"
             >
                <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-purple-500 animate-pulse" />
                    <span className="text-sm font-medium">Demandez à Diallo OS...</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-400">
                    ⌘ K
                </div>
             </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
             {/* Currency */}
             <div className="hidden lg:flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200 text-xs font-bold text-yellow-700">
                <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] text-white">Ⓒ</div>
                {userProfile.credits.toLocaleString()}
             </div>

             {/* Language */}
             <div className="relative group">
                 <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                     <span className="text-lg">{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.flag}</span>
                 </button>
                 <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block w-32 animate-fade-up p-1">
                     {SUPPORTED_LANGUAGES.map(lang => (
                         <button 
                            key={lang.code}
                            onClick={() => setCurrentLang(lang.code)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
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
                  className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-fade-up">
                       <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                          <span className="font-bold text-sm">Notifications</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500">{unreadCount} nouvelles</span>
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs">Rien à signaler</div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                className={`p-4 border-b border-gray-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                onClick={() => onMarkRead(notif.id)}
                              >
                                 <div className="flex gap-3">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                    <div>
                                       <div className="font-semibold text-sm text-slate-800">{notif.title}</div>
                                       <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
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
             
             {/* Profile */}
             <div className="relative">
                 <button 
                   onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                   className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-brand-200 transition-all"
                 >
                   <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                 </button>
                 {isProfileMenuOpen && (
                     <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-up p-2">
                            <div className="p-2 border-b border-gray-50 mb-2">
                                <p className="text-sm font-bold truncate">{userProfile.name}</p>
                                <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
                                {userProfile.role === 'admin' && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">ADMIN</span>
                                )}
                            </div>
                            
                            <button onClick={() => {onTabChange('profile'); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm flex items-center gap-2">
                                <User size={16} /> Mon Profil
                            </button>
                            <button onClick={() => {onTabChange('settings'); setIsProfileMenuOpen(false);}} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm flex items-center gap-2">
                                <Settings size={16} /> Paramètres
                            </button>
                            
                            {onLogout && (
                                <button onClick={() => { onLogout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border-t border-gray-50 mt-1">
                                    <LogOut size={16} /> Se déconnecter
                                </button>
                            )}
                        </div>
                     </>
                 )}
             </div>
          </div>
        </div>
        
        {/* News Ticker (Desktop) */}
        <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 overflow-hidden whitespace-nowrap flex items-center">
            <span className="bg-red-600 px-2 py-0.5 ml-4 mr-4 rounded text-[9px] uppercase tracking-wider animate-pulse flex-shrink-0">Direct</span>
            <div className="inline-block animate-[slide-across_30s_linear_infinite] w-full opacity-80">
                {NEWS_ITEMS.map((item, i) => (
                    <span key={i} className="mr-16">{item}</span>
                ))}
            </div>
        </div>
      </header>

      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden bg-white/90 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2" onClick={() => onTabChange('home')}>
              <div className="bg-gradient-to-tr from-brand-600 to-purple-600 p-1.5 rounded-lg">
                  <Globe className="text-white" size={16} />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">Le Monde à Vous</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">{userProfile.credits} Ⓒ</div>
              <button onClick={() => onTabChange('profile')} className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                  <img src={userProfile.avatarUrl} className="w-full h-full object-cover" />
              </button>
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- DESKTOP SIDEBAR (Collapsible) --- */}
        <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 h-full overflow-hidden flex-shrink-0 z-10 transition-all duration-300 ease-in-out`}>
          
          {/* Collapse Toggle */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} p-3 border-b border-gray-100`}>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                title={isSidebarCollapsed ? "Déployer le menu" : "Réduire le menu"}
              >
                  {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
             <div className="space-y-4">
                 {Object.entries(groupedNavItems).map(([category, items]) => (
                    <div key={category}>
                        {!isSidebarCollapsed ? (
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1 mt-2 first:mt-0 fade-in">{category}</h3>
                        ) : (
                            <div className="h-px bg-slate-100 my-3 mx-2"></div>
                        )}
                        
                        <div className="space-y-0.5">
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    title={isSidebarCollapsed ? item.label : ''}
                                    className={`
                                        w-full flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group
                                        ${isSidebarCollapsed ? 'justify-center px-0' : 'px-3'}
                                        ${activeTab === item.id 
                                            ? 'bg-brand-50 text-brand-700 shadow-sm' 
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                    `}
                                >
                                    <item.icon size={20} className={`transition-colors shrink-0 ${activeTab === item.id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    
                                    {!isSidebarCollapsed && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                    
                                    {activeTab === item.id && (
                                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-600 rounded-r-full ${isSidebarCollapsed ? 'h-4' : ''}`}></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                 ))}
             </div>
          </div>
          
          {/* Sidebar Footer - Removed System Status & Admin Button */}
          <div className={`p-3 border-t border-gray-100 bg-slate-50/50 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
              <div className={`bg-white rounded-lg border border-gray-100 shadow-sm flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'p-2.5 gap-3'}`}>
                  <div className="relative shrink-0">
                      <img src={userProfile.avatarUrl} className="w-8 h-8 rounded-full border border-gray-200" />
                  </div>
                  {!isSidebarCollapsed && (
                      <div className="overflow-hidden">
                          <div className="text-[10px] font-bold text-slate-800 truncate">{userProfile.name}</div>
                          <div className="text-[9px] text-slate-500 truncate">{userProfile.title}</div>
                      </div>
                  )}
              </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto relative w-full bg-[#f0f2f5] scroll-smooth pb-32 md:pb-0">
          <div className="max-w-[1600px] mx-auto h-full">
             {children}
          </div>
        </main>

        {/* --- MOBILE SMART DOCK (COMPACT & EXPANDABLE) --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Expanded Menu Drawer */}
            <div 
                className={`bg-white/95 backdrop-blur-xl border-t border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuExpanded ? 'h-auto max-h-[85vh] opacity-100 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]' : 'h-0 opacity-0'}`}
            >
                <div className="p-4 pb-24 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h2 className="text-base font-bold text-slate-800">Menu Principal</h2>
                        <button onClick={() => setIsMobileMenuExpanded(false)} className="p-1.5 bg-slate-100 rounded-full text-slate-500">
                            <ChevronDown size={18} />
                        </button>
                    </div>
                    
                    <div className="space-y-4 overflow-y-auto flex-1">
                        {Object.entries(groupedNavItems).map(([category, items]) => (
                            <div key={category}>
                                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{category}</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => { onTabChange(item.id); setIsMobileMenuExpanded(false); }}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95
                                                ${activeTab === item.id ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === item.id ? 'bg-brand-200 text-brand-700' : 'bg-slate-100'}`}>
                                                <item.icon size={18} />
                                            </div>
                                            <span className="text-[9px] font-bold text-center leading-tight line-clamp-1 w-full">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 shrink-0 space-y-2">
                        <button onClick={() => {onTabChange('settings'); setIsMobileMenuExpanded(false);}} className="w-full py-2 bg-slate-100 rounded-lg text-slate-600 font-bold text-xs flex items-center justify-center gap-2">
                            Paramètres
                        </button>
                        {onLogout && (
                            <button onClick={onLogout} className="w-full py-2 border border-red-200 text-red-600 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                                Déconnexion
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Dock Bar */}
            <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-[#f0f2f5] via-[#f0f2f5] to-transparent">
                <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2.5rem] p-2 flex items-center justify-between relative px-6 h-20">
                    {/* Home */}
                    <button 
                        onClick={() => {onTabChange('home'); setIsMobileMenuExpanded(false);}} 
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${activeTab === 'home' ? 'text-brand-600' : 'text-slate-400'}`}
                    >
                        <HomeIcon size={24} className={activeTab === 'home' ? 'fill-current' : ''} />
                    </button>

                    {/* Chat */}
                    <button 
                        onClick={() => {onTabChange('chat'); setIsMobileMenuExpanded(false);}} 
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${activeTab === 'chat' ? 'text-brand-600' : 'text-slate-400'}`}
                    >
                        <MessageSquare size={24} className={activeTab === 'chat' ? 'fill-current' : ''} />
                    </button>

                    {/* OS Button (Center) */}
                    <button 
                        onClick={() => setIsDialloOSOpen(true)}
                        className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-600 to-purple-600 rounded-full shadow-lg shadow-brand-500/40 text-white transform -translate-y-8 hover:scale-110 transition-transform border-4 border-[#f0f2f5] z-20"
                    >
                        <Sparkles size={28} className="animate-pulse" />
                    </button>

                    {/* Wallet */}
                    <button 
                        onClick={() => {onTabChange('wallet'); setIsMobileMenuExpanded(false);}} 
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${activeTab === 'wallet' ? 'text-brand-600' : 'text-slate-400'}`}
                    >
                        <Wallet size={24} className={activeTab === 'wallet' ? 'fill-current' : ''} />
                    </button>

                    {/* Menu Toggle */}
                    <button 
                        onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)} 
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${isMobileMenuExpanded ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                    >
                        {isMobileMenuExpanded ? <ChevronDown size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </div>
        
        {/* DIALLO OS OVERLAY */}
        <DialloOS 
            isOpen={isDialloOSOpen}
            onClose={() => setIsDialloOSOpen(false)}
            onNavigate={onTabChange}
            userProfile={userProfile}
        />

      </div>
    </div>
  );
};
