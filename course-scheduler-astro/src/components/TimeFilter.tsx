/**
 * TimeFilter Component
 *
 * A React island component for filtering courses by day and time.
 * Features playful, modern styling with animated buttons, icons,
 * and clear visual feedback on filter changes.
 *
 * @module components/TimeFilter
 * @task T3.2.5 - Migrate TimeFilter as React island
 * @task T4.2.5 - Redesign with playful styling
 */

import type { ReactNode } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Check } from 'lucide-react';
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
  /** Short display name */
  readonly shortName: string;
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
 * Available days for exclusion with short names
 */
const AVAILABLE_DAYS: readonly DayOption[] = [
  { code: 'M', name: 'Monday', shortName: 'Mon' },
  { code: 'T', name: 'Tuesday', shortName: 'Tue' },
  { code: 'W', name: 'Wednesday', shortName: 'Wed' },
  { code: 'TH', name: 'Thursday', shortName: 'Thu' },
  { code: 'F', name: 'Friday', shortName: 'Fri' },
  { code: 'S', name: 'Saturday', shortName: 'Sat' },
  { code: 'SU', name: 'Sunday', shortName: 'Sun' },
] as const;

/**
 * Time option for dropdown
 */
interface TimeOption {
  readonly value: string;
  readonly label: string;
}

// ============================================================================
// Icon Components (using Lucide)
// ============================================================================

/**
 * Calendar icon for day exclusion section
 */
function CalendarIcon({ className }: { className?: string }) {
  return <Calendar className={className} aria-hidden="true" />;
}

/**
 * Clock icon for time range section
 */
function ClockIcon({ className }: { className?: string }) {
  return <Clock className={className} aria-hidden="true" />;
}

/**
 * Plus icon for add button
 */
function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} aria-hidden="true" />;
}

/**
 * X icon for remove button
 */
function XIcon({ className }: { className?: string }) {
  return <X className={className} aria-hidden="true" />;
}

/**
 * Check icon for active filter indicator
 */
function CheckIcon({ className }: { className?: string }) {
  return <Check className={className} aria-hidden="true" />;
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
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-content-secondary uppercase tracking-wide"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-3 rounded-lg border border-default bg-surface-primary text-content-primary
                   focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                   cursor-pointer min-w-[140px] appearance-none bg-no-repeat bg-right
                   transition-all duration-200 hover:border-accent hover:bg-surface-hover
                   text-sm font-medium min-h-[44px] touch-target"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '1.25rem',
          backgroundPosition: 'right 0.75rem center',
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
 * for filtering course schedules with playful, modern styling.
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

  // Track filter changes for visual feedback
  const [recentChange, setRecentChange] = useState<string | null>(null);

  // Show brief highlight on filter change
  useEffect(() => {
    if (recentChange) {
      const timer = setTimeout(() => setRecentChange(null), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [recentChange]);

  // Memoize ranges array to prevent unnecessary re-renders
  const ranges = useMemo(
    () => (Array.isArray(excludedTimeRanges) ? excludedTimeRanges : []),
    [excludedTimeRanges]
  );

  // Handle day checkbox toggle with visual feedback
  const handleDayToggle = useCallback(
    (dayCode: DayCode) => {
      const isExcluded = excludedDays.includes(dayCode);
      onDayChange(dayCode, !isExcluded);
      setRecentChange(`day-${dayCode}`);
    },
    [excludedDays, onDayChange]
  );

  // Handle time change with visual feedback
  const handleTimeChange = useCallback(
    (id: number, field: 'start' | 'end', value: string) => {
      onTimeRangeChange(id, field, value);
      setRecentChange(`time-${id}-${field}`);
    },
    [onTimeRangeChange]
  );

  // Calculate stats for display
  const excludedDaysCount = excludedDays.length;
  const activeTimeRanges = ranges.filter((r) => r.start && r.end).length;

  return (
    <div className="space-y-8">
      {/* Day Exclusion Section */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hover shadow-md">
            <CalendarIcon className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2">
              Exclude Days
              {excludedDaysCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-warning text-slate-900 rounded-full animate-scale-in">
                  {excludedDaysCount} filtered
                </span>
              )}
            </h3>
            <p className="text-sm text-content-secondary">
              Click days to exclude them from schedule generation
            </p>
          </div>
        </div>

        {/* Day Buttons Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {AVAILABLE_DAYS.map((day) => {
            const isExcluded = excludedDays.includes(day.code);
            const isRecentChange = recentChange === `day-${day.code}`;
            return (
              <button
                key={day.code}
                type="button"
                onClick={() => handleDayToggle(day.code)}
                aria-pressed={isExcluded}
                aria-label={`${isExcluded ? 'Include' : 'Exclude'} ${day.name}`}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-xl font-medium text-sm
                  transition-all duration-200 ease-out min-h-[52px] touch-target
                  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-primary
                  ${
                    isExcluded
                      ? 'bg-gradient-to-br from-warning to-amber-600 text-slate-900 shadow-lg shadow-warning/25 scale-105'
                      : 'bg-surface-secondary text-content-secondary border border-default hover:border-accent hover:text-content-primary hover:bg-surface-hover'
                  }
                  ${isRecentChange ? 'animate-pulse-once' : ''}
                `}
              >
                {/* Checkmark for excluded days */}
                {isExcluded && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                    <CheckIcon className="text-white" />
                  </span>
                )}
                <span className="font-bold text-base">{day.code}</span>
                <span className="text-[10px] mt-0.5 opacity-75">{day.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        {excludedDaysCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-content-secondary animate-fade-in">
            <button
              type="button"
              onClick={() => {
                AVAILABLE_DAYS.forEach((day) => {
                  if (excludedDays.includes(day.code)) {
                    onDayChange(day.code, false);
                  }
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              Clear all days
            </button>
          </div>
        )}
      </section>

      {/* Time Range Exclusion Section */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-info to-blue-600 shadow-md">
            <ClockIcon className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2">
              Exclude Time Ranges
              {activeTimeRanges > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-info text-white rounded-full animate-scale-in">
                  {activeTimeRanges} active
                </span>
              )}
            </h3>
            <p className="text-sm text-content-secondary">
              Block specific time periods from your schedules
            </p>
          </div>
        </div>

        {/* Time Range Cards */}
        <div className="space-y-3">
          {ranges.map((range, index) => {
            const isComplete = range.start && range.end;
            const isRecentChange =
              recentChange === `time-${range.id}-start` || recentChange === `time-${range.id}-end`;

            return (
              <div
                key={range.id}
                className={`
                  relative p-4 rounded-xl border transition-all duration-200
                  ${
                    isComplete
                      ? 'bg-gradient-to-r from-info/5 to-blue-500/5 border-info/30 shadow-md'
                      : 'bg-surface-elevated border-default'
                  }
                  ${isRecentChange ? 'ring-2 ring-accent ring-opacity-50' : ''}
                `}
              >
                {/* Range Number Badge */}
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-hover text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {index + 1}
                </div>

                {/* Time Pickers Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pl-4">
                  {/* Time Pickers */}
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                    <TimePicker
                      value={range.start}
                      label="From"
                      onChange={(value) => handleTimeChange(range.id, 'start', value)}
                      placeholder="Select start"
                      id={`${instanceId}-range-${range.id}-start`}
                    />
                    <TimePicker
                      value={range.end}
                      label="To"
                      onChange={(value) => handleTimeChange(range.id, 'end', value)}
                      placeholder="Select end"
                      id={`${instanceId}-range-${range.id}-end`}
                    />
                  </div>

                  {/* Time Range Display */}
                  {isComplete && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-primary border border-info/20 text-sm">
                      <ClockIcon className="text-info" />
                      <span className="font-semibold text-content-primary">
                        {formatTimeDisplay(range.start)}
                      </span>
                      <span className="text-content-secondary mx-1">—</span>
                      <span className="font-semibold text-content-primary">
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
                      className="flex-shrink-0 p-2 rounded-lg text-content-secondary border border-transparent
                                 hover:text-danger hover:bg-danger/10 hover:border-danger/30
                                 transition-all duration-200 hover:scale-110
                                 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Range Button */}
        <button
          type="button"
          onClick={onAddTimeRange}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-surface-secondary border border-dashed border-default
                     text-content-secondary font-medium text-sm
                     hover:border-accent hover:text-accent hover:bg-accent/5
                     transition-all duration-200 group
                     focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <PlusIcon className="transition-transform duration-200 group-hover:rotate-90" />
          <span>Add Time Range</span>
        </button>
      </section>

      {/* Custom animations */}
      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes pulse-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        .animate-pulse-once {
          animation: pulse-once 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
