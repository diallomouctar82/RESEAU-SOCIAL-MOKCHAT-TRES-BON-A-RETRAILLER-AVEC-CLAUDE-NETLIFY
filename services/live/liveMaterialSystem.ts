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
    { id: 'violet_luxe', label: 'Violet Luxe', description: 'Violet profond, reflet doré, sensation premium.' },
    { id: 'deep_ocean', label: 'Océan Profond', description: 'Bleu-sarcelle sombre, profondeur, calme.' },
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
