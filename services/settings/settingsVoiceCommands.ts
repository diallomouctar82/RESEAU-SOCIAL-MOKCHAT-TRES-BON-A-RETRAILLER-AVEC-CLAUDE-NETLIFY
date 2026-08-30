/**
 * Architecte — registre des capacités « Paramètres » et « Appareil ».
 *
 * Même patron que les 4 registres de domaine déjà réels
 * (`LIVE_VOICE_CAPABILITIES`, `CONTENT_VOICE_CAPABILITIES`,
 * `SOCIAL_VOICE_CAPABILITIES`, `TASK_VOICE_CAPABILITIES`) : ce fichier
 * DÉCRIT, il n'exécute pas. Les handlers réels vivent dans
 * `services/architecte/settingsCapabilityHandlers.ts`.
 *
 * Contrairement aux domaines Live/Contenu/Social, ces capacités ne dépendent
 * d'AUCUN état d'écran : elles n'opèrent que sur le profil de l'utilisateur
 * courant (colonnes réelles `profiles.preferred_language` et
 * `profiles.privacy_settings`) ou sur des API navigateur. L'Architecte les
 * porte donc lui-même, exactement comme le domaine Tâches — elles sont
 * disponibles partout dans l'application, y compris depuis la barre
 * flottante vocale.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FRONTIÈRE HONNÊTE, À NE JAMAIS FRANCHIR EN PRÉTENDANT LE CONTRAIRE
 * ─────────────────────────────────────────────────────────────────────────
 * MokNet est une application web. Le navigateur interdit, par conception, à
 * toute page d'agir sur les réglages du SYSTÈME du téléphone : volume,
 * luminosité, Wi-Fi, Bluetooth, données mobiles, mode avion, sonneries,
 * applications tierces. Aucune capacité de ce registre ne prétend le faire.
 *
 * Ce qui EST réellement pilotable est de deux natures :
 *   1. les paramètres de MokNet eux-mêmes (langue, confidentialité,
 *      notifications, profil) — persistés en base, vérifiables ;
 *   2. les quelques capacités que le navigateur expose réellement à une page
 *      (vibration, plein écran, partage natif, veille de l'écran) — soumises
 *      au support du navigateur, et rapportées comme indisponibles quand
 *      elles ne le sont pas, jamais simulées.
 *
 * Une demande hors de ce périmètre (« monte le volume », « active le
 * Wi-Fi ») doit recevoir une réponse honnête de l'Architecte, jamais une
 * fausse confirmation.
 */

export type SettingsVoiceActionType =
    | 'SET_LANGUAGE'
    | 'MUTE_NOTIFICATIONS'
    | 'UNMUTE_NOTIFICATIONS'
    | 'SET_PROFILE_VISIBILITY'
    | 'SET_MESSAGES_FROM'
    | 'SET_FRIEND_REQUESTS_FROM'
    | 'SET_ONLINE_STATUS'
    | 'UPDATE_PROFILE'
    | 'READ_SETTINGS'
    | 'VIBRATE'
    | 'TOGGLE_FULLSCREEN'
    | 'SHARE'
    | 'TOGGLE_WAKE_LOCK';

export interface SettingsVoiceCapability {
    id: string;
    actionType: SettingsVoiceActionType;
    description: string;
    riskLevel: 'low' | 'moderate' | 'high';
}

/**
 * Les réglages de confidentialité sont en `moderate` : ils changent qui peut
 * vous voir, vous écrire ou vous ajouter. Une confirmation explicite est donc
 * exigée avant l'écriture (dérivée automatiquement de `riskLevel` par
 * `capabilityRegistry.ts`) — jamais un basculement silencieux sur une phrase
 * mal comprise.
 */
export const SETTINGS_VOICE_CAPABILITIES: SettingsVoiceCapability[] = [
    {
        id: 'settings.language.set',
        actionType: 'SET_LANGUAGE',
        description: "changer la langue de l'interface, payload.language = code court ('fr', 'en', 'es', 'pt', 'ar')",
        riskLevel: 'low',
    },
    {
        id: 'settings.notifications.mute',
        actionType: 'MUTE_NOTIFICATIONS',
        description: 'activer le mode silencieux (masque la pastille de notifications sans jamais masquer les notifications elles-mêmes), payload vide',
        riskLevel: 'low',
    },
    {
        id: 'settings.notifications.unmute',
        actionType: 'UNMUTE_NOTIFICATIONS',
        description: 'désactiver le mode silencieux, payload vide',
        riskLevel: 'low',
    },
    {
        id: 'settings.privacy.profile_visibility',
        actionType: 'SET_PROFILE_VISIBILITY',
        description: "changer qui peut voir votre profil, payload.visibility = 'public' | 'network' | 'private'",
        riskLevel: 'moderate',
    },
    {
        id: 'settings.privacy.messages_from',
        actionType: 'SET_MESSAGES_FROM',
        description: "changer qui peut vous écrire, payload.from = 'all' | 'network' | 'none'",
        riskLevel: 'moderate',
    },
    {
        id: 'settings.privacy.friend_requests_from',
        actionType: 'SET_FRIEND_REQUESTS_FROM',
        description: "changer qui peut vous envoyer une demande d'ami, payload.from = 'all' | 'none'",
        riskLevel: 'moderate',
    },
    {
        id: 'settings.privacy.online_status',
        actionType: 'SET_ONLINE_STATUS',
        description: 'afficher ou masquer votre statut en ligne, payload.visible = true | false',
        riskLevel: 'low',
    },
    {
        id: 'settings.profile.update',
        actionType: 'UPDATE_PROFILE',
        description: 'mettre à jour un champ de votre profil, payload = { name?, title?, bio?, city?, country? } — uniquement les champs réellement énoncés',
        riskLevel: 'low',
    },
    {
        id: 'settings.read',
        actionType: 'READ_SETTINGS',
        description: 'énoncer vos réglages actuels (langue, mode silencieux, confidentialité), payload vide — lecture seule',
        riskLevel: 'low',
    },
    {
        id: 'device.vibrate',
        actionType: 'VIBRATE',
        description: "faire vibrer l'appareil, payload.durationMs (défaut 200) — indisponible sur la plupart des navigateurs de bureau",
        riskLevel: 'low',
    },
    {
        id: 'device.fullscreen.toggle',
        actionType: 'TOGGLE_FULLSCREEN',
        description: 'passer en plein écran ou en sortir, payload vide',
        riskLevel: 'low',
    },
    {
        id: 'device.share',
        actionType: 'SHARE',
        description: "ouvrir le partage natif de l'appareil, payload = { title?, text?, url? } — indisponible sur la plupart des navigateurs de bureau",
        riskLevel: 'low',
    },
    {
        id: 'device.wake_lock.toggle',
        actionType: 'TOGGLE_WAKE_LOCK',
        description: "empêcher l'écran de s'éteindre, ou lever cette contrainte, payload vide",
        riskLevel: 'low',
    },
];

/**
 * Formulations que l'Architecte doit reconnaître comme HORS de son pouvoir
 * réel, pour répondre honnêtement au lieu de tenter une capacité inexistante.
 * Utilisé par `settingsCapabilityHandlers.ts` uniquement à titre de message
 * d'explication — aucune de ces demandes ne correspond à une capacité
 * enregistrée, donc aucune ne peut être « exécutée » par erreur.
 */
export const OUT_OF_REACH_EXPLANATION =
    "Je ne peux pas agir sur les réglages du téléphone lui-même (volume, luminosité, Wi-Fi, mode avion) : le navigateur l'interdit à toute page web, MokNet comprise. En revanche je pilote tous les réglages de MokNet — langue, confidentialité, notifications, profil — et je peux faire vibrer l'appareil, passer en plein écran, ouvrir le partage natif ou garder l'écran allumé.";
