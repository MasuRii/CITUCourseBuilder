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
      <div className="p-4 rounded-lg bg-surface-elevated border border-default">
        <h4 className="text-md font-semibold text-content-primary mb-3">Current Filter State</h4>

        {/* Excluded Days */}
        <div className="mb-3">
          <span className="text-sm text-content-secondary">Excluded Days:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {excludedDays.length === 0 ? (
              <span className="text-sm text-content-secondary italic">None</span>
            ) : (
              excludedDays.map((day) => (
                <span
                  key={day}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-white"
                >
                  {day}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Time Ranges */}
        <div>
          <span className="text-sm text-content-secondary">Time Ranges:</span>
          <div className="mt-1 space-y-1">
            {timeRanges.length === 0 ? (
              <span className="text-sm text-content-secondary italic">None</span>
            ) : (
              timeRanges.map((range, index) => (
                <div key={range.id} className="text-sm text-content-primary">
                  <span className="font-medium">{index + 1}.</span> {range.start || '??'} -{' '}
                  {range.end || '??'}
                  {range.start && range.end && (
                    <span className="text-content-secondary ml-1">
                      ({range.start} - {range.end})
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-content-secondary space-y-1">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Click day buttons to toggle exclusion (highlighted = excluded)</li>
          <li>Use dropdown menus to select start/end times</li>
          <li>Click + button to add more time ranges</li>
          <li>Click X button to remove time ranges</li>
          <li>View the state changes in the console (F12)</li>
        </ul>
      </div>
    </div>
  );
}
