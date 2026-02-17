/**
 * Filter state management hook
 *
 * Manages day and time exclusion filters for course scheduling.
 * Handles excluded days and time ranges with localStorage persistence.
 *
 * @module hooks/useFilterState
 * @task T3.2.8 - Extract state management from App.jsx
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '@/types/index';
import type { DayCode, TimeRange } from '@/types/index';

/**
 * Default time range with empty values
 */
const DEFAULT_TIME_RANGE: TimeRange = {
  id: 0,
  start: '',
  end: '',
};

/**
 * Return type for useFilterState hook
 */
export interface UseFilterStateReturn {
  // Day exclusion state
  /** Days to exclude from schedules */
  excludedDays: DayCode[];
  /** Set the excluded days array */
  setExcludedDays: (days: DayCode[]) => void;
  /** Toggle a day in the exclusion list */
  toggleExcludedDay: (day: DayCode) => void;
  /** Check if a day is excluded */
  isDayExcluded: (day: DayCode) => boolean;

  // Time range exclusion state
  /** Time ranges to exclude from schedules */
  excludedTimeRanges: TimeRange[];
  /** Set the excluded time ranges array */
  setExcludedTimeRanges: (ranges: TimeRange[]) => void;
  /** Update a specific time range */
  updateTimeRange: (id: number, field: 'start' | 'end', value: string) => void;
  /** Add a new empty time range */
  addTimeRange: () => void;
  /** Remove a time range by ID */
  removeTimeRange: (id: number) => void;
  /** Clear all time ranges (resets to one empty range) */
  clearTimeRanges: () => void;

  // Max units constraint
  /** Maximum allowed units (empty string = no limit) */
  maxUnits: string;
  /** Set the max units constraint */
  setMaxUnits: (units: string) => void;

  // Max class gap constraint
  /** Maximum gap between classes in hours (empty string = no limit) */
  maxClassGapHours: string;
  /** Set the max gap constraint */
  setMaxClassGapHours: (hours: string) => void;
}

/**
 * A React hook for managing filter state with localStorage persistence
 *
 * @returns Filter state and management functions
 *
 * @example
 * ```tsx
 * const {
 *   excludedDays,
 *   toggleExcludedDay,
 *   excludedTimeRanges,
 *   updateTimeRange,
 *   addTimeRange,
 * } = useFilterState();
 *
 * // Toggle Monday exclusion
 * toggleExcludedDay('M');
 *
 * // Add a time range to exclude
 * addTimeRange();
 * updateTimeRange(123, 'start', '12:00');
 * updateTimeRange(123, 'end', '13:00');
 * ```
 */
export function useFilterState(): UseFilterStateReturn {
  // Day exclusion state - explicit types
  const [excludedDays, setExcludedDays] = useLocalStorage(
    LOCAL_STORAGE_KEYS.EXCLUDED_DAYS,
    [] as DayCode[]
  );

  // Time range exclusion state
  const [excludedTimeRanges, setExcludedTimeRanges] = useLocalStorage(
    LOCAL_STORAGE_KEYS.EXCLUDED_RANGES,
    [{ ...DEFAULT_TIME_RANGE, id: Date.now() }] as TimeRange[]
  );

  // Constraint state
  const [maxUnits, setMaxUnits] = useLocalStorage(LOCAL_STORAGE_KEYS.MAX_UNITS, '');

  const [maxClassGapHours, setMaxClassGapHours] = useLocalStorage(
    LOCAL_STORAGE_KEYS.MAX_CLASS_GAP_HOURS,
    ''
  );

  // Day handlers
  const toggleExcludedDay = useCallback(
    (day: DayCode) => {
      setExcludedDays((prev: DayCode[]) =>
        prev.includes(day) ? prev.filter((d: DayCode) => d !== day) : [...prev, day]
      );
    },
    [setExcludedDays]
  );

  const isDayExcluded = useCallback(
    (day: DayCode) => {
      return excludedDays.includes(day);
    },
    [excludedDays]
  );

  // Time range handlers
  const updateTimeRange = useCallback(
    (id: number, field: 'start' | 'end', value: string) => {
      setExcludedTimeRanges((prev: TimeRange[]) =>
        prev.map((range: TimeRange) => (range.id === id ? { ...range, [field]: value } : range))
      );
    },
    [setExcludedTimeRanges]
  );

  const addTimeRange = useCallback(() => {
    setExcludedTimeRanges((prev: TimeRange[]) => [...prev, { id: Date.now(), start: '', end: '' }]);
  }, [setExcludedTimeRanges]);

  const removeTimeRange = useCallback(
    (id: number) => {
      // Always keep at least one time range
      if (excludedTimeRanges.length <= 1) return;
      setExcludedTimeRanges((prev: TimeRange[]) =>
        prev.filter((range: TimeRange) => range.id !== id)
      );
    },
    [excludedTimeRanges.length, setExcludedTimeRanges]
  );

  const clearTimeRanges = useCallback(() => {
    setExcludedTimeRanges([{ id: Date.now(), start: '', end: '' }]);
  }, [setExcludedTimeRanges]);

  return {
    // Day exclusion state
    excludedDays,
    setExcludedDays,
    toggleExcludedDay,
    isDayExcluded,

    // Time range exclusion state
    excludedTimeRanges,
    setExcludedTimeRanges,
    updateTimeRange,
    addTimeRange,
    removeTimeRange,
    clearTimeRanges,

    // Constraints
    maxUnits,
    setMaxUnits,
    maxClassGapHours,
    setMaxClassGapHours,
  };
}
