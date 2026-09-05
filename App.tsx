
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';
import { forgetPushSubscription } from './services/push/pushService';
import { ThemeProvider } from './contexts/ThemeContext';
import { GoalProvider } from './contexts/GoalContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard'; 
import { ChatInterface } from './components/ChatInterface';
import { LiveSession } from './components/LiveSession';
import { SocialLive } from './components/SocialLive';
import { Studio } from './components/Studio';
import { SocialFeed } from './components/SocialFeed';
import { Campus } from './components/Campus';
import { Shop } from './components/Shop';
import { Profile } from './components/Profile';
import { MyShop } from './components/MyShop';
import { WorldHub } from './components/WorldHub';
import { CareerCenter } from './components/CareerCenter';
import { HealthCenter } from './components/HealthCenter';
import { HousingCenter } from './components/HousingCenter';
import { LegalCenter } from './components/LegalCenter';
import { Wallet } from './components/Wallet';
import { Auth } from './components/Auth';
import { ArchitecteDemoPage } from './components/architecte/ArchitecteDemoPage';
import { ResetPassword } from './components/ResetPassword';
import { LanguageCenter } from './components/LanguageCenter';
import { CouncilRoom } from './components/CouncilRoom';
import { ExpertsHub } from './components/ExpertsHub';
import { GoogleDriveCenter } from './components/GoogleDriveCenter';
import { GoogleMapsExplorer } from './components/GoogleMapsExplorer';
import { GoogleChatCenter } from './components/GoogleChatCenter';
import { GoogleMeetCenter } from './components/GoogleMeetCenter';
import { AdminDashboard } from './components/AdminDashboard';
import { AGENTS } from './constants';
import { Agent, LiveStream, MemberProfile } from './types';
import { getSession, onAuthStateChange, signOut } from './services/auth';
import { supabaseService } from './services/supabaseClient';
import { fetchUserProfile } from './services/profile';
import { detectStandaloneModule } from './services/modules/standaloneMode';

// Composant interne qui consomme le contexte
const AppContent = () => {
  const { userProfile, notifications, updateUserProfile, addNotification, markNotificationRead, updateUserShop, updateUserCredits, updateUserXp, logout } = useGlobal();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  
  // DS-M2 (menu « Miroir d'eau ») — le réseau social est l'écran d'accueil
  // par défaut, invariant fixé par la Direction. 'home' (Dashboard) reste
  // atteignable comme n'importe quel autre onglet, simplement plus par défaut.
  const [activeTab, setActiveTab] = useState('social');
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  // Recherche universelle : remontée ici (au lieu d'un état local à Layout)
  // pour que Dashboard puisse aussi l'ouvrir depuis sa zone d'actions
  // rapides — c'était l'absence de ce lien qui faisait naviguer vers un
  // onglet 'search' inexistant et vider tout l'écran.
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  // Idem pour la modale d'objectif ("Mon Cap") : remontée ici pour que
  // Dashboard puisse aussi l'ouvrir depuis le pill "Changer de cap" de
  // son EditorialHero, sans quoi ce clic n'avait aucun effet.
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  // LOOP 06/17 (messagerie, fondation) : même patron — remonté ici pour que
  // le bouton "Message"/"Mooc Chat" du fil social (SocialFeed.tsx) puisse
  // ouvrir une vraie conversation dans <MoocChatFloating>, montée à
  // l'intérieur de <Layout>. Sans ce pont, `onOpenDirectChat` n'avait aucun
  // appelant réel : ces boutons ne faisaient rien pour un vrai membre.
  const [pendingDirectChatMember, setPendingDirectChatMember] = useState<MemberProfile | undefined>(undefined);

  // Mode module autonome (architecture modulaire exportable) : `/messagerie`
  // (réécriture Netlify) ou `?module=messagerie` → Layout ne rend que le
  // module, plein écran, avec la même session et les mêmes données. Décidé
  // une fois au démarrage : l'URL d'un module installé ne change pas en cours
  // de route. L'authentification reste celle de l'application (écran de
  // connexion identique, puis retour sur le module).
  const standaloneModule = useMemo(
    () => detectStandaloneModule(window.location.pathname, window.location.search),
    []
  );

  /** Route publique de démonstration de l'avatar (`/architecte`). */
  const isArchitecteDemoRoute = useMemo(
    () => /^\/architecte\/?$/i.test(window.location.pathname),
    []
  );

  // LIVE STATE
  const [activeLiveId, setActiveLiveId] = useState<string | null>(null);
  const [customLiveStream, setCustomLiveStream] = useState<LiveStream | undefined>(undefined);

  // Équipe I / LOOP I4 — navigation avant/arrière RÉELLE : chaque changement
  // d'onglet principal devient une entrée d'historique (hash, donc aucune
  // dépendance à une réécriture serveur Netlify) ; le bouton retour du
  // navigateur/téléphone remonte le parcours au lieu de sortir de l'app.
  // Sans interférence avec les hash d'authentification Supabase
  // (#access_token…) : cet effet n'agit qu'une fois isAuthenticated=true,
  // donc après que supabase-js a déjà consommé et nettoyé ce hash.
  const popNavigationRef = useRef(false);
  useEffect(() => {
    // En mode module autonome il n'y a pas d'onglets : ne pas accrocher
    // `#home` à l'URL du module.
    if (!isAuthenticated || standaloneModule) return;
    const cameFromPop = popNavigationRef.current;
    popNavigationRef.current = false;
    const st = window.history.state as { mokTab?: string; mokIdx?: number } | null;
    if (cameFromPop || st?.mokTab === activeTab) return;
    if (st?.mokTab === undefined) {
      // Première entrée de la session : remplace (pas d'entrée parasite).
      window.history.replaceState({ mokTab: activeTab, mokIdx: 0 }, '', `#${activeTab}`);
    } else {
      window.history.pushState({ mokTab: activeTab, mokIdx: (st.mokIdx ?? 0) + 1 }, '', `#${activeTab}`);
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      // Seuls nos propres états (mokTab) sont rejoués — un hash étranger ou
      // absent retombe sur 'home', jamais sur un onglet inconnu (écran vide).
      const tab = e.state && typeof e.state.mokTab === 'string' ? e.state.mokTab : 'home';
      popNavigationRef.current = true;
      setActiveTab(tab);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // GESTION DE SESSION RÉSILIENTE (Supabase Cloud + Local-First Fallback)
  useEffect(() => {
      let isMounted = true;

      const applySession = async (userId: string | undefined, isInitial: boolean) => {
          if (!userId) {
              if (isMounted) {
                  setIsAuthenticated(false);
                  if (isInitial) setIsAuthChecking(false);
              }
              return;
          }

          try {
              const profile = await fetchUserProfile(userId);
              if (!isMounted) return;
              if (profile) {
                  updateUserProfile(profile);
                  setIsAuthenticated(true);
                  if (!isInitial) {
                      addNotification("Connexion Réussie", `Bienvenue sur votre espace, ${profile.name.split(' ')[0] || 'Citoyen'}.`, "success");
                  }
              } else {
                  setIsAuthenticated(true);
              }
          } catch (err) {
              console.warn('Erreur résolution profil session:', err);
              if (isMounted) setIsAuthenticated(true);
          } finally {
              if (isMounted && isInitial) {
                  setIsAuthChecking(false);
              }
          }
      };

      getSession().then((session) => applySession(session?.user?.id, true));

      // PASSWORD_RECOVERY (lien "mot de passe oublié" cliqué) doit afficher
      // l'écran "nouveau mot de passe", pas être traité comme une connexion
      // normale — sinon l'utilisateur se retrouverait dans l'app sans avoir
      // choisi de nouveau mot de passe.
      const unsubscribe = onAuthStateChange((session, event) => {
          if (event === 'PASSWORD_RECOVERY') {
              setIsPasswordRecovery(true);
              return;
          }
          setIsPasswordRecovery(false);
          applySession(session?.user?.id, false);
      });

      return () => {
          isMounted = false;
          unsubscribe();
      };
  }, []);

  // ACTIONS
  const handleLogout = async () => {
      // L'abonnement push de CET appareil est retiré AVANT la fin de session :
      // la suppression de la ligne push_subscriptions passe par la RLS, donc
      // exige encore le jeton de l'utilisateur. Après signOut(), l'appel
      // n'aurait effacé aucune ligne et le téléphone aurait continué à
      // recevoir les appels d'un compte déconnecté. Ne bloque jamais la
      // déconnexion (la fonction ne lève pas).
      await forgetPushSubscription();
      try {
          await signOut();
      } catch (e) {
          console.error('Erreur déconnexion Supabase:', e);
      }
      logout();
      setIsAuthenticated(false);
      setActiveTab('home');
  };

  const handleNavigateToAgent = (agentId: string, initialMessage?: string) => {
      const agent = AGENTS.find(a => a.id === agentId);
      if (agent) {
          setSelectedAgent(agent);
          setInitialChatMessage(initialMessage);
          setActiveTab('chat');
      }
  };

  const handleOpenLive = (liveId: string, customLive?: LiveStream) => {
      if (customLive) {
          setCustomLiveStream(customLive);
      } else {
          setCustomLiveStream(undefined);
      }
      setActiveLiveId(liveId);
  };

  // Lien direct vers un Live précis (?live=<id>, copié depuis le bouton
  // "Copier le lien" de SocialLive.tsx) — ouvre CE Live en rejouant
  // exactement le même chemin que la navigation interne (handleOpenLive,
  // sans initialData). Aucune vérification d'accès n'est contournée ni
  // ajoutée ici : SocialLive applique les mêmes contrôles (RLS Supabase
  // can_view_live_session()/is_live_host(), logique déjà en place) que pour
  // un Live ouvert depuis le fil social — y compris le refus d'accès à une
  // session privée. On attend que la session applicative soit confirmée
  // (isAuthenticated) avant de consommer le paramètre, pour ne pas tenter
  // d'ouvrir un Live avant que l'utilisateur ne soit connecté ; un lien
  // ouvert déconnecté atterrit normalement sur l'écran de connexion, puis
  // ce même effet se redéclenche une fois isAuthenticated passé à true.
  const hasConsumedLiveLinkRef = useRef(false);
  useEffect(() => {
      if (!isAuthenticated || hasConsumedLiveLinkRef.current) return;
      try {
          const params = new URLSearchParams(window.location.search);
          const liveIdFromUrl = params.get('live');
          if (liveIdFromUrl) {
              hasConsumedLiveLinkRef.current = true;
              handleOpenLive(liveIdFromUrl);
              // Nettoie l'URL une fois le lien consommé, pour ne pas rouvrir
              // ce Live à chaque rechargement après que l'utilisateur l'a quitté.
              const cleanUrl = window.location.pathname + window.location.hash;
              window.history.replaceState({}, '', cleanUrl);
          }
      } catch (err) {
          console.warn('Lecture du paramètre ?live= impossible', err);
      }
  }, [isAuthenticated]);

  // ÉQUIPE F6 — lien d'invitation (?invite=CODE, cf. components/ui/
  // InviteButton.tsx). Le code est mémorisé AVANT l'authentification (la
  // personne invitée arrive déconnectée, crée son compte, puis revient
  // authentifiée), et consommé UNE fois la session établie :
  // accept_invitation (SECURITY DEFINER) rattache réellement le compte au
  // parrain — refus serveur silencieux si auto-parrainage/déjà parrainé.
  const hasConsumedInviteRef = useRef(false);
  useEffect(() => {
      try {
          const params = new URLSearchParams(window.location.search);
          const inviteCode = params.get('invite');
          if (inviteCode && /^[A-Za-z0-9]{4,16}$/.test(inviteCode)) {
              localStorage.setItem('lmav_pending_invite', inviteCode.toUpperCase());
              const cleanUrl = window.location.pathname + window.location.hash;
              window.history.replaceState({}, '', cleanUrl);
          }
      } catch { /* paramètre illisible — on n'insiste pas */ }
  }, []);
  useEffect(() => {
      if (!isAuthenticated || hasConsumedInviteRef.current) return;
      const pending = (() => { try { return localStorage.getItem('lmav_pending_invite'); } catch { return null; } })();
      if (!pending) return;
      hasConsumedInviteRef.current = true;
      void supabaseService.acceptInvitation(pending).then((res) => {
          try { localStorage.removeItem('lmav_pending_invite'); } catch {}
          if (res.accepted) {
              console.info('Invitation rattachée au parrain.');
          }
      });
  }, [isAuthenticated]);

  // Prioritaire sur tout le reste : un lien "mot de passe oublié" cliqué
  // établit une vraie session Supabase, mais l'utilisateur doit choisir un
  // nouveau mot de passe avant d'entrer dans l'app, même si isAuthenticated
  // est déjà vrai à ce stade.
  if (isPasswordRecovery) {
      return <ResetPassword onDone={() => setIsPasswordRecovery(false)} />;
  }

  // Écran de chargement discret pendant la vérification de session
  if (isAuthChecking) {
      // DS-M2c : même fond que les écrans qui suivent — sans quoi l'ouverture
      // de l'application commence par un aplat gris étranger à l'habillage.
      return <div data-miroir className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // DÉMONSTRATION PUBLIQUE DE L'AVATAR — avant le verrou d'authentification.
  //
  // Sans cette route, la Direction ne pouvait pas constater l'avatar par
  // elle-même : toute prévisualisation s'ouvrait sur « Se connecter ». La page
  // ne lit aucune donnée de compte, n'écrit rien, et n'ouvre aucune fonction
  // de l'application — elle ne fait que rendre le composant réel.
  if (isArchitecteDemoRoute) {
      return <ArchitecteDemoPage />;
  }

  if (!isAuthenticated) {
      return <Auth />;
  }

  return (
    <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notifications={notifications}
        onMarkRead={markNotificationRead}
        userProfile={userProfile}
        onLogout={handleLogout}
        isSearchModalOpen={isSearchModalOpen}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onCloseSearch={() => setIsSearchModalOpen(false)}
        isGoalModalOpen={isGoalModalOpen}
        onOpenGoalModal={() => setIsGoalModalOpen(true)}
        onCloseGoalModal={() => setIsGoalModalOpen(false)}
        pendingDirectChatMember={pendingDirectChatMember}
        onConsumePendingDirectChatMember={() => setPendingDirectChatMember(undefined)}
        onUpdateProfile={updateUserProfile}
        standaloneModule={standaloneModule}
    >

      {activeTab === 'home' && <Dashboard userProfile={userProfile} onNavigate={setActiveTab} onOpenSearch={() => setIsSearchModalOpen(true)} onOpenCapModal={() => setIsGoalModalOpen(true)} />}

      {activeTab === 'google-maps' && <GoogleMapsExplorer />}

      {activeTab === 'google-drive' && <GoogleDriveCenter />}

      {activeTab === 'google-chat' && <GoogleChatCenter />}

      {activeTab === 'google-meet' && <GoogleMeetCenter />}

      {activeTab === 'social' && <SocialFeed onOpenLive={handleOpenLive} onOpenDirectChat={(_, member) => member && setPendingDirectChatMember(member)} onNavigate={setActiveTab} />}

      {activeTab === 'world' && <WorldHub onNavigateToAgent={handleNavigateToAgent} onNavigate={setActiveTab} />}

      {activeTab === 'wallet' && <Wallet userProfile={userProfile} />}

      {activeTab === 'career' && (
        <CareerCenter 
          userProfile={userProfile} 
          onNavigateToInterview={() => setActiveTab('live')} 
          onNavigate={setActiveTab}
          onOpenExpertChat={(agentId, prompt) => {
            const targetAgent = AGENTS.find(a => a.id === agentId) || AGENTS[0];
            setSelectedAgent(targetAgent);
            setInitialChatMessage(prompt || '');
            setActiveTab('chat');
          }}
        />
      )}
      
      {activeTab === 'health' && <HealthCenter userProfile={userProfile} />}

      {activeTab === 'housing' && <HousingCenter userProfile={userProfile} />}
      
      {activeTab === 'legal' && <LegalCenter userProfile={userProfile} />}

      {(activeTab === 'admin' || activeTab === 'super-admin' || activeTab === 'admin-dashboard') &&
          (userProfile.role === 'admin' || (userProfile.role as string) === 'super_admin') && (
              <AdminDashboard />
      )}

      {activeTab === 'languages' && <LanguageCenter userProfile={userProfile} />}

      {activeTab === 'admin-procedures' && <LegalCenter userProfile={userProfile} />}

      {activeTab === 'council' && <CouncilRoom onClose={() => setActiveTab('home')} />}

      {(activeTab === 'parcours' || activeTab === 'dossiers') && (
        <ExpertsHub 
          userProfile={userProfile} 
          initialTab="dossiers"
          onNavigate={setActiveTab}
        />
      )}

      {(activeTab === 'chat' || activeTab === 'experts') && (
        <ExpertsHub 
          userProfile={userProfile} 
          initialTab="catalogue"
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'campus' && (
          <Campus 
            onExamPass={(courseTitle, grade) => {
                const xpGain = grade * 20;
                const creditGain = 50;
                updateUserXp(xpGain);
                updateUserCredits(creditGain);
                addNotification(
                    "Examen Réussi 🎓", 
                    `Vous avez validé "${courseTitle}" avec ${grade}/20. +${xpGain} XP et +${creditGain} Crédits !`, 
                    "success"
                );
            }} 
          />
      )}

      {activeTab === 'live' && (
          <LiveSession 
            agent={selectedAgent} 
            onClose={() => setActiveTab('chat')} 
          />
      )}
      
      {activeTab === 'studio' && <Studio />}
      
      {activeTab === 'shop' && (
        <Shop 
            userCredits={userProfile.credits} 
            userShop={userProfile.shop}
            onPurchase={(amount, item) => {
                updateUserCredits(-amount);
                addNotification("Achat Confirmé 🛍️", `Vous avez acheté "${item}". Votre solde est maintenant de ${(userProfile.credits - amount).toFixed(2)} Crédits.`, "info");
            }}
            onOpenMyShop={() => setActiveTab('my-shop')}
            onOpenExpertChat={(agentId, initialPrompt) => {
              const targetAgent = AGENTS.find(a => a.id === agentId) || AGENTS[0];
              setSelectedAgent(targetAgent);
              setInitialChatMessage(initialPrompt);
              setActiveTab('chat');
            }}
            onWatchReel={(reelId) => {
              setActiveTab('social');
            }}
            onOpenMokChatUser={(userId, userName) => {
              addNotification("Mok Chat", `Conversation directe ouverte avec ${userName}`, "info");
              setActiveTab('google-chat');
            }}
            onOpenLiveRoom={(sessionTitle, participantName) => {
              addNotification("Salon Mondial Live B2B", `Session en direct "${sessionTitle}" connectée avec ${participantName}`, "info");
              setActiveTab('google-meet');
            }}
        />
      )}

      {activeTab === 'my-shop' && (
          <MyShop userProfile={userProfile} onUpdateShop={updateUserShop} />
      )}

      {activeTab === 'profile' && <Profile userProfile={userProfile} />}

      {activeLiveId && (
          <SocialLive 
            liveId={activeLiveId} 
            initialData={customLiveStream}
            onClose={() => { setActiveLiveId(null); setCustomLiveStream(undefined); }} 
            onNavigateToTab={(tab) => {
              setActiveLiveId(null);
              setCustomLiveStream(undefined);
              setActiveTab(tab);
            }}
          />
      )}
      
    </Layout>
  );
};

export default function App() {
    return (
        <GlobalProvider>
            <ThemeProvider>
                <GoalProvider>
                    <AppContent />
                </GoalProvider>
            </ThemeProvider>
        </GlobalProvider>
    );
}
