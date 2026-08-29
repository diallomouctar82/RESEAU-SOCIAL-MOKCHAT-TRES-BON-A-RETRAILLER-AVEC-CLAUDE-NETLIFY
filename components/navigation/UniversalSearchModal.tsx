import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  FolderKanban, 
  HeartPulse, 
  Home as HomeIcon, 
  Wallet, 
  FileText, 
  Scale, 
  Palette, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  MapPin, 
  HardDrive, 
  Video, 
  ChevronRight,
  Zap,
  CornerDownLeft,
  Volume2
} from 'lucide-react';
import { MAIN_NAV_ITEMS, TRANSVERSAL_SERVICES, NavItemDef } from './NavigationItems';
import { LEGAL_PROCEDURES } from '../../constants';
import { supabaseService } from '../../services/supabaseClient';
import { SearchResult } from '../../types';
import { interpretSearchVoiceCommand } from '../../services/search/searchVoiceCommands';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, context?: any) => void;
  onOpenDialloOS: (initialPrompt?: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenDialloOS
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // LOOP 10/17 (recherche universelle, fondation) : résultats réels
  // (Supabase, RLS appliquée) — distincts des sections ci-dessous qui
  // restent à raison purement locales (MAIN_NAV_ITEMS/TRANSVERSAL_SERVICES/
  // LEGAL_PROCEDURES sont la structure de navigation de l'app elle-même,
  // jamais des données en base). Débounce 300ms pour éviter une requête à
  // chaque frappe.
  const [realResults, setRealResults] = useState<SearchResult[]>([]);
  const [isSearchingReal, setIsSearchingReal] = useState(false);
  // LOOP 11/17 : distingue explicitement « la recherche a échoué » de
  // « aucun résultat » — l'un ne doit jamais être présenté comme l'autre.
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setVoiceFeedback(null);
      setSelectedIndex(0);
      setRealResults([]);
      setSearchFailed(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setRealResults([]);
      setIsSearchingReal(false);
      setSearchFailed(false);
      return;
    }
    setIsSearchingReal(true);
    const handle = setTimeout(() => {
      supabaseService.universalSearch(term)
        .then(({ results, degraded }) => {
          setRealResults(results);
          setSearchFailed(degraded);
        })
        .catch(() => {
          setRealResults([]);
          setSearchFailed(true);
        })
        .finally(() => setIsSearchingReal(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  // Voice command detection
  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceFeedback("Reconnaissance vocale non supportée par ce navigateur.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback("À l'écoute... Dites par exemple 'Ouvre Carrière' ou 'Mes démarches'");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setVoiceFeedback(`Compris : "${transcript}"`);
        setIsListening(false);
        const matchedNavigation = processVoiceCommand(transcript);
        // LOOP 11/17 (Architecte — navigateur de recherche) : repli
        // uniquement quand aucun raccourci de navigation par mot-clé n'a
        // été reconnu — le chemin rapide/déterministe ci-dessus reste
        // inchangé et prioritaire, jamais remplacé par un appel IA.
        if (!matchedNavigation) {
          interpretSearchVoiceCommand(transcript).then((action) => {
            if (action.type === 'SEARCH' && action.payload?.query) {
              setQuery(action.payload.query);
            }
            setVoiceFeedback(action.spokenConfirmation);
          });
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedback("Erreur lors de la capture audio.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setVoiceFeedback("Impossible d'activer le microphone.");
    }
  };

  /**
   * Retourne `true` si un raccourci de navigation par mot-clé a été
   * reconnu et exécuté (chemin rapide, déterministe, sans appel IA) —
   * `false` sinon, pour laisser `interpretSearchVoiceCommand` (LOOP 11/17)
   * prendre le relais côté recherche.
   */
  const processVoiceCommand = (text: string): boolean => {
    const clean = text.toLowerCase().trim();

    // Quick intent matching
    if (clean.includes('carriere') || clean.includes('carrière') || clean.includes('emploi') || clean.includes('cv') || clean.includes('job')) {
      onNavigate('career');
      onClose();
      return true;
    }
    if (clean.includes('cours') || clean.includes('campus') || clean.includes('examen') || clean.includes('etude')) {
      onNavigate('campus');
      onClose();
      return true;
    }
    if (clean.includes('langue') || clean.includes('anglais') || clean.includes('espagnol')) {
      onNavigate('languages');
      onClose();
      return true;
    }
    if (clean.includes('demarche') || clean.includes('démarche') || clean.includes('titre de sejour') || clean.includes('admin')) {
      onNavigate('admin-procedures');
      onClose();
      return true;
    }
    if (clean.includes('logement') || clean.includes('habitat') || clean.includes('appartement')) {
      onNavigate('housing');
      onClose();
      return true;
    }
    if (clean.includes('sante') || clean.includes('santé') || clean.includes('medecin') || clean.includes('docteur')) {
      onNavigate('health');
      onClose();
      return true;
    }
    if (clean.includes('juridique') || clean.includes('droit') || clean.includes('avocat') || clean.includes('contrat')) {
      onNavigate('legal');
      onClose();
      return true;
    }
    if (clean.includes('marche') || clean.includes('marché') || clean.includes('boutique') || clean.includes('vendre') || clean.includes('fournisseur')) {
      onNavigate('shop');
      onClose();
      return true;
    }
    if (clean.includes('studio') || clean.includes('video') || clean.includes('creer')) {
      onNavigate('studio');
      onClose();
      return true;
    }
    if (clean.includes('reseau') || clean.includes('réseau') || clean.includes('moc') || clean.includes('social')) {
      onNavigate('social');
      onClose();
      return true;
    }
    if (clean.includes('expert') || clean.includes('conseil') || clean.includes('diallo')) {
      onNavigate('chat');
      onClose();
      return true;
    }
    if (clean.includes('parcours') || clean.includes('dossier') || clean.includes('cap')) {
      onNavigate('parcours');
      onClose();
      return true;
    }
    if (clean.includes('maps') || clean.includes('carte')) {
      onNavigate('google-maps');
      onClose();
      return true;
    }
    if (clean.includes('drive') || clean.includes('document')) {
      onNavigate('google-drive');
      onClose();
      return true;
    }

    return false;
  };

  // Filter modules
  const filteredModules = MAIN_NAV_ITEMS.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    );
  });

  // Filter transversal services
  const filteredServices = TRANSVERSAL_SERVICES.filter(srv => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return (
      srv.title.toLowerCase().includes(q) ||
      srv.description.toLowerCase().includes(q) ||
      srv.integratedIn.some(m => m.toLowerCase().includes(q))
    );
  });

  // Filter procedures & courses when query is specific
  const filteredProcedures = query.trim().length > 1
    ? LEGAL_PROCEDURES.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Résultats réels (LOOP 10/17) répartis par type — remplace l'ancien
  // filtre local sur un `COURSES` factice à un seul élément, jamais
  // connecté à la vraie table.
  const realProfiles = realResults.filter(r => r.type === 'profile');
  const realPosts = realResults.filter(r => r.type === 'post');
  const realCourses = realResults.filter(r => r.type === 'course');

  const handleSelectTab = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  const handleAskDialloOS = () => {
    onClose();
    onOpenDialloOS(query);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (filteredModules.length > 0) {
        handleSelectTab(filteredModules[0].id);
      } else if (query.trim()) {
        handleAskDialloOS();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Search size={22} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un espace, un besoin, un cours, un visa, un mot-clé..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium text-base md:text-lg"
          />

          {/* Voice Command Button */}
          <button
            onClick={handleToggleVoice}
            title={isListening ? "Arrêter l'écoute" : "Commande vocale"}
            className={`p-2.5 rounded-2xl flex items-center gap-1.5 transition ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            <span className="text-xs font-bold hidden sm:inline">{isListening ? 'Écoute...' : 'Vocal'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Voice Feedback Banner */}
        {voiceFeedback && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-800">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-indigo-600 animate-pulse" />
              <span>{voiceFeedback}</span>
            </div>
            <button 
              onClick={() => setVoiceFeedback(null)} 
              className="text-[10px] font-bold text-indigo-600 hover:underline"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Diallo OS Action Card if query exists */}
          {query.trim() && (
            <button
              onClick={handleAskDialloOS}
              className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white hover:shadow-lg transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Orchestrer avec Diallo OS</span>
                    <span className="text-[10px] bg-purple-500/40 px-2 py-0.5 rounded-full font-bold">Auto</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5 line-clamp-1">
                    « {query} »
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-200 font-bold group-hover:translate-x-1 transition">
                <span>Analyser</span>
                <ArrowRight size={16} />
              </div>
            </button>
          )}

          {/* Navigation Modules Section */}
          <div>
            <div className="flex justify-between items-center px-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {query ? 'Espaces & Modules correspondants' : 'Accès Rapides & Espaces Métiers'}
              </span>
              <span className="text-[10px] text-slate-400">{filteredModules.length} disponibles</span>
            </div>

            {filteredModules.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                Aucun espace ne correspond directement. Essayez de demander à Diallo OS ci-dessus.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className="p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition flex items-start gap-3 text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 flex items-center justify-center shrink-0 transition">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transversal Services if query matches */}
          {filteredServices.length > 0 && (
            <div>
              <div className="flex justify-between items-center px-2 mb-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Services Transversaux Google & Sécurité
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredServices.map((srv) => {
                  const SrvIcon = srv.icon;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => handleSelectTab(srv.tabTarget)}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition flex items-start gap-3 text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <SrvIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {srv.title}
                        </span>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {srv.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Procedure Matches */}
          {filteredProcedures.length > 0 && (
            <div>
              <div className="flex justify-between items-center px-2 mb-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Démarches Administratives Détectées
                </span>
              </div>
              <div className="space-y-1.5">
                {filteredProcedures.map((proc) => (
                  <button
                    key={proc.id}
                    onClick={() => handleSelectTab('admin-procedures')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-800">{proc.title}</span>
                        <span className="text-[10px] text-slate-500 ml-2">({proc.category})</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recherche réelle en cours (LOOP 10/17) */}
          {isSearchingReal && (
            <div className="px-2 text-[11px] text-slate-400 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              Recherche dans les profils, publications et formations...
            </div>
          )}

          {/* LOOP 11/17 : dégradation gracieuse honnête — un échec n'est
              jamais présenté comme un simple silence, un vrai zéro résultat
              n'est jamais présenté comme une panne. */}
          {!isSearchingReal && query.trim().length >= 2 && searchFailed && (
            <div className="px-2 text-[11px] text-amber-600">
              La recherche dans les profils/publications/formations a rencontré un problème — réessayez, ou demandez à Diallo OS ci-dessus.
            </div>
          )}
          {!isSearchingReal && !searchFailed && query.trim().length >= 2 && realResults.length === 0 && (
            <div className="px-2 text-[11px] text-slate-400">
              Aucun profil, publication ou formation ne correspond exactement — essayez de reformuler, ou demandez à Diallo OS ci-dessus.
            </div>
          )}

          {/* Profil Matches — réel, respecte profiles_select_visible (LOOP 10/17) */}
          {realProfiles.length > 0 && (
            <div>
              <div className="flex justify-between items-center px-2 mb-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Profils MOK
                </span>
              </div>
              <div className="space-y-1.5">
                {realProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectTab('social')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <Users size={16} className="text-indigo-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">{p.title}</span>
                        {p.subtitle && <span className="text-[10px] text-slate-500">{p.subtitle}</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Publication Matches — réel, respecte posts_select_visible (LOOP 10/17) */}
          {realPosts.length > 0 && (
            <div>
              <div className="flex justify-between items-center px-2 mb-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Publications MOK
                </span>
              </div>
              <div className="space-y-1.5">
                {realPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleSelectTab('social')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare size={16} className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">{post.title}</span>
                        {post.subtitle && <span className="text-[10px] text-slate-500">{post.subtitle}</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Course Matches — réel, respecte courses_select_published_or_admin (LOOP 10/17, remplace l'ancien filtre sur un COURSES factice à un seul élément) */}
          {realCourses.length > 0 && (
            <div>
              <div className="flex justify-between items-center px-2 mb-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Formations & Cours Campus
                </span>
              </div>
              <div className="space-y-1.5">
                {realCourses.map((crs) => (
                  <button
                    key={crs.id}
                    onClick={() => handleSelectTab('campus')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">{crs.title}</span>
                        {crs.subtitle && <span className="text-[10px] text-slate-500">{crs.subtitle}</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 text-[10px] font-mono shadow-xs">Entrée</kbd> Ouvrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 text-[10px] font-mono shadow-xs">Échap</kbd> Fermer
            </span>
          </div>
          <span className="font-semibold text-slate-600">Recherche Universelle Le Monde à Vous</span>
        </div>
      </div>
    </div>
  );
};
