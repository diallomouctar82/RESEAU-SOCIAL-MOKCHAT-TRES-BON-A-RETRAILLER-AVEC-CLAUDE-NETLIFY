// Lecture du dossier de la personne connectée.
//
// GARDE-FOU STRUCTUREL : toutes les requêtes passent par `ctx.userClient`,
// c'est-à-dire le client Supabase portant le JWT de la personne. Les politiques
// RLS de chaque table décident donc de ce qui est lisible — un expert ne peut
// jamais voir le dossier de quelqu'un d'autre, ni un champ protégé, même si le
// modèle le demandait explicitement. Le respect des rôles n'est pas une
// promesse du code : il est appliqué par la base.

import { ToolExecutionContext, ToolResult } from './types.ts';

type Volet = 'profil' | 'dossiers' | 'formations' | 'carriere' | 'tout';

export async function executeGetUserContext(
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
): Promise<ToolResult> {
    const volet = (typeof args.volet === 'string' ? args.volet : 'tout') as Volet;
    const veut = (v: Volet) => volet === 'tout' || volet === v;

    const sections: string[] = [];

    if (veut('profil')) {
        const { data } = await ctx.userClient
            .from('profiles')
            .select('name, title, country, city, level, xp, interests')
            .eq('id', ctx.userId)
            .maybeSingle();
        sections.push(
            data
                ? `PROFIL\n- Nom : ${data.name ?? 'non renseigné'}\n- Intitulé : ${data.title ?? 'non renseigné'}\n- Pays : ${data.country ?? 'non renseigné'}\n- Ville : ${data.city ?? 'non renseignée'}\n- Centres d'intérêt : ${(data.interests ?? []).join(', ') || 'non renseignés'}`
                : 'PROFIL\n- Aucun profil accessible.',
        );
    }

    if (veut('dossiers')) {
        const { data } = await ctx.userClient
            .from('dossiers')
            .select('title, status, category, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
        sections.push(
            data && data.length
                ? `DOSSIERS DE VIE (${data.length})\n` +
                  data.map((d) => `- ${d.title} — statut : ${d.status ?? 'non précisé'}${d.category ? ` (${d.category})` : ''}`).join('\n')
                : "DOSSIERS DE VIE\n- Aucun dossier ouvert pour l'instant.",
        );
    }

    if (veut('formations')) {
        const { data } = await ctx.userClient
            .from('enrollments')
            .select('status, progress, courses(title)')
            .order('created_at', { ascending: false })
            .limit(10);
        sections.push(
            data && data.length
                ? `FORMATIONS (${data.length})\n` +
                  data.map((e: Record<string, unknown>) => {
                      const cours = (e.courses as { title?: string } | null)?.title ?? 'Formation';
                      return `- ${cours} — ${e.status ?? 'en cours'}${e.progress != null ? `, progression ${e.progress}%` : ''}`;
                  }).join('\n')
                : 'FORMATIONS\n- Aucune formation suivie pour l\'instant.',
        );
    }

    if (veut('carriere')) {
        const { data } = await ctx.userClient
            .from('career_goals')
            .select('title, target_role, target_country, status')
            .order('created_at', { ascending: false })
            .limit(5);
        sections.push(
            data && data.length
                ? `OBJECTIFS DE CARRIÈRE (${data.length})\n` +
                  data.map((g) => `- ${g.title ?? g.target_role ?? 'Objectif'}${g.target_country ? ` — ${g.target_country}` : ''} (${g.status ?? 'en cours'})`).join('\n')
                : 'OBJECTIFS DE CARRIÈRE\n- Aucun objectif défini pour l\'instant.',
        );
    }

    if (!sections.length) {
        return { ok: false, content: `Volet « ${volet} » inconnu. Volets disponibles : profil, dossiers, formations, carriere, tout.` };
    }

    return {
        ok: true,
        content:
            `DOSSIER DE LA PERSONNE CONNECTÉE (lecture limitée à ses propres droits) :\n\n${sections.join('\n\n')}\n\n` +
            `Utiliser ces informations pour personnaliser la réponse sans les redemander. ` +
            `Une rubrique vide signifie que la personne n'a rien enregistré : le lui proposer plutôt que de le supposer.`,
    };
}
