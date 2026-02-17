/**
 * Header Accessibility Tests
 *
 * Tests for header component accessibility compliance.
 * Verifies:
 * - Proper ARIA attributes (role="banner", aria-label)
 * - ThemeToggle accessibility features (aria-label, aria-pressed)
 * - CSS hover states are defined
 * - Header includes required elements (logo, title, theme toggle)
 * - No accessibility violations in component structure
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(PROJECT_ROOT, 'src/components');

describe('Header Accessibility', () => {
  describe('Header.astro', () => {
    let headerContent: string;

    beforeAll(() => {
      const headerPath = join(COMPONENTS_DIR, 'Header.astro');
      headerContent = existsSync(headerPath) ? readFileSync(headerPath, 'utf-8') : '';
    });

    it('should have role="banner" attribute', () => {
      expect(headerContent).toContain('role="banner"');
    });

    it('should have proper heading structure (h1)', () => {
      expect(headerContent).toMatch(/<h1[^>]*class="header-title"/);
    });

    it('should include logo element', () => {
      expect(headerContent).toContain('class="logo');
      expect(headerContent).toContain('logo-light');
      expect(headerContent).toContain('logo-dark');
    });

    it('should have aria-hidden on decorative elements', () => {
      // Logo images should be aria-hidden (title provides the accessible name)
      expect(headerContent).toMatch(/<img[^>]*aria-hidden="true"/);
      // Decoration circles should be aria-hidden
      expect(headerContent).toContain('aria-hidden="true"');
    });

    it('should have accessible link to home', () => {
      expect(headerContent).toContain('aria-label="CIT-U Course Builder - Home"');
    });

    it('should include ThemeToggle component', () => {
      expect(headerContent).toContain("import ThemeToggle from './ThemeToggle'");
      expect(headerContent).toContain('<ThemeToggle');
    });

    it('should define hover states in CSS', () => {
      expect(headerContent).toMatch(/:hover/);
    });

    it('should define focus-visible states for keyboard navigation', () => {
      expect(headerContent).toContain(':focus-visible');
    });

    it('should have smooth transitions defined', () => {
      expect(headerContent).toContain('transition:');
    });
  });

  describe('ThemeToggle.tsx', () => {
    let toggleContent: string;

    beforeAll(() => {
      const togglePath = join(COMPONENTS_DIR, 'ThemeToggle.tsx');
      toggleContent = existsSync(togglePath) ? readFileSync(togglePath, 'utf-8') : '';
    });

    it('should have TypeScript interface with JSDoc comments', () => {
      expect(toggleContent).toContain('interface ThemeToggleProps');
      expect(toggleContent).toContain('/**');
      expect(toggleContent).toContain('Additional CSS classes');
    });

    it('should have aria-label on theme toggle button', () => {
      expect(toggleContent).toContain(
        "aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}"
      );
    });

    it('should have aria-pressed on theme toggle button', () => {
      expect(toggleContent).toContain("aria-pressed={theme === 'dark'}");
    });

    it('should have aria-label on palette toggle button', () => {
      expect(toggleContent).toContain('aria-label');
      expect(toggleContent).toContain('Cycle color palette');
    });

    it('should have aria-hidden on decorative preview dots', () => {
      expect(toggleContent).toContain('aria-hidden="true"');
    });

    it('should not use any types', () => {
      expect(toggleContent).not.toMatch(/: any\b/);
    });

    it('should have focus-visible styles for keyboard navigation', () => {
      expect(toggleContent).toContain(':focus-visible');
    });

    it('should have hover states for interactive feedback', () => {
      expect(toggleContent).toContain(':hover');
    });

    it('should have smooth transitions', () => {
      expect(toggleContent).toContain('transition:');
    });
  });

  describe('Global CSS Accessibility', () => {
    let globalCssContent: string;

    beforeAll(() => {
      const cssPath = join(PROJECT_ROOT, 'src/styles/global.css');
      globalCssContent = existsSync(cssPath) ? readFileSync(cssPath, 'utf-8') : '';
    });

    it('should define focus-visible outline styles', () => {
      expect(globalCssContent).toContain(':focus-visible');
      expect(globalCssContent).toContain('outline:');
    });

    it('should have sufficient focus outline offset', () => {
      expect(globalCssContent).toContain('outline-offset');
    });

    it('should define button styles with accessible contrast', () => {
      expect(globalCssContent).toContain('.btn-primary');
      expect(globalCssContent).toContain('.btn:focus-visible');
    });

    it('should define toggle button styles with aria-pressed support', () => {
      expect(globalCssContent).toContain('.toggle');
      expect(globalCssContent).toContain("aria-pressed='true'");
    });
  });
});
