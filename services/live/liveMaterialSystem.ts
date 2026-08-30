/**
 * Système verre/eau/lumière du LIVE (LOOP 07/14, univers n°9 Glassmorphism
 * Crystal Water — prompts 1/7 et 3/7). Source unique de vérité pour les
 * paramètres réutilisables (transparence, flou, bordure, reflet, animation
 * de "liquide") — un système, pas des effets CSS dispersés composant par
 * composant. Les classes CSS (.glass-crystal, .glass-crystal-surface,
 * animate-water-*) sont définies dans index.html (même convention que les
 * autres animations de ce projet — voir tailwind.config).
 *
 * Les 7 états ci-dessous sont ceux du prompt 3/7 (comportement du liquide) —
 * la grammaire complète à 10 états (avatar, prompt 5/7) réutilisera ce même
 * système au LOOP 10/14, pas un second système parallèle.
 */

export type LiveMaterialState =
    | 'idle'        // Repos — quasi immobile.
    | 'interaction' // Interaction utilisateur — légère ondulation.
    | 'voice'       // Commande vocale — onde lumineuse.
    | 'reflecting'  // Réflexion (IA qui traite) — mouvements internes subtils.
    | 'responding'  // Réponse — stabilisation.
    | 'success'     // Succès — impulsion positive.
    | 'error';      // Erreur — variation discrète, jamais agressive.

/** Classe d'animation Tailwind associée à chaque état — jamais deux effets pour un même état. */
export const LIVE_MATERIAL_ANIMATION: Record<LiveMaterialState, string> = {
    idle: 'animate-water-idle',
    interaction: 'animate-water-ripple',
    voice: 'animate-water-wave',
    reflecting: 'animate-water-reflect',
    responding: '',
    success: 'animate-water-success',
    error: 'animate-water-error',
};

import type { LiveVisualUniverse } from '../../types';

/**
 * Cinq univers visuels (prompt 3/7, LOOP 08/14) — métadonnées d'affichage
 * pour le sélecteur (Avancé, hôte uniquement). Le rendu réel de chaque
 * univers est porté par des variables CSS définies dans index.html
 * (`[data-live-universe="..."] { --glass-*: ... }`), appliquées via
 * l'attribut `data-live-universe` posé sur le conteneur racine du LIVE —
 * .glass-crystal/.glass-crystal-surface restent les seules classes, ce
 * n'est jamais une deuxième famille de classes par univers.
 */
export const LIVE_VISUAL_UNIVERSES: { id: LiveVisualUniverse; label: string; description: string }[] = [
    { id: 'crystal', label: 'Cristal (référence)', description: 'Glassmorphism Crystal Water — verre et eau, la référence du LIVE.' },
    { id: 'futuristic_blue', label: 'Futuriste Bleu', description: 'Bleu électrique, contrastes nets, sensation de vitesse.' },
    { id: 'natural_fresh', label: 'Naturel & Frais', description: 'Vert/émeraude doux, lumière naturelle.' },
    { id: 'solaire_chaud', label: 'Solaire & Chaud', description: 'Ambre doré, chaleur de fin de journée.' },
    { id: 'violet_luxe', label: 'Violet Luxe', description: 'Violet profond, reflet doré, sensation premium.' },
    { id: 'deep_ocean', label: 'Océan Profond', description: 'Bleu-sarcelle sombre, profondeur, calme.' },
    { id: 'rose_doux', label: 'Rose Doux', description: 'Rose poudré, douceur et légèreté — le verre le plus clair.' },
];

export type GlassSurfaceVariant = 'primary' | 'surface';

/** .glass-crystal (chrome principal : header, dock) vs .glass-crystal-surface (panneaux secondaires : sidebar, tuiles). */
export function glassSurfaceClass(variant: GlassSurfaceVariant = 'primary'): string {
    return variant === 'primary' ? 'glass-crystal' : 'glass-crystal-surface';
}

/** Combine la surface de verre et l'animation d'état en une seule chaîne de classes. */
export function liveMaterialClass(state: LiveMaterialState, variant: GlassSurfaceVariant = 'primary'): string {
    const animation = LIVE_MATERIAL_ANIMATION[state];
    return animation ? `${glassSurfaceClass(variant)} ${animation}` : glassSurfaceClass(variant);
}

/**
 * Grammaire d'états de l'avatar IA (LOOP 10/14, prompt 5/7) — étend le même
 * système verre/eau/lumière plutôt que d'en construire un second. 6 des 10
 * états réutilisent directement une animation du LOOP 07/14 (repos/écoute/
 * réflexion/réponse/succès/erreur) ; 4 sont propres à l'avatar (vision
 * active/compréhension/action/incertitude) — voir index.html pour leurs
 * keyframes (avatar-vision/avatar-comprehension/avatar-action/
 * avatar-uncertainty). L'avatar n'est jamais présenté avec plus de
 * certitude que ce qu'il a réellement (état "incertitude" dédié — prompt 5/7).
 */
export type AvatarGrammarState =
    | 'repos'          // Écran par défaut, immobile.
    | 'ecoute'         // Commande vocale en cours de capture.
    | 'vision_active'  // Analyse visuelle en cours (branché au LOOP 11/14).
    | 'comprehension'  // Traite une réponse de clarification.
    | 'reflexion'      // Interprète une commande fraîche (appel LLM en cours).
    | 'reponse'        // Parle une confirmation.
    | 'action'         // Exécute réellement une action (impulsion brève).
    | 'succes'         // Action terminée avec succès.
    | 'incertitude'    // Commande non comprise / information manquante — jamais présenté comme sûr à tort.
    | 'erreur';        // Action refusée ou échouée.

export const AVATAR_GRAMMAR_ANIMATION: Record<AvatarGrammarState, string> = {
    repos: 'animate-water-idle',
    ecoute: 'animate-water-wave',
    vision_active: 'animate-avatar-vision',
    comprehension: 'animate-avatar-comprehension',
    reflexion: 'animate-water-reflect',
    reponse: '',
    action: 'animate-avatar-action',
    succes: 'animate-water-success',
    incertitude: 'animate-avatar-uncertainty',
    erreur: 'animate-water-error',
};

/** Couleur du halo par état — "la lumière comme langage d'état" (prompt 3/7), jamais deux états de la même teinte. */
export const AVATAR_GRAMMAR_COLOR: Record<AvatarGrammarState, string> = {
    repos: 'rgba(232, 251, 255, 0.25)',
    ecoute: 'rgba(143, 227, 255, 0.6)',
    vision_active: 'rgba(217, 143, 255, 0.6)',
    comprehension: 'rgba(255, 196, 110, 0.55)',
    reflexion: 'rgba(129, 140, 255, 0.5)',
    reponse: 'rgba(255, 255, 255, 0.6)',
    action: 'rgba(110, 255, 180, 0.6)',
    succes: 'rgba(143, 227, 255, 0.7)',
    incertitude: 'rgba(200, 200, 190, 0.4)',
    erreur: 'rgba(255, 120, 120, 0.6)',
};

/** Halo circulaire (voir .avatar-halo dans index.html) + son animation/couleur pour un état donné — à poser autour d'Avatar3D. */
export function avatarHaloProps(state: AvatarGrammarState): { className: string; style: Record<string, string> } {
    const animation = AVATAR_GRAMMAR_ANIMATION[state];
    return {
        className: `avatar-halo${animation ? ` ${animation}` : ''}`,
        style: { '--halo-color': AVATAR_GRAMMAR_COLOR[state] },
    };
}

/**
 * Onde d'appui (direction artistique Studio Live, 30/08/2026) — « quand on
 * appuie sur un élément, il réagit comme une matière fluide : une onde
 * subtile qui se propage, comme une goutte qui touche une surface d'eau
 * calme ». Crée un point d'onde éphémère (.water-ripple-dot, teinté par
 * --water-accent de l'univers courant) aux coordonnées de l'appui, retiré
 * du DOM à la fin de son animation. Décoratif uniquement : jamais de logique
 * métier ici, et no-op complet si l'utilisateur préfère réduire le mouvement
 * (prefers-reduced-motion) — la matière respire, elle n'impose rien.
 */
export function spawnWaterRipple(event: { clientX: number; clientY: number }, host: HTMLElement | null): void {
    if (!host) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = host.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'water-ripple-dot';
    dot.style.left = `${event.clientX - rect.left}px`;
    dot.style.top = `${event.clientY - rect.top}px`;
    host.appendChild(dot);
    // Filet de sécurité si animationend ne se déclenche pas (onglet en arrière-plan).
    const remove = () => dot.remove();
    dot.addEventListener('animationend', remove, { once: true });
    window.setTimeout(remove, 900);
}
