import React, { useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    Check,
    Lock,
    Mic,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Trash2,
    Upload,
    Volume2,
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { InitialsAvatar } from '../ui/InitialsAvatar';
import {
    AVATAR_CONSENT_CLAUSES,
    AVATAR_STUDIO_STEPS,
    AVATAR_STUDIO_STEP_LABELS,
    avatarStepBlocker,
    buildAvatarConsent,
    buildAvatarConsentRecap,
    currentAvatarStep,
    emptyAvatarDraft,
    generatePersonalAvatar,
    parseAvatarDisplayName,
    resolveActiveAvatar,
    resolveAvatarStudioAccess,
    revokePersonalAvatar,
    validateAvatarPhoto,
    type AvatarConsentAnswers,
    type AvatarStudioDraft,
    type AvatarStudioStep,
    type DefaultAvatarPolicy,
} from '../../services/studio/avatarStudio';

/**
 * STUDIO AVATAR — parcours du membre Pro.
 *
 * ACCÈS PRO → PHOTO → CONSENTEMENT → NOM → GÉNÉRATION → APERÇU.
 *
 * L'écran ne décide de rien : il lit `services/studio/avatarStudio.ts` pour
 * savoir où il en est, ce qui bloque, et ce que produit la génération. C'est
 * ce qui rend le parcours testable sans navigateur — et ce qui garantit
 * qu'aucune règle (droit d'accès, consentement obligatoire) ne peut être
 * contournée en modifiant seulement l'affichage.
 *
 * Dégradation gracieuse (règle AGENTS.md §2.3/2.4) : sans Supabase configuré,
 * le téléversement retombe sur une image encodée localement — le parcours
 * reste entièrement parcourable et l'avatar reste réellement affiché.
 */

export interface AvatarStudioProps {
    profile: UserProfile;
    /** Avatar par défaut défini par l'Admin-Général — celui que le membre porte avant personnalisation. */
    defaultAvatar: DefaultAvatarPolicy;
    /** Persistance réelle du profil ; renvoie `false` si rien n'a été enregistré. */
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
    /** Téléversement réel de la photo. `null` = indisponible, on retombe sur l'encodage local. */
    onUploadPhoto?: (file: File) => Promise<string | null>;
    /** Diction de la salutation — injectée pour rester testable sans audio. */
    onSpeak?: (text: string) => void;
}

const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('lecture impossible'));
        reader.readAsDataURL(file);
    });

export const AvatarStudio: React.FC<AvatarStudioProps> = ({
    profile,
    defaultAvatar,
    onUpdateProfile,
    onUploadPhoto,
    onSpeak,
}) => {
    const access = useMemo(() => resolveAvatarStudioAccess(profile), [profile]);
    const activeAvatar = useMemo(
        () => resolveActiveAvatar(profile, defaultAvatar),
        [profile, defaultAvatar],
    );

    const [draft, setDraft] = useState<AvatarStudioDraft>(emptyAvatarDraft);
    const [answers, setAnswers] = useState<AvatarConsentAnswers>({
        ownsImage: false,
        allowsDisplay: false,
        allowsVoiceGuidance: false,
    });
    const [nameInput, setNameInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const step = currentAvatarStep(draft, access);
    const stepIndex = AVATAR_STUDIO_STEPS.indexOf(step);

    // ── Étape PHOTO ────────────────────────────────────────────────────────
    const handleFile = async (file?: File) => {
        if (!file) return;
        setSaved(false);
        const rejection = validateAvatarPhoto({ name: file.name, type: file.type, size: file.size });
        if (rejection) {
            setError(rejection.message);
            return;
        }
        setError(null);
        setBusy(true);
        try {
            let url: string | null = null;
            if (onUploadPhoto) {
                try {
                    url = await onUploadPhoto(file);
                } catch {
                    // Réseau/stockage indisponible : on ne perd pas la photo,
                    // on bascule sur l'encodage local plutôt que d'échouer.
                    url = null;
                }
            }
            if (!url) url = await readAsDataUrl(file);
            setDraft((prev) => ({
                ...prev,
                photo: { url, fileName: file.name, sizeBytes: file.size, mimeType: file.type },
            }));
        } catch {
            setError('Impossible de lire cette photo. Réessayez avec un autre fichier.');
        } finally {
            setBusy(false);
        }
    };

    // ── Étape CONSENTEMENT ─────────────────────────────────────────────────
    const confirmConsent = () => {
        const consent = buildAvatarConsent(answers, new Date());
        if (!consent) {
            setError('Les deux premières clauses sont obligatoires : sans elles, aucun avatar personnel ne peut être créé.');
            return;
        }
        setError(null);
        setDraft((prev) => ({ ...prev, consent }));
    };

    // ── Étape NOM ──────────────────────────────────────────────────────────
    const confirmName = () => {
        const parsed = parseAvatarDisplayName(nameInput);
        if (!parsed) {
            setError('Indiquez un nom de 2 à 40 caractères, sans adresse web ni balise.');
            return;
        }
        setError(null);
        setDraft((prev) => ({ ...prev, displayName: parsed }));
    };

    // ── Étape GÉNÉRATION ───────────────────────────────────────────────────
    const generate = () => {
        const result = generatePersonalAvatar(draft, access, new Date());
        if (!result.ok) {
            setError(result.error);
            return;
        }
        setError(null);
        setDraft((prev) => ({ ...prev, persona: result.avatar }));
    };

    // ── Étape APERÇU : activation réelle ───────────────────────────────────
    const activate = async () => {
        if (!draft.persona) return;
        setBusy(true);
        setError(null);
        const ok = await onUpdateProfile({
            avatarUrl: draft.persona.photoUrl,
            privacySettings: { ...profile.privacySettings, avatarStudio: draft.persona },
        });
        setBusy(false);
        if (!ok) {
            setError("L'enregistrement n'a pas abouti. Votre avatar n'est pas encore actif — réessayez.");
            return;
        }
        setSaved(true);
    };

    const revoke = async () => {
        setBusy(true);
        setError(null);
        const ok = await onUpdateProfile(revokePersonalAvatar(profile, defaultAvatar));
        setBusy(false);
        if (!ok) {
            setError("La révocation n'a pas abouti. Votre avatar personnel est toujours actif.");
            return;
        }
        setDraft(emptyAvatarDraft());
        setAnswers({ ownsImage: false, allowsDisplay: false, allowsVoiceGuidance: false });
        setNameInput('');
        setSaved(false);
    };

    const restart = () => {
        setDraft(emptyAvatarDraft());
        setAnswers({ ownsImage: false, allowsDisplay: false, allowsVoiceGuidance: false });
        setNameInput('');
        setError(null);
        setSaved(false);
    };

    // ── ACCÈS REFUSÉ ───────────────────────────────────────────────────────
    if (!access.allowed) {
        return (
            <section aria-labelledby="avatar-studio-title" className="max-w-2xl">
                <h2 id="avatar-studio-title" className="sr-only">
                    Studio Avatar
                </h2>
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
                    <span className="inline-flex p-3 bg-white text-slate-400 rounded-2xl border border-slate-200 mb-4">
                        <Lock size={26} />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5">Avatar personnel — réservé aux membres Pro</h3>
                    <p role="status" className="text-sm text-slate-500 max-w-md mx-auto">
                        {access.message}
                    </p>

                    <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-center gap-4">
                        <InitialsAvatar
                            name={activeAvatar.displayName}
                            avatarUrl={activeAvatar.photoUrl}
                            size={56}
                            className="ring-2 ring-white"
                        />
                        <div className="text-left">
                            <p className="text-xs font-bold text-slate-700">Votre avatar actuel</p>
                            <p className="text-[11px] text-slate-400">
                                {activeAvatar.source === 'defaut_plateforme'
                                    ? 'Avatar défini par la plateforme'
                                    : activeAvatar.source === 'photo_profil'
                                      ? 'Votre photo de profil'
                                      : 'Vos initiales'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // ── PARCOURS PRO ───────────────────────────────────────────────────────
    return (
        <section aria-labelledby="avatar-studio-title" className="space-y-6">
            <div>
                <h2 id="avatar-studio-title" className="text-lg font-bold text-slate-900">
                    Votre avatar personnel
                </h2>
                <p className="text-sm text-slate-500">{access.message}</p>
            </div>

            {/* Progression — lue du service, jamais d'un compteur local. */}
            <ol className="flex flex-wrap gap-2" aria-label="Progression du parcours">
                {AVATAR_STUDIO_STEPS.map((s, index) => {
                    const done = index < stepIndex;
                    const active = s === step;
                    return (
                        <li key={s}>
                            <span
                                aria-current={active ? 'step' : undefined}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                                    active
                                        ? 'bg-brand-600 text-white border-brand-600'
                                        : done
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-white text-slate-400 border-slate-200'
                                }`}
                            >
                                {done ? <Check size={12} /> : <span>{index + 1}</span>}
                                {AVATAR_STUDIO_STEP_LABELS[s]}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {error && (
                <p
                    role="alert"
                    className="flex items-start gap-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3"
                >
                    <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
                    {error}
                </p>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-6">
                {/* ÉTAPE 2 — PHOTO */}
                {step === 'photo' && (
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Votre photo</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Elle remplacera l’avatar de la plateforme partout dans MokNet. JPEG, PNG ou WebP, 8 Mo maximum.
                        </p>
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={busy}
                            className="w-full border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-2xl p-8 text-center transition bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <span className="inline-flex w-12 h-12 bg-white text-slate-500 rounded-full items-center justify-center mb-2 border border-slate-200">
                                <Upload size={22} />
                            </span>
                            <span className="block text-sm font-semibold text-slate-700">
                                {busy ? 'Traitement en cours…' : 'Choisir une photo'}
                            </span>
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            aria-label="Choisir une photo"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                    </div>
                )}

                {/* ÉTAPE 3 — CONSENTEMENT */}
                {step === 'consentement' && (
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Votre consentement</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Rien n’est enregistré avant votre accord explicite, et vous pourrez le révoquer à tout moment.
                        </p>
                        <div className="flex items-start gap-4 mb-5">
                            <img
                                src={draft.photo?.url}
                                alt="Photo choisie"
                                className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
                            />
                            <p className="text-xs text-slate-500 pt-1">
                                {draft.photo?.fileName}
                                <br />
                                <button
                                    type="button"
                                    onClick={() => setDraft((prev) => ({ ...prev, photo: undefined }))}
                                    className="text-brand-600 font-bold hover:underline mt-1"
                                >
                                    Changer de photo
                                </button>
                            </p>
                        </div>

                        <ul className="space-y-3">
                            {AVATAR_CONSENT_CLAUSES.map((clause) => (
                                <li key={clause.key}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={answers[clause.key]}
                                            onChange={(e) =>
                                                setAnswers((prev) => ({ ...prev, [clause.key]: e.target.checked }))
                                            }
                                            className="mt-0.5 w-4 h-4 text-brand-600 rounded flex-shrink-0"
                                        />
                                        <span className="text-sm text-slate-700">
                                            {clause.label}
                                            {clause.required && (
                                                <span className="text-rose-600 font-bold"> *</span>
                                            )}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={confirmConsent}
                            className="mt-5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <ShieldCheck size={16} /> Je consens
                        </button>
                    </div>
                )}

                {/* ÉTAPE 4 — NOM */}
                {step === 'nom' && (
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Le nom de votre avatar</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            C’est ainsi qu’il se présentera quand il vous parlera et vous guidera.
                        </p>
                        <label htmlFor="avatar-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                            Nom affiché
                        </label>
                        <input
                            id="avatar-name"
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Mamadou, ou « Appelez-moi Mamadou »"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                            type="button"
                            onClick={confirmName}
                            className="mt-4 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            Valider le nom
                        </button>
                    </div>
                )}

                {/* ÉTAPE 5 — GÉNÉRATION */}
                {step === 'generation' && (
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Génération de votre avatar</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            {buildAvatarConsentRecap(draft.consent!)}
                        </p>
                        <dl className="text-sm text-slate-600 space-y-1 mb-5">
                            <div className="flex gap-2">
                                <dt className="font-bold text-slate-800">Nom :</dt>
                                <dd>{draft.displayName}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="font-bold text-slate-800">Photo :</dt>
                                <dd>{draft.photo?.fileName}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="font-bold text-slate-800">Parole :</dt>
                                <dd>{draft.consent?.allowsVoiceGuidance ? 'autorisée' : 'refusée (avatar muet)'}</dd>
                            </div>
                        </dl>
                        <button
                            type="button"
                            onClick={generate}
                            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <Sparkles size={16} /> Générer mon avatar
                        </button>
                    </div>
                )}

                {/* ÉTAPE 6 — APERÇU */}
                {step === 'apercu' && draft.persona && (
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-4">Aperçu</h3>
                        <div className="flex items-start gap-5">
                            <InitialsAvatar
                                name={draft.persona.displayName}
                                avatarUrl={draft.persona.photoUrl}
                                size={96}
                                className="ring-4 ring-brand-50"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-slate-900">{draft.persona.displayName}</p>
                                <p className="text-sm text-slate-600 italic mt-1">« {draft.persona.greeting} »</p>

                                <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                    Ce que votre avatar sait faire
                                </p>
                                <ul className="mt-1.5 space-y-1">
                                    {draft.persona.guidance.map((line) => (
                                        <li key={line} className="text-sm text-slate-600 flex gap-2">
                                            <Check size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                            {line}
                                        </li>
                                    ))}
                                </ul>

                                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                                    <Mic size={13} />
                                    {draft.persona.speaks
                                        ? 'Parole autorisée : votre avatar vous accompagne à la voix.'
                                        : 'Parole refusée : votre avatar reste muet tant que vous ne l’autorisez pas.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={activate}
                                disabled={busy}
                                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                                {busy ? 'Enregistrement…' : 'Activer cet avatar'}
                            </button>

                            {draft.persona.speaks && onSpeak && (
                                <button
                                    type="button"
                                    onClick={() => onSpeak(draft.persona!.greeting)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                >
                                    <Volume2 size={15} /> Écouter
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={restart}
                                className="px-4 py-2.5 text-slate-500 hover:text-slate-800 rounded-xl text-sm font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                <RotateCcw size={15} /> Recommencer
                            </button>

                            {saved && (
                                <span role="status" className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                                    <Check size={16} /> Avatar personnel actif
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar déjà actif : révocation, toujours accessible. */}
            {profile.privacySettings.avatarStudio && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                    <p className="text-xs text-slate-600">
                        Avatar personnel actif : <strong>{profile.privacySettings.avatarStudio.displayName}</strong>.
                        La révocation vous rend l’avatar défini par la plateforme.
                    </p>
                    <button
                        type="button"
                        onClick={revoke}
                        disabled={busy}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                    >
                        <Trash2 size={14} /> Révoquer mon avatar
                    </button>
                </div>
            )}

            {/* Ce qui bloque l'étape suivante, dit en clair plutôt que deviné. */}
            {(() => {
                const next = AVATAR_STUDIO_STEPS[stepIndex + 1] as AvatarStudioStep | undefined;
                const blocker = next ? avatarStepBlocker(next, draft, access) : null;
                return blocker ? <p className="text-[11px] text-slate-400">Étape suivante : {blocker}</p> : null;
            })()}
        </section>
    );
};
