/**
 * ConfirmDialog Component
 *
 * A React island component for confirmation dialogs with support for different variants.
 * Provides accessible modal dialogs with keyboard navigation (Escape to close).
 *
 * @module components/ConfirmDialog
 * @see docs/architecture/REACT_ISLANDS_HYDRATION.md - Uses client:load for immediate interactivity
 */

import { useEffect, useCallback, type KeyboardEvent } from 'react';
import { Info, AlertTriangle } from 'lucide-react';

/**
 * Dialog variant type
 * - 'info': Information dialog with accent color
 * - 'warning': Warning dialog with yellow/amber color
 * - 'danger': Danger dialog with red color (used for destructive actions)
 */
export type DialogVariant = 'info' | 'warning' | 'danger';

/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is currently open */
  open: boolean;
  /** Dialog title (default: 'Confirm') */
  title?: string;
  /** Dialog message content (default: '') */
  message?: string;
  /** Callback fired when the confirm button is clicked */
  onConfirm: () => void;
  /** Callback fired when the cancel button is clicked or dialog is dismissed */
  onCancel: () => void;
  /** Text for the confirm button (default: 'Confirm') */
  confirmText?: string;
  /** Text for the cancel button (default: 'Cancel') */
  cancelText?: string;
  /**
   * Dialog variant controlling icon and color scheme
   * - 'info': Information dialog (accent color)
   * - 'warning': Warning dialog (yellow/amber)
   * - 'danger': Danger dialog (red, for destructive actions)
   * @default 'info'
   */
  variant?: DialogVariant;
}

/**
 * Configuration for dialog icons based on variant
 */
const iconConfig: Record<DialogVariant, { type: 'info' | 'warning'; colorClass: string }> = {
  info: {
    type: 'info',
    colorClass: 'text-accent',
  },
  warning: {
    type: 'warning',
    colorClass: 'text-warning',
  },
  danger: {
    type: 'warning',
    colorClass: 'text-danger-button-bg',
  },
};

/**
 * ConfirmDialog component for user confirmation dialogs.
 *
 * Features:
 * - Accessible modal dialog with ARIA attributes
 * - Keyboard navigation (Escape to close, Tab to focus trap)
 * - Three variants: info, warning, danger
 * - Automatic variant detection based on confirmText (delete/clear keywords)
 * - Tailwind styled with theme support
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDialog}
 *   title="Delete Course"
 *   message="Are you sure you want to delete this course?"
 *   variant="danger"
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message = '',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}: ConfirmDialogProps) {
  // Determine actual variant based on props and confirmText content
  const actualVariant: DialogVariant =
    variant === 'danger' ||
    confirmText.toLowerCase().includes('delete') ||
    confirmText.toLowerCase().includes('clear')
      ? 'danger'
      : variant;

  const { type: iconType, colorClass } = iconConfig[actualVariant];

  // Handle Escape key to close dialog
  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  // Add/remove keyboard event listener
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Handle click on backdrop to close
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  // Handle dialog key events for accessibility
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onConfirm();
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="relative z-[var(--z-modal)] w-full max-w-md bg-surface-secondary text-content-primary
                   rounded-xl shadow-xl min-w-[340px] animate-in fade-in zoom-in-95 duration-150"
        role={actualVariant === 'danger' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onKeyDown={handleDialogKeyDown}
      >
        {/* Header */}
        <div id="confirm-dialog-title" className="flex items-center gap-3 p-6 pb-0">
          {iconType === 'info' ? (
            <Info className={`w-9 h-9 ${colorClass} flex-shrink-0`} aria-hidden="true" />
          ) : (
            <AlertTriangle className={`w-9 h-9 ${colorClass} flex-shrink-0`} aria-hidden="true" />
          )}
          <span className="text-lg font-semibold">{title}</span>
        </div>

        {/* Content */}
        <div className="p-6">
          <p
            id="confirm-dialog-description"
            className="text-base text-content-secondary leading-relaxed m-0"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 pt-0">
          {/* Cancel button - styled based on variant */}
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 font-medium rounded-lg
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                         actualVariant === 'danger'
                           ? 'text-white bg-gray-600 hover:bg-gray-500'
                           : 'text-content-primary hover:bg-surface-hover'
                       }`}
          >
            {cancelText}
          </button>
          {/* Confirm button - styled based on variant */}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 font-medium rounded-lg
                       transition-colors duration-150 ${
                         actualVariant === 'danger'
                           ? 'text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/50'
                           : 'text-white bg-accent hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent/30'
                       }`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
