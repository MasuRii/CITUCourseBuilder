/**
 * ThemeToggle Component
 *
 * A React island component that provides theme and palette switching functionality.
 * Supports 2 themes (light/dark) and 3 palettes (original/comfort/space)
 * for a total of 6 theme combinations.
 *
 * Features:
 * - Smooth icon rotation animation when switching themes
 * - Scale animation on hover
 * - Color preview dots for palette selection
 * - Full keyboard accessibility
 *
 * Uses localStorage for persistence with the keys:
 * - courseBuilder_theme: 'light' | 'dark'
 * - courseBuilder_palette: 'original' | 'comfort' | 'space'
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

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

// Palette color preview dots
const paletteColors: Record<Palette, { primary: string; secondary: string }> = {
  original: { primary: '#6366f1', secondary: '#4f46e5' },
  comfort: { primary: '#888888', secondary: '#0855b1' },
  space: { primary: '#2a9d8f', secondary: '#e9c46a' },
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

  // Animation state for icon rotation
  const [isAnimating, setIsAnimating] = useState(false);

  // Apply theme changes to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('courseBuilder_theme', theme);
    localStorage.setItem('courseBuilder_palette', palette);
  }, [theme, palette]);

  const toggleTheme = useCallback(() => {
    setIsAnimating(true);
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 300);
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
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-24 h-10 bg-white/10 animate-pulse rounded-lg" />
        <div className="w-24 h-10 bg-white/10 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        aria-pressed={theme === 'dark'}
      >
        <span className={`theme-icon ${isAnimating ? 'animating' : ''}`}>
          {theme === 'light' ? (
            // Moon icon (for switching to dark)
            <Moon className="icon-moon" aria-hidden="true" />
          ) : (
            // Sun icon (for switching to light)
            <Sun className="icon-sun" aria-hidden="true" />
          )}
        </span>
        <span className="theme-label">{themeLabels[theme]}</span>
      </button>

      {/* Palette Cycle Button */}
      <button
        onClick={cyclePalette}
        className="palette-toggle-btn"
        aria-label={`Cycle color palette. Current: ${paletteLabels[palette]}`}
      >
        {/* Palette color preview dots */}
        <div className="palette-preview" aria-hidden="true">
          <span
            className="palette-dot"
            style={{ backgroundColor: paletteColors[palette].primary }}
          />
          <span
            className="palette-dot"
            style={{ backgroundColor: paletteColors[palette].secondary }}
          />
        </div>
        <span className="palette-label">{paletteLabels[palette]}</span>
      </button>

      <style>{`
        .theme-toggle-btn,
        .palette-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
          border: none;
        }

        .theme-toggle-btn {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          backdrop-filter: blur(4px);
        }

        .theme-toggle-btn:hover {
          background-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .theme-toggle-btn:active {
          transform: translateY(0);
        }

        .theme-toggle-btn:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 2px;
        }

        .theme-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          transition: transform 300ms ease;
        }

        .theme-icon.animating {
          animation: icon-spin 300ms ease;
        }

        @keyframes icon-spin {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(0.8);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        .icon-moon,
        .icon-sun {
          width: 20px;
          height: 20px;
        }

        .theme-label {
          line-height: 1;
        }

        .palette-toggle-btn {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .palette-toggle-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .palette-toggle-btn:active {
          transform: translateY(0);
        }

        .palette-toggle-btn:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 2px;
        }

        .palette-preview {
          display: flex;
          gap: 4px;
        }

        .palette-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: transform 150ms ease;
        }

        .palette-toggle-btn:hover .palette-dot {
          transform: scale(1.2);
        }

        .palette-label {
          line-height: 1;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .theme-toggle-btn,
          .palette-toggle-btn {
            padding: 6px 12px;
            font-size: 12px;
          }

          .palette-dot {
            width: 8px;
            height: 8px;
          }
        }

        @media (max-width: 360px) {
          .theme-label,
          .palette-label {
            display: none;
          }

          .theme-toggle-btn,
          .palette-toggle-btn {
            padding: 8px;
            min-width: 36px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default ThemeToggle;
