/**
 * RawDataInput Component
 *
 * A React island component for importing course schedule data from WITS or AIMS systems.
 * Provides a toggle between two import modes with contextual placeholders.
 *
 * @module components/RawDataInput
 * @see docs/architecture/REACT_ISLANDS_HYDRATION.md - Uses client:load for immediate interactivity
 */

import { useState, useCallback, type ChangeEvent, type MouseEvent } from 'react';

/**
 * Import mode for course data
 * - 'WITS': New WITS system - accepts HTML table data or compact schedule text
 * - 'AIMS': Legacy AIMS system - accepts tab-separated schedule data
 */
type ImportMode = 'WITS' | 'AIMS';

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
   */
  onSubmit: (mode: ImportMode) => void;
}

/**
 * Configuration for each import mode
 */
const modeConfig: Record<ImportMode, { label: string; description: string; placeholder: string }> =
  {
    WITS: {
      label: 'WITS (New)',
      description: 'Paste HTML table data or compact schedule text from WITS.',
      placeholder: 'Copy-paste the WITS table here (HTML or compact text format)',
    },
    AIMS: {
      label: 'AIMS (Legacy)',
      description: 'Paste tab-separated schedule data from AIMS (Legacy).',
      placeholder: 'Go to AIMS -> Section Offering and copy-paste the table data here',
    },
  };

/**
 * RawDataInput component for importing course schedule data.
 *
 * Features:
 * - Toggle between WITS (New) and AIMS (Legacy) import modes
 * - Dynamic placeholder text based on selected mode
 * - Responsive textarea with monospace font for data input
 * - Import button with upload icon
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
export default function RawDataInput({ value, onChange, onSubmit }: RawDataInputProps) {
  const [importMode, setImportMode] = useState<ImportMode>('WITS');

  const handleImport = useCallback(
    (_event: MouseEvent<HTMLButtonElement>) => {
      onSubmit(importMode);
    },
    [importMode, onSubmit]
  );

  const handleModeChange = useCallback((mode: ImportMode) => {
    return (_event: MouseEvent<HTMLButtonElement>) => {
      setImportMode(mode);
    };
  }, []);

  const config = modeConfig[importMode];

  return (
    <div className="flex flex-col gap-3">
      {/* Import Mode Toggle */}
      <div className="flex gap-2 p-1 bg-surface-secondary rounded-lg border border-default w-fit">
        <button
          type="button"
          onClick={handleModeChange('WITS')}
          className={`px-4 py-1 rounded-md font-medium transition-all duration-150 ${
            importMode === 'WITS'
              ? 'bg-accent text-white shadow-md'
              : 'bg-transparent text-content-secondary hover:bg-surface-hover hover:text-content-primary'
          }`}
          aria-pressed={importMode === 'WITS'}
        >
          {modeConfig.WITS.label}
        </button>
        <button
          type="button"
          onClick={handleModeChange('AIMS')}
          className={`px-4 py-1 rounded-md font-medium transition-all duration-150 ${
            importMode === 'AIMS'
              ? 'bg-accent text-white shadow-md'
              : 'bg-transparent text-content-secondary hover:bg-surface-hover hover:text-content-primary'
          }`}
          aria-pressed={importMode === 'AIMS'}
        >
          {modeConfig.AIMS.label}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-content-secondary leading-relaxed m-0">{config.description}</p>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={config.placeholder}
        className="min-h-[150px] p-4 rounded-lg border border-input bg-surface-input text-content-input
                   font-mono text-sm resize-y transition-all duration-150
                   focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30
                   placeholder:text-content-secondary/50"
        rows={6}
      />

      {/* Import Button */}
      <button
        type="button"
        onClick={handleImport}
        className="self-start px-5 py-3 bg-accent text-white font-semibold rounded-lg
                   shadow-md hover:bg-accent-hover hover:-translate-y-px
                   transition-all duration-150 flex items-center gap-2 mt-2"
      >
        {/* Upload Icon (inline SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        Import {config.label} Data
      </button>
    </div>
  );
}
