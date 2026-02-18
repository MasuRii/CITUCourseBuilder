/**
 * Toast Notification System
 *
 * Custom Tailwind-styled toast notifications replacing react-toastify.
 * Features playful animations, progress bar, and theme-aware styling.
 *
 * @module components/Toast
 * @see docs/architecture/ADR-002-ui-component-strategy.md - Custom Tailwind components
 */

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/**
 * Toast notification type variants
 * Each type has a distinct color and icon for visual clarity
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Individual toast message data
 */
export interface ToastMessage {
  /** Unique identifier for the toast */
  id: number;
  /** Type determines the color scheme and icon */
  type: ToastType;
  /** The message content to display */
  message: string;
  /** Duration in milliseconds before auto-dismiss (default: 4000) */
  duration?: number;
  /** Optional title for more context */
  title?: string;
}

/**
 * Props for individual Toast component
 */
export interface ToastProps {
  /** The toast message data */
  toast: ToastMessage;
  /** Callback when toast is dismissed (either by user or timeout) */
  onDismiss: (id: number) => void;
}

/**
 * Props for ToastContainer component
 */
export interface ToastContainerProps {
  /** Array of toast messages to display */
  toasts: ToastMessage[];
  /** Callback when a toast is dismissed */
  onDismiss: (id: number) => void;
  /** Position of the toast container (default: top-center) */
  position?:
    | 'top-center'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-center'
    | 'top-left'
    | 'bottom-left';
}

// ============================================================================
// Constants
// ============================================================================

/** Default duration for toast notifications in milliseconds */
const DEFAULT_DURATION = 4000;

/** Map of toast types to their Lucide icons */
const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

// ============================================================================
// Toast Component
// ============================================================================

/**
 * Individual Toast Notification Component
 *
 * Displays a single toast notification with:
 * - Animated entrance and exit
 * - Progress bar showing remaining time
 * - Icon based on toast type
 * - Close button for manual dismissal
 * - Hover state to pause progress
 *
 * @example
 * ```tsx
 * <Toast
 *   toast={{ id: 1, type: 'success', message: 'Course imported!' }}
 *   onDismiss={(id) => console.log('Dismissed:', id)}
 * />
 * ```
 */
function Toast({ toast, onDismiss }: ToastProps): ReactNode {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = toast.duration ?? DEFAULT_DURATION;

  /**
   * Handle toast dismissal with exit animation
   */
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Match exit animation duration
  }, [onDismiss, toast.id]);

  // Handle progress bar animation
  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const initialProgress = progress;
    const remainingTime = (initialProgress / 100) * duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, ((remainingTime - elapsed) / duration) * 100);

      setProgress(newProgress);

      if (newProgress <= 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, duration, progress, handleDismiss]);

  /**
   * Get background and text colors based on toast type
   */
  const getTypeStyles = (): string => {
    switch (toast.type) {
      case 'success':
        return 'bg-success text-slate-900';
      case 'error':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning text-slate-900';
      case 'info':
        return 'bg-info text-white';
      default:
        return 'bg-accent text-white';
    }
  };

  /**
   * Check if this toast type uses light text (for button styling)
   */
  const hasLightText = (): boolean => {
    return toast.type === 'error' || toast.type === 'info';
  };

  /**
   * Get progress bar color based on toast type
   */
  const getProgressColor = (): string => {
    if (hasLightText()) {
      return 'bg-white/30';
    }
    return 'bg-slate-900/30';
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        relative flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg
        min-w-[300px] max-w-md w-full
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
        ${getTypeStyles()}
        animate-slide-up
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5 animate-bounce-once">{TOAST_ICONS[toast.type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-sm mb-1">{toast.title}</p>}
        <p className="text-sm leading-snug break-words">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className={`flex-shrink-0 p-1 rounded transition-colors
                    focus:outline-none focus:ring-2 ${
                      hasLightText()
                        ? 'hover:bg-white/20 focus:ring-white/50'
                        : 'hover:bg-slate-900/20 focus:ring-slate-900/50'
                    }`}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      <div
        className="absolute bottom-0 left-0 h-1 rounded-b-lg transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      >
        <div className={`h-full w-full rounded-b-lg ${getProgressColor()}`} />
      </div>
    </div>
  );
}

// ============================================================================
// ToastContainer Component
// ============================================================================

/**
 * Toast Container Component
 *
 * Manages the positioning and stacking of multiple toast notifications.
 * Toasts are stacked vertically with proper spacing and z-index management.
 *
 * @example
 * ```tsx
 * <ToastContainer
 *   toasts={toasts}
 *   onDismiss={handleDismiss}
 *   position="top-center"
 * />
 * ```
 */
export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-center',
}: ToastContainerProps): ReactNode {
  if (toasts.length === 0) return null;

  /**
   * Get position styles based on the position prop
   */
  const getPositionStyles = (): string => {
    switch (position) {
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2 items-center';
      case 'top-right':
        return 'top-4 right-4 items-end';
      case 'top-left':
        return 'top-4 left-4 items-start';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-right':
        return 'bottom-4 right-4 items-end';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start';
      default:
        return 'top-4 left-1/2 -translate-x-1/2 items-center';
    }
  };

  return (
    <div
      className={`fixed z-toast flex flex-col gap-2 w-auto max-w-[calc(100%-2rem)] ${getPositionStyles()}`}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Hook and Context (Optional - for more advanced use)
// ============================================================================

/**
 * Simple toast function for dispatching toast messages
 * Uses a global Set of listeners to dispatch messages
 *
 * @example
 * ```tsx
 * import { toast } from '@/components/Toast';
 *
 * toast.success('Course imported successfully!');
 * toast.error('Failed to import courses');
 * ```
 */

// Global state for toast listeners
const toastListeners = new Set<(toast: ToastMessage) => void>();
let toastId = 0;

/**
 * Subscribe to toast events
 * @param listener - Callback function to receive toast messages
 * @returns Cleanup function to unsubscribe
 */
// eslint-disable-next-line react-refresh/only-export-components
export function subscribeToToasts(listener: (toast: ToastMessage) => void): () => void {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

/**
 * Dispatch a toast message to all listeners
 */
function dispatchToast(
  type: ToastType,
  message: string,
  options?: { duration?: number; title?: string }
): void {
  const id = ++toastId;
  const toastMessage: ToastMessage = {
    id,
    type,
    message,
    duration: options?.duration,
    title: options?.title,
  };
  toastListeners.forEach((listener) => listener(toastMessage));
}

/**
 * Toast API object with convenience methods for each toast type
 * @example
 * ```tsx
 * import { toast } from '@/components/Toast';
 * toast.success('Course imported successfully!');
 * toast.error('Failed to import courses');
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  /**
   * Show a success toast notification
   * @param message - The message to display
   * @param options - Optional duration and title
   */
  success: (message: string, options?: { duration?: number; title?: string }): void => {
    dispatchToast('success', message, options);
  },

  /**
   * Show an error toast notification
   * @param message - The message to display
   * @param options - Optional duration and title
   */
  error: (message: string, options?: { duration?: number; title?: string }): void => {
    dispatchToast('error', message, options);
  },

  /**
   * Show a warning toast notification
   * @param message - The message to display
   * @param options - Optional duration and title
   */
  warning: (message: string, options?: { duration?: number; title?: string }): void => {
    dispatchToast('warning', message, options);
  },

  /**
   * Show an info toast notification
   * @param message - The message to display
   * @param options - Optional duration and title
   */
  info: (message: string, options?: { duration?: number; title?: string }): void => {
    dispatchToast('info', message, options);
  },

  /**
   * Show a custom toast notification
   * @param type - The toast type
   * @param message - The message to display
   * @param options - Optional duration and title
   */
  show: (
    type: ToastType,
    message: string,
    options?: { duration?: number; title?: string }
  ): void => {
    dispatchToast(type, message, options);
  },
};

export default ToastContainer;
