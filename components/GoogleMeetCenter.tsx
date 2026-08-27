import React, { useState, useEffect, useRef } from 'react';
import { 
    Video, Plus, Copy, Check, ExternalLink, Calendar, Users, 
    Sparkles, Shield, Clock, PhoneCall, Mic, MicOff, Camera, 
    CameraOff, RefreshCw, AlertCircle, Play, UserCheck
} from 'lucide-react';
import {
    createMeetSpace,
    getMeetSpace,
    GoogleMeetSpace,
    getAccessToken
} from '../services/googleWorkspace';
import { hasWorkspaceCapabilities, subscribeToWorkspaceToken } from '../services/googleWorkspaceLink';
import { GoogleWorkspaceBanner } from './GoogleWorkspaceBanner';
import { AGENTS } from '../constants';

interface ScheduledMeet {
    id: string;
    topic: string;
    agentName: string;
    agentRole: string;
    agentAvatar: string;
    meetingUri: string;
    meetingCode: string;
    date: string;
    time: string;
    status: 'ready' | 'completed';
}

const EXPERT_TEMPLATES = [
    {
        agentId: '2',
        name: 'Maître Diallo',
        role: 'Consultation Juridique & Visas',
        avatar: AGENTS[1]?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        topic: 'Étude d\'éligibilité Visa & Droits Internationaux'
    },
    {
        agentId: '5',
        name: 'Docteur Diallo',
        role: 'Téléconsultation & Bilan de Santé',
        avatar: AGENTS[4]?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
        topic: 'Bilan de santé pré-départ & Vaccinations'
    },
    {
        agentId: '3',
        name: 'Coach Diallo',
        role: 'Entretien d\'Embauche & Carrière',
        avatar: AGENTS[2]?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        topic: 'Simulation d\'entretien d\'embauche international'
    },
    {
        agentId: '4',
        name: 'Professeur Diallo',
        role: 'Tutorat & Orientation Universitaire',
        avatar: AGENTS[3]?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        topic: 'Revue de dossier universitaire & bourses'
    }
];

export const GoogleMeetCenter: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Active / Generated Space
    const [activeMeet, setActiveMeet] = useState<GoogleMeetSpace | null>(null);
    const [copied, setCopied] = useState(false);

    // List of scheduled expert sessions
    const [scheduledMeets, setScheduledMeets] = useState<ScheduledMeet[]>([]);

    // Local device preview state
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeToWorkspaceToken((t) => {
            setToken(t && hasWorkspaceCapabilities(['meet']) ? t : null);
        });
        return () => unsubscribe();
    }, []);

    // Camera test preview
    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    setVideoStream(stream);
                    if (videoPreviewRef.current) {
                        videoPreviewRef.current.srcObject = stream;
                    }
                }
            } catch (e) {
                console.warn('Camera preview non disponible ou permissions refusées:', e);
            }
        };
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleCamera = () => {
        if (videoStream) {
            videoStream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOn;
            });
        }
        setIsCameraOn(!isCameraOn);
    };

    const handleCreateInstantMeeting = async (customTopic?: string, expert?: typeof EXPERT_TEMPLATES[0]) => {
        if (!token) {
            setError('Veuillez connecter votre compte Google pour créer une réunion Google Meet.');
            return;
        }

        setIsCreating(true);
        setError(null);
        try {
            const space = await createMeetSpace();
            setActiveMeet(space);

            if (!space.meetingUri || !space.meetingCode) {
                throw new Error('Google Meet n’a retourné aucun lien de réunion valide.');
            }
            const uri = space.meetingUri;
            const code = space.meetingCode;

            const newMeet: ScheduledMeet = {
                id: `meet-${Date.now()}`,
                topic: customTopic || 'Session de Visioconférence Instantanée',
                agentName: expert ? expert.name : 'Visioconférence Google Meet',
                agentRole: expert ? expert.role : 'Session Collaborative',
                agentAvatar: expert ? expert.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                meetingUri: uri,
                meetingCode: code,
                date: 'Maintenant',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'ready'
            };

            setScheduledMeets(prev => [newMeet, ...prev]);
        } catch (err: any) {
            console.error('Erreur création Meet:', err);
            setActiveMeet(null);
            setError(err?.message || 'Google Meet n’est pas configuré. Vérifiez le consentement et les APIs activées.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyLink = (uri: string) => {
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                            <Video size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visioconférence Google Meet</h1>
                            <p className="text-sm text-slate-500">
                                Rendez-vous vidéo sécurisés avec vos avocats, médecins, tuteurs et recruteurs internationaux
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleCreateInstantMeeting()}
                        disabled={!token || isCreating}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
                    >
                        {isCreating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                        <span>Démarrer une Réunion Instantanée</span>
                    </button>
                </div>
            </div>

            {/* Google Workspace Banner */}
            <GoogleWorkspaceBanner capabilities={['meet']} />

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Meet Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Active Meeting or Camera Preview Stage */}
                <div className="lg:col-span-7 space-y-4">
                    {activeMeet ? (
                        <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-rose-800/30 relative overflow-hidden animate-fade-up">
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                                    Réunion Prête
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {activeMeet.meetingCode || 'meet-live'}
                                </span>
                            </div>

                            <div className="my-6 text-center space-y-2">
                                <h3 className="text-xl font-bold text-white">Votre visioconférence est prête !</h3>
                                <p className="text-xs text-slate-300 max-w-md mx-auto">
                                    Rejoignez la réunion maintenant ou partagez le lien avec vos interlocuteurs.
                                </p>
                            </div>

                            {/* Meeting Link Box */}
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 mb-6">
                                <div className="text-xs font-mono text-rose-300 truncate">
                                    {activeMeet.meetingUri}
                                </div>
                                <button
                                    onClick={() => handleCopyLink(activeMeet.meetingUri!)}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                                >
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                <a
                                    href={activeMeet.meetingUri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold text-center transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                    <Video size={16} />
                                    <span>Rejoindre sur Google Meet</span>
                                    <ExternalLink size={14} />
                                </a>
                                <button
                                    onClick={() => setActiveMeet(null)}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-2xl text-xs font-bold transition-all"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Camera size={16} className="text-rose-400" />
                                    Aperçu Caméra & Audio
                                </h3>
                                <span className="text-[11px] text-slate-400">Prêt pour Google Meet</span>
                            </div>

                            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
                                {isCameraOn ? (
                                    <video
                                        ref={videoPreviewRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />
                                ) : (
                                    <div className="text-center text-slate-500 space-y-2">
                                        <CameraOff size={36} className="mx-auto text-slate-600" />
                                        <p className="text-xs">Caméra désactivée</p>
                                    </div>
                                )}

                                {/* Bottom controls overlay */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                    <button
                                        onClick={toggleCamera}
                                        className={`p-2.5 rounded-full transition-all ${
                                            isCameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 text-white'
                                        }`}
                                        title={isCameraOn ? 'Couper la caméra' : 'Activer la caméra'}
                                    >
                                        {isCameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setIsMicOn(!isMicOn)}
                                        className={`p-2.5 rounded-full transition-all ${
                                            isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 text-white'
                                        }`}
                                        title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
                                    >
                                        {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expert Consultation Instant Launchers */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <Sparkles size={14} className="text-brand-600" />
                                Consulter un Expert par Vidéo
                            </h3>
                            <span className="text-[11px] text-slate-400">1-Clic Google Meet</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {EXPERT_TEMPLATES.map(exp => (
                                <div
                                    key={exp.agentId}
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all group flex flex-col justify-between"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={exp.avatar}
                                            alt={exp.name}
                                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                        />
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                                                {exp.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 truncate">{exp.role}</p>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-600 mb-3 italic">
                                        « {exp.topic} »
                                    </p>

                                    <button
                                        onClick={() => handleCreateInstantMeeting(exp.topic, exp)}
                                        disabled={!token || isCreating}
                                        className="w-full py-2 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <Video size={13} />
                                        <span>Lancer la consultation</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scheduled / Recent Meetings Sidebar */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Calendar size={14} className="text-rose-500" />
                                Sessions & Rendez-vous ({scheduledMeets.length})
                            </h3>
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                                Direct Meet
                            </span>
                        </div>

                        <div className="space-y-3 mt-4">
                            {scheduledMeets.map(meet => (
                                <div
                                    key={meet.id}
                                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <img
                                                src={meet.agentAvatar}
                                                alt={meet.agentName}
                                                className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                                            />
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{meet.agentName}</h4>
                                                <span className="text-[10px] text-slate-400">{meet.agentRole}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200/60">
                                            <Clock size={12} className="text-slate-400" />
                                            <span>{meet.time}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-700 font-medium leading-snug">
                                        {meet.topic}
                                    </p>

                                    <div className="flex items-center gap-2 pt-1">
                                        <a
                                            href={meet.meetingUri}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <Video size={13} />
                                            <span>Rejoindre</span>
                                        </a>
                                        <button
                                            onClick={() => handleCopyLink(meet.meetingUri)}
                                            className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-500 transition-colors"
                                            title="Copier le lien"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
