/**
 * Theme state management hook
 *
 * Manages light/dark theme mode and color palette preferences.
 * Automatically applies theme to document.documentElement and persists to localStorage.
 *
 * @module hooks/useTheme
 * @task T3.2.8 - Extract state management from App.jsx
 */

import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  ALLOWED_VALUES,
  DEFAULT_VALUES,
  LOCAL_STORAGE_KEYS,
  type ColorPalette,
  type ThemeMode,
  type ThemePaletteState,
} from '@/types/index';

/**
 * Return type for useTheme hook
 */
export interface UseThemeReturn {
  /** Current theme mode ('light' or 'dark') */
  theme: ThemeMode;
  /** Set the theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  /** Current palette state for both themes */
  themePalette: ThemePaletteState;
  /** Set the palette for both themes */
  setThemePalette: (palette: ThemePaletteState) => void;
  /** Cycle to the next palette in the palette list */
  cyclePalette: () => void;
  /** Get the current active palette based on current theme */
  currentPalette: ColorPalette;
  /** Set palette for the current theme only */
  setCurrentThemePalette: (palette: ColorPalette) => void;
}

/**
 * A React hook for managing theme state with localStorage persistence
 *
 * This hook manages:
 * - Theme mode (light/dark)
 * - Palette preference per theme
 * - Automatic application to document.documentElement
 *
 * @returns Theme state and controls
 *
 * @example
 * ```tsx
 * const { theme, toggleTheme, currentPalette, cyclePalette } = useTheme();
 *
 * // Toggle light/dark mode
 * <button onClick={toggleTheme}>
 *   Switch to {theme === 'light' ? 'dark' : 'light'} mode
 * </button>
 *
 * // Cycle through palettes
 * <button onClick={cyclePalette}>
 *   Current palette: {currentPalette}
 * </button>
 * ```
 */
export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useLocalStorage(LOCAL_STORAGE_KEYS.THEME, DEFAULT_VALUES.THEME);

  const [themePalette, setThemePalette] = useLocalStorage(
    LOCAL_STORAGE_KEYS.THEME_PALETTE,
    DEFAULT_VALUES.THEME_PALETTE
  );

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  /**
   * Get the current active palette based on current theme
   */
  const currentPalette = themePalette[theme];

  /**
   * Cycle to the next palette
   */
  const cyclePalette = useCallback(() => {
    setThemePalette((prev) => {
      const currentPaletteForTheme = prev[theme];
      const palettes = ALLOWED_VALUES.PALETTES;
      const currentIndex = palettes.indexOf(currentPaletteForTheme);
      const nextIndex = (currentIndex + 1) % palettes.length;
      const nextPalette = palettes[nextIndex];

      return {
        light: nextPalette,
        dark: nextPalette,
      };
    });
  }, [setThemePalette, theme]);

  /**
   * Set palette for the current theme only
   */
  const setCurrentThemePalette = useCallback(
    (palette: ColorPalette) => {
      setThemePalette((prev) => ({
        ...prev,
        [theme]: palette,
      }));
    },
    [setThemePalette, theme]
  );

  /**
   * Apply theme to document.documentElement
   * This effect runs whenever theme or themePalette changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Set theme attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Set palette attribute
    const palette = themePalette[theme];
    if (palette) {
      document.documentElement.setAttribute('data-palette', palette);
    } else {
      document.documentElement.setAttribute('data-palette', 'original');
    }
  }, [theme, themePalette]);

  return {
    theme,
    setTheme,
    toggleTheme,
    themePalette,
    setThemePalette,
    cyclePalette,
    currentPalette,
    setCurrentThemePalette,
  };
}
