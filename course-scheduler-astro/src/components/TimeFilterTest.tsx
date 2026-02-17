/**
 * TimeFilterTest Component
 *
 * A test wrapper component for the TimeFilter that demonstrates all features
 * and provides state management for testing.
 *
 * @module components/TimeFilterTest
 */

import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import TimeFilter from './TimeFilter';
import type { DayCode, TimeRange } from '@/types/index';

/**
 * Props for TimeFilterTest component (none required)
 */
export interface TimeFilterTestProps {
  /** Optional initial excluded days */
  readonly initialExcludedDays?: readonly DayCode[];
}

/**
 * Generate a unique ID for time ranges
 * Uses a counter to ensure uniqueness within the session
 */
let timeRangeIdCounter = 0;
function generateTimeRangeId(): number {
  timeRangeIdCounter += 1;
  return timeRangeIdCounter;
}

/**
 * Icon for lightbulb/tips
 */
function LightbulbIcon({ className }: { className?: string }) {
  return (
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
      className={className}
      aria-hidden="true"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

/**
 * Test wrapper for TimeFilter component
 *
 * Demonstrates all TimeFilter features with state management.
 * Shows the current filter state below the component.
 */
export default function TimeFilterTest({ initialExcludedDays }: TimeFilterTestProps): ReactNode {
  // State for excluded days
  const [excludedDays, setExcludedDays] = useState<readonly DayCode[]>(initialExcludedDays ?? []);

  // Initialize time ranges with generated ID (called during first render only)
  const [timeRanges, setTimeRanges] = useState<readonly TimeRange[]>(() => [
    { id: generateTimeRangeId(), start: '', end: '' },
  ]);

  // Handle day toggle
  const handleDayChange = useCallback((dayCode: DayCode, isExcluded: boolean) => {
    console.log(`Day ${dayCode} ${isExcluded ? 'excluded' : 'included'}`);
    setExcludedDays((prev) =>
      isExcluded ? [...prev, dayCode] : prev.filter((d) => d !== dayCode)
    );
  }, []);

  // Handle time range field change
  const handleTimeRangeChange = useCallback((id: number, field: 'start' | 'end', value: string) => {
    console.log(`Time range ${id} ${field}: ${value}`);
    setTimeRanges((prev) =>
      prev.map((range) => (range.id === id ? { ...range, [field]: value } : range))
    );
  }, []);

  // Add a new time range
  const handleAddTimeRange = useCallback(() => {
    const newId = generateTimeRangeId();
    console.log(`Adding time range ${newId}`);
    setTimeRanges((prev) => [...prev, { id: newId, start: '', end: '' }]);
  }, []);

  // Remove a time range
  const handleRemoveTimeRange = useCallback((id: number) => {
    console.log(`Removing time range ${id}`);
    setTimeRanges((prev) => prev.filter((range) => range.id !== id));
  }, []);

  // Calculate stats
  const activeTimeRanges = timeRanges.filter((r) => r.start && r.end).length;

  return (
    <div className="space-y-6">
      {/* TimeFilter Component */}
      <TimeFilter
        excludedDays={excludedDays}
        onDayChange={handleDayChange}
        excludedTimeRanges={timeRanges}
        onTimeRangeChange={handleTimeRangeChange}
        onAddTimeRange={handleAddTimeRange}
        onRemoveTimeRange={handleRemoveTimeRange}
      />

      {/* State Display */}
      <div className="p-5 rounded-xl bg-surface-elevated border border-default shadow-sm">
        <h4 className="text-base font-semibold text-content-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Current Filter State
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Excluded Days */}
          <div className="p-3 rounded-lg bg-surface-primary border border-default">
            <span className="text-xs font-medium text-content-secondary uppercase tracking-wide">
              Excluded Days
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {excludedDays.length === 0 ? (
                <span className="text-sm text-content-secondary italic">None excluded</span>
              ) : (
                excludedDays.map((day) => (
                  <span
                    key={day}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-br from-warning to-amber-600 text-slate-900 shadow-sm"
                  >
                    {day}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Time Ranges */}
          <div className="p-3 rounded-lg bg-surface-primary border border-default">
            <span className="text-xs font-medium text-content-secondary uppercase tracking-wide">
              Time Ranges
            </span>
            <div className="mt-2 space-y-1">
              {timeRanges.length === 0 ? (
                <span className="text-sm text-content-secondary italic">None</span>
              ) : (
                timeRanges.map((range, index) => (
                  <div
                    key={range.id}
                    className="text-sm text-content-primary flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="font-mono">
                      {range.start || '--:--'} — {range.end || '--:--'}
                    </span>
                    {range.start && range.end && <span className="text-xs text-success">✓</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-4 pt-4 border-t border-default flex items-center gap-4 text-sm text-content-secondary">
          <span>
            <strong className="text-content-primary">{excludedDays.length}</strong> days excluded
          </span>
          <span className="text-default">•</span>
          <span>
            <strong className="text-content-primary">{activeTimeRanges}</strong> active time ranges
          </span>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-info/10 border border-info/20">
        <div className="flex items-start gap-3">
          <LightbulbIcon className="text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm text-content-secondary space-y-2">
            <p className="font-medium text-content-primary">Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                Highlighted days are <strong>excluded</strong> from schedule generation
              </li>
              <li>Add time ranges to block lunch breaks or other unavailable times</li>
              <li>Click a highlighted day to include it again</li>
              <li>Watch the console (F12) for filter change events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
