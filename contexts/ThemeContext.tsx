import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BRAND_PALETTES, PaletteDefinition, DEFAULT_PALETTE_ID, LMAV_BLUE_SCALE } from '../components/ui/DesignTokens';

interface ThemeContextType {
  currentPalette: PaletteDefinition;
  paletteId: string;
  setPaletteId: (id: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  availablePalettes: PaletteDefinition[];
  lmavScale: typeof LMAV_BLUE_SCALE;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [paletteId, setPaletteIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('lmav_selected_palette');
      return stored && BRAND_PALETTES.some(p => p.id === stored) ? stored : DEFAULT_PALETTE_ID;
    } catch {
      return DEFAULT_PALETTE_ID;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('lmav_dark_mode');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const currentPalette = BRAND_PALETTES.find(p => p.id === paletteId) || BRAND_PALETTES[0];

  const setPaletteId = (id: string) => {
    if (BRAND_PALETTES.some(p => p.id === id)) {
      setPaletteIdState(id);
      try {
        localStorage.setItem('lmav_selected_palette', id);
      } catch (e) {
        console.error('Failed to save palette to localStorage', e);
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('lmav_dark_mode', String(next));
      } catch (e) {
        console.error('Failed to save dark mode to localStorage', e);
      }
      return next;
    });
  };

  // Inject CSS Variables into Document Root for global instant reactivity
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentPalette.colors;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-soft', colors.primarySoft);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-gold', colors.accentGold);
    root.style.setProperty('--color-sidebar-bg', colors.sidebarBg);
    root.style.setProperty('--color-sidebar-surface', colors.sidebarSurface);
    root.style.setProperty('--color-sidebar-text', colors.sidebarText);
    root.style.setProperty('--color-sidebar-active-bg', colors.sidebarActiveBg);
    root.style.setProperty('--color-sidebar-active-text', colors.sidebarActiveText);
    root.style.setProperty('--color-sidebar-border', colors.sidebarBorder);
    root.style.setProperty('--color-sidebar-highlight', colors.sidebarHighlight);
    root.style.setProperty('--color-header-bg', colors.headerBg);
    root.style.setProperty('--color-header-text', colors.headerText);
    root.style.setProperty('--color-header-border', colors.headerBorder);

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentPalette, isDarkMode]);

  return (
    <ThemeContext.Provider value={{
      currentPalette,
      paletteId,
      setPaletteId,
      isDarkMode,
      setIsDarkMode,
      toggleDarkMode,
      availablePalettes: BRAND_PALETTES,
      lmavScale: LMAV_BLUE_SCALE
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
