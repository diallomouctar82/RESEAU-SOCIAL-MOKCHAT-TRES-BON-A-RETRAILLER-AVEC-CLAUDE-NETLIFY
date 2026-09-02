import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AU-7 — rapport de diagnostic d'appel : journal borné, épuré (jetons), daté,
 * envoyé au serveur en cours d'appel et à la fin avec son issue. Le client
 * Supabase est doublé : ce test vérifie CE QUI PART, jamais un vrai réseau.
 */

const rig = vi.hoisted(() => ({
    configured: true,
    userId: 'u-1' as string | null,
    upserts: [] as Array<{ payload: any; onConflict: string | undefined }>,
    failNext: false,
}));

vi.mock('../services/supabaseClient', () => ({
    get isSupabaseConfigured() { return rig.configured; },
    supabase: {
        auth: { getUser: async () => ({ data: { user: rig.userId ? { id: rig.userId } : null } }) },
        from: (table: string) => ({
            upsert: (payload: any, options?: { onConflict?: string }) => {
                rig.upserts.push({ payload: { ...payload, table }, onConflict: options?.onConflict });
                return {
                    select: () => ({
                        maybeSingle: async () => (rig.failNext ? (rig.failNext = false, { data: null, error: { message: 'refusé' } }) : { data: { id: 'row-1' }, error: null }),
                    }),
                };
            },
        }),
    },
}));

const mod = await import('../services/calls/callDiagnostics');
const {
    __resetCallDiagnosticsForTests, CALL_DIAGNOSTICS_MAX_BYTES, CALL_DIAGNOSTICS_MAX_EVENTS, callDiagnosticsRowId, flushCallDiagnostics, isCallDiagnosticsActive,
    peekCallDiagnostics, recordCallEvent, scrubDiagnosticText, startCallDiagnostics, stopCallDiagnostics, trimDiagnosticEvents,
} = mod;

beforeEach(() => {
    vi.useFakeTimers();
    rig.configured = true; rig.userId = 'u-1'; rig.upserts.length = 0; rig.failNext = false;
    __resetCallDiagnosticsForTests();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { __resetCallDiagnosticsForTests(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('épuration — jamais un jeton dans un rapport', () => {
    it('masque access_token, Bearer et tout JWT, garde le reste', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMiLCJleHAiOjF9.abcdefghijklmnopqrstuvwxyz012345';
        expect(scrubDiagnosticText(`connecting to wss://live.moknet.net/rtc?access_token=${jwt}&protocol=17`)).toBe('connecting to wss://live.moknet.net/rtc?[jeton masqué]&protocol=17');
        expect(scrubDiagnosticText(`Authorization: Bearer ${jwt}`)).toBe('Authorization: [jeton masqué]');
        expect(scrubDiagnosticText(`jeton nu ${jwt} fin`)).toBe('jeton nu [jeton masqué] fin');
        expect(scrubDiagnosticText('ICE connected via udp relay')).toBe('ICE connected via udp relay');
    });
});

describe('journal borné — les plus anciens partent d’abord', () => {
    it('limite le nombre d’événements et les octets', () => {
        const many = Array.from({ length: CALL_DIAGNOSTICS_MAX_EVENTS + 100 }, (_, i) => ({ t: i, k: 'sdk' as const, m: `e${i}` }));
        const trimmed = trimDiagnosticEvents(many);
        expect(trimmed.length).toBe(CALL_DIAGNOSTICS_MAX_EVENTS);
        expect(trimmed[0].m).toBe('e100');
        const fat = Array.from({ length: 200 }, (_, i) => ({ t: i, k: 'sdk' as const, m: 'x'.repeat(600) }));
        const byBytes = trimDiagnosticEvents(fat);
        expect(JSON.stringify(byBytes).length).toBeLessThanOrEqual(CALL_DIAGNOSTICS_MAX_BYTES);
        expect(byBytes.length).toBeGreaterThan(0);
        expect(byBytes.at(-1)?.t).toBe(199); // le dernier mot est conservé
    });
});

describe('cycle d’un rapport', () => {
    it('sans rapport actif, rien n’est noté ; avec, les événements sont datés, épurés, et l’issue part au serveur', async () => {
        recordCallEvent('call', 'perdu dans le vide');
        expect(isCallDiagnosticsActive()).toBe(false);
        expect(peekCallDiagnostics().events).toEqual([]);

        startCallDiagnostics({ callId: 'c-1', conversationId: 'conv-1', role: 'appelé', deviceId: 'dev-1' });
        expect(isCallDiagnosticsActive()).toBe(true);
        vi.advanceTimersByTime(1200);
        recordCallEvent('sdk', 'reconnecting, reason: signal', { url: 'wss://x/rtc?access_token=eyJabc.def.ghi', n: 1n as unknown as number });
        const { events } = peekCallDiagnostics();
        expect(events[0].m).toBe('rapport démarré');
        expect(events[1]).toMatchObject({ t: 1200, k: 'sdk', m: 'reconnecting, reason: signal' });
        expect((events[1].d as any).url).toBe('wss://x/rtc?[jeton masqué]');
        expect((events[1].d as any).n).toBe(1);

        await flushCallDiagnostics();
        expect(rig.upserts.length).toBe(1);
        expect(rig.upserts[0].onConflict).toBe('user_id,call_id,device_id');
        expect(rig.upserts[0].payload).toMatchObject({ table: 'call_diagnostics', user_id: 'u-1', call_id: 'c-1', device_id: 'dev-1', role: 'appelé', outcome: 'en cours' });
        expect(callDiagnosticsRowId()).toBe('row-1');

        // Rien de neuf → pas de nouvel envoi ; envoi périodique après un nouvel événement.
        await flushCallDiagnostics();
        expect(rig.upserts.length).toBe(1);
        recordCallEvent('audio', 'envoi=ok réception=ok');
        await vi.advanceTimersByTimeAsync(15_000);
        expect(rig.upserts.length).toBe(2);

        await stopCallDiagnostics('correspondant perdu');
        expect(rig.upserts.length).toBe(3);
        expect(rig.upserts[2].payload.outcome).toBe('correspondant perdu');
        expect(rig.upserts[2].payload.events.at(-1).m).toBe('rapport terminé : correspondant perdu');
        expect(isCallDiagnosticsActive()).toBe(false);
    });

    it('un échec d’envoi ne lève jamais ; sans utilisateur ou sans Supabase, rien ne part', async () => {
        startCallDiagnostics({ callId: 'c-2', conversationId: null, role: 'appelant', deviceId: 'dev-1' });
        rig.failNext = true;
        await expect(flushCallDiagnostics()).resolves.toBeUndefined();
        expect(callDiagnosticsRowId()).toBeNull();
        await stopCallDiagnostics('terminé');

        rig.userId = null;
        startCallDiagnostics({ callId: 'c-3', conversationId: null, role: 'appelant', deviceId: 'dev-1' });
        await stopCallDiagnostics('terminé');
        rig.configured = false; rig.userId = 'u-1';
        startCallDiagnostics({ callId: 'c-4', conversationId: null, role: 'appelant', deviceId: 'dev-1' });
        await stopCallDiagnostics('terminé');
        expect(rig.upserts.filter((u) => u.payload.call_id !== 'c-2').length).toBe(0);
    });

    it('un nouvel appel remplace le précédent après l’avoir envoyé ; le même appel redémarré est ignoré', async () => {
        startCallDiagnostics({ callId: 'c-5', conversationId: null, role: 'appelant', deviceId: 'dev-1' });
        recordCallEvent('call', 'a');
        startCallDiagnostics({ callId: 'c-5', conversationId: null, role: 'appelant', deviceId: 'dev-1' });
        expect(peekCallDiagnostics().events.map((e) => e.m)).toEqual(['rapport démarré', 'a']);
        startCallDiagnostics({ callId: 'c-6', conversationId: null, role: 'appelé', deviceId: 'dev-1' });
        await vi.advanceTimersByTimeAsync(0);
        expect(peekCallDiagnostics().session?.callId).toBe('c-6');
        expect(rig.upserts.some((u) => u.payload.call_id === 'c-5' && u.payload.outcome === 'remplacé')).toBe(true);
    });
});
