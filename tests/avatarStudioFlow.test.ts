import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../types';
import {
    AVATAR_STUDIO_STEPS,
    avatarStepBlocker,
    buildAvatarConsent,
    buildAvatarGreeting,
    currentAvatarStep,
    emptyAvatarDraft,
    generatePersonalAvatar,
    isProAccount,
    parseAvatarDisplayName,
    resolveActiveAvatar,
    resolveAvatarStudioAccess,
    resolveNewAccountAvatarUrl,
    revokePersonalAvatar,
    validateAvatarPhoto,
    validateDefaultAvatarUrl,
    type AvatarStudioDraft,
    type DefaultAvatarPolicy,
} from '../services/studio/avatarStudio';

/**
 * STUDIO AVATAR — règles métier du parcours.
 *
 * Tout ce qui DÉCIDE est ici : qui a le droit d'entrer, ce qui est accepté,
 * ce qui bloque, ce qui est réellement produit, et quel visage l'application
 * finit par afficher. L'écran ne fait que lire ces fonctions — c'est ce qui
 * rend le parcours vérifiable sans navigateur, sans clé d'API et sans base.
 */

const NOW = new Date('2026-09-04T10:30:00.000Z');
const STOCK = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop';

const profile = (over: Partial<UserProfile> = {}): UserProfile =>
    ({
        id: 'u1',
        email: 'membre@example.com',
        name: 'Aïssatou Bah',
        role: 'user',
        avatarUrl: '',
        privacySettings: {},
        ...over,
    }) as UserProfile;

const policy = (photoUrl: string): DefaultAvatarPolicy => ({
    photoUrl,
    label: 'Avatar institutionnel',
    updatedAt: NOW.toISOString(),
    updatedBy: 'Admin-Général',
});

/** Brouillon complet et valide — point de départ des variantes ci-dessous. */
const fullDraft = (): AvatarStudioDraft => ({
    photo: { url: 'https://cdn.moknet.app/a/photo.jpg', fileName: 'moi.jpg', sizeBytes: 120_000, mimeType: 'image/jpeg' },
    consent: {
        ownsImage: true,
        allowsDisplay: true,
        allowsVoiceGuidance: true,
        acceptedAt: NOW.toISOString(),
    },
    displayName: 'Aïssatou',
});

// ─────────────────────────────────────────────────────────────────────────
describe('Étape 1 — accès Pro', () => {
    it('ouvre le parcours au membre Pro, et à lui seul', () => {
        expect(resolveAvatarStudioAccess(profile({ plan: 'pro' })).allowed).toBe(true);
        expect(resolveAvatarStudioAccess(profile({ plan: 'pro' })).verdict).toBe('pro');
    });

    it("un compte sans plan est standard : l'absence d'information ne donne jamais le droit", () => {
        const access = resolveAvatarStudioAccess(profile());
        expect(access.allowed).toBe(false);
        expect(access.verdict).toBe('plan_insuffisant');
        expect(isProAccount(profile())).toBe(false);
        expect(isProAccount(profile({ plan: 'free' }))).toBe(false);
    });

    it('l’administrateur voit le parcours réellement livré aux membres Pro', () => {
        expect(resolveAvatarStudioAccess(profile({ role: 'admin' })).allowed).toBe(true);
    });

    it('un compte suspendu n’a ni parcours ni offre — même Pro', () => {
        const access = resolveAvatarStudioAccess(profile({ plan: 'pro', accountStatus: 'suspended' }));
        expect(access.allowed).toBe(false);
        expect(access.verdict).toBe('compte_inactif');
    });

    it('le refus est une phrase affichable, jamais un code technique', () => {
        expect(resolveAvatarStudioAccess(profile()).message).toMatch(/Pro/);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Étape 2 — photo', () => {
    it('accepte JPEG, PNG et WebP dans la limite de poids', () => {
        for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
            expect(validateAvatarPhoto({ name: 'p', type, size: 500_000 })).toBeNull();
        }
    });

    it('refuse un format non pris en charge, avec le motif exact', () => {
        const rejection = validateAvatarPhoto({ name: 'doc.pdf', type: 'application/pdf', size: 1000 });
        expect(rejection?.code).toBe('format');
        expect(rejection?.message).toMatch(/JPEG/);
    });

    it('refuse au-delà de 8 Mo et dit le poids réel', () => {
        const rejection = validateAvatarPhoto({ name: 'p.jpg', type: 'image/jpeg', size: 9 * 1024 * 1024 });
        expect(rejection?.code).toBe('poids');
        expect(rejection?.message).toContain('9 Mo');
    });

    it('refuse un fichier vide — un 0 octet passerait sinon tous les autres contrôles', () => {
        expect(validateAvatarPhoto({ name: 'p.jpg', type: 'image/jpeg', size: 0 })?.code).toBe('vide');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Étape 3 — consentement', () => {
    it('exige les deux clauses obligatoires : rien de partiel ne ressemble à un accord', () => {
        expect(buildAvatarConsent({ ownsImage: true, allowsDisplay: false, allowsVoiceGuidance: true }, NOW)).toBeUndefined();
        expect(buildAvatarConsent({ ownsImage: false, allowsDisplay: true, allowsVoiceGuidance: true }, NOW)).toBeUndefined();
    });

    it('la parole reste optionnelle : on peut consentir à l’image et refuser la voix', () => {
        const consent = buildAvatarConsent({ ownsImage: true, allowsDisplay: true, allowsVoiceGuidance: false }, NOW);
        expect(consent).toBeDefined();
        expect(consent!.allowsVoiceGuidance).toBe(false);
    });

    it('horodate le consentement — la date vient du clic, jamais d’une supposition', () => {
        const consent = buildAvatarConsent({ ownsImage: true, allowsDisplay: true, allowsVoiceGuidance: true }, NOW);
        expect(consent!.acceptedAt).toBe('2026-09-04T10:30:00.000Z');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Étape 4 — nom', () => {
    it('nettoie les tournures dictées, tutoiement comme vouvoiement', () => {
        expect(parseAvatarDisplayName('Appelle-moi Mamadou')).toBe('Mamadou');
        expect(parseAvatarDisplayName('Appelez-moi Aïssatou')).toBe('Aïssatou');
        expect(parseAvatarDisplayName("Vous pouvez m'appeler Fatou Diop")).toBe('Fatou Diop');
        expect(parseAvatarDisplayName('  Yaya   Diallo  ')).toBe('Yaya Diallo');
    });

    it('refuse le vide, le trop court et le trop long', () => {
        expect(parseAvatarDisplayName('')).toBeUndefined();
        expect(parseAvatarDisplayName('a')).toBeUndefined();
        expect(parseAvatarDisplayName('x'.repeat(41))).toBeUndefined();
    });

    it('refuse une adresse web ou du balisage — ce nom est affiché partout dans l’app', () => {
        expect(parseAvatarDisplayName('https://exemple.com')).toBeUndefined();
        expect(parseAvatarDisplayName('<script>alerte</script>')).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Progression — l’ordre du parcours est tenu par le service', () => {
    const proAccess = resolveAvatarStudioAccess(profile({ plan: 'pro' }));

    it('un compte non Pro reste bloqué à l’accès, quel que soit son brouillon', () => {
        const standard = resolveAvatarStudioAccess(profile());
        expect(currentAvatarStep(fullDraft(), standard)).toBe('acces');
        expect(avatarStepBlocker('photo', fullDraft(), standard)).toMatch(/Pro/);
    });

    it('avance étape par étape à mesure que le brouillon se remplit', () => {
        const draft = emptyAvatarDraft();
        expect(currentAvatarStep(draft, proAccess)).toBe('photo');

        draft.photo = fullDraft().photo;
        expect(currentAvatarStep(draft, proAccess)).toBe('consentement');

        draft.consent = fullDraft().consent;
        expect(currentAvatarStep(draft, proAccess)).toBe('nom');

        draft.displayName = 'Aïssatou';
        expect(currentAvatarStep(draft, proAccess)).toBe('generation');

        draft.persona = generatePersonalAvatar(draft, proAccess, NOW).avatar;
        expect(currentAvatarStep(draft, proAccess)).toBe('apercu');
    });

    it('nomme précisément ce qui bloque, plutôt que de désactiver en silence', () => {
        expect(avatarStepBlocker('consentement', emptyAvatarDraft(), proAccess)).toMatch(/photo/i);
        expect(avatarStepBlocker('nom', { photo: fullDraft().photo }, proAccess)).toMatch(/consentement/i);
        expect(avatarStepBlocker('generation', { photo: fullDraft().photo, consent: fullDraft().consent }, proAccess)).toMatch(/nom/i);
        expect(avatarStepBlocker('apercu', fullDraft(), proAccess)).toMatch(/génération/i);
    });

    it('le parcours annoncé est exactement celui de la mission', () => {
        expect([...AVATAR_STUDIO_STEPS]).toEqual([
            'acces',
            'photo',
            'consentement',
            'nom',
            'generation',
            'apercu',
        ]);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Étape 5 — génération', () => {
    const proAccess = resolveAvatarStudioAccess(profile({ plan: 'pro' }));

    it('produit une persona complète : photo, nom, salutation et guidage', () => {
        const result = generatePersonalAvatar(fullDraft(), proAccess, NOW);
        expect(result.ok).toBe(true);
        expect(result.avatar!.displayName).toBe('Aïssatou');
        expect(result.avatar!.greeting).toBe(buildAvatarGreeting('Aïssatou'));
        expect(result.avatar!.guidance.length).toBeGreaterThan(0);
        expect(result.avatar!.guidance.every((line) => line.includes('Aïssatou'))).toBe(true);
        expect(result.avatar!.createdAt).toBe('2026-09-04T10:30:00.000Z');
    });

    it('l’avatar ne parle que si la clause de parole a été acceptée', () => {
        const muet = fullDraft();
        muet.consent = { ...muet.consent!, allowsVoiceGuidance: false };
        expect(generatePersonalAvatar(muet, proAccess, NOW).avatar!.speaks).toBe(false);
        expect(generatePersonalAvatar(fullDraft(), proAccess, NOW).avatar!.speaks).toBe(true);
    });

    it('échoue explicitement sur un brouillon incomplet — jamais d’avatar à moitié construit', () => {
        const sansPhoto = { ...fullDraft(), photo: undefined };
        expect(generatePersonalAvatar(sansPhoto, proAccess, NOW).ok).toBe(false);
        expect(generatePersonalAvatar(sansPhoto, proAccess, NOW).avatar).toBeUndefined();

        const sansConsentement = { ...fullDraft(), consent: undefined };
        expect(generatePersonalAvatar(sansConsentement, proAccess, NOW).error).toMatch(/onsentement/);

        const sansNom = { ...fullDraft(), displayName: undefined };
        expect(generatePersonalAvatar(sansNom, proAccess, NOW).error).toMatch(/[Nn]om/);
    });

    it('refuse un consentement dont une clause obligatoire est fausse, même daté', () => {
        const truque = fullDraft();
        truque.consent = { ...truque.consent!, ownsImage: false };
        const result = generatePersonalAvatar(truque, proAccess, NOW);
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/obligatoires/);
    });

    it('un non-Pro ne peut pas générer, même avec un brouillon parfait', () => {
        const standard = resolveAvatarStudioAccess(profile());
        expect(generatePersonalAvatar(fullDraft(), standard, NOW).ok).toBe(false);
    });

    it('refuse le cliché de banque d’images comme photo personnelle', () => {
        const stock = fullDraft();
        stock.photo = { ...stock.photo!, url: STOCK };
        expect(generatePersonalAvatar(stock, proAccess, NOW).ok).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Avatar par défaut de la plateforme (Admin-Général)', () => {
    it('accepte une adresse https ou un chemin interne', () => {
        expect(validateDefaultAvatarUrl('https://cdn.moknet.app/avatar.png')).toBeNull();
        expect(validateDefaultAvatarUrl('/icons/icon-192.png')).toBeNull();
    });

    it('refuse le cliché hérité : l’app le traite déjà comme « avatar absent »', () => {
        const rejection = validateDefaultAvatarUrl(STOCK);
        expect(rejection?.code).toBe('placeholder');
    });

    it('refuse http:// et les adresses relatives ambiguës', () => {
        expect(validateDefaultAvatarUrl('http://exemple.com/a.png')?.code).toBe('protocole');
        expect(validateDefaultAvatarUrl('avatar.png')?.code).toBe('protocole');
    });

    it('un champ vide est un choix explicite, pas une erreur silencieuse', () => {
        expect(validateDefaultAvatarUrl('  ')?.code).toBe('vide');
    });

    it('un nouveau compte reçoit l’avatar défini, ou rien (donc ses initiales)', () => {
        expect(resolveNewAccountAvatarUrl(policy('https://cdn.moknet.app/a.png'))).toBe('https://cdn.moknet.app/a.png');
        expect(resolveNewAccountAvatarUrl(policy(''))).toBe('');
        expect(resolveNewAccountAvatarUrl(null)).toBe('');
        // Même si un réglage hérité contenait le cliché, il n'est jamais servi.
        expect(resolveNewAccountAvatarUrl(policy(STOCK))).toBe('');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Avatar réellement affiché — l’ordre de priorité', () => {
    const persona = generatePersonalAvatar(fullDraft(), resolveAvatarStudioAccess(profile({ plan: 'pro' })), NOW).avatar!;

    it('l’avatar personnel Pro passe avant tout le reste', () => {
        const active = resolveActiveAvatar(
            profile({ avatarUrl: 'https://cdn.moknet.app/ancienne.png', privacySettings: { avatarStudio: persona } as never }),
            policy('https://cdn.moknet.app/defaut.png'),
        );
        expect(active.source).toBe('personnel');
        expect(active.photoUrl).toBe(persona.photoUrl);
        expect(active.displayName).toBe('Aïssatou');
        expect(active.speaks).toBe(true);
        expect(active.greeting).toBe(persona.greeting);
    });

    it('sans avatar personnel, la photo de profil du membre passe avant le défaut', () => {
        const active = resolveActiveAvatar(
            profile({ avatarUrl: 'https://cdn.moknet.app/ma-photo.png' }),
            policy('https://cdn.moknet.app/defaut.png'),
        );
        expect(active.source).toBe('photo_profil');
        expect(active.speaks).toBe(false);
    });

    it('un compte qui porte exactement l’avatar de la plateforme n’est pas annoncé comme ayant choisi sa photo', () => {
        // Un nouveau compte reçoit l'avatar par défaut comme sien : sans cette
        // comparaison, l'écran lui annoncerait « votre photo de profil » alors
        // qu'il n'a jamais rien choisi.
        const active = resolveActiveAvatar(
            profile({ avatarUrl: 'https://cdn.moknet.app/defaut.png' }),
            policy('https://cdn.moknet.app/defaut.png'),
        );
        expect(active.source).toBe('defaut_plateforme');
    });

    it('après un changement d’avatar par l’Admin-Général, le membre garde le sien — hérité, donc personnel', () => {
        const active = resolveActiveAvatar(
            profile({ avatarUrl: 'https://cdn.moknet.app/ancien-defaut.png' }),
            policy('https://cdn.moknet.app/nouveau-defaut.png'),
        );
        expect(active.source).toBe('photo_profil');
        expect(active.photoUrl).toBe('https://cdn.moknet.app/ancien-defaut.png');
    });

    it('sans photo personnelle, le membre porte l’avatar défini par l’Admin-Général', () => {
        const active = resolveActiveAvatar(profile(), policy('https://cdn.moknet.app/defaut.png'));
        expect(active.source).toBe('defaut_plateforme');
        expect(active.photoUrl).toBe('https://cdn.moknet.app/defaut.png');
        // Le défaut plateforme est un visage institutionnel : il ne parle pas.
        expect(active.speaks).toBe(false);
    });

    it('sans rien du tout, les initiales — jamais le cliché de banque d’images', () => {
        expect(resolveActiveAvatar(profile(), policy('')).source).toBe('initiales');
        expect(resolveActiveAvatar(profile({ avatarUrl: STOCK }), policy(STOCK)).source).toBe('initiales');
    });

    it('un avatar personnel sans photo exploitable ne prend pas la main', () => {
        const casse = { ...persona, photoUrl: '   ' };
        const active = resolveActiveAvatar(
            profile({ privacySettings: { avatarStudio: casse } as never }),
            policy('https://cdn.moknet.app/defaut.png'),
        );
        expect(active.source).toBe('defaut_plateforme');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Révocation', () => {
    const persona = generatePersonalAvatar(fullDraft(), resolveAvatarStudioAccess(profile({ plan: 'pro' })), NOW).avatar!;

    it('retire l’avatar personnel et rend celui de la plateforme', () => {
        const current = profile({
            avatarUrl: persona.photoUrl,
            privacySettings: { profileVisibility: 'public', avatarStudio: persona } as never,
        });
        const updates = revokePersonalAvatar(current, policy('https://cdn.moknet.app/defaut.png'));

        expect(updates.privacySettings.avatarStudio).toBeUndefined();
        expect(updates.avatarUrl).toBe('https://cdn.moknet.app/defaut.png');
        // Les autres réglages de confidentialité survivent à la révocation.
        expect(updates.privacySettings.profileVisibility).toBe('public');
    });

    it('sans avatar par défaut, la révocation ramène aux initiales, pas au cliché hérité', () => {
        const current = profile({ privacySettings: { avatarStudio: persona } as never });
        expect(revokePersonalAvatar(current, policy('')).avatarUrl).toBe('');
    });

    it('après révocation, l’affichage n’a plus de source personnelle', () => {
        const current = profile({ privacySettings: { avatarStudio: persona } as never });
        const updates = revokePersonalAvatar(current, policy('https://cdn.moknet.app/defaut.png'));
        const after = resolveActiveAvatar(
            { ...current, ...updates } as UserProfile,
            policy('https://cdn.moknet.app/defaut.png'),
        );
        expect(after.source).not.toBe('personnel');
        expect(after.speaks).toBe(false);
    });
});
