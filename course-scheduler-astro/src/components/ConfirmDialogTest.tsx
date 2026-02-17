/**
 * ConfirmDialogTest Component
 *
 * A test wrapper for the ConfirmDialog component that manages dialog state.
 * Provides test buttons for all three dialog variants.
 *
 * @module components/ConfirmDialogTest
 */

import { useState, useCallback } from 'react';
import ConfirmDialog, { type DialogVariant } from './ConfirmDialog';

/** Configuration for each test dialog */
interface DialogConfig {
  variant: DialogVariant;
  title: string;
  message: string;
  confirmText: string;
}

/** Dialog test configurations */
const dialogConfigs: Record<string, DialogConfig> = {
  info: {
    variant: 'info',
    title: 'Information',
    message: 'This is an informational message. Press Confirm or Cancel to close.',
    confirmText: 'OK',
  },
  warning: {
    variant: 'warning',
    title: 'Warning',
    message: 'This is a warning message. Please review before proceeding.',
    confirmText: 'Proceed',
  },
  danger: {
    variant: 'danger',
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
  },
};

/**
 * Test wrapper component for ConfirmDialog.
 * Manages dialog open/close state and provides test buttons for all variants.
 */
export default function ConfirmDialogTest() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const handleOpen = useCallback((dialogKey: string) => {
    return () => {
      setActiveDialog(dialogKey);
    };
  }, []);

  const handleClose = useCallback(() => {
    setActiveDialog(null);
  }, []);

  const handleConfirm = useCallback(() => {
    console.log(`Confirmed action for: ${activeDialog}`);
    setActiveDialog(null);
  }, [activeDialog]);

  return (
    <div>
      {/* Test buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleOpen('info')}
          className="px-4 py-2 rounded-md bg-interactive-primary text-white hover:bg-interactive-primary-hover transition-colors"
        >
          Info Dialog
        </button>
        <button
          type="button"
          onClick={handleOpen('warning')}
          className="px-4 py-2 rounded-md bg-warning text-black hover:opacity-80 transition-opacity"
        >
          Warning Dialog
        </button>
        <button
          type="button"
          onClick={handleOpen('danger')}
          className="px-4 py-2 rounded-md bg-danger text-white hover:opacity-80 transition-opacity"
        >
          Delete Dialog
        </button>
      </div>

      {/* Dialog instances */}
      {Object.entries(dialogConfigs).map(([key, config]) => (
        <ConfirmDialog
          key={key}
          open={activeDialog === key}
          title={config.title}
          message={config.message}
          variant={config.variant}
          confirmText={config.confirmText}
          onConfirm={handleConfirm}
          onCancel={handleClose}
        />
      ))}
    </div>
  );
}
