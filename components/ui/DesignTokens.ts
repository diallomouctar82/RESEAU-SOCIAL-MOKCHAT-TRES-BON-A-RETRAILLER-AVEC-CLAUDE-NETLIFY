/**
 * 🎨 DESIGN TOKENS — LE MONDE À VOUS (LMAV)
 * Central design tokens and aesthetic constants for the platform.
 * 
 * Palette: Deep Navy (#0B132B) + Crisp Neutral (#F8FAFC, #FFFFFF) + Warm Accent (#EA580C)
 * 5 Pillars Desaturated Color Spectrum
 */

export const DESIGN_TOKENS = {
  colors: {
    // 🏛️ Deep Navy Base (Trust, International, High-Tech, Stability)
    navy: {
      950: '#070D1E',
      900: '#0B132B',
      800: '#14213D',
      700: '#1E293B',
      600: '#334155',
    },
    // 🌅 Brand Signature Accent (Warm Amber / Terracotta - Used with intent and mastery)
    accent: {
      DEFAULT: '#EA580C', // Orange 600
      hover: '#C2410C',   // Orange 700
      light: '#FFF7ED',   // Orange 50
      border: '#FED7AA',  // Orange 200
      subtle: '#FB923C',  // Orange 400
    },
    // 🕊️ Clean Surfaces
    surface: {
      canvas: '#F8FAFC',    // Slate 50
      card: '#FFFFFF',      // Pure White
      subtle: '#F1F5F9',    // Slate 100
      divider: '#E2E8F0',   // Slate 200
    },
    // ✍️ Typography Neutrals
    text: {
      primary: '#0F172A',   // Slate 900
      secondary: '#475569', // Slate 600
      muted: '#64748B',     // Slate 500
      inverted: '#FFFFFF',
    },
    // 🏛️ The 5 Pillars Spectral Accents
    pillars: {
      cap: {
        base: '#0F172A',
        light: '#F8FAFC',
        text: '#0F172A',
        accent: '#2563EB',
      },
      learn: {
        base: '#1D4ED8',
        light: '#EFF6FF',
        text: '#1E40AF',
        accent: '#3B82F6',
      },
      life: {
        base: '#0D9488',
        light: '#F0FDFA',
        text: '#115E59',
        accent: '#14B8A6',
      },
      create: {
        base: '#D97706',
        light: '#FFFBEB',
        text: '#B45309',
        accent: '#F59E0B',
      },
      community: {
        base: '#7C3AED',
        light: '#FAF5FF',
        text: '#6D28D9',
        accent: '#8B5CF6',
      },
    },
    // 🚦 System States
    status: {
      success: {
        bg: '#F0FDF4',
        border: '#BBF7D0',
        text: '#166534',
        dot: '#22C55E',
      },
      info: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        text: '#1E40AF',
        dot: '#3B82F6',
      },
      warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
        dot: '#F59E0B',
      },
      danger: {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        dot: '#EF4444',
      },
      verified: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        text: '#0F172A',
        dot: '#0284C7',
      }
    }
  },
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
    xl: 'rounded-3xl',   // 24px (for prominent containers)
    full: 'rounded-full' // 9999px (for pills/tags)
  },
  shadows: {
    subtle: 'shadow-xs',
    card: 'shadow-sm',
    elevated: 'shadow-md',
    floating: 'shadow-xl shadow-slate-900/5',
  }
};
