
import React, { useState } from 'react';
import { User, Shield, Lock, Eye, Download, LogOut, Smartphone, Globe, Activity, CheckCircle, Bell, CreditCard, Moon, ChevronRight, Mail, Key, Fingerprint, RefreshCw } from 'lucide-react';
import { USER_PROFILE, SECURITY_LOGS, ACTIVE_SESSIONS, SUPPORTED_LANGUAGES } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';
import { signOut } from '../services/auth';

type SettingsTab = 'profile' | 'security' | 'preferences' | 'billing';

export const Settings: React.FC = () => {
  const { userProfile, updateUserProfile, logout } = useGlobal();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
      setIsLoggingOut(true);
      try {
          await signOut();
      } catch (e) {
          console.error('Erreur déconnexion Supabase:', e);
      }
      logout();
  };

  // Local state for form handling
  const [formData, setFormData] = useState({
      name: userProfile.name,
      title: userProfile.title,
      email: userProfile.email,
      bio: "Citoyen du monde, passionné par la technologie et l'innovation." // Mock data if not in type
  });

  const handleRevokeSession = (id: string) => {
      setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveProfile = () => {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
          updateUserProfile({ name: formData.name, title: formData.title });
          setIsSaving(false);
      }, 1000);
  };

  const renderSidebarItem = (id: SettingsTab, label: string, icon: React.ElementType, desc: string) => (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex items-center justify-between group ${activeTab === id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:shadow-md'}`}
      >
          <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                  {React.createElement(icon, { size: 20 })}
              </div>
              <div>
                  <div className="font-bold text-sm">{label}</div>
                  <div className={`text-xs ${activeTab === id ? 'text-slate-300' : 'text-slate-400'}`}>{desc}</div>
              </div>
          </div>
          <ChevronRight size={16} className={`transition-transform ${activeTab === id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
      </button>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-up pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-1 bg-brand-600 rounded-full"></div>
          <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres Globaux</h1>
              <p className="text-slate-500 font-medium">Gérez votre identité numérique et vos préférences système.</p>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-80 space-y-3 shrink-0">
              {renderSidebarItem('profile', 'Profil & Identité', User, 'Infos personnelles, KYC')}
              {renderSidebarItem('security', 'Sécurité & Données', Shield, 'Mots de passe, 2FA, Logs')}
              {renderSidebarItem('preferences', 'Préférences', Globe, 'Langue, Notifications')}
              {renderSidebarItem('billing', 'Abonnement', CreditCard, 'Crédits, Factures')}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] relative">
              
              {/* TAB: PROFILE */}
              {activeTab === 'profile' && (
                  <div className="p-8 space-y-8 animate-fade-up">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                          <div>
                              <h2 className="text-xl font-bold text-slate-800">Profil Public</h2>
                              <p className="text-sm text-slate-500">Ces informations sont visibles sur votre passeport numérique.</p>
                          </div>
                          <div className="relative group cursor-pointer">
                              <img src={userProfile.avatarUrl} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-md group-hover:opacity-80 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black/50 p-1 rounded-full text-white"><RefreshCw size={16} /></div>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nom Complet</label>
                              <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Titre / Poste</label>
                              <div className="relative">
                                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                  />
                              </div>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Biographie</label>
                              <textarea 
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium text-sm h-24 resize-none"
                              />
                          </div>
                      </div>

                      <div className="bg-green-50 rounded-xl p-6 border border-green-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                  <CheckCircle size={24} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-green-900">Identité Vérifiée (KYC Niveau 2)</h3>
                                  <p className="text-xs text-green-700">ID Citoyen: <span className="font-mono">{userProfile.citizenshipId}</span></p>
                              </div>
                          </div>
                          <button className="text-xs font-bold text-green-700 bg-white px-3 py-2 rounded-lg shadow-sm hover:bg-green-50">Voir Certificat</button>
                      </div>

                      <div className="flex justify-end pt-4">
                          <button 
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                              Enregistrer les modifications
                          </button>
                      </div>
                  </div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                  <div className="p-8 space-y-8 animate-fade-up">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 mb-2">Centre de Sécurité</h2>
                          <p className="text-sm text-slate-500">Protégez l'accès à votre compte et vos données personnelles.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-6 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all cursor-pointer group">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><Key size={24} /></div>
                                  <span className="text-xs font-bold text-slate-400">Recommandé</span>
                              </div>
                              <h3 className="font-bold text-slate-900">Changer de mot de passe</h3>
                              <p className="text-xs text-slate-500 mt-1">Dernière modification il y a 3 mois</p>
                          </div>
                          <div className="p-6 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all cursor-pointer group">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Fingerprint size={24} /></div>
                                  <div className={`w-10 h-5 rounded-full relative transition-colors ${userProfile.twoFactorEnabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${userProfile.twoFactorEnabled ? 'left-6' : 'left-1'}`}></div>
                                  </div>
                              </div>
                              <h3 className="font-bold text-slate-900">Double Authentification</h3>
                              <p className="text-xs text-slate-500 mt-1">Via Application Authenticator</p>
                          </div>
                      </div>

                      <div>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Smartphone size={16} /> Sessions Actives</h3>
                          <div className="space-y-3">
                              {sessions.map(session => (
                                  <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.isCurrent ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                              {session.deviceName.includes('iPhone') ? <Smartphone size={20} /> : <Globe size={20} />}
                                          </div>
                                          <div>
                                              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">{session.deviceName} {session.isCurrent && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">Actuel</span>}</div>
                                              <div className="text-xs text-slate-500">{session.location} • {session.lastActive}</div>
                                          </div>
                                      </div>
                                      {!session.isCurrent && <button onClick={() => handleRevokeSession(session.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Déconnecter"><LogOut size={18} /></button>}
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                          <button
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
                          >
                              <LogOut size={18} />
                              {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
                          </button>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Eye size={16} /> Confidentialité</h3>
                          <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between">
                              <div>
                                  <div className="font-bold text-slate-900">Exporter mes données (RGPD)</div>
                                  <div className="text-xs text-slate-500">Télécharger une copie de toutes vos interactions.</div>
                              </div>
                              <button className="flex items-center gap-2 text-brand-600 font-bold border border-brand-200 px-4 py-2 rounded-xl hover:bg-white transition-colors">
                                  <Download size={16} /> Télécharger
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* TAB: PREFERENCES */}
              {activeTab === 'preferences' && (
                  <div className="p-8 space-y-8 animate-fade-up">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 mb-2">Préférences Système</h2>
                          <p className="text-sm text-slate-500">Personnalisez votre expérience Le Monde à Vous.</p>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-3">Langue de l'interface</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {SUPPORTED_LANGUAGES.map(lang => (
                                      <button 
                                        key={lang.code}
                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${userProfile.preferredLanguage === lang.code ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'}`}
                                        onClick={() => updateUserProfile({ preferredLanguage: lang.code })}
                                      >
                                          <span className="text-2xl">{lang.flag}</span>
                                          <span className={`text-sm font-medium ${userProfile.preferredLanguage === lang.code ? 'text-brand-700' : 'text-slate-600'}`}>{lang.name}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Bell size={16} /> Notifications</h3>
                              <div className="space-y-3">
                                  {['Annonces importantes', 'Nouveaux messages', 'Alertes de sécurité', 'Mises à jour des cours'].map((notif, i) => (
                                      <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                          <span className="text-sm font-medium text-slate-700">{notif}</span>
                                          <label className="relative inline-flex items-center cursor-pointer">
                                              <input type="checkbox" className="sr-only peer" defaultChecked />
                                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                                          </label>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Moon size={16} /> Apparence</h3>
                              <div className="flex gap-4">
                                  <button className="flex-1 p-4 rounded-xl border-2 border-brand-500 bg-brand-50 text-center">
                                      <div className="w-full h-12 bg-white rounded-lg mb-2 shadow-sm border border-slate-100 mx-auto"></div>
                                      <span className="text-xs font-bold text-brand-700">Clair</span>
                                  </button>
                                  <button className="flex-1 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-center opacity-50 cursor-not-allowed" title="Bientôt disponible">
                                      <div className="w-full h-12 bg-slate-800 rounded-lg mb-2 shadow-sm mx-auto"></div>
                                      <span className="text-xs font-bold text-slate-500">Sombre (Bientôt)</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* TAB: BILLING */}
              {activeTab === 'billing' && (
                  <div className="p-8 space-y-8 animate-fade-up">
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[80px] opacity-20"></div>
                          <div className="relative z-10">
                              <h2 className="text-sm font-bold text-brand-300 uppercase tracking-widest mb-1">Plan Actuel</h2>
                              <div className="flex justify-between items-end">
                                  <div>
                                      <h1 className="text-4xl font-black">Citoyen <span className="text-brand-400">Premium</span></h1>
                                      <p className="text-slate-400 mt-2 text-sm">Renouvellement le 12 Octobre 2025</p>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-3xl font-mono font-bold text-yellow-400">{userProfile.credits} Ⓒ</div>
                                      <div className="text-xs text-slate-400 uppercase font-bold">Solde Crédits</div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 border border-slate-200 rounded-2xl">
                              <h3 className="font-bold text-slate-900 mb-4">Moyen de Paiement</h3>
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-[8px] font-bold tracking-widest">VISA</div>
                                  <div className="flex-1">
                                      <div className="text-sm font-bold text-slate-800">•••• •••• •••• 4242</div>
                                      <div className="text-xs text-slate-500">Expire 12/28</div>
                                  </div>
                                  <button className="text-brand-600 text-xs font-bold hover:underline">Modifier</button>
                              </div>
                              <button className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                  Voir l'historique de facturation
                              </button>
                          </div>

                          <div className="p-6 border border-slate-200 rounded-2xl bg-brand-50/50">
                              <h3 className="font-bold text-slate-900 mb-2">Recharger des Crédits</h3>
                              <p className="text-xs text-slate-500 mb-4">Utilisez vos crédits pour les cours, les certifications et les services premium.</p>
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                  <button className="py-2 bg-white border border-brand-200 rounded-lg text-sm font-bold text-brand-700 hover:shadow-md transition-all">100 Ⓒ</button>
                                  <button className="py-2 bg-white border border-brand-200 rounded-lg text-sm font-bold text-brand-700 hover:shadow-md transition-all">500 Ⓒ</button>
                                  <button className="py-2 bg-brand-600 border border-brand-600 rounded-lg text-sm font-bold text-white hover:bg-brand-700 shadow-md transition-all">1000 Ⓒ</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

          </div>
      </div>
    </div>
  );
};
