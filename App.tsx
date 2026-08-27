
import React, { useState, useEffect } from 'react';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import { Settings } from './components/Settings';
import { LanguageCenter } from './components/LanguageCenter';
import { CouncilRoom } from './components/CouncilRoom';
import { ExpertsHub } from './components/ExpertsHub';
import { GoogleDriveCenter } from './components/GoogleDriveCenter';
import { GoogleMapsExplorer } from './components/GoogleMapsExplorer';
import { GoogleChatCenter } from './components/GoogleChatCenter';
import { GoogleMeetCenter } from './components/GoogleMeetCenter';
import { AGENTS } from './constants';
import { Agent, LiveStream } from './types';
import { getSession, onAuthStateChange, signOut } from './services/auth';
import { fetchUserProfile } from './services/profile';

// Composant interne qui consomme le contexte
const AppContent = () => {
  const { userProfile, notifications, updateUserProfile, addNotification, markNotificationRead, updateUserShop, updateUserCredits, updateUserXp, logout } = useGlobal();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  
  // LIVE STATE
  const [activeLiveId, setActiveLiveId] = useState<string | null>(null);
  const [customLiveStream, setCustomLiveStream] = useState<LiveStream | undefined>(undefined);

  // SESSION SUPABASE : au montage, puis à chaque changement (connexion,
  // déconnexion, retour de redirection OAuth Google), charge le profil
  // applicatif correspondant depuis la table `profiles`. Le rôle
  // (admin/user) n'est plus jamais déterminé côté client : il vient
  // de la base, fixé serveur par le trigger handle_new_user.
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
          const profile = await fetchUserProfile(userId);
          if (!isMounted) return;
          if (profile) {
              updateUserProfile(profile);
              setIsAuthenticated(true);
              if (!isInitial) {
                  addNotification("Connexion Réussie", `Bienvenue sur votre espace, ${profile.name.split(' ')[0]}.`, "success");
              } else {
                  addNotification("Retour", `Bon retour parmi nous, ${profile.name.split(' ')[0]}.`, "info");
              }
          } else {
              console.error('Session Supabase active mais profil applicatif introuvable.');
          }
          if (isInitial) setIsAuthChecking(false);
      };

      getSession().then((session) => applySession(session?.user.id, true));

      const unsubscribe = onAuthStateChange((session) => {
          applySession(session?.user.id, false);
      });

      return () => {
          isMounted = false;
          unsubscribe();
      };
  }, []);

  // ACTIONS
  const handleLogout = async () => {
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

  // Écran de chargement discret pendant la vérification de session
  if (isAuthChecking) {
      return <div className="h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
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
    >
      
      {activeTab === 'home' && <Dashboard userProfile={userProfile} onNavigate={setActiveTab} />}

      {activeTab === 'google-maps' && <GoogleMapsExplorer />}

      {activeTab === 'google-drive' && <GoogleDriveCenter />}

      {activeTab === 'google-chat' && <GoogleChatCenter />}

      {activeTab === 'google-meet' && <GoogleMeetCenter />}

      {activeTab === 'social' && <SocialFeed onOpenLive={handleOpenLive} />}

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

      {activeTab === 'settings' && <Settings />}

      {activeTab === 'languages' && <LanguageCenter userProfile={userProfile} />}

      {(activeTab === 'admin-procedures' || activeTab === 'demarches') && <LegalCenter userProfile={userProfile} />}

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
                <AppContent />
            </ThemeProvider>
        </GlobalProvider>
    );
}
