/**
 * Icons Module
 *
 * Re-exports Lucide React icons with consistent styling and sizing conventions.
 * All icons are tree-shakeable and follow the "hobby student" aesthetic.
 *
 * @module components/Icons
 * @see docs/architecture/decisions/ADR-002-ui-component-strategy.md - Icon mapping strategy
 *
 * Usage:
 * ```tsx
 * import { Check, X, AlertTriangle } from '@/components/Icons';
 *
 * <Check className="w-4 h-4" />
 * ```
 */

// ============================================================================
// Re-export Lucide Icons
// ============================================================================

// Status and feedback icons
export { Check, X, AlertTriangle, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Lock/unlock icons
export { Lock, Unlock } from 'lucide-react';

// Action icons
export {
  Trash2,
  Download,
  Copy,
  ExternalLink,
  MoreVertical,
  Menu,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';

// Theme icons
export { Sun, Moon, Palette } from 'lucide-react';

// Time/date icons
export { Calendar, CalendarDays, Clock } from 'lucide-react';

// Export/file icons
export { Image, FileText, FileSpreadsheet } from 'lucide-react';

// Navigation icons
export { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

// UI icons
export { Filter, Search, Settings, HelpCircle, Eye, EyeOff } from 'lucide-react';

// Content icons
export { BookOpen, MapPin, User, Users } from 'lucide-react';

// ============================================================================
// Icon Size Utilities
// ============================================================================

/**
 * Standard icon size classes for consistent sizing across the application.
 * Use these constants to ensure consistent icon sizing.
 */
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

/**
 * Type for icon size keys
 */
export type IconSize = keyof typeof ICON_SIZES;
