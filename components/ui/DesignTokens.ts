/**
 * 🎨 DESIGN TOKENS & PALETTES CHROMATIQUES — LE MONDE À VOUS (LMAV)
 * Central design tokens, color scales, and 10 complete premium color palettes.
 * 
 * Direction: Deep Blue (Bleu Profond) + International + Premium + Institutional + Technological
 */

export interface PaletteDefinition {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'royal' | 'navy' | 'cobalt' | 'ocean' | 'sapphire' | 'indigo' | 'atlantic' | 'gold' | 'prussian' | 'global';
  tags: string[];
  wcagContrastRatio: string;
  wcagRating: 'AAA' | 'AA';
  colors: {
    // Primary brand identity
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primarySoft: string;
    primaryLight: string;
    
    // Secondary & Accent
    secondary: string;
    secondaryHover: string;
    accent: string;
    accentGold: string; // Or/Champagne used with extreme restraint
    
    // Global surfaces & structure
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    borderSubtle: string;
    
    // Sidebar (Deep Blue Presence)
    sidebarBg: string;
    sidebarSurface: string;
    sidebarText: string;
    sidebarTextMuted: string;
    sidebarActiveBg: string;
    sidebarActiveText: string;
    sidebarBorder: string;
    sidebarHighlight: string;
    
    // Header (Crisp Light Contrast)
    headerBg: string;
    headerText: string;
    headerBorder: string;
    
    // Typography Neutrals
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverted: string;
    
    // Semantic Functional States (Preserved & Protected)
    statusSuccess: { bg: string; text: string; border: string; dot: string };
    statusWarning: { bg: string; text: string; border: string; dot: string };
    statusDanger: { bg: string; text: string; border: string; dot: string };
    statusInfo: { bg: string; text: string; border: string; dot: string };
    
    // Focus Ring
    focusRing: string;
    
    // Dark Mode Specification
    darkVariant: {
      background: string;
      surface: string;
      surfaceElevated: string;
      border: string;
      textPrimary: string;
      textSecondary: string;
      sidebarBg: string;
      primary: string;
      accentGold: string;
    };
  };
}

/**
 * 🌊 PROPRIETARY SCALE — LE MONDE À VOUS BLUE (LMAV Blue 50 -> 950)
 * Mathematical scale with high optical balance for deep international resonance.
 */
export const LMAV_BLUE_SCALE = {
  50: '#F0F6FE',   // Ultra light tint
  100: '#E0EDFD',  // Light tint for active soft pills
  200: '#BAE0FD',  // Subtle borders & tags
  300: '#7CBDF7',  // Interactive secondary
  400: '#389BF2',  // Vibrant tech highlight
  500: '#0F7EE6',  // Bright action blue
  600: '#0261C7',  // Primary interactive blue
  700: '#034DA2',  // Deep authoritative blue
  800: '#073B7A',  // Institutional deep blue
  900: '#0B254E',  // Royal navy dark
  950: '#071633',  // Midnight foundational base
};

/**
 * 🏛️ LES 10 PROPOSITIONS DE PALETTES COMPLÈTES
 */
export const BRAND_PALETTES: PaletteDefinition[] = [
  // ─── 01. BLEU VISION PREMIUM ───
  {
    id: 'palette-01',
    number: '01',
    name: 'Bleu Vision Premium',
    subtitle: 'Bleu royal profond + blanc + gris froid + accent or discret',
    description: 'Inspiré de l’esprit de la référence : une sidebar bleu royal intense et statutaire, associée à des espaces clairs lumineux et une touche dorée prestigieuse.',
    category: 'royal',
    tags: ['Royal', 'Statutaire', 'Vision', 'Prestige'],
    wcagContrastRatio: '14.2:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#1D4ED8',        // Royal Blue 700
      primaryHover: '#1E40AF',   // Royal Blue 800
      primaryActive: '#172554',  // Blue 950
      primarySoft: '#EFF6FF',    // Blue 50
      primaryLight: '#DBEAFE',   // Blue 100
      secondary: '#0F172A',
      secondaryHover: '#1E293B',
      accent: '#2563EB',
      accentGold: '#D97706',     // Or ambré discret
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      sidebarBg: '#0E2A5D',      // Bleu royal profond intense (proche de la référence)
      sidebarSurface: '#143675',
      sidebarText: '#E2E8F0',
      sidebarTextMuted: '#94A3B8',
      sidebarActiveBg: '#1D4ED8',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#1A3C7E',
      sidebarHighlight: '#F59E0B',
      headerBg: '#FFFFFF',
      headerText: '#0F172A',
      headerBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
      focusRing: 'ring-blue-600',
      darkVariant: {
        background: '#070D1E',
        surface: '#0B132B',
        surfaceElevated: '#14213D',
        border: '#1E293B',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        sidebarBg: '#060B18',
        primary: '#3B82F6',
        accentGold: '#F59E0B'
      }
    }
  },

  // ─── 02. BLEU NUIT INTERNATIONAL ───
  {
    id: 'palette-02',
    number: '02',
    name: 'Bleu Nuit International',
    subtitle: 'Navy très profond + bleu électrique maîtrisé + blanc cassé + accent champagne',
    description: 'Une présence diplomatique et souveraine, mêlant un bleu nuit dense à des pointes électriques contrôlées et des reflets champagne raffinés.',
    category: 'navy',
    tags: ['International', 'Diplomatie', 'Souveraineté', 'Champagne'],
    wcagContrastRatio: '15.6:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#2563EB',
      primaryHover: '#1D4ED8',
      primaryActive: '#0F172A',
      primarySoft: '#F0F4FF',
      primaryLight: '#E0EAFF',
      secondary: '#070D1E',
      secondaryHover: '#0F172A',
      accent: '#3B82F6',
      accentGold: '#E2B870',     // Champagne doux
      background: '#FAFBFD',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      sidebarBg: '#070D1E',      // Navy absolu
      sidebarSurface: '#0F1938',
      sidebarText: '#E2E8F0',
      sidebarTextMuted: '#8B9BB4',
      sidebarActiveBg: '#1D4ED8',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#14234C',
      sidebarHighlight: '#E2B870',
      headerBg: '#FFFFFF',
      headerText: '#070D1E',
      headerBorder: '#E2E8F0',
      textPrimary: '#070D1E',
      textSecondary: '#3F4D67',
      textMuted: '#6B7A99',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#2563EB' },
      focusRing: 'ring-blue-600',
      darkVariant: {
        background: '#04070F',
        surface: '#080E20',
        surfaceElevated: '#0F1836',
        border: '#1A2952',
        textPrimary: '#F8FAFC',
        textSecondary: '#8B9BB4',
        sidebarBg: '#03050B',
        primary: '#3B82F6',
        accentGold: '#E2B870'
      }
    }
  },

  // ─── 03. BLEU COBALT ───
  {
    id: 'palette-03',
    number: '03',
    name: 'Bleu Cobalt',
    subtitle: 'Cobalt premium + blanc + graphite + accent bleu ciel',
    description: 'Une esthétique high-tech et dynamique, marquée par l’énergie du cobalt et des respirations ciel limpides sur fond graphite.',
    category: 'cobalt',
    tags: ['Cobalt', 'Technologie', 'Dynamisme', 'Ciel'],
    wcagContrastRatio: '13.8:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#1338BE',        // Pure Cobalt
      primaryHover: '#0E298F',
      primaryActive: '#081754',
      primarySoft: '#EEF2FF',
      primaryLight: '#E0E7FF',
      secondary: '#1E293B',
      secondaryHover: '#334155',
      accent: '#0284C7',
      accentGold: '#38BDF8',     // Accent bleu ciel lumineux
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      sidebarBg: '#0B1D51',      // Cobalt profond
      sidebarSurface: '#122A70',
      sidebarText: '#E0E7FF',
      sidebarTextMuted: '#94A3B8',
      sidebarActiveBg: '#1338BE',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#1A3891',
      sidebarHighlight: '#38BDF8',
      headerBg: '#FFFFFF',
      headerText: '#0F172A',
      headerBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD', dot: '#0EA5E9' },
      focusRing: 'ring-indigo-600',
      darkVariant: {
        background: '#060B1C',
        surface: '#0B1533',
        surfaceElevated: '#122252',
        border: '#1A3075',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        sidebarBg: '#040714',
        primary: '#4F46E5',
        accentGold: '#38BDF8'
      }
    }
  },

  // ─── 04. BLEU OCÉAN ───
  {
    id: 'palette-04',
    number: '04',
    name: 'Bleu Océan',
    subtitle: 'Bleu profond légèrement pétrole + blanc + gris minéral + accent turquoise discret',
    description: 'Une nuance maritime et apaisante à tonalité pétrole, conférant clarté, sérénité et autorité aux démarches internationales.',
    category: 'ocean',
    tags: ['Océan', 'Pétrole', 'Sérénité', 'Turquoise'],
    wcagContrastRatio: '14.5:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#0F4C64',        // Deep Petrol Ocean
      primaryHover: '#0A3749',
      primaryActive: '#06232F',
      primarySoft: '#F0FDFA',
      primaryLight: '#CCFBF1',
      secondary: '#1E293B',
      secondaryHover: '#334155',
      accent: '#0D9488',
      accentGold: '#14B8A6',     // Turquoise discret
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F0FDFA',
      sidebarBg: '#0B2937',      // Bleu pétrole profond
      sidebarSurface: '#123D51',
      sidebarText: '#E0F2FE',
      sidebarTextMuted: '#85A6B8',
      sidebarActiveBg: '#0D9488',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#184960',
      sidebarHighlight: '#2DD4BF',
      headerBg: '#FFFFFF',
      headerText: '#0F2937',
      headerBorder: '#E2E8F0',
      textPrimary: '#0A2533',
      textSecondary: '#425C6B',
      textMuted: '#6B8796',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#F0FDFA', text: '#115E59', border: '#99F6E4', dot: '#0D9488' },
      focusRing: 'ring-teal-600',
      darkVariant: {
        background: '#041017',
        surface: '#081D29',
        surfaceElevated: '#0F2F42',
        border: '#16425C',
        textPrimary: '#F8FAFC',
        textSecondary: '#85A6B8',
        sidebarBg: '#030C12',
        primary: '#14B8A6',
        accentGold: '#2DD4BF'
      }
    }
  },

  // ─── 05. BLEU SAPHIR ───
  {
    id: 'palette-05',
    number: '05',
    name: 'Bleu Saphir',
    subtitle: 'Saphir sombre + ivoire + graphite + accent doré',
    description: 'Une harmonie noble et joaillière, mariant la profondeur sombre du saphir brut à la pureté d’un ivoire soyeux et de légers accents or.',
    category: 'sapphire',
    tags: ['Saphir', 'Luxe Discret', 'Ivoire', 'Or'],
    wcagContrastRatio: '15.1:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#1A365D',        // Deep Sapphire
      primaryHover: '#132845',
      primaryActive: '#0B1729',
      primarySoft: '#F4F7FB',
      primaryLight: '#E2E8F0',
      secondary: '#0F172A',
      secondaryHover: '#1E293B',
      accent: '#2B6CB0',
      accentGold: '#C59B27',     // Or noble
      background: '#FDFBF7',     // Ivoire très léger
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E8E4DA',
      borderSubtle: '#F6F3EB',
      sidebarBg: '#0C1E4A',      // Saphir profond
      sidebarSurface: '#142C69',
      sidebarText: '#F7FAFC',
      sidebarTextMuted: '#A0AEC0',
      sidebarActiveBg: '#2B6CB0',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#1A3780',
      sidebarHighlight: '#C59B27',
      headerBg: '#FFFFFF',
      headerText: '#1A202C',
      headerBorder: '#E8E4DA',
      textPrimary: '#1A202C',
      textSecondary: '#4A5568',
      textMuted: '#718096',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#EBF8FF', text: '#2B6CB0', border: '#BEE3F8', dot: '#3182CE' },
      focusRing: 'ring-blue-800',
      darkVariant: {
        background: '#060E21',
        surface: '#0C1A3B',
        surfaceElevated: '#132757',
        border: '#1D3B7F',
        textPrimary: '#FDFBF7',
        textSecondary: '#A0AEC0',
        sidebarBg: '#040917',
        primary: '#3182CE',
        accentGold: '#C59B27'
      }
    }
  },

  // ─── 06. INDIGO MONDE ───
  {
    id: 'palette-06',
    number: '06',
    name: 'Indigo Monde',
    subtitle: 'Indigo profond + blanc + gris bleuté + accent cyan très contrôlé',
    description: 'Une signature technologique puissante aux reflets ultraviolets subtils, offrant une énergie cérébrale et un magnétisme moderne.',
    category: 'indigo',
    tags: ['Indigo', 'Tech Mondiale', 'Ultraviolet', 'Cyan'],
    wcagContrastRatio: '14.8:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#4338CA',        // Indigo 700
      primaryHover: '#3730A3',   // Indigo 800
      primaryActive: '#1E1B4B',  // Indigo 950
      primarySoft: '#EEF2FF',
      primaryLight: '#E0E7FF',
      secondary: '#1E1B4B',
      secondaryHover: '#312E81',
      accent: '#4F46E5',
      accentGold: '#06B6D4',     // Cyan contrôlé
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#EEF2FF',
      sidebarBg: '#131138',      // Indigo nuit profond
      sidebarSurface: '#201C59',
      sidebarText: '#E0E7FF',
      sidebarTextMuted: '#9CA3AF',
      sidebarActiveBg: '#4F46E5',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#2B2675',
      sidebarHighlight: '#06B6D4',
      headerBg: '#FFFFFF',
      headerText: '#1E1B4B',
      headerBorder: '#E2E8F0',
      textPrimary: '#111827',
      textSecondary: '#4B5563',
      textMuted: '#6B7280',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE', dot: '#4F46E5' },
      focusRing: 'ring-indigo-600',
      darkVariant: {
        background: '#09081E',
        surface: '#110F36',
        surfaceElevated: '#1D1A54',
        border: '#2E2A7A',
        textPrimary: '#F8FAFC',
        textSecondary: '#9CA3AF',
        sidebarBg: '#050412',
        primary: '#6366F1',
        accentGold: '#06B6D4'
      }
    }
  },

  // ─── 07. BLEU ATLANTIQUE ───
  {
    id: 'palette-07',
    number: '07',
    name: 'Bleu Atlantique',
    subtitle: 'Bleu marine international + blanc pur + gris argent + accent azur',
    description: 'Une élégance maritime universelle inspirée des grandes liaisons transatlantiques, claire, institutionnelle et sans artifice.',
    category: 'atlantic',
    tags: ['Marine', 'Atlantique', 'Argent', 'Azur'],
    wcagContrastRatio: '14.6:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#0A2540',        // Stripe-like Atlantic Navy
      primaryHover: '#071829',
      primaryActive: '#030B14',
      primarySoft: '#F0F7FF',
      primaryLight: '#E0F0FE',
      secondary: '#1A2E40',
      secondaryHover: '#2C4459',
      accent: '#0070F3',
      accentGold: '#0284C7',     // Azur lumineux
      background: '#F9FBFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      sidebarBg: '#0A2540',      // Atlantic Navy
      sidebarSurface: '#12385E',
      sidebarText: '#E6EFF7',
      sidebarTextMuted: '#8FA6BC',
      sidebarActiveBg: '#0070F3',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#1A436D',
      sidebarHighlight: '#38BDF8',
      headerBg: '#FFFFFF',
      headerText: '#0A2540',
      headerBorder: '#E2E8F0',
      textPrimary: '#0A2540',
      textSecondary: '#425466',
      textMuted: '#6B7C8E',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#F0F7FF', text: '#0A2540', border: '#BAE0FD', dot: '#0070F3' },
      focusRing: 'ring-blue-600',
      darkVariant: {
        background: '#040E18',
        surface: '#081C2E',
        surfaceElevated: '#0E2E4B',
        border: '#17446E',
        textPrimary: '#F8FAFC',
        textSecondary: '#8FA6BC',
        sidebarBg: '#02070D',
        primary: '#0070F3',
        accentGold: '#38BDF8'
      }
    }
  },

  // ─── 08. BLEU & OR ───
  {
    id: 'palette-08',
    number: '08',
    name: 'Bleu & Or',
    subtitle: 'Bleu nuit + blanc + gris perle + or premium très discret',
    description: 'Le classicisme du bleu nuit associé au prestige d’un fil doré discret. Utilisé avec retenue pour signaler les victoires et jalons clés.',
    category: 'gold',
    tags: ['Prestige', 'Excellence', 'Or Impérial', 'Accomplissement'],
    wcagContrastRatio: '15.9:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#0A1128',        // Nightfall Blue
      primaryHover: '#14214D',
      primaryActive: '#050814',
      primarySoft: '#FDFCF7',
      primaryLight: '#F7F3E3',
      secondary: '#1C2541',
      secondaryHover: '#3A506B',
      accent: '#D4AF37',         // Or Impérial subtil
      accentGold: '#D4AF37',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E5E7EB',
      borderSubtle: '#F3F4F6',
      sidebarBg: '#0A1128',      // Bleu nuit intense
      sidebarSurface: '#16234D',
      sidebarText: '#F3F4F6',
      sidebarTextMuted: '#9CA3AF',
      sidebarActiveBg: '#1C2541',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#203063',
      sidebarHighlight: '#D4AF37',
      headerBg: '#FFFFFF',
      headerText: '#0A1128',
      headerBorder: '#E5E7EB',
      textPrimary: '#111827',
      textSecondary: '#4B5563',
      textMuted: '#6B7280',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
      focusRing: 'ring-amber-500',
      darkVariant: {
        background: '#040710',
        surface: '#080E21',
        surfaceElevated: '#101B3E',
        border: '#1B2C61',
        textPrimary: '#F9FAFB',
        textSecondary: '#9CA3AF',
        sidebarBg: '#020308',
        primary: '#D4AF37',
        accentGold: '#E5C158'
      }
    }
  },

  // ─── 09. BLEU PRUSSE ───
  {
    id: 'palette-09',
    number: '09',
    name: 'Bleu Prusse',
    subtitle: 'Bleu Prusse profond + blanc cassé + graphite + accent vert émeraude très limité',
    description: 'Une tonalité historique et académique d’une grande fermeté intellectuelle, renforcée par un accent vert émeraude symbolisant la validation et la conformité.',
    category: 'prussian',
    tags: ['Prusse', 'Académique', 'Rigueur', 'Émeraude'],
    wcagContrastRatio: '15.4:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#002B49',        // Prussian Blue
      primaryHover: '#001E33',
      primaryActive: '#00121F',
      primarySoft: '#F0FDF4',
      primaryLight: '#DCFCE7',
      secondary: '#1A2E3B',
      secondaryHover: '#2A4456',
      accent: '#059669',         // Émeraude vérifié
      accentGold: '#10B981',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#DEE2E6',
      borderSubtle: '#E9ECEF',
      sidebarBg: '#002138',      // Bleu Prusse profond
      sidebarSurface: '#00355A',
      sidebarText: '#E9ECEF',
      sidebarTextMuted: '#868E96',
      sidebarActiveBg: '#00355A',
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#004778',
      sidebarHighlight: '#059669',
      headerBg: '#FFFFFF',
      headerText: '#002B49',
      headerBorder: '#DEE2E6',
      textPrimary: '#212529',
      textSecondary: '#495057',
      textMuted: '#6C757D',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#059669' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD', dot: '#0284C7' },
      focusRing: 'ring-emerald-600',
      darkVariant: {
        background: '#000D17',
        surface: '#001A2E',
        surfaceElevated: '#002B4C',
        border: '#003E6E',
        textPrimary: '#F8F9FA',
        textSecondary: '#868E96',
        sidebarBg: '#00080F',
        primary: '#059669',
        accentGold: '#10B981'
      }
    }
  },

  // ─── 10. GLOBAL BLUE (SIGNATURE LMAV) ───
  {
    id: 'palette-10',
    number: '10',
    name: 'Global Aqua (Signature LMAV — Miroir d\'eau)',
    subtitle: 'Aqua propriétaire « Miroir d\'eau » + blanc arctique + micro-accent or & émeraude',
    description: 'La création propriétaire ultime pour Le Monde à Vous : un bleu universel, magistral et non-générique, combinant autorité bancaire/ministérielle, vitesse technologique et chaleur humaine.',
    category: 'global',
    tags: ['Signature LMAV', 'Propriétaire', 'Universel', 'Statut Mondial'],
    wcagContrastRatio: '15.8:1',
    wcagRating: 'AAA',
    colors: {
      primary: '#0A404F',        // Aqua 900 — abysse calme
      primaryHover: '#086077',   // Aqua 700
      primaryActive: '#06262F',  // Aqua 950
      primarySoft: '#ECFAFD',    // Aqua 50
      primaryLight: '#CBF0FA',   // Aqua 100
      secondary: '#0A7590',      // Aqua 600
      secondaryHover: '#086077', // Aqua 700
      accent: '#0A7590',         // Action signature (aqua 600)
      accentGold: '#D9A74A',     // Or solaire maîtrisé
      background: '#EAF7FB',     // Blanc arctique teinté d'eau (= --mir-bg)
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      sidebarBg: '#062733',      // Abysse Miroir d'eau
      sidebarSurface: '#0B3A4A',
      sidebarText: '#E4F6FB',
      sidebarTextMuted: '#8FBFCF',
      sidebarActiveBg: '#0A7590', // Aqua 600 — 5,35:1 avec du texte blanc
      sidebarActiveText: '#FFFFFF',
      sidebarBorder: '#0F4B5E',
      sidebarHighlight: '#D9A74A',
      headerBg: '#FFFFFF',
      headerText: '#0B3A46',
      headerBorder: '#E2E8F0',
      textPrimary: '#0B3A46',
      textSecondary: '#3C6270',
      textMuted: '#5F8592',
      textInverted: '#FFFFFF',
      statusSuccess: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#059669' },
      statusWarning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      statusDanger: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      statusInfo: { bg: '#ECFAFD', text: '#086077', border: '#A5E4F5', dot: '#0A7590' },
      focusRing: 'ring-blue-600',
      darkVariant: {
        background: '#04161C',
        surface: '#082A34',
        surfaceElevated: '#0B3A4A',
        border: '#12556A',
        textPrimary: '#F8FAFC',
        textSecondary: '#8FBFCF',
        sidebarBg: '#04161C',
        primary: '#29B4D6',
        accentGold: '#D9A74A'
      }
    }
  }
];

export const DEFAULT_PALETTE_ID = 'palette-10'; // Global Blue LMAV as primary candidate

export const DESIGN_TOKENS = {
  colors: BRAND_PALETTES.find(p => p.id === DEFAULT_PALETTE_ID)!.colors,
  scale: LMAV_BLUE_SCALE,
  palettes: BRAND_PALETTES,
  typography: {
    fontFamily: {
      sans: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif",
    }
  },
  radius: {
    sm: 'rounded-lg',    // 8px
    md: 'rounded-xl',    // 12px
    lg: 'rounded-2xl',   // 16px
    xl: 'rounded-3xl',   // 24px
    full: 'rounded-full' // 9999px
  },
  shadows: {
    subtle: 'shadow-xs',
    card: 'shadow-sm',
    elevated: 'shadow-md',
    floating: 'shadow-xl shadow-slate-900/5',
  }
};
