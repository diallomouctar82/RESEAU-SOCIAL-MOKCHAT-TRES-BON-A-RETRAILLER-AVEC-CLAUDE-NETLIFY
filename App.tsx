
import React, { useState, useEffect } from 'react';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';
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
import { AGENTS } from './constants';
import { Agent, LiveStream, UserRole } from './types';

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

  // VÉRIFICATION DE SESSION
  useEffect(() => {
      const storedUser = localStorage.getItem('lmav_session_v2');
      if (storedUser) {
          try {
              const parsedUser = JSON.parse(storedUser);
              // Vérifie si le token (simulé) est toujours valide
              if (parsedUser && parsedUser.email) {
                  updateUserProfile(parsedUser);
                  setIsAuthenticated(true);
                  addNotification("Retour", `Bon retour parmi nous, ${parsedUser.name.split(' ')[0]}.`, "info");
              }
          } catch (e) {
              console.error("Session corrompue", e);
              localStorage.removeItem('lmav_session_v2');
          }
      }
      setIsAuthChecking(false);
  }, []);

  // ACTIONS
  const handleLogin = (email: string) => {
      // DÉTERMINATION DU RÔLE
      // Admin Principal : visionsmart224@gmail.com
      const isAdmin = email.trim().toLowerCase() === 'visionsmart224@gmail.com';
      const role: UserRole = isAdmin ? 'admin' : 'user';
      
      const userName = isAdmin ? 'Administrateur Principal' : email.split('@')[0];
      const countryCode = 'FR'; // Par défaut, ou déduit de l'IP dans un vrai backend

      const newProfileData = {
          id: `usr-${Date.now()}`,
          email: email,
          role: role,
          name: userName,
          citizenshipId: `LMAV-2025-${Math.floor(Math.random()*9000)+1000}-${countryCode}`,
          // Pour l'admin, on peut donner des stats boostées
          level: isAdmin ? 99 : 1,
          xp: isAdmin ? 999999 : 0,
          credits: isAdmin ? 1000000 : 150
      };
      
      // Mise à jour du state global
      updateUserProfile(newProfileData);
      
      // Persistance locale (Session permanente tant que pas de logout)
      localStorage.setItem('lmav_session_v2', JSON.stringify({
          ...userProfile, 
          ...newProfileData
      }));

      setIsAuthenticated(true);
      
      if (isAdmin) {
          addNotification("Mode Administrateur", "Bienvenue, Superviseur. Console système active.", "warning");
          setActiveTab('home'); // Redirect to Home (Dashboard handles Admin View)
      } else {
          addNotification("Connexion Réussie", `Bienvenue sur votre espace, ${userName}.`, "success");
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('lmav_session_v2');
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
      return <Auth onLogin={handleLogin} />;
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

      {activeTab === 'social' && <SocialFeed onOpenLive={handleOpenLive} />}

      {activeTab === 'world' && <WorldHub onNavigateToAgent={handleNavigateToAgent} />}

      {activeTab === 'wallet' && <Wallet userProfile={userProfile} />}

      {activeTab === 'career' && <CareerCenter userProfile={userProfile} onNavigateToInterview={() => setActiveTab('live')} />}
      
      {activeTab === 'health' && <HealthCenter userProfile={userProfile} />}

      {activeTab === 'housing' && <HousingCenter userProfile={userProfile} />}
      
      {activeTab === 'legal' && <LegalCenter userProfile={userProfile} />}

      {activeTab === 'settings' && <Settings />}

      {activeTab === 'languages' && <LanguageCenter userProfile={userProfile} />}

      {activeTab === 'admin-procedures' && <LegalCenter userProfile={userProfile} />}

      {activeTab === 'council' && <CouncilRoom onClose={() => setActiveTab('home')} />}

      {activeTab === 'chat' && (
        <div className="flex flex-col h-full md:flex-row">
           <div className="hidden lg:block w-80 border-r border-gray-200 bg-white overflow-y-auto">
             <div className="p-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                <h3 className="font-bold text-gray-700 px-2">Équipe d'Experts</h3>
             </div>
             <div className="p-2 space-y-2">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                        setSelectedAgent(agent);
                        setInitialChatMessage(undefined);
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors
                      ${selectedAgent.id === agent.id ? 'bg-brand-50 border border-brand-100' : 'hover:bg-gray-50 border border-transparent'}
                    `}
                  >
                    <img src={agent.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.title}</div>
                    </div>
                  </button>
                ))}
             </div>
           </div>

           <div className="lg:hidden p-4 bg-white border-b flex items-center justify-between cursor-pointer" onClick={() => window.scrollTo(0,0)}>
             <div className="flex items-center gap-3">
               <img src={selectedAgent.avatarUrl} className="w-10 h-10 rounded-full" />
               <div>
                 <div className="font-bold text-gray-900">{selectedAgent.name}</div>
                 <div className="text-xs text-gray-500">{selectedAgent.title}</div>
               </div>
             </div>
             <div className="text-xs text-brand-600 font-medium">Changer</div>
           </div>

           <div className="flex-1 flex flex-col h-full overflow-hidden relative">
             <ChatInterface 
                key={selectedAgent.id + (initialChatMessage || '')} 
                agent={selectedAgent} 
                initialMessage={initialChatMessage}
                onStartCall={() => setActiveTab('live')}
             />
           </div>
        </div>
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
          />
      )}
      
    </Layout>
  );
};

export default function App() {
    return (
        <GlobalProvider>
            <AppContent />
        </GlobalProvider>
    );
}
