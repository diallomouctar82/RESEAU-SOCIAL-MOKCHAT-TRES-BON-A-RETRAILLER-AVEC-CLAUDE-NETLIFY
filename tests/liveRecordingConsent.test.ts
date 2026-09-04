import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Le consentement de conservation doit ARRIVER EN BASE.
 *
 * La modale de création affiche « Enregistrement & Replay Intelligent »,
 * activé par défaut, et l'animateur peut l'éteindre. Cette valeur voyageait
 * jusqu'à `createLiveSession`… qui ne l'écrivait pas. Résultat : l'écran
 * disait que la parole était enregistrée, la base gardait `false`, rien
 * n'était conservé, et le rattrapage répondait « ce direct n'enregistre pas
 * la parole » — une phrase juste, sur un écran qui affirmait le contraire.
 *
 * C'est exactement le défaut que LP-8 existe pour supprimer : une commande
 * qui a l'air de faire quelque chose et ne fait rien. D'où un garde-fou sur
 * la CHARGE RÉELLEMENT INSÉRÉE, pas sur l'intention de l'appelant.
 */

let payloadInsere: Record<string, unknown> | null = null;

vi.mock('../services/supabaseClient', () => ({
    isSupabaseConfigured: true,
    supabase: {
        from: () => ({
            insert: (payload: Record<string, unknown>) => {
                payloadInsere = payload;
                return {
                    select: () => ({
                        single: async () => ({
                            data: { id: 'session-1', host_id: 'u-1', title: 'T', ...payload },
                            error: null,
                        }),
                    }),
                };
            },
        }),
    },
}));

const { createLiveSession } = await import('../services/live/liveSessionService');

beforeEach(() => { payloadInsere = null; });

describe('LP-7/LP-8 — le consentement de conservation arrive réellement en base', () => {
    it("l'enregistrement demandé par l'animateur est ÉCRIT, pas seulement affiché", async () => {
        await createLiveSession('u-1', 'Awa', '', { title: 'Direct', isRecordingEnabled: true });
        expect(payloadInsere).not.toBeNull();
        // La colonne doit être présente ET vraie : la présence seule ne suffit
        // pas, c'est le `true` qui décide si la parole se pose quelque part.
        expect(payloadInsere).toHaveProperty('is_recording_enabled', true);
    });

    it("l'enregistrement refusé est écrit comme refusé — jamais laissé au hasard", async () => {
        await createLiveSession('u-1', 'Awa', '', { title: 'Direct', isRecordingEnabled: false });
        expect(payloadInsere).toHaveProperty('is_recording_enabled', false);
    });

    it("un appelant qui ne dit rien ne fait RIEN conserver — le défaut sûr est maintenu", async () => {
        // LP-7 : « sans le geste de l'animateur, la parole ne se pose nulle
        // part ». Un appelant qui omet le champ ne doit pas hériter d'un
        // enregistrement silencieux.
        await createLiveSession('u-1', 'Awa', '', { title: 'Direct' });
        expect(payloadInsere).toHaveProperty('is_recording_enabled', false);
    });
});
