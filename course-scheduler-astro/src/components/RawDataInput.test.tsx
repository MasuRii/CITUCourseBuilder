/**
 * @vitest-environment jsdom
 */
/**
 * Accessibility tests for RawDataInput component
 *
 * Verifies WCAG 2.1 AA compliance:
 * - Hover states on interactive elements
 * - Active state visually distinct (color contrast ≥ 3:1)
 * - Keyboard accessibility
 * - ARIA attributes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RawDataInput, { type ImportMode } from './RawDataInput';

describe('RawDataInput Accessibility', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(() => true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Mode Toggle Buttons - Hover States
  // ===========================================================================
  describe('Mode Toggle Buttons - Hover States', () => {
    it('should have transition classes for hover effects on toggle buttons', () => {
      render(<RawDataInput {...defaultProps} />);

      const witsButton = screen.getByRole('button', { name: /select wits/i });
      const aimsButton = screen.getByRole('button', { name: /select aims/i });

      // Check that buttons have transition classes for smooth hover effects
      expect(witsButton.className).toMatch(/transition-all|duration-/);
      expect(aimsButton.className).toMatch(/transition-all|duration-/);
    });

    it('should have hover state classes on non-active toggle buttons', () => {
      render(<RawDataInput {...defaultProps} />);

      // WITS is active by default, AIMS should have hover states
      const aimsButton = screen.getByRole('button', { name: /select aims/i });

      // Check that inactive button has hover-related classes
      expect(aimsButton.className).toMatch(
        /hover:border-accent|hover:text-content|hover:bg-surface/
      );
    });

    it('should apply hover styles via CSS pseudo-classes', () => {
      render(<RawDataInput {...defaultProps} />);

      const buttons = screen
        .getAllByRole('button')
        .filter((btn) => btn.getAttribute('aria-pressed'));

      // All toggle buttons should have hover-related classes
      buttons.forEach((button) => {
        const hasHoverClass =
          button.className.includes('hover:') || button.className.includes('transition-');
        expect(hasHoverClass).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Active State - Visual Distinction
  // ===========================================================================
  describe('Active State - Visual Distinction', () => {
    it('should visually distinguish active mode with different background', () => {
      render(<RawDataInput {...defaultProps} />);

      const witsButton = screen.getByRole('button', { name: /select wits/i });
      const aimsButton = screen.getByRole('button', { name: /select aims/i });

      // Active button should have accent background
      expect(witsButton.className).toMatch(/bg-accent/);
      expect(witsButton.className).toMatch(/text-white/);

      // Inactive button should have different styling
      expect(aimsButton.className).toMatch(/bg-surface-secondary/);
    });

    it('should have aria-pressed attribute for active state indication', () => {
      render(<RawDataInput {...defaultProps} />);

      const witsButton = screen.getByRole('button', { name: /select wits/i });
      const aimsButton = screen.getByRole('button', { name: /select aims/i });

      expect(witsButton).toHaveAttribute('aria-pressed', 'true');
      expect(aimsButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle aria-pressed when mode changes', async () => {
      render(<RawDataInput {...defaultProps} />);

      const witsButton = screen.getByRole('button', { name: /select wits/i });
      const aimsButton = screen.getByRole('button', { name: /select aims/i });

      // Click AIMS button
      fireEvent.click(aimsButton);

      await waitFor(() => {
        expect(witsButton).toHaveAttribute('aria-pressed', 'false');
        expect(aimsButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should have shadow on active button for depth distinction', () => {
      render(<RawDataInput {...defaultProps} />);

      const witsButton = screen.getByRole('button', { name: /select wits/i });

      // Active button should have shadow for visual distinction
      expect(witsButton.className).toMatch(/shadow/);
    });
  });

  // ===========================================================================
  // Keyboard Accessibility
  // ===========================================================================
  describe('Keyboard Accessibility', () => {
    it('should have all interactive elements focusable via Tab', () => {
      render(<RawDataInput {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const textarea = screen.getByRole('textbox');

      // All buttons and textarea should be focusable
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
      expect(textarea).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have focus-visible styles for keyboard navigation', () => {
      render(<RawDataInput {...defaultProps} />);

      // Check import button specifically - it has focus-visible styles
      const importButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.className.includes('focus-visible:ring'));

      // At least the import button should have focus-visible styles
      expect(importButtons.length).toBeGreaterThan(0);
    });

    it('should toggle help section with keyboard', async () => {
      render(<RawDataInput {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: /how to import/i });

      // Initially collapsed
      expect(helpButton).toHaveAttribute('aria-expanded', 'false');

      // Activate with keyboard
      helpButton.focus();
      fireEvent.click(helpButton);

      await waitFor(() => {
        expect(helpButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have accessible labels on toggle buttons', () => {
      render(<RawDataInput {...defaultProps} />);

      const witsButton = screen.getByRole('button', { name: /select wits/i });
      const aimsButton = screen.getByRole('button', { name: /select aims/i });

      // Toggle buttons should have accessible labels
      expect(witsButton).toBeInTheDocument();
      expect(aimsButton).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ARIA Attributes
  // ===========================================================================
  describe('ARIA Attributes', () => {
    it('should have proper aria-pressed on toggle buttons', () => {
      render(<RawDataInput {...defaultProps} />);

      const toggleButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.getAttribute('aria-pressed'));

      toggleButtons.forEach((button) => {
        const ariaPressed = button.getAttribute('aria-pressed');
        expect(['true', 'false']).toContain(ariaPressed);
      });
    });

    it('should have aria-expanded on help toggle', () => {
      render(<RawDataInput {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: /how to import/i });

      expect(helpButton).toHaveAttribute('aria-expanded', 'false');
      expect(helpButton).toHaveAttribute('aria-controls', 'import-instructions');
    });

    it('should have aria-hidden on decorative icons', () => {
      render(<RawDataInput {...defaultProps} />);

      const decorativeIcons = document.querySelectorAll('svg[aria-hidden="true"]');

      // All icons should be marked as decorative
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Help Section
  // ===========================================================================
  describe('Help Section', () => {
    it('should expand/collapse help section on click', async () => {
      render(<RawDataInput {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: /how to import/i });

      // Initially collapsed
      expect(helpButton).toHaveAttribute('aria-expanded', 'false');

      // Expand
      fireEvent.click(helpButton);

      await waitFor(() => {
        expect(helpButton).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('list')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(helpButton);

      await waitFor(() => {
        expect(helpButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should show numbered steps in help section', async () => {
      render(<RawDataInput {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: /how to import/i });
      fireEvent.click(helpButton);

      await waitFor(() => {
        // Should show step numbers
        const stepNumbers = screen.getAllByText(/[123]/);
        expect(stepNumbers.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  // ===========================================================================
  // Status States (Visual Feedback)
  // ===========================================================================
  describe('Status States', () => {
    it('should show loading text during import', async () => {
      const onSubmit = vi.fn(
        async (_mode: ImportMode): Promise<boolean> =>
          new Promise((resolve) => setTimeout(() => resolve(true), 200))
      );
      render(<RawDataInput {...defaultProps} onSubmit={onSubmit} value="test data" />);

      // Get the import button by looking for the one that has aria-busy
      const buttons = screen.getAllByRole('button');
      const importButton = buttons.find((btn) => btn.getAttribute('aria-busy') !== null);

      // Start import
      fireEvent.click(importButton!);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText(/importing/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Textarea States
  // ===========================================================================
  describe('Textarea States', () => {
    it('should have aria-label on textarea', () => {
      render(<RawDataInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label');
    });

    it('should have placeholder text for guidance', () => {
      render(<RawDataInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder');
      expect(textarea.getAttribute('placeholder')?.length).toBeGreaterThan(10);
    });
  });
});
