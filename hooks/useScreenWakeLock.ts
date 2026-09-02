import { useEffect } from 'react';

/**
 * AU-7 — ÉCRAN MAINTENU ALLUMÉ pendant un appel (Screen Wake Lock API).
 *
 * Sur un téléphone, la mise en veille automatique de l'écran (30 s à 1 min
 * par défaut) suspend la page dans Safari iOS et peut geler la ligne dans
 * d'autres navigateurs : un appel web sans verrou d'écran tombe « à la
 * minute » sans autre raison. Comme toute application d'appel, l'écran reste
 * allumé tant que l'appel est actif ; le verrou est repris quand la page
 * revient au premier plan (le système le libère quand elle est masquée).
 *
 * Sans l'API (navigateur ancien, contexte non sécurisé) : rien, jamais
 * d'erreur — la fonctionnalité se dégrade en silence et le journal le dit.
 */
type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener?: (type: 'release', cb: () => void) => void };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };

export function isScreenWakeLockSupported(): boolean {
    return typeof navigator !== 'undefined' && !!(navigator as NavigatorWithWakeLock).wakeLock?.request;
}

export function useScreenWakeLock(active: boolean, onEvent?: (message: string) => void): void {
    useEffect(() => {
        if (!active) return;
        const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as NavigatorWithWakeLock | undefined;
        if (!nav?.wakeLock?.request) { onEvent?.('verrou d’écran indisponible sur ce navigateur'); return; }
        let sentinel: WakeLockSentinelLike | null = null;
        let disposed = false;
        const request = async () => {
            if (disposed || typeof document === 'undefined' || document.visibilityState !== 'visible') return;
            try {
                sentinel = await nav.wakeLock!.request('screen');
                onEvent?.('verrou d’écran acquis');
                sentinel.addEventListener?.('release', () => { onEvent?.('verrou d’écran libéré par le système'); });
            } catch (err) {
                onEvent?.(`verrou d’écran refusé : ${err instanceof Error ? err.message : String(err)}`);
            }
        };
        const onVisibility = () => { if (document.visibilityState === 'visible') void request(); };
        document.addEventListener('visibilitychange', onVisibility);
        void request();
        return () => {
            disposed = true;
            document.removeEventListener('visibilitychange', onVisibility);
            if (sentinel) { sentinel.release().catch(() => {}); sentinel = null; }
        };
        // onEvent est un journal : sa variation ne doit pas relâcher/reprendre le verrou.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);
}
