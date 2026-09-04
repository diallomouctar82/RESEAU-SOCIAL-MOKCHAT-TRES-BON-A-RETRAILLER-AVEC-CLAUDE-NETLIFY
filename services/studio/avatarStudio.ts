/**
 * STUDIO AVATAR — logique métier du parcours d'avatar personnel.
 *
 * Deux niveaux d'identité coexistent dans MokNet :
 *
 *  1. L'AVATAR PAR DÉFAUT, choisi une fois pour toutes par l'Admin-Général et
 *     appliqué à TOUT nouveau compte (`resolveNewAccountAvatarUrl`). Il donne
 *     un visage institutionnel cohérent à la plateforme au lieu du cliché de
 *     banque d'images hérité, qui reste refusé (`describeDefaultAvatar`).
 *  2. L'AVATAR PERSONNEL des membres Pro, qui REMPLACE le précédent : leur
 *     vraie photo, leur nom, et le droit de leur parler et de les guider dans
 *     l'application.
 *
 * Ce module est PUR : pas de React, pas de réseau, pas de `localStorage`, pas
 * d'horloge implicite (`now` est toujours passé). Tout ce qui décide — qui a
 * le droit, ce qui est accepté, ce qui bloque, ce qui est produit — est donc
 * vérifiable par test sans navigateur ni clé d'API. Les effets de bord
 * (téléversement du fichier, écriture du profil) restent à l'appelant.
 *
 * Ce que ce module ne fait PAS et ne prétend pas faire : générer une vidéo ou
 * une voix clonée. La « génération » assemble une PERSONA exploitable
 * immédiatement — photo, nom d'appel, salutation et lignes de guidage — que
 * l'app sait déjà rendre (Avatar3D, VoiceEngine). Aucune capacité inexistante
 * n'est simulée.
 */

import type { UserProfile } from '../../types';
import { isStockPlaceholderAvatar, realAvatarUrl } from './avatarIdentity';

// ─────────────────────────────────────────────────────────────────────────
// 1. ÉTAPES DU PARCOURS
// ─────────────────────────────────────────────────────────────────────────

/** Parcours Pro imposé : accès → photo → consentement → nom → génération → aperçu. */
export type AvatarStudioStep =
    | 'acces'
    | 'photo'
    | 'consentement'
    | 'nom'
    | 'generation'
    | 'apercu';

export const AVATAR_STUDIO_STEPS: readonly AvatarStudioStep[] = [
    'acces',
    'photo',
    'consentement',
    'nom',
    'generation',
    'apercu',
] as const;

export const AVATAR_STUDIO_STEP_LABELS: Record<AvatarStudioStep, string> = {
    acces: 'Accès Pro',
    photo: 'Votre photo',
    consentement: 'Consentement',
    nom: 'Votre nom',
    generation: 'Génération',
    apercu: 'Aperçu',
};

// ─────────────────────────────────────────────────────────────────────────
// 2. ACCÈS PRO
// ─────────────────────────────────────────────────────────────────────────

export type AvatarAccessVerdict =
    /** Membre Pro : parcours complet ouvert. */
    | 'pro'
    /** Administrateur : ouvert aussi, pour pouvoir contrôler le parcours réellement livré. */
    | 'admin'
    /** Compte standard : le Studio Avatar reste visible mais verrouillé, avec l'offre. */
    | 'plan_insuffisant'
    /** Compte suspendu / incomplet : ni Pro ni offre, on ne propose rien. */
    | 'compte_inactif';

export interface AvatarStudioAccess {
    allowed: boolean;
    verdict: AvatarAccessVerdict;
    /** Phrase affichable telle quelle — jamais un code technique à l'écran. */
    message: string;
}

/**
 * Un compte est Pro s'il porte explicitement le plan `pro`. Le champ est
 * optionnel dans `UserProfile` : un profil hérité sans plan est un compte
 * standard, jamais un Pro par accident — l'absence d'information ne donne
 * jamais un droit.
 */
export const isProAccount = (profile: Pick<UserProfile, 'plan'>): boolean => profile.plan === 'pro';

export function resolveAvatarStudioAccess(
    profile: Pick<UserProfile, 'plan' | 'role' | 'accountStatus'>,
): AvatarStudioAccess {
    if (profile.accountStatus === 'suspended') {
        return {
            allowed: false,
            verdict: 'compte_inactif',
            message:
                "Votre compte est suspendu : le Studio Avatar est indisponible tant qu'il n'est pas rétabli.",
        };
    }
    if (isProAccount(profile)) {
        return {
            allowed: true,
            verdict: 'pro',
            message: 'Votre abonnement Pro vous donne accès à votre avatar personnel.',
        };
    }
    if (profile.role === 'admin') {
        return {
            allowed: true,
            verdict: 'admin',
            message: 'Accès administrateur : vous voyez le parcours exactement tel que les membres Pro le vivent.',
        };
    }
    return {
        allowed: false,
        verdict: 'plan_insuffisant',
        message:
            "L'avatar personnel qui vous parle et vous guide est réservé aux membres Pro. Votre avatar reste celui défini par la plateforme.",
    };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. PHOTO
// ─────────────────────────────────────────────────────────────────────────

export const ACCEPTED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** 8 Mo : au-delà, le téléversement échoue en mobile réseau lent bien avant d'apporter de la qualité. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export interface AvatarPhotoCandidate {
    name: string;
    type: string;
    size: number;
}

export type AvatarPhotoRejectionCode = 'format' | 'poids' | 'vide';

export interface AvatarPhotoRejection {
    code: AvatarPhotoRejectionCode;
    message: string;
}

/** `null` = photo acceptée. Toute autre valeur porte le motif exact du refus. */
export function validateAvatarPhoto(file: AvatarPhotoCandidate): AvatarPhotoRejection | null {
    if (!file.size) {
        return { code: 'vide', message: 'Ce fichier est vide : choisissez une photo enregistrée sur votre appareil.' };
    }
    if (!ACCEPTED_PHOTO_MIME_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_MIME_TYPES)[number])) {
        return { code: 'format', message: 'Formats acceptés : JPEG, PNG ou WebP.' };
    }
    if (file.size > MAX_PHOTO_BYTES) {
        const mo = Math.round((file.size / (1024 * 1024)) * 10) / 10;
        return { code: 'poids', message: `Photo trop lourde (${mo} Mo) : la limite est de 8 Mo.` };
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. CONSENTEMENT
// ─────────────────────────────────────────────────────────────────────────

/**
 * Consentement de l'avatar personnel. Même esprit que la fiche de
 * l'Architecte : coché explicitement, daté, et révocable à tout moment
 * (`revokePersonalAvatar`). Rien n'est présumé accordé.
 */
export interface AvatarConsent {
    /** La photo est bien la mienne, ou j'en détiens les droits. */
    ownsImage: boolean;
    /** J'autorise cet avatar à prendre la parole et à me guider dans l'application. */
    allowsVoiceGuidance: boolean;
    /** J'autorise l'affichage de mon visage à la place de l'avatar de la plateforme. */
    allowsDisplay: boolean;
    /** Horodatage ISO du consentement — jamais deviné, toujours celui du clic. */
    acceptedAt: string;
}

export type AvatarConsentAnswers = Omit<AvatarConsent, 'acceptedAt'>;

export interface AvatarConsentClause {
    key: keyof AvatarConsentAnswers;
    label: string;
    /** Une clause requise refusée bloque tout le parcours : pas d'avatar personnel sans elle. */
    required: boolean;
}

export const AVATAR_CONSENT_CLAUSES: readonly AvatarConsentClause[] = [
    {
        key: 'ownsImage',
        label: "Cette photo est la mienne, ou je détiens les droits nécessaires pour l'utiliser.",
        required: true,
    },
    {
        key: 'allowsDisplay',
        label: "J'autorise MokNet à afficher ce visage à la place de l'avatar défini par la plateforme.",
        required: true,
    },
    {
        key: 'allowsVoiceGuidance',
        label: "J'autorise mon avatar à prendre la parole et à me guider dans l'application.",
        required: false,
    },
] as const;

/**
 * `undefined` tant qu'une clause OBLIGATOIRE n'est pas acceptée : on ne
 * fabrique jamais un consentement partiel qui aurait l'air valide.
 */
export function buildAvatarConsent(answers: AvatarConsentAnswers, now: Date): AvatarConsent | undefined {
    const missing = AVATAR_CONSENT_CLAUSES.filter((clause) => clause.required && !answers[clause.key]);
    if (missing.length > 0) return undefined;
    return { ...answers, acceptedAt: now.toISOString() };
}

/** Récapitulatif dit AVANT l'écriture — vérifier, corriger, confirmer. */
export function buildAvatarConsentRecap(consent: AvatarConsent): string {
    const voice = consent.allowsVoiceGuidance
        ? 'il pourra vous parler et vous guider'
        : 'il restera silencieux tant que vous ne l’autoriserez pas à parler';
    return `Vous confirmez détenir les droits sur cette photo et autoriser son affichage à la place de l’avatar de la plateforme ; ${voice}. Vous pouvez révoquer ce choix à tout moment.`;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. NOM
// ─────────────────────────────────────────────────────────────────────────

const NAME_MIN = 2;
const NAME_MAX = 40;

/**
 * Nettoie les tournures de politesse comme la fiche de consentement de
 * l'Architecte le fait déjà (« Appelez-moi Preuve » → « Preuve ») : le membre
 * dicte souvent une phrase, pas un nom nu. `undefined` = pas exploitable, on
 * repose la question plutôt que d'enregistrer une phrase entière.
 */
export function parseAvatarDisplayName(raw: string): string | undefined {
    const cleaned = raw
        .replace(
            /^(appelle[- ]?moi|appelez[- ]?moi|(tu peux|vous pouvez) m'appeler|je m'appelle|mon nom est|moi c'est|c'est)\s+/i,
            '',
        )
        .replace(/\s+/g, ' ')
        .trim();
    if (cleaned.length < NAME_MIN || cleaned.length > NAME_MAX) return undefined;
    // Un nom, pas une URL ni un balisage : on refuse ce qui n'a rien à faire
    // dans un libellé affiché partout dans l'application.
    if (/[<>{}[\]|\\^~`]|https?:\/\//i.test(cleaned)) return undefined;
    return cleaned;
}

// ─────────────────────────────────────────────────────────────────────────
// 6. BROUILLON ET PROGRESSION
// ─────────────────────────────────────────────────────────────────────────

export interface AvatarPhotoDraft {
    /** URL exploitable : objet local pendant l'aperçu, URL publique après téléversement. */
    url: string;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
}

export interface AvatarStudioDraft {
    photo?: AvatarPhotoDraft;
    consent?: AvatarConsent;
    displayName?: string;
    persona?: PersonalAvatar;
}

/** Brouillon vierge — état de départ du parcours. */
export const emptyAvatarDraft = (): AvatarStudioDraft => ({});

/**
 * Étape réellement atteinte par le brouillon. C'est la seule source de vérité
 * de la progression : l'écran n'invente pas son propre compteur, il lit ceci.
 */
export function currentAvatarStep(draft: AvatarStudioDraft, access: AvatarStudioAccess): AvatarStudioStep {
    if (!access.allowed) return 'acces';
    if (!draft.photo) return 'photo';
    if (!draft.consent) return 'consentement';
    if (!draft.displayName) return 'nom';
    if (!draft.persona) return 'generation';
    return 'apercu';
}

/** Ce qui manque pour atteindre `step`, en clair — `null` si l'étape est ouverte. */
export function avatarStepBlocker(
    step: AvatarStudioStep,
    draft: AvatarStudioDraft,
    access: AvatarStudioAccess,
): string | null {
    if (step === 'acces') return null;
    if (!access.allowed) return access.message;
    const order = AVATAR_STUDIO_STEPS.indexOf(step);
    if (order > AVATAR_STUDIO_STEPS.indexOf('photo') && !draft.photo) {
        return 'Ajoutez d’abord votre photo.';
    }
    if (order > AVATAR_STUDIO_STEPS.indexOf('consentement') && !draft.consent) {
        return 'Le consentement est obligatoire avant d’aller plus loin.';
    }
    if (order > AVATAR_STUDIO_STEPS.indexOf('nom') && !draft.displayName) {
        return 'Indiquez le nom que votre avatar doit porter.';
    }
    if (step === 'apercu' && !draft.persona) {
        return 'Lancez la génération pour obtenir l’aperçu.';
    }
    return null;
}

/** Une étape est atteignable quand rien ne la bloque — navigation arrière comprise. */
export const isAvatarStepReachable = (
    step: AvatarStudioStep,
    draft: AvatarStudioDraft,
    access: AvatarStudioAccess,
): boolean => avatarStepBlocker(step, draft, access) === null;

// ─────────────────────────────────────────────────────────────────────────
// 7. GÉNÉRATION DE LA PERSONA
// ─────────────────────────────────────────────────────────────────────────

/**
 * Avatar personnel effectivement enregistré sur le profil. Persisté dans
 * `privacySettings` — colonne `privacy_settings` réelle, déjà écrite par
 * `GlobalContext.updateUserProfile`, exactement comme la fiche de
 * consentement de l'Architecte. Aucune migration inventée.
 */
export interface PersonalAvatar {
    photoUrl: string;
    displayName: string;
    consent: AvatarConsent;
    createdAt: string;
    /** Première phrase prononcée à l'ouverture de l'app. */
    greeting: string;
    /** Phrases de guidage prêtes à être dites ou affichées. */
    guidance: string[];
    /** `false` si le membre a refusé la clause de parole : l'avatar reste muet. */
    speaks: boolean;
}

/**
 * Résultat de la génération. Forme PLATE volontaire, comme
 * `AiCoreResult` dans `supabase/functions/ai-gateway/tools/ai_core_memory.ts` :
 * une union discriminée (`{ok:true,…} | {ok:false,…}`) ne se réduit PAS avec la
 * configuration de ce dépôt (`strictNullChecks` désactivé), et `result.error`
 * après un `if (!result.ok)` pourtant correct serait signalé en erreur.
 * Champs toujours présents ; `avatar` est renseigné si et seulement si `ok`.
 */
export interface AvatarGenerationResult {
    ok: boolean;
    avatar?: PersonalAvatar;
    /** Motif exact du refus — chaîne vide en cas de succès. */
    error: string;
}

export function buildAvatarGreeting(displayName: string): string {
    return `Bonjour, je suis ${displayName}. Je vous accompagne dans MokNet.`;
}

/**
 * Lignes de guidage réellement utilisables par l'app : elles ne promettent
 * que des écrans qui existent (fil social, messagerie, studio, paramètres).
 */
export function buildAvatarGuidance(displayName: string): string[] {
    return [
        `${displayName} vous ouvre le fil social et lit les nouveautés de votre réseau.`,
        `${displayName} vous emmène en messagerie et vous annonce les conversations non lues.`,
        `${displayName} vous guide dans le Studio pour créer une image, une vidéo ou un document.`,
        `${displayName} vous rappelle où modifier vos réglages et révoquer cet avatar.`,
    ];
}

/**
 * Assemble la persona à partir d'un brouillon COMPLET. Un brouillon
 * incomplet échoue explicitement : jamais d'avatar à moitié construit qui
 * aurait ensuite l'air valide en base.
 */
export function generatePersonalAvatar(
    draft: AvatarStudioDraft,
    access: AvatarStudioAccess,
    now: Date,
): AvatarGenerationResult {
    if (!access.allowed) return { ok: false, error: access.message };

    const photoUrl = realAvatarUrl(draft.photo?.url);
    if (!photoUrl) {
        return { ok: false, error: 'Aucune photo exploitable : reprenez à l’étape « Votre photo ».' };
    }
    if (!draft.consent) {
        return { ok: false, error: 'Consentement manquant : il est obligatoire avant toute génération.' };
    }
    if (!draft.consent.ownsImage || !draft.consent.allowsDisplay) {
        return { ok: false, error: 'Consentement incomplet : les clauses obligatoires doivent être acceptées.' };
    }
    const displayName = draft.displayName ? parseAvatarDisplayName(draft.displayName) : undefined;
    if (!displayName) {
        return { ok: false, error: 'Nom manquant ou non exploitable : indiquez le nom que votre avatar doit porter.' };
    }

    return {
        ok: true,
        error: '',
        avatar: {
            photoUrl,
            displayName,
            consent: draft.consent,
            createdAt: now.toISOString(),
            greeting: buildAvatarGreeting(displayName),
            guidance: buildAvatarGuidance(displayName),
            speaks: draft.consent.allowsVoiceGuidance,
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────
// 8. AVATAR PAR DÉFAUT DE LA PLATEFORME (ADMIN-GÉNÉRAL)
// ─────────────────────────────────────────────────────────────────────────

/** Réglage tenu par l'Admin-Général et appliqué à tout nouveau compte. */
export interface DefaultAvatarPolicy {
    /** Vide = aucun avatar imposé : les nouveaux comptes retombent sur leurs initiales. */
    photoUrl: string;
    label: string;
    updatedAt: string;
    updatedBy: string;
}

export type DefaultAvatarRejectionCode = 'placeholder' | 'protocole' | 'vide';

export interface DefaultAvatarRejection {
    code: DefaultAvatarRejectionCode;
    message: string;
}

/**
 * Contrôle de l'URL saisie par l'Admin-Général. `null` = acceptée.
 *
 * Le cliché Unsplash historique est explicitement refusé : c'est le visage
 * d'un inconnu, et le reste de l'app le traite déjà comme « avatar absent »
 * (`isStockPlaceholderAvatar`). L'imposer comme défaut officiel produirait un
 * avatar que la messagerie effacerait aussitôt au profit des initiales.
 */
export function validateDefaultAvatarUrl(rawUrl: string): DefaultAvatarRejection | null {
    const url = rawUrl.trim();
    if (!url) {
        return { code: 'vide', message: 'Indiquez l’adresse de la photo, ou laissez vide pour n’imposer aucun avatar.' };
    }
    if (isStockPlaceholderAvatar(url)) {
        return {
            code: 'placeholder',
            message:
                'Cette photo est le cliché de banque d’images hérité : l’application la traite déjà comme « avatar absent ». Choisissez une image de la plateforme.',
        };
    }
    if (!/^(https:\/\/|\/)/.test(url)) {
        return {
            code: 'protocole',
            message: 'Adresse invalide : utilisez une URL https:// ou un chemin interne commençant par « / ».',
        };
    }
    return null;
}

/**
 * Avatar reçu par un compte qui vient d'être créé. `''` quand aucun défaut
 * n'est défini — l'app affiche alors les initiales, jamais le cliché hérité.
 */
export function resolveNewAccountAvatarUrl(policy?: DefaultAvatarPolicy | null): string {
    const url = realAvatarUrl(policy?.photoUrl);
    return url ?? '';
}

// ─────────────────────────────────────────────────────────────────────────
// 9. AVATAR RÉELLEMENT AFFICHÉ
// ─────────────────────────────────────────────────────────────────────────

export type ActiveAvatarSource = 'personnel' | 'photo_profil' | 'defaut_plateforme' | 'initiales';

export interface ActiveAvatar {
    source: ActiveAvatarSource;
    /** `undefined` = aucune image exploitable, l'app rend les initiales. */
    photoUrl?: string;
    displayName: string;
    /** Seul l'avatar personnel consenti prend la parole ; le défaut plateforme est muet. */
    speaks: boolean;
    greeting?: string;
}

/**
 * Ordre de priorité — la règle centrale du module :
 * avatar personnel Pro → photo de profil du membre → défaut Admin-Général →
 * initiales. Le cliché de banque d'images n'est jamais une réponse.
 */
export function resolveActiveAvatar(
    profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'privacySettings'>,
    policy?: DefaultAvatarPolicy | null,
): ActiveAvatar {
    const displayName = profile.name?.trim() || 'Membre';
    const personal = profile.privacySettings?.avatarStudio;

    if (personal && realAvatarUrl(personal.photoUrl)) {
        return {
            source: 'personnel',
            photoUrl: realAvatarUrl(personal.photoUrl),
            displayName: personal.displayName || displayName,
            speaks: personal.speaks,
            greeting: personal.greeting,
        };
    }

    const ownPhoto = realAvatarUrl(profile.avatarUrl);
    const fallback = realAvatarUrl(policy?.photoUrl);

    if (ownPhoto) {
        // Un nouveau compte REÇOIT l'avatar par défaut comme sien
        // (`resolveNewAccountAvatarUrl`) : la seule façon de distinguer
        // ensuite « photo choisie par le membre » de « avatar hérité de la
        // plateforme » est de comparer à la politique EN VIGUEUR. Sans cela,
        // l'écran annonce « votre photo de profil » à quelqu'un qui n'a jamais
        // rien choisi. La comparaison est faite à chaque lecture, donc un
        // changement d'avatar par l'Admin-Général se reflète immédiatement.
        const source: ActiveAvatarSource = ownPhoto === fallback ? 'defaut_plateforme' : 'photo_profil';
        return { source, photoUrl: ownPhoto, displayName, speaks: false };
    }

    if (fallback) {
        return { source: 'defaut_plateforme', photoUrl: fallback, displayName, speaks: false };
    }

    return { source: 'initiales', displayName, speaks: false };
}

/**
 * Révocation : l'avatar personnel disparaît et le membre retombe sur le
 * défaut de la plateforme. On renvoie les modifications à appliquer au profil
 * — l'écriture reste à l'appelant, comme partout dans ce module.
 */
export function revokePersonalAvatar(
    profile: Pick<UserProfile, 'privacySettings'>,
    policy?: DefaultAvatarPolicy | null,
): { privacySettings: UserProfile['privacySettings']; avatarUrl: string } {
    const { avatarStudio: _removed, ...keptSettings } = profile.privacySettings;
    return {
        privacySettings: keptSettings as UserProfile['privacySettings'],
        avatarUrl: resolveNewAccountAvatarUrl(policy),
    };
}
