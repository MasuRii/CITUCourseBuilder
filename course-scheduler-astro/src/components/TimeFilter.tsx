/**
 * TimeFilter Component
 *
 * A React island component for filtering courses by day and time.
 * Provides day exclusion checkboxes and custom time range exclusion.
 *
 * @module components/TimeFilter
 * @task T3.2.5 - Migrate TimeFilter as React island
 */

import type { ReactNode } from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { DayCode, TimeRange } from '@/types/index';

// ============================================================================
// Types
// ============================================================================

/**
 * Day option for exclusion checkboxes
 */
interface DayOption {
  /** Day code (M, T, W, TH, F, S, SU) */
  readonly code: DayCode;
  /** Full day name for display */
  readonly name: string;
}

/**
 * Props for the TimeFilter component
 */
export interface TimeFilterProps {
  /** Array of day codes to exclude from schedules */
  readonly excludedDays: readonly DayCode[];
  /** Callback when a day exclusion changes */
  readonly onDayChange: (dayCode: DayCode, isExcluded: boolean) => void;
  /** Array of time ranges to exclude */
  readonly excludedTimeRanges: readonly TimeRange[];
  /** Callback when a time range field changes */
  readonly onTimeRangeChange: (id: number, field: 'start' | 'end', value: string) => void;
  /** Callback to add a new time range */
  readonly onAddTimeRange: () => void;
  /** Callback to remove a time range by ID */
  readonly onRemoveTimeRange: (id: number) => void;
}

/**
 * Props for TimePicker component
 */
interface TimePickerProps {
  /** Current selected time value (HH:mm) */
  readonly value: string;
  /** Label for the picker */
  readonly label: string;
  /** Callback when time changes */
  readonly onChange: (value: string) => void;
  /** Placeholder text when no value selected */
  readonly placeholder: string;
  /** Unique ID for accessibility */
  readonly id: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available days for exclusion
 */
const AVAILABLE_DAYS: readonly DayOption[] = [
  { code: 'M', name: 'Monday' },
  { code: 'T', name: 'Tuesday' },
  { code: 'W', name: 'Wednesday' },
  { code: 'TH', name: 'Thursday' },
  { code: 'F', name: 'Friday' },
  { code: 'S', name: 'Saturday' },
  { code: 'SU', name: 'Sunday' },
] as const;

/**
 * Time option for dropdown
 */
interface TimeOption {
  readonly value: string;
  readonly label: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates time options for the select dropdown
 * Creates 30-minute intervals from 7:30 AM to 10:00 PM
 *
 * @returns Array of time options with display and value strings
 */
function generateTimeOptions(): readonly TimeOption[] {
  const options: TimeOption[] = [];

  // Use number type for mutable iteration variables
  let currentHour: number = 7; // Start hour
  let currentMinute: number = 30; // Start minute
  const endHour: number = 22; // End hour (10 PM)
  const endMinute: number = 0;

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    // Format time as HH:mm (24-hour)
    const hours = currentHour.toString().padStart(2, '0');
    const minutes = currentMinute.toString().padStart(2, '0');
    const value = `${hours}:${minutes}`;

    // Format display as h:mm AM/PM (12-hour)
    const displayHour = currentHour % 12 || 12;
    const period = currentHour < 12 ? 'AM' : 'PM';
    const label = `${displayHour}:${minutes} ${period}`;

    options.push({ value, label });

    // Increment by 30 minutes
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }

  return options;
}

/**
 * Formats a 24-hour time string to 12-hour display format
 *
 * @param time - Time in HH:mm format
 * @returns Formatted time string (e.g., "9:00 AM")
 */
function formatTimeDisplay(time: string): string {
  if (!time || !time.includes(':')) {
    return '';
  }

  const [hoursStr, minutes] = time.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);

  const displayHour = hours % 12 || 12;
  const period = hours < 12 ? 'AM' : 'PM';

  return `${displayHour}:${minutes} ${period}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Custom time picker select component styled with Tailwind
 */
function TimePicker({ value, label, onChange, placeholder, id }: TimePickerProps): ReactNode {
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-content-secondary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-md border border-default bg-surface-primary text-content-primary
                   focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                   cursor-pointer min-w-[120px] appearance-none bg-no-repeat bg-right
                   transition-colors hover:border-accent"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '1.25rem',
          backgroundPosition: 'right 0.5rem center',
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {timeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * TimeFilter Component
 *
 * Provides day exclusion checkboxes and time range exclusion functionality
 * for filtering course schedules.
 *
 * @example
 * ```tsx
 * <TimeFilter
 *   excludedDays={['M', 'W']}
 *   onDayChange={(day, excluded) => console.log(day, excluded)}
 *   excludedTimeRanges={[{ id: 1, start: '12:00', end: '14:00' }]}
 *   onTimeRangeChange={(id, field, value) => console.log(id, field, value)}
 *   onAddTimeRange={() => console.log('Add range')}
 *   onRemoveTimeRange={(id) => console.log('Remove', id)}
 * />
 * ```
 */
export default function TimeFilter({
  excludedDays,
  onDayChange,
  excludedTimeRanges,
  onTimeRangeChange,
  onAddTimeRange,
  onRemoveTimeRange,
}: TimeFilterProps): ReactNode {
  // Generate unique IDs for accessibility
  const [instanceId] = useState(() => `timefilter-${Math.random().toString(36).slice(2, 9)}`);

  // Memoize ranges array to prevent unnecessary re-renders
  const ranges = useMemo(
    () => (Array.isArray(excludedTimeRanges) ? excludedTimeRanges : []),
    [excludedTimeRanges]
  );

  // Handle day checkbox toggle
  const handleDayToggle = useCallback(
    (dayCode: DayCode) => {
      const isExcluded = excludedDays.includes(dayCode);
      onDayChange(dayCode, !isExcluded);
    },
    [excludedDays, onDayChange]
  );

  // Handle time change with proper typing
  const handleTimeChange = useCallback(
    (id: number, field: 'start' | 'end', value: string) => {
      onTimeRangeChange(id, field, value);
    },
    [onTimeRangeChange]
  );

  return (
    <div className="space-y-6">
      {/* Day Exclusion Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-content-primary">Exclude Days</h3>
        <p className="text-sm text-content-secondary">
          Select days to exclude from schedule generation.
        </p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_DAYS.map((day) => {
            const isExcluded = excludedDays.includes(day.code);
            return (
              <button
                key={day.code}
                type="button"
                onClick={() => handleDayToggle(day.code)}
                aria-pressed={isExcluded}
                aria-label={`${isExcluded ? 'Include' : 'Exclude'} ${day.name}`}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                  ${
                    isExcluded
                      ? 'bg-accent text-white shadow-md'
                      : 'bg-surface-secondary text-content-secondary border border-default hover:border-accent hover:text-content-primary'
                  }`}
              >
                {day.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Range Exclusion Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-content-primary">Exclude Time Ranges</h3>
        <p className="text-sm text-content-secondary">
          Add time ranges to exclude from schedule generation (e.g., lunch breaks).
        </p>

        {/* Time Range List */}
        <div className="space-y-3">
          {ranges.map((range, index) => (
            <div
              key={range.id}
              className="flex items-start gap-3 p-4 rounded-lg bg-surface-elevated border border-default"
            >
              {/* Range Index */}
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent text-white text-sm font-medium">
                {index + 1}
              </span>

              {/* Time Pickers */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <TimePicker
                  value={range.start}
                  label="From"
                  onChange={(value) => handleTimeChange(range.id, 'start', value)}
                  placeholder="Start time"
                  id={`${instanceId}-range-${range.id}-start`}
                />
                <TimePicker
                  value={range.end}
                  label="To"
                  onChange={(value) => handleTimeChange(range.id, 'end', value)}
                  placeholder="End time"
                  id={`${instanceId}-range-${range.id}-end`}
                />
              </div>

              {/* Display formatted time range */}
              {range.start && range.end && (
                <div className="text-sm text-content-secondary self-center hidden sm:block">
                  <span className="font-medium text-content-primary">
                    {formatTimeDisplay(range.start)}
                  </span>
                  <span className="mx-1">-</span>
                  <span className="font-medium text-content-primary">
                    {formatTimeDisplay(range.end)}
                  </span>
                </div>
              )}

              {/* Remove Button */}
              {ranges.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveTimeRange(range.id)}
                  aria-label={`Remove time range ${index + 1}`}
                  className="flex-shrink-0 p-2 rounded-md text-content-secondary
                             hover:text-danger hover:bg-danger/10 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Range Button */}
        <button
          type="button"
          onClick={onAddTimeRange}
          className="flex items-center gap-2 px-4 py-2 rounded-md
                     text-accent hover:bg-accent/10 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="font-medium">Add Time Range</span>
        </button>
      </div>
    </div>
  );
}
