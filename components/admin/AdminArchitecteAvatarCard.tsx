import React, { useState } from 'react';
import { Check, Film, ImageOff, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { ELEVENLABS_CURATED_VOICES } from '../../services/voiceEngine';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_PRESENCE_LEVEL,
    DEFAULT_ARCHITECTE_AVATAR,
    clampMouthAnchor,
    needsSyntheticMediaNotice,
    validateArchitectePhotoUrl,
    type ArchitecteAvatarConfig,
} from '../../services/architecte/architecteAvatar';
import { LIP_SYNC_LEVEL_LABEL } from '../../services/architecte/lipSync';
import { clampPortraitRig } from '../../services/architecte/livingAvatar';
import { ArchitecteAvatar } from '../architecte/ArchitecteAvatar';
import {
    ARCHITECTE_PRESENTATION,
    ARCHITECTE_SEQUENCES,
    architecteSequencePlayer,
    formatSequenceDuration,
} from '../../services/architecte/sequences';

/**
 * AVATAR DE L'ARCHITECTE — console de l'Admin-Général.
 *
 * Les quatre réglages demandés par la Direction : changer l'avatar, remettre
 * l'avatar par défaut, activer ou désactiver les animations, régler la voix.
 * S'y ajoute l'ancre de bouche, sans laquelle la synchro labiale ne peut pas
 * fonctionner sur une PHOTO (le code ne sait pas où est une bouche).
 *
 * L'aperçu est le VRAI composant, pas une vignette : ce que la Direction voit
 * ici est exactement ce que porte la barre de l'Architecte.
 */

export interface AdminArchitecteAvatarCardProps {
    value: ArchitecteAvatarConfig;
    adminName: string;
    onChange: (next: ArchitecteAvatarConfig) => void;
}

export const AdminArchitecteAvatarCard: React.FC<AdminArchitecteAvatarCardProps> = ({
    value,
    adminName,
    onChange,
}) => {
    const [draft, setDraft] = useState<ArchitecteAvatarConfig>(value);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    // Aperçu animé : niveau de voix simulé PAR LA DIRECTION avec le curseur,
    // clairement étiqueté comme tel. Aucun son n'est produit ici.
    const [demoLevel, setDemoLevel] = useState(0);

    const stamp = (next: ArchitecteAvatarConfig): ArchitecteAvatarConfig => ({
        ...next,
        updatedAt: new Date().toISOString(),
        updatedBy: adminName,
    });

    const commit = (next: ArchitecteAvatarConfig) => {
        setDraft(next);
        onChange(stamp(next));
        setSaved(true);
    };

    const applyPhoto = () => {
        setSaved(false);
        const url = draft.photoUrl.trim();
        if (!url) {
            setError('Champ vide : utilisez « Remettre l’avatar par défaut ».');
            return;
        }
        const rejection = validateArchitectePhotoUrl(url);
        if (rejection) {
            setError(rejection.message);
            return;
        }
        setError(null);
        commit({ ...draft, photoUrl: url });
    };

    const resetDefault = () => {
        setError(null);
        setDemoLevel(0);
        commit({ ...DEFAULT_ARCHITECTE_AVATAR });
        setDraft({ ...DEFAULT_ARCHITECTE_AVATAR });
    };

    return (
        <section
            aria-labelledby="admin-architecte-avatar-title"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-cyan-600" size={20} />
                <h3 id="admin-architecte-avatar-title" className="text-base font-bold text-slate-900">
                    Avatar vivant de l’Architecte
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                    Présence {ARCHITECTE_PRESENCE_LEVEL}
                </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
                {ARCHITECTE_DISCLOSURE}. Présence légère et vocale : visage animé et bouche synchronisée sur la voix,
                plus la séquence vidéo pré-rendue validée par la Direction le 5 septembre 2026 (modèle HeyGen, niveau P3a).
                L’avatar vidéo temps réel et l’avatar génératif ne sont pas livrés.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
                {/* Aperçu réel — le composant lui-même. */}
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[#0f172a]">
                    <ArchitecteAvatar
                        config={draft}
                        presence={demoLevel > 0.02 ? 'speaking' : 'rest'}
                        ttsEngine="elevenlabs"
                        outputLevel={demoLevel}
                        size={96}
                        actionLabel="Aperçu"
                        sequence={ARCHITECTE_PRESENTATION}
                        sequenceSlot="admin-preview"
                    />
                    <label htmlFor="architecte-demo-level" className="text-[10px] font-bold uppercase tracking-wide text-cyan-300">
                        Simuler la voix
                    </label>
                    <input
                        id="architecte-demo-level"
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(demoLevel * 100)}
                        onChange={(e) => setDemoLevel(Number(e.target.value) / 100)}
                        className="w-32"
                    />
                    <p className="text-[10px] text-slate-400 text-center max-w-[9rem]">
                        L’aperçu respire et cligne en direct. Le curseur simule la voix ; aucun son n’est émis ici.
                    </p>
                </div>

                <div className="space-y-5">
                    {/* 1. CHANGER L'AVATAR */}
                    <div>
                        <label htmlFor="architecte-photo" className="block text-xs font-bold text-slate-700 mb-1.5">
                            Changer l’avatar — adresse de la photo
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="architecte-photo"
                                type="text"
                                value={draft.photoUrl}
                                onChange={(e) => {
                                    setDraft({ ...draft, photoUrl: e.target.value });
                                    setError(null);
                                    setSaved(false);
                                }}
                                placeholder="https://… ou /architecte/reference.jpg"
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <button
                                type="button"
                                onClick={applyPhoto}
                                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                Appliquer
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Vide = visage dessiné par l’application. Vous ne pouvez déposer que votre propre image ou une
                            image dont vous détenez les droits ; une photo affiche automatiquement la pastille « média synthétique ».
                        </p>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5"
                        >
                            <ImageOff size={15} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </p>
                    )}

                    {/* Ancre de bouche — seulement utile sur une photo. */}
                    {needsSyntheticMediaNotice(draft) && (
                        <fieldset className="border border-slate-200 rounded-xl p-3.5">
                            <legend className="text-[11px] font-bold text-slate-600 px-1">
                                Calage du visage sur la photo
                            </legend>
                            <p className="text-[11px] text-slate-400 mb-3">
                                Indispensable pour animer une nouvelle photo : le code ne peut pas deviner où sont les
                                yeux et la mâchoire d’un visage qu’il n’a jamais vu.
                            </p>
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {([
                                    ['eyeLinePercent', 'Ligne des yeux'],
                                    ['eyeBandPercent', 'Hauteur des yeux'],
                                    ['jawLinePercent', 'Ligne de mâchoire'],
                                    ['jawTravelPercent', 'Ouverture mâchoire'],
                                    ['chinLinePercent', 'Bas du menton'],
                                    ['eyeLeftXPercent', 'Œil gauche (horizontale)'],
                                    ['eyeRightXPercent', 'Œil droit (horizontale)'],
                                    ['eyeWidthPercent', 'Largeur d’un œil'],
                                ] as const).map(([key, label]) => (
                                    <label key={key} className="text-[11px] text-slate-500">
                                        {label}
                                        <input
                                            type="number"
                                            step="0.5"
                                            aria-label={label}
                                            value={draft.rig[key]}
                                            onChange={(e) =>
                                                setDraft({
                                                    ...draft,
                                                    rig: clampPortraitRig({ ...draft.rig, [key]: Number(e.target.value) }),
                                                })
                                            }
                                            className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                                        />
                                    </label>
                                ))}
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 mb-2">Position de la bouche</p>
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    ['xPercent', 'Horizontale'],
                                    ['yPercent', 'Verticale'],
                                    ['widthPercent', 'Largeur'],
                                ] as const).map(([key, label]) => (
                                    <label key={key} className="text-[11px] text-slate-500">
                                        {label}
                                        <input
                                            type="number"
                                            aria-label={label}
                                            value={draft.mouthAnchor[key]}
                                            onChange={(e) =>
                                                setDraft({
                                                    ...draft,
                                                    mouthAnchor: clampMouthAnchor({
                                                        ...draft.mouthAnchor,
                                                        [key]: Number(e.target.value),
                                                    }),
                                                })
                                            }
                                            className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                                        />
                                    </label>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => commit(draft)}
                                className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold transition"
                            >
                                Enregistrer la position
                            </button>
                        </fieldset>
                    )}

                    {/* 2. ANIMATIONS + SYNCHRO LABIALE */}
                    <div className="space-y-2.5">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-700 font-medium">Animations de l’avatar</span>
                            <input
                                type="checkbox"
                                aria-label="Animations de l’avatar"
                                checked={draft.animationsEnabled}
                                onChange={(e) => commit({ ...draft, animationsEnabled: e.target.checked })}
                                className="w-4 h-4 text-cyan-600 rounded"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-700 font-medium">Synchro labiale pendant la parole</span>
                            <input
                                type="checkbox"
                                aria-label="Synchro labiale pendant la parole"
                                checked={draft.lipSyncEnabled}
                                onChange={(e) => commit({ ...draft, lipSyncEnabled: e.target.checked })}
                                className="w-4 h-4 text-cyan-600 rounded"
                            />
                        </label>
                        <p className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                            <Mic size={13} className="flex-shrink-0 mt-0.5" />
                            {LIP_SYNC_LEVEL_LABEL.visemes_alignes}
                            <br />
                            {LIP_SYNC_LEVEL_LABEL.amplitude_reelle}
                            <br />
                            {LIP_SYNC_LEVEL_LABEL.rythme_des_mots}
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Un appareil réglé sur « réduire les animations » reste immobile même si ces cases sont cochées.
                        </p>
                    </div>

                    {/* 2 bis. SÉQUENCES VIDÉO VALIDÉES (P3a) — le modèle de la Direction */}
                    <div className="space-y-2.5" data-testid="architecte-sequences">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-700 font-medium">Séquence vidéo validée (présentation)</span>
                            <input
                                type="checkbox"
                                aria-label="Séquence vidéo validée (présentation)"
                                checked={draft.videoSequencesEnabled !== false}
                                onChange={(e) => commit({ ...draft, videoSequencesEnabled: e.target.checked })}
                                className="w-4 h-4 text-cyan-600 rounded"
                            />
                        </label>
                        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50">
                            {ARCHITECTE_SEQUENCES.map((sequence) => (
                                <li key={sequence.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{sequence.title}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {formatSequenceDuration(sequence.durationMs)} · HeyGen, expressivité{' '}
                                            {sequence.model.settings.expressiveness === 'medium' ? 'moyenne' : sequence.model.settings.expressiveness} ·
                                            validée le {sequence.validatedAt} par {sequence.validatedBy}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => architecteSequencePlayer.play(sequence.key, 'admin-preview')}
                                        disabled={draft.videoSequencesEnabled === false}
                                        className="flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-cyan-800 hover:bg-cyan-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                        aria-label={`Prévisualiser : ${sequence.title}`}
                                    >
                                        <Film size={13} /> Prévisualiser
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className="text-[11px] text-slate-400">
                            La vidéo se joue dans l’aperçu ci-contre, par-dessus le portrait vivant ; le rig 2D reprend dès la fin ou en cas
                            d’échec. Une nouvelle séquence se produit avec la méthode capitalisée dans Vision Smart AI Core (playbook 16), puis
                            se livre avec l’application après validation.
                        </p>
                    </div>

                    {/* 3. VOIX */}
                    <div>
                        <label htmlFor="architecte-voice" className="block text-xs font-bold text-slate-700 mb-1.5">
                            <Volume2 size={13} className="inline mr-1" />
                            Régler la voix
                        </label>
                        <select
                            id="architecte-voice"
                            value={draft.voiceKey}
                            onChange={(e) => commit({ ...draft, voiceKey: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="">Voix attitrée de l’Architecte (par défaut)</option>
                            {Object.entries(ELEVENLABS_CURATED_VOICES).map(([key, voice]) => (
                                <option key={key} value={key}>
                                    {voice.name} — {voice.preview}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Voix de synthèse du catalogue. La voix HD vient de la chaîne vocale de l’Espace IA (fournisseur
                            classé en tête, relais automatique vers le suivant) ; si aucun fournisseur HD ne répond,
                            l’Architecte parle avec la voix du navigateur et la bouche suit le rythme des mots.
                        </p>
                    </div>

                    {/* 4. REMETTRE PAR DÉFAUT */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                            type="button"
                            onClick={resetDefault}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                            <RotateCcw size={14} />
                            Remettre l’avatar par défaut
                        </button>
                        {saved && (
                            <span role="status" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <Check size={15} /> Réglage enregistré
                            </span>
                        )}
                    </div>

                    {value.updatedAt && (
                        <p className="text-[11px] text-slate-400">
                            Dernière modification : {new Date(value.updatedAt).toLocaleString('fr-FR')}
                            {value.updatedBy ? ` — ${value.updatedBy}` : ''}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};
