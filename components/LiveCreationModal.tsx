import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Radio, Sparkles, Video, Mic, Globe, Lock, Users, Calendar, 
  Clock, Shield, Eye, FileText, Check, ChevronRight, ChevronLeft, 
  HelpCircle, Bot, Share2, Award, Zap, Layers, AlertCircle, Camera, Volume2, Wifi
} from 'lucide-react';
import { LiveStream, LiveType, LiveQualityMode, Agent } from '../types';
import { AGENTS, TRIBES, USER_PROFILE, MOCK_MEMBERS } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';

interface LiveCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLive: (live: LiveStream) => void;
}

const LIVE_TYPES: { id: LiveType; label: string; icon: string; desc: string; category: string }[] = [
  { id: 'public', label: 'Live Public', icon: '🌍', desc: 'Accessible à tous les membres du réseau Réseau Mok.', category: 'Général' },
  { id: 'expert', label: 'Live Expert & Conseil', icon: '⚖️', desc: 'Consultation interactive avec experts IA ou spécialistes humains.', category: 'Expertise' },
  { id: 'project_pitch', label: 'Présentation de Projet', icon: '🚀', desc: 'Présentation d\'entreprise, levée de fonds ou projet de vie.', category: 'Projet' },
  { id: 'education', label: 'Live Éducatif & Cours', icon: '📚', desc: 'Cours magistral ou interactif avec tableau blanc et quiz.', category: 'Éducation' },
  { id: 'campus', label: 'Live Campus & Certifiant', icon: '🎓', desc: 'Direct connecté au Campus avec évaluation et ressource auto-générée.', category: 'Éducation' },
  { id: 'qa', label: 'Questions / Réponses', icon: '💬', desc: 'Session interactive avec votes du public et organisation IA.', category: 'Interactif' },
  { id: 'coaching', label: 'Accompagnement & Mentorat', icon: '🎯', desc: 'Suivi personnalisé, coaching de carrière et mobilité.', category: 'Accompagnement' },
  { id: 'workshop', label: 'Atelier Collaboratif', icon: '🛠️', desc: 'Travail d\'équipe, revue de documents et brainstorming.', category: 'Collaboratif' },
  { id: 'demo', label: 'Démonstration Pratique', icon: '💻', desc: 'Tutoriel pas à pas, manipulation de logiciel ou produit.', category: 'Technique' },
  { id: 'tribe', label: 'Live Tribu Thématique', icon: '🔥', desc: 'Réservé aux membres d\'une communauté ou d\'un groupe.', category: 'Communauté' },
  { id: 'conference', label: 'Conférence & Keynote', icon: '🎙️', desc: 'Grand événement avec multi-intervenants et régie de parole.', category: 'Événement' },
  { id: 'pro', label: 'Live Professionnel', icon: '💼', desc: 'Échanges B2B, recrutement et partenariats économiques.', category: 'Professionnel' },
  { id: 'enterprise', label: 'Live d\'Entreprise', icon: '🏢', desc: 'Communication interne ou externe d\'organisation.', category: 'Professionnel' },
  { id: 'members', label: 'Entre Membres & Réseau', icon: '🤝', desc: 'Échanges ouverts et rencontres conviviales.', category: 'Communauté' },
  { id: 'group', label: 'Live de Groupe Fermé', icon: '👥', desc: 'Session restreinte pour une équipe ou promotion d\'étudiants.', category: 'Collaboratif' },
  { id: 'private', label: 'Live Privé Confidentiel', icon: '🔒', desc: 'Session ultra-sécurisée sur invitation stricte.', category: 'Confidentiel' }
];

const TIMEZONES = [
  { id: 'GMT', label: 'GMT (Conakry, Dakar, Abidjan, Bamako, Londres)' },
  { id: 'CET', label: 'CET / UTC+1 (Paris, Bruxelles, Genève, Casablanca)' },
  { id: 'EST', label: 'EST / UTC-5 (New York, Montréal, Toronto)' },
  { id: 'CAT', label: 'CAT / UTC+2 (Kigali, Le Caire, Johannesburg)' },
  { id: 'EAT', label: 'EAT / UTC+3 (Nairobi, Addis-Abeba)' },
  { id: 'PST', label: 'PST / UTC-8 (San Francisco, Vancouver)' }
];

export const LiveCreationModal: React.FC<LiveCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateLive
}) => {
  const { userProfile, addNotification } = useGlobal();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [liveType, setLiveType] = useState<LiveType>('public');
  const [primaryLang, setPrimaryLang] = useState('Français');
  const [targetLang, setTargetLang] = useState('Anglais');
  const [coverImage, setCoverImage] = useState<string>('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&fit=crop');
  const [tagsInput, setTagsInput] = useState('#Innovation, #Afrique, #DialloOS');

  // Step 2: Access & Scheduling
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'tribe'>('public');
  const [selectedTribeId, setSelectedTribeId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('1');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('GMT');
  const [invitedMemberIds, setInvitedMemberIds] = useState<string[]>([]);
  const [moderatorIds, setModeratorIds] = useState<string[]>([]);

  // Step 3: Superpowers & Tools
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(true);
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(true);
  const [isQuestionsEnabled, setIsQuestionsEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(true);
  const [isVisionEnabled, setIsVisionEnabled] = useState(true);
  const [isDataSaver, setIsDataSaver] = useState(false);

  // Step 4: Real Preview & Diagnostics
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (currentStep === 4 && isOpen) {
      startMediaPreview();
    } else {
      stopMediaPreview();
    }
    return () => {
      stopMediaPreview();
    };
  }, [currentStep, isOpen]);

  const startMediaPreview = async () => {
    try {
      setIsTestingCamera(true);
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn("getUserMedia not available in this environment");
        setCameraActive(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setCameraActive(true);

      // Audio Meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          if (!streamRef.current || !analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const avg = sum / bufferLength;
          setAudioVolume(Math.min(100, Math.round(avg * 1.5)));
          requestAnimationFrame(updateVolume);
        };
        updateVolume();
      }
    } catch (e) {
      console.warn("Could not access camera/mic for preview", e);
      setCameraActive(false);
    } finally {
      setIsTestingCamera(false);
    }
  };

  const stopMediaPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setCameraActive(false);
    setAudioVolume(0);
  };

  const handleCreateOrSchedule = () => {
    if (!title.trim()) {
      addNotification("Titre Requis", "Veuillez donner un titre à votre session Live.", "warning");
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const assignedAgent = AGENTS.find(a => a.id === selectedAgentId);
    const assignedTribe = TRIBES.find(t => t.id === selectedTribeId);
    // LOOP 15/17 (mission Architecte MOCnet) : `scheduled_for` est une vraie
    // colonne `timestamptz` en base (confirmé en testant le correctif de
    // persistance de cette même LOOP) — la chaîne lisible "2026-09-05 à
    // 18:00 (Europe/Paris)" auparavant assignée directement à `scheduledFor`
    // aurait fait échouer l'insertion réelle avec `22007 invalid input
    // syntax for type timestamp with time zone` dès que ce champ serait
    // effectivement transmis. Un seul Date calculé, réutilisé pour
    // `startedAt` (comportement inchangé) et `scheduledFor` (ISO réel) ; le
    // libellé lisible reste utilisé uniquement pour le message affiché.
    const scheduledDateObj = new Date(scheduledDate ? `${scheduledDate}T${scheduledTime || '12:00'}` : Date.now() + 86400000);
    const scheduledLabel = `${scheduledDate} à ${scheduledTime} (${timezone})`;

    const newLive: LiveStream = {
      id: `live-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `Session interactive ${LIVE_TYPES.find(t => t.id === liveType)?.label}`,
      type: liveType,
      hostName: userProfile.name,
      hostAvatar: userProfile.avatarUrl,
      viewers: 1,
      isMixed: true,
      aiAssistantId: selectedAgentId,
      startedAt: isScheduled ? scheduledDateObj : new Date(),
      isScheduled,
      scheduledFor: isScheduled ? scheduledDateObj.toISOString() : undefined,
      timezone: isScheduled ? timezone : undefined,
      duration: 45,
      isPaid: false,
      language: primaryLang,
      targetLanguage: targetLang,
      coverImage,
      isPrivate: privacy === 'private',
      allowedMemberIds: invitedMemberIds,
      tribeId: privacy === 'tribe' ? selectedTribeId : undefined,
      tribeName: privacy === 'tribe' ? assignedTribe?.name : undefined,
      expertId: selectedAgentId,
      isRecordingEnabled,
      isTranslationEnabled,
      isQuestionsEnabled,
      isScreenShareEnabled,
      isVisionEnabled,
      isDataSaver,
      qualityMode: isDataSaver ? 'eco_audio' : 'auto',
      tags: tags.length > 0 ? tags : ['#Live', '#DialloOS', '#RéseauMok'],
      speakers: [
        {
          id: userProfile.id,
          name: userProfile.name,
          avatar: userProfile.avatarUrl,
          role: 'host',
          isMuted: false,
          isVideoOn: true,
          isVerified: true
        },
        ...(assignedAgent ? [{
          id: `agent-${assignedAgent.id}`,
          name: `${assignedAgent.name} (IA)`,
          avatar: assignedAgent.avatarUrl,
          role: 'expert_ai' as const,
          isMuted: false,
          isVideoOn: true,
          isAi: true,
          specialty: assignedAgent.specialty,
          agentId: assignedAgent.id
        }] : [])
      ]
    };

    stopMediaPreview();
    onCreateLive(newLive);
    onClose();

    addNotification(
      isScheduled ? "Live Programmé 🗓️" : "Live Démarré 🔴",
      isScheduled ? `Votre Live "${title}" est programmé pour ${scheduledLabel}.` : `Votre Live intelligent "${title}" est maintenant ouvert.`,
      "success"
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white animate-scale-in">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 rounded-2xl border border-red-500/30">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Studio de Création Live
              </span>
              <h2 className="text-base font-extrabold text-white">
                Configurer & Lancer une Session Intelligente
              </h2>
            </div>
          </div>
          <button 
            onClick={() => { stopMediaPreview(); onClose(); }}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-xs font-bold">
          {[
            { step: 1, label: '1. Thématique & Type' },
            { step: 2, label: '2. Accès & Programmation' },
            { step: 3, label: '3. Super-pouvoirs IA' },
            { step: 4, label: '4. Prévisualisation' }
          ].map(s => (
            <div 
              key={s.step} 
              className={`flex items-center gap-2 cursor-pointer transition-colors ${currentStep === s.step ? 'text-indigo-400' : currentStep > s.step ? 'text-emerald-400' : 'text-slate-500'}`}
              onClick={() => setCurrentStep(s.step as any)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${currentStep === s.step ? 'bg-indigo-600 text-white' : currentStep > s.step ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                {currentStep > s.step ? '✓' : s.step}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Details & Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Titre de la session Live *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Masterclass Financement de Projet & Levée de Fonds..."
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-500 font-medium"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Description & Objectifs du Live
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Expliquez brièvement ce qui sera abordé et les livrables attendus..."
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-500 resize-none"
                  />
                </div>
              </div>

              {/* Type of Live Grid */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Sélectionnez le Type de Live (L'interface s'adaptera automatiquement)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {LIVE_TYPES.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setLiveType(t.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${liveType === t.id ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-slate-950/40 border-white/5 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{t.icon}</span>
                        <h4 className="text-xs font-extrabold text-white truncate">{t.label}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages & Cover */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Langue Principale Parlée
                  </label>
                  <select 
                    value={primaryLang} 
                    onChange={(e) => setPrimaryLang(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais (English)</option>
                    <option value="Arabe">Arabe (العربية)</option>
                    <option value="Wolof">Wolof</option>
                    <option value="Pulaar">Pulaar / Peul</option>
                    <option value="Malinké">Malinké / Bambara</option>
                    <option value="Soussou">Soussou</option>
                    <option value="Espagnol">Espagnol</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Traduction Automatique Cible
                  </label>
                  <select 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Anglais">Anglais</option>
                    <option value="Français">Français</option>
                    <option value="Arabe">Arabe</option>
                    <option value="Pulaar">Pulaar</option>
                    <option value="Wolof">Wolof</option>
                    <option value="Malinké">Malinké</option>
                    <option value="Espagnol">Espagnol</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Mots-clés & Tags
                  </label>
                  <input 
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="#Projet, #Finance..."
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Access, Tribes, Experts & Scheduling */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Privacy & Audience */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Visibilité & Accès
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'public', label: 'Public (Tout Réseau Mok)', icon: Globe, desc: 'Visible dans le flux et sur les profils.' },
                    { id: 'tribe', label: 'Tribu Thématique', icon: Users, desc: 'Réservé aux membres de la tribu sélectionnée.' },
                    { id: 'private', label: 'Privé / Sur Invitation', icon: Lock, desc: 'Accessible uniquement via lien ou invitation directe.' }
                  ].map(p => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPrivacy(p.id as any)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${privacy === p.id ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-950/40 border-white/5 hover:bg-white/5'}`}
                      >
                        <Icon size={18} className="text-indigo-400 mb-2" />
                        <h4 className="text-xs font-extrabold text-white">{p.label}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tribe Select if tribe */}
              {privacy === 'tribe' && (
                <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Associer à une Tribu
                  </label>
                  <select
                    value={selectedTribeId}
                    onChange={(e) => setSelectedTribeId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="">-- Choisir une Tribu --</option>
                    {TRIBES.map(tr => (
                      <option key={tr.id} value={tr.id}>{tr.name} ({tr.members} membres)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Expert Co-pilot Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Expert Diallo Associé (Copilote IA sur scène)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {AGENTS.slice(0, 4).map(ag => (
                    <div
                      key={ag.id}
                      onClick={() => setSelectedAgentId(ag.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${selectedAgentId === ag.id ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-slate-950/40 border-white/5 hover:bg-white/5'}`}
                    >
                      <img src={ag.avatarUrl} className="w-9 h-9 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{ag.name}</h5>
                        <p className="text-[10px] text-indigo-300 truncate">{ag.specialty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date & Time (Immediate vs Scheduled) */}
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Programmer pour plus tard</h4>
                      <p className="text-[10px] text-slate-400">Si désactivé, le Live sera lancé immédiatement dès validation.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {isScheduled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-fade-in">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Date</label>
                      <input 
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Heure</label>
                      <input 
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Fuseau Horaire</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz.id} value={tz.id}>{tz.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 3: Superpowers & Live Tools */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <span className="text-xs font-bold text-slate-300 block">
                Activez les fonctionnalités intelligentes pour votre session
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'rec',
                    title: 'Enregistrement & Replay Intelligent',
                    desc: 'Génération automatique de chapitres, transcription synchronisée et export Studio/Campus.',
                    state: isRecordingEnabled,
                    setter: setIsRecordingEnabled,
                    icon: Video
                  },
                  {
                    id: 'trans',
                    title: 'Sous-titrage & Traduction en Direct',
                    desc: 'Affichage bilingue simultané (Français, Anglais, Arabe, Pulaar, Wolof...) avec détection d\'intervenant.',
                    state: isTranslationEnabled,
                    setter: setIsTranslationEnabled,
                    icon: Globe
                  },
                  {
                    id: 'qa',
                    title: 'Espace Q&R avec Votes du Public',
                    desc: 'Sépare les questions des commentaires avec regroupement intelligent par Diallo OS.',
                    state: isQuestionsEnabled,
                    setter: setIsQuestionsEnabled,
                    icon: HelpCircle
                  },
                  {
                    id: 'screen',
                    title: 'Partage d\'Écran & Documents',
                    desc: 'Partage d\'écran fluide (getDisplayMedia) avec support des PDF, présentations et analyses IA.',
                    state: isScreenShareEnabled,
                    setter: setIsScreenShareEnabled,
                    icon: Share2
                  },
                  {
                    id: 'vision',
                    title: 'Vision IA Multimodale par Caméra',
                    desc: 'Permet à l\'IA d\'analyser les documents, objets ou schémas montrés à la caméra en direct.',
                    state: isVisionEnabled,
                    setter: setIsVisionEnabled,
                    icon: Eye
                  },
                  {
                    id: 'eco',
                    title: 'Mode Basse Consommation / Afrique (2G/3G)',
                    desc: 'Optimisation drastique de la bande passante avec flux audio prioritaire et reconnexion automatique.',
                    state: isDataSaver,
                    setter: setIsDataSaver,
                    icon: Wifi
                  }
                ].map(tool => {
                  const Icon = tool.icon;
                  return (
                    <div 
                      key={tool.id}
                      onClick={() => tool.setter(!tool.state)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${tool.state ? 'bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/40' : 'bg-slate-950/40 border-white/5 hover:bg-white/5 opacity-70'}`}
                    >
                      <div className={`p-2.5 rounded-xl ${tool.state ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-white">{tool.title}</h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${tool.state ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/5 text-slate-500'}`}>
                            {tool.state ? 'Activé' : 'Désactivé'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{tool.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* STEP 4: Real Preview & Hardware Diagnostics */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Preview Box (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    Aperçu Caméra & Microphone en Direct
                  </span>
                  
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl flex items-center justify-center">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`}
                    />

                    {!cameraActive && (
                      <div className="text-center p-6 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                          <Camera size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-300">Caméra désactivée ou en attente d'autorisation</p>
                        <p className="text-[10px] text-slate-500">Cliquez sur autoriser si le navigateur le demande</p>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Prêt pour l'antenne
                    </div>
                  </div>

                  {/* Mic Audio Meter */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Volume2 size={14} className="text-emerald-400" /> Niveau du Microphone
                      </span>
                      <span className="font-mono text-emerald-400 text-[11px]">{audioVolume}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-75"
                        style={{ width: `${audioVolume}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Summary Card (5 cols) */}
                <div className="lg:col-span-5 bg-slate-950/60 p-5 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <Sparkles size={16} /> Récapitulatif de la session
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-extrabold text-white leading-snug">{title || 'Titre non défini'}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{description || 'Aucune description'}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Type :</span>
                        <span className="font-bold text-indigo-300">{LIVE_TYPES.find(t => t.id === liveType)?.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Langues :</span>
                        <span className="font-bold text-white">{primaryLang} → {targetLang}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Accès :</span>
                        <span className="font-bold capitalize">{privacy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Copilote :</span>
                        <span className="font-bold text-indigo-300">{AGENTS.find(a => a.id === selectedAgentId)?.name} (IA)</span>
                      </div>
                      {isScheduled && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Programmé :</span>
                          <span className="font-bold text-emerald-400">{scheduledDate} à {scheduledTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-2">
                    <Shield size={14} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                    <span>Conforme à la charte Réseau Mok. Données sensibles protégées par Diallo OS.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !title.trim()) {
                  addNotification("Titre Requis", "Veuillez renseigner le titre du Live.", "warning");
                  return;
                }
                setCurrentStep((currentStep + 1) as any);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreateOrSchedule}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-extrabold rounded-2xl shadow-xl shadow-red-600/40 hover:scale-102 transition-all flex items-center gap-2"
            >
              <Radio size={16} className="animate-pulse" />
              {isScheduled ? 'Confirmer la Programmation' : 'Démarrer le Live Maintenant'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
