import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
    ensurePushSubscription,
    getPushPermissionState,
    type PushPermissionState,
    type PushSubscriptionResult,
} from '../services/push/pushService';

/**
 * ÉQUIPE P (mission VF-1) — abonnement push SILENCIEUX d'un utilisateur
 * connecté.
 *
 * Permission déjà accordée → `ensurePushSubscription` une fois par session
 * de page (l'abonnement existant est réutilisé ; la sauvegarde serveur est
 * bornée à une fois par 24 h et par endpoint dans le service). Permission
 * « default » → rien ici : la demande n'est légitime que dans un geste
 * utilisateur (bandeau `PushPermissionPrompt`).
 *
 * Écoute aussi `moknet-push-resubscribed` (posté par `public/sw.js` après un
 * `pushsubscriptionchange`) : le nouvel endpoint doit être ré-enregistré
 * côté serveur — le worker n'a pas de session Supabase pour le faire
 * lui-même.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiants déjà synchronisés pendant CETTE session de page. */
const ensuredThisSession = new Set<string>();

/** Réservé aux tests : repart d'une session de page vierge. */
export const __resetPushNotificationsForTests = (): void => {
    ensuredThisSession.clear();
};

/**
 * `userProfile.id` ne vaut un identifiant Supabase (uuid) qu'une fois le
 * profil réel chargé ; avant, c'est le profil de démonstration (`u1`). Un
 * abonnement suivi sous un id de démonstration partagerait son marqueur
 * local entre deux comptes du même appareil — on attend l'identité réelle.
 */
export const isRealUserId = (userId: string | null | undefined): userId is string =>
    typeof userId === 'string' && UUID_RE.test(userId);

export interface UsePushNotificationsResult {
    permission: PushPermissionState;
    /** Dernier résultat d'abonnement de cette session (null tant que rien n'a été tenté). */
    lastResult: PushSubscriptionResult | null;
}

export function usePushNotifications(userId: string | null): UsePushNotificationsResult {
    const [permission, setPermission] = useState<PushPermissionState>(() => getPushPermissionState());
    const [lastResult, setLastResult] = useState<PushSubscriptionResult | null>(null);
    const realUserId = isRealUserId(userId) ? userId : null;

    useEffect(() => {
        if (!realUserId || !isSupabaseConfigured) return;
        if (getPushPermissionState() !== 'granted') return;
        if (ensuredThisSession.has(realUserId)) return;
        ensuredThisSession.add(realUserId);
        let cancelled = false;
        void ensurePushSubscription(realUserId).then((result) => {
            // Un échec ne « consomme » pas la session : un prochain montage retentera.
            if (result.status === 'error') ensuredThisSession.delete(realUserId);
            if (cancelled) return;
            setLastResult(result);
            setPermission(getPushPermissionState());
        });
        return () => {
            cancelled = true;
        };
    }, [realUserId]);

    useEffect(() => {
        if (!realUserId || !isSupabaseConfigured) return;
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
        const container = navigator.serviceWorker;
        let cancelled = false;
        const onMessage = (event: MessageEvent) => {
            const data = event.data as { type?: unknown } | null;
            if (!data || data.type !== 'moknet-push-resubscribed') return;
            void ensurePushSubscription(realUserId, { force: true }).then((result) => {
                if (cancelled) return;
                setLastResult(result);
                setPermission(getPushPermissionState());
            });
        };
        container.addEventListener('message', onMessage);
        return () => {
            cancelled = true;
            container.removeEventListener('message', onMessage);
        };
    }, [realUserId]);

    return { permission, lastResult };
}
