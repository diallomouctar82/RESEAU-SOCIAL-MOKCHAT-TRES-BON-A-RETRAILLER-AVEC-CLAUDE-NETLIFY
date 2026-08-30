import type { UserProfile } from '../../types';
import { registerCapabilityHandlers, type CapabilityHandler } from './capabilityBus';

/**
 * Handlers réels des domaines « Paramètres » et « Appareil », portés par
 * l'Architecte lui-même.
 *
 * Comme le domaine Tâches, ces capacités ne dépendent d'AUCUN état d'écran :
 * elles n'opèrent que sur le profil de l'utilisateur courant (colonnes
 * réelles `profiles.preferred_language` et `profiles.privacy_settings`) ou
 * sur des API navigateur. Elles sont donc disponibles partout, y compris
 * depuis la barre flottante vocale.
 *
 * Discipline anti-faux-succès, appliquée sans exception ici : chaque écriture
 * de réglage passe par `updateProfile`, qui ne renvoie `true` que si la
 * persistance a RÉELLEMENT abouti (voir `contexts/GlobalContext.tsx`). Un
 * échec réseau ou une RLS refusante produit donc un `ok: false` honnête, que
 * le bus convertit en `failed` — jamais un « c'est fait » prononcé à voix
 * haute alors que rien n'a changé.
 *
 * Les capacités `device.*` s'appuient sur des API réellement exposées par le
 * navigateur. Quand l'API n'existe pas (cas courant sur navigateur de
 * bureau), le handler le DIT au lieu de simuler un succès. Aucune capacité
 * de ce fichier ne touche aux réglages du système d'exploitation — le
 * navigateur l'interdit, et prétendre le contraire serait exactement le genre
 * de fausse capacité que ce dépôt refuse (voir `settingsVoiceCommands.ts`).
 */

type PrivacySettings = UserProfile['privacySettings'];

export interface SettingsHandlerDeps {
    /** Profil courant, relu à CHAQUE appel : un réglage modifié entre-temps ne doit jamais être écrasé par une valeur périmée capturée à l'enregistrement. */
    getProfile: () => UserProfile;
    /** Persistance réelle. `false` = rien n'a été enregistré. */
    updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const LANGUAGE_LABELS: Record<string, string> = {
    fr: 'français',
    en: 'anglais',
    es: 'espagnol',
    pt: 'portugais',
    ar: 'arabe',
};

const VISIBILITY_LABELS: Record<string, string> = {
    public: 'visible par tout le monde',
    network: 'visible par vos contacts et abonnés',
    private: 'privé',
};

const AUDIENCE_LABELS: Record<string, string> = {
    all: 'tout le monde',
    network: 'vos contacts et abonnés',
    none: 'personne',
};

/** Écrit un sous-ensemble de `privacySettings` sans jamais perdre les autres clés. */
async function patchPrivacy(
    deps: SettingsHandlerDeps,
    patch: Partial<PrivacySettings>
): Promise<boolean> {
    const current = deps.getProfile().privacySettings;
    return deps.updateProfile({ privacySettings: { ...current, ...patch } });
}

function readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function buildSettingsCapabilityHandlers(deps: SettingsHandlerDeps): Record<string, CapabilityHandler> {
    return {
        'settings.language.set': async (params) => {
            const raw = readString(params?.language)?.toLowerCase();
            const code = raw?.slice(0, 2);
            if (!code || !LANGUAGE_LABELS[code]) {
                return {
                    ok: false,
                    message: `Je ne gère pas encore cette langue. Les langues disponibles sont : ${Object.values(LANGUAGE_LABELS).join(', ')}.`,
                };
            }
            const saved = await deps.updateProfile({ preferredLanguage: code });
            if (!saved) return { ok: false, message: "Le changement de langue n'a pas pu être enregistré." };
            return { ok: true, message: `Langue de l'interface réglée sur le ${LANGUAGE_LABELS[code]}.` };
        },

        'settings.notifications.mute': async () => {
            const saved = await patchPrivacy(deps, { notificationsMuted: true });
            if (!saved) return { ok: false, message: "Le mode silencieux n'a pas pu être enregistré." };
            // Formulation exacte du comportement réel : le mode silencieux
            // masque la pastille, jamais les notifications elles-mêmes.
            return { ok: true, message: 'Mode silencieux activé. Vos notifications continuent d\'arriver, seule la pastille est masquée.' };
        },

        'settings.notifications.unmute': async () => {
            const saved = await patchPrivacy(deps, { notificationsMuted: false });
            if (!saved) return { ok: false, message: "La désactivation du mode silencieux n'a pas pu être enregistrée." };
            return { ok: true, message: 'Mode silencieux désactivé.' };
        },

        'settings.privacy.profile_visibility': async (params) => {
            const visibility = readString(params?.visibility) as PrivacySettings['profileVisibility'] | undefined;
            if (!visibility || !VISIBILITY_LABELS[visibility]) {
                return { ok: false, message: "Précisez : profil public, réservé à vos contacts, ou privé ?" };
            }
            const saved = await patchPrivacy(deps, { profileVisibility: visibility });
            if (!saved) return { ok: false, message: "Le réglage de visibilité n'a pas pu être enregistré." };
            return { ok: true, message: `Votre profil est maintenant ${VISIBILITY_LABELS[visibility]}.` };
        },

        'settings.privacy.messages_from': async (params) => {
            const from = readString(params?.from) as PrivacySettings['allowMessagesFrom'] | undefined;
            if (!from || !AUDIENCE_LABELS[from]) {
                return { ok: false, message: 'Précisez : qui peut vous écrire — tout le monde, vos contacts, ou personne ?' };
            }
            const saved = await patchPrivacy(deps, { allowMessagesFrom: from });
            if (!saved) return { ok: false, message: "Le réglage de messagerie n'a pas pu être enregistré." };
            return { ok: true, message: `Désormais, ${AUDIENCE_LABELS[from]} peut vous écrire.` };
        },

        'settings.privacy.friend_requests_from': async (params) => {
            const from = readString(params?.from) as PrivacySettings['allowFriendRequestsFrom'] | undefined;
            // `network` n'existe volontairement pas pour les demandes d'ami
            // (voir types.ts, LOOP 04/17) — ne pas l'accepter silencieusement.
            if (from !== 'all' && from !== 'none') {
                return { ok: false, message: "Précisez : tout le monde peut vous envoyer une demande d'ami, ou personne ?" };
            }
            const saved = await patchPrivacy(deps, { allowFriendRequestsFrom: from });
            if (!saved) return { ok: false, message: "Le réglage des demandes d'ami n'a pas pu être enregistré." };
            return {
                ok: true,
                message: from === 'all'
                    ? "Tout le monde peut désormais vous envoyer une demande d'ami."
                    : "Plus personne ne peut vous envoyer de demande d'ami.",
            };
        },

        'settings.privacy.online_status': async (params) => {
            if (typeof params?.visible !== 'boolean') {
                return { ok: false, message: 'Voulez-vous afficher ou masquer votre statut en ligne ?' };
            }
            const saved = await patchPrivacy(deps, { showOnlineStatus: params.visible });
            if (!saved) return { ok: false, message: "Le réglage du statut en ligne n'a pas pu être enregistré." };
            return { ok: true, message: params.visible ? 'Votre statut en ligne est maintenant visible.' : 'Votre statut en ligne est maintenant masqué.' };
        },

        'settings.profile.update': async (params) => {
            // Seuls les champs RÉELLEMENT énoncés sont écrits — jamais un
            // champ vide qui écraserait une valeur existante.
            const updates: Partial<UserProfile> = {};
            const name = readString(params?.name);
            const title = readString(params?.title);
            const bio = readString(params?.bio);
            const city = readString(params?.city);
            const country = readString(params?.country);
            if (name) updates.name = name;
            if (title) updates.title = title;
            if (bio) updates.bio = bio;
            if (city) updates.city = city;
            if (country) updates.country = country;

            const changed = Object.keys(updates);
            if (changed.length === 0) {
                return { ok: false, message: "Je n'ai pas compris quel champ de votre profil modifier." };
            }
            const saved = await deps.updateProfile(updates);
            if (!saved) return { ok: false, message: "La modification du profil n'a pas pu être enregistrée." };

            const labels: Record<string, string> = { name: 'nom', title: 'titre', bio: 'biographie', city: 'ville', country: 'pays' };
            const list = changed.map((k) => labels[k] || k).join(', ');
            return { ok: true, message: `Profil mis à jour : ${list}.` };
        },

        'settings.read': async () => {
            const p = deps.getProfile();
            const s = p.privacySettings;
            const lang = LANGUAGE_LABELS[(p.preferredLanguage || 'fr').slice(0, 2)] || p.preferredLanguage || 'français';
            const parts = [
                `langue : ${lang}`,
                `mode silencieux : ${s.notificationsMuted ? 'activé' : 'désactivé'}`,
                `profil : ${VISIBILITY_LABELS[s.profileVisibility] || s.profileVisibility}`,
                `vous écrire : ${AUDIENCE_LABELS[s.allowMessagesFrom] || s.allowMessagesFrom}`,
                `demandes d'ami : ${s.allowFriendRequestsFrom === 'all' ? 'ouvertes' : 'fermées'}`,
                `statut en ligne : ${s.showOnlineStatus ? 'visible' : 'masqué'}`,
            ];
            return { ok: true, message: `Vos réglages actuels — ${parts.join(' ; ')}.`, data: s };
        },

        // ── Appareil : API réellement exposées par le navigateur ────────────
        // Aucune ne touche au système d'exploitation. Quand l'API n'existe
        // pas, on le dit — jamais un succès simulé.

        'device.vibrate': async (params) => {
            const duration = typeof params?.durationMs === 'number' && params.durationMs > 0
                ? Math.min(params.durationMs, 2000)
                : 200;
            if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
                return { ok: false, message: "Cet appareil ou ce navigateur ne permet pas la vibration — c'est courant sur ordinateur." };
            }
            // `vibrate` renvoie false si le navigateur refuse (onglet en
            // arrière-plan, réglage utilisateur) : on rapporte le vrai retour.
            const accepted = navigator.vibrate(duration);
            if (!accepted) return { ok: false, message: "Le navigateur a refusé la vibration." };
            return { ok: true, message: 'Vibration envoyée.' };
        },

        'device.fullscreen.toggle': async () => {
            if (typeof document === 'undefined') {
                return { ok: false, message: 'Le plein écran est indisponible ici.' };
            }
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                    return { ok: true, message: 'Plein écran désactivé.' };
                }
                if (typeof document.documentElement.requestFullscreen !== 'function') {
                    return { ok: false, message: 'Ce navigateur ne permet pas le plein écran.' };
                }
                await document.documentElement.requestFullscreen();
                return { ok: true, message: 'Plein écran activé.' };
            } catch (e: any) {
                // Refus courant : le navigateur exige un geste utilisateur
                // direct. On dit la vérité plutôt que de prétendre l'inverse.
                return { ok: false, message: e?.message || "Le navigateur a refusé le passage en plein écran." };
            }
        },

        'device.share': async (params) => {
            const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
            if (!nav || typeof nav.share !== 'function') {
                return { ok: false, message: "Le partage natif n'est pas disponible sur ce navigateur — c'est courant sur ordinateur." };
            }
            try {
                await nav.share({
                    title: readString(params?.title) || 'Le Monde à Vous',
                    text: readString(params?.text) || '',
                    url: readString(params?.url) || (typeof window !== 'undefined' ? window.location.href : undefined),
                });
                return { ok: true, message: 'Partage ouvert.' };
            } catch (e: any) {
                // Annulation par l'utilisateur incluse — ce n'est pas un
                // succès, et ce n'est pas non plus une panne à dramatiser.
                if (e?.name === 'AbortError') return { ok: false, message: 'Partage annulé.' };
                return { ok: false, message: e?.message || "Le partage n'a pas pu être ouvert." };
            }
        },

        'device.wake_lock.toggle': async () => {
            const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
            if (!nav?.wakeLock || typeof nav.wakeLock.request !== 'function') {
                return { ok: false, message: "Ce navigateur ne permet pas de garder l'écran allumé." };
            }
            try {
                if (activeWakeLock) {
                    await activeWakeLock.release();
                    activeWakeLock = null;
                    return { ok: true, message: "L'écran peut de nouveau s'éteindre normalement." };
                }
                activeWakeLock = await nav.wakeLock.request('screen');
                // Le système peut relâcher le verrou de lui-même (onglet
                // masqué, batterie faible) : on tient l'état à jour au lieu de
                // croire indéfiniment qu'il est actif.
                activeWakeLock?.addEventListener?.('release', () => { activeWakeLock = null; });
                return { ok: true, message: "L'écran restera allumé." };
            } catch (e: any) {
                activeWakeLock = null;
                return { ok: false, message: e?.message || "Impossible de garder l'écran allumé." };
            }
        },
    };
}

/** Verrou de veille courant — hors du builder pour survivre à un réenregistrement des handlers. */
let activeWakeLock: any = null;

/**
 * Enregistre les handlers Paramètres/Appareil et renvoie la fonction de
 * retrait. Appelée depuis l'Architecte lui-même : ces capacités restent
 * disponibles partout dans l'application, puisqu'elles ne dépendent d'aucun
 * état d'interface.
 */
export function registerSettingsCapabilities(deps: SettingsHandlerDeps): () => void {
    return registerCapabilityHandlers(buildSettingsCapabilityHandlers(deps));
}
