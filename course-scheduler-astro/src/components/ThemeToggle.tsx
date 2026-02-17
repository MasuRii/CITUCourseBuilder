/**
 * ThemeToggle Component
 *
 * A React island component that provides theme and palette switching functionality.
 * Supports 2 themes (light/dark) and 3 palettes (original/comfort/space)
 * for a total of 6 theme combinations.
 *
 * Uses localStorage for persistence with the keys:
 * - courseBuilder_theme: 'light' | 'dark'
 * - courseBuilder_palette: 'original' | 'comfort' | 'space'
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
type Palette = 'original' | 'comfort' | 'space';

interface ThemeToggleProps {
  /** Additional CSS classes to apply to the container */
  className?: string;
}

const palettes: Palette[] = ['original', 'comfort', 'space'];

const paletteLabels: Record<Palette, string> = {
  original: 'Original',
  comfort: 'Comfort',
  space: 'Space',
};

const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
};

// Helper to check if we're on the client
function getSnapshot(): boolean {
  return typeof window !== 'undefined';
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(_callback: () => void): () => void {
  // No subscription needed - this just detects client-side
  return () => {};
}

/**
 * Get initial theme from localStorage or default to 'dark'
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('courseBuilder_theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

/**
 * Get initial palette from localStorage or default to 'original'
 */
function getInitialPalette(): Palette {
  if (typeof window === 'undefined') return 'original';
  const saved = localStorage.getItem('courseBuilder_palette') as Palette | null;
  return saved && palettes.includes(saved) ? saved : 'original';
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  // Use useSyncExternalStore to detect client-side mounting
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Initialize theme and palette from localStorage using lazy initialization
  // This avoids the need to set state in useEffect
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [palette, setPalette] = useState<Palette>(getInitialPalette);

  // Apply theme changes to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('courseBuilder_theme', theme);
    localStorage.setItem('courseBuilder_palette', palette);
  }, [theme, palette]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const cyclePalette = useCallback(() => {
    setPalette((prev) => {
      const currentIndex = palettes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % palettes.length;
      return palettes[nextIndex];
    });
  }, []);

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="w-24 h-10 bg-surface-secondary animate-pulse rounded-md" />
        <div className="w-24 h-10 bg-surface-secondary animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="px-4 py-2 rounded-md bg-surface-header text-content-header
                   hover:opacity-90 transition-all duration-150
                   flex items-center gap-2 font-medium"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
        <span>{themeLabels[theme]}</span>
      </button>

      {/* Palette Cycle Button */}
      <button
        onClick={cyclePalette}
        className="px-4 py-2 rounded-md border border-default
                   hover:bg-surface-hover transition-all duration-150
                   flex items-center gap-2 font-medium"
        aria-label="Cycle color palette"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span>{paletteLabels[palette]}</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
