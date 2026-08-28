export interface OfficialSource {
  label: string;
  url: string;
  scope: string;
}

const readUrl = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
};

export const LIFE_OFFICIAL_SOURCES = {
  health: {
    label: 'Organisation mondiale de la Santé — urgences sanitaires',
    url: readUrl(
      import.meta.env.VITE_HEALTH_OFFICIAL_SOURCE_URL,
      'https://www.who.int/emergencies',
    ),
    scope: 'Information sanitaire générale. Les numéros locaux doivent être confirmés auprès des autorités du pays.',
  },
  housing: {
    label: 'Service-Public.fr — logement',
    url: readUrl(
      import.meta.env.VITE_HOUSING_OFFICIAL_SOURCE_URL,
      'https://www.service-public.fr/particuliers/vosdroits/N19808',
    ),
    scope: 'Référentiel officiel français. Configurez une source nationale pour un autre pays.',
  },
  legal: {
    label: 'Service-Public.fr — démarches et droits',
    url: readUrl(
      import.meta.env.VITE_LEGAL_OFFICIAL_SOURCE_URL,
      'https://www.service-public.fr/',
    ),
    scope: 'Référentiel officiel français. Les règles applicables dépendent du pays et de la situation.',
  },
  mobility: {
    label: 'Organisation internationale pour les migrations',
    url: readUrl(
      import.meta.env.VITE_MOBILITY_OFFICIAL_SOURCE_URL,
      'https://www.iom.int/',
    ),
    scope: 'Information générale. Seul le consulat ou le portail officiel du pays de destination confirme un visa.',
  },
} satisfies Record<'health' | 'housing' | 'legal' | 'mobility', OfficialSource>;

export const MEDICAL_DISCLAIMER =
  'Cette orientation ne constitue ni un diagnostic, ni une prescription. En cas de danger immédiat, contactez les secours locaux.';

export const LEGAL_DISCLAIMER =
  'Ce contenu est une aide à la compréhension et à la rédaction. Il ne remplace pas un avocat, une autorité ou la vérification du droit applicable.';

export const MOBILITY_DISCLAIMER =
  'Cette estimation n’accorde aucun droit au visa. Vérifiez les critères, frais et délais sur le portail officiel du pays de destination.';
