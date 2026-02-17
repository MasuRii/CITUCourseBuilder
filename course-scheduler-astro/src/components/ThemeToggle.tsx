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

import { useState, useEffect, useCallback } from 'react';

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

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [palette, setPalette] = useState<Palette>('original');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('courseBuilder_theme') as Theme | null;
    const savedPalette = localStorage.getItem('courseBuilder_palette') as Palette | null;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    }
    if (savedPalette && palettes.includes(savedPalette)) {
      setPalette(savedPalette);
    }
    setMounted(true);
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    if (!mounted) return;
    
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('courseBuilder_theme', theme);
    localStorage.setItem('courseBuilder_palette', palette);
  }, [theme, palette, mounted]);

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

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span>{paletteLabels[palette]}</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
