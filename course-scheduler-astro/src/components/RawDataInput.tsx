/**
 * RawDataInput Component
 *
 * A React island component for importing course schedule data from WITS or AIMS systems.
 * Provides a welcoming, playful interface with visual feedback during import.
 *
 * @module components/RawDataInput
 * @see docs/architecture/REACT_ISLANDS_HYDRATION.md - Uses client:load for immediate interactivity
 */

import { useState, useCallback, type ChangeEvent, type MouseEvent } from 'react';
import {
  ClipboardList,
  CheckCircle,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  XCircle,
  Loader2,
  Upload,
} from 'lucide-react';

/**
 * Import mode for course data
 * - 'WITS': New WITS system - accepts HTML table data or compact schedule text
 * - 'AIMS': Legacy AIMS system - accepts tab-separated schedule data
 */
export type ImportMode = 'WITS' | 'AIMS';

/**
 * Import status for visual feedback
 * - 'idle': Ready for input
 * - 'loading': Import in progress
 * - 'success': Import completed successfully
 * - 'error': Import failed
 */
export type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Props for the RawDataInput component
 */
export interface RawDataInputProps {
  /** The current value of the textarea input */
  value: string;
  /**
   * Callback fired when the textarea value changes
   * @param event - The change event from the textarea
   */
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  /**
   * Callback fired when the import button is clicked
   * @param mode - The selected import mode ('WITS' or 'AIMS')
   * @returns Promise<boolean> - true if import succeeded, false otherwise
   */
  onSubmit: (mode: ImportMode) => Promise<boolean> | boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Configuration for each import mode
 */
const modeConfig: Record<
  ImportMode,
  { label: string; shortLabel: string; description: string; placeholder: string; steps: string[] }
> = {
  WITS: {
    label: 'WITS (New)',
    shortLabel: 'WITS',
    description: 'Paste HTML table data or compact schedule text from the new WITS system.',
    placeholder:
      '📋 Paste your WITS data here...\n\nYou can paste HTML tables from the WITS website or compact schedule text.',
    steps: [
      'Open WITS and navigate to your schedule',
      'Select and copy the course table data',
      'Paste it here and click Import',
    ],
  },
  AIMS: {
    label: 'AIMS (Legacy)',
    shortLabel: 'AIMS',
    description: 'Paste tab-separated schedule data from the legacy AIMS system.',
    placeholder:
      '📋 Paste your AIMS data here...\n\nCopy the table data from AIMS Section Offering page.',
    steps: [
      'Go to AIMS → Section Offering',
      'Select and copy the table data',
      'Paste it here and click Import',
    ],
  },
};

/**
 * RawDataInput component for importing course schedule data.
 *
 * Features:
 * - Welcoming, playful interface with visual guidance
 * - Toggle between WITS (New) and AIMS (Legacy) import modes
 * - Dynamic placeholder text based on selected mode
 * - Expandable instructions for each mode
 * - Loading animation during import
 * - Visual success/error feedback
 * - Keyboard accessible with focus management
 *
 * @example
 * ```tsx
 * <RawDataInput
 *   value={rawData}
 *   onChange={(e) => setRawData(e.target.value)}
 *   onSubmit={(mode) => handleImport(mode)}
 * />
 * ```
 */
export default function RawDataInput({
  value,
  onChange,
  onSubmit,
  className = '',
}: RawDataInputProps) {
  const [importMode, setImportMode] = useState<ImportMode>('WITS');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [showHelp, setShowHelp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleImport = useCallback(
    async (_event: MouseEvent<HTMLButtonElement>) => {
      if (status === 'loading' || !value.trim()) return;

      setStatus('loading');
      setStatusMessage(null);

      try {
        const result = await onSubmit(importMode);
        if (result) {
          setStatus('success');
          setStatusMessage('Courses imported successfully! 🎉');
          // Reset to idle after showing success
          setTimeout(() => {
            setStatus('idle');
            setStatusMessage(null);
          }, 2000);
        } else {
          setStatus('error');
          setStatusMessage('Import failed. Please check your data format.');
          // Reset to idle after showing error
          setTimeout(() => {
            setStatus('idle');
            setStatusMessage(null);
          }, 3000);
        }
      } catch {
        setStatus('error');
        setStatusMessage('An error occurred during import.');
        setTimeout(() => {
          setStatus('idle');
          setStatusMessage(null);
        }, 3000);
      }
    },
    [importMode, onSubmit, status, value]
  );

  const handleModeChange = useCallback((mode: ImportMode) => {
    return (_event: MouseEvent<HTMLButtonElement>) => {
      setImportMode(mode);
      setStatus('idle');
      setStatusMessage(null);
    };
  }, []);

  const config = modeConfig[importMode];
  const isImporting = status === 'loading';
  const hasContent = value.trim().length > 0;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header with welcoming message */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-content-primary m-0 font-display flex items-center gap-2">
          {/* Clipboard icon */}
          <ClipboardList className="w-6 h-6 text-accent" aria-hidden="true" />
          Import Your Schedule
        </h3>
        <p className="text-sm text-content-secondary m-0">
          Paste your course data from WITS or AIMS to get started
        </p>
      </div>

      {/* Import Mode Toggle - visually styled pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(modeConfig) as ImportMode[]).map((mode) => {
          const isActive = importMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={handleModeChange(mode)}
              className={`
                px-4 py-2 rounded-full font-medium text-sm
                transition-all duration-200 ease-out
                border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                ${
                  isActive
                    ? 'bg-accent text-white border-accent shadow-md transform scale-[1.02]'
                    : 'bg-surface-secondary text-content-secondary border-default hover:border-accent hover:text-content-primary hover:bg-surface-hover'
                }
              `}
              aria-pressed={isActive}
              aria-label={`Select ${modeConfig[mode].label} import mode`}
            >
              <span className="flex items-center gap-2">
                {mode === 'WITS' ? (
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                )}
                {modeConfig[mode].label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Help/Instructions Section - collapsible */}
      <div className="bg-surface-secondary/50 rounded-lg border border-default overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-content-primary hover:bg-surface-hover transition-colors duration-150"
          aria-expanded={showHelp}
          aria-controls="import-instructions"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            How to import {config.shortLabel} data
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showHelp ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        {showHelp && (
          <div id="import-instructions" className="px-4 pb-4 pt-0">
            <ol className="m-0 p-0 list-none space-y-2">
              {config.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-content-secondary">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Textarea with visual styling */}
      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          placeholder={config.placeholder}
          className={`
            w-full min-h-[180px] p-4 rounded-xl border-2 
            bg-surface-input text-content-primary font-mono text-sm
            resize-y transition-all duration-200 ease-out
            placeholder:text-content-secondary placeholder:leading-relaxed
            focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20
            ${status === 'success' ? 'border-success' : ''}
            ${status === 'error' ? 'border-danger' : ''}
            ${status === 'loading' ? 'opacity-70 cursor-wait' : ''}
          `}
          rows={7}
          disabled={isImporting}
          aria-label={`${config.label} data input`}
          aria-describedby={statusMessage ? 'status-message' : undefined}
        />

        {/* Character count indicator */}
        {hasContent && (
          <div className="absolute bottom-3 right-3 text-xs text-content-secondary font-mono">
            {value.length} chars
          </div>
        )}
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          id="status-message"
          role="status"
          aria-live="polite"
          className={`
            flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium
            animate-slide-up
            ${status === 'success' ? 'bg-success/10 text-success border border-success/30' : ''}
            ${status === 'error' ? 'bg-danger/10 text-danger border border-danger/30' : ''}
          `}
        >
          {status === 'success' && <CheckCircle className="w-[18px] h-[18px]" aria-hidden="true" />}
          {status === 'error' && <XCircle className="w-[18px] h-[18px]" aria-hidden="true" />}
          {statusMessage}
        </div>
      )}

      {/* Import Button */}
      <button
        type="button"
        onClick={handleImport}
        disabled={isImporting || !hasContent}
        className={`
          self-start px-6 py-3 rounded-xl font-semibold text-base
          shadow-lg transition-all duration-200 ease-out
          flex items-center gap-2
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
          ${
            isImporting || !hasContent
              ? 'bg-surface-secondary text-content-secondary cursor-not-allowed shadow-none'
              : 'bg-accent text-white hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md'
          }
        `}
        aria-busy={isImporting}
      >
        {isImporting ? (
          <>
            {/* Loading spinner */}
            <Loader2 className="w-[18px] h-[18px] animate-spin" aria-hidden="true" />
            Importing...
          </>
        ) : (
          <>
            {/* Upload icon */}
            <Upload className="w-[18px] h-[18px]" aria-hidden="true" />
            Import {config.shortLabel} Data
          </>
        )}
      </button>
    </div>
  );
}
