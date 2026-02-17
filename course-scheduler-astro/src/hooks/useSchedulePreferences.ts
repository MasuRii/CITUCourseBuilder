/**
 * Schedule preferences state management hook
 *
 * Manages user preferences for schedule generation:
 * - Preferred time ordering
 * - Search mode (fast, exhaustive, partial)
 * - Minimize campus days option
 *
 * @module hooks/useSchedulePreferences
 * @task T3.2.8 - Extract state management from App.jsx
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_VALUES, LOCAL_STORAGE_KEYS } from '@/types/index';
import type { ScheduleSearchMode, TimeOfDayBucket } from '@/types/index';

/**
 * Return type for useSchedulePreferences hook
 */
export interface UseSchedulePreferencesReturn {
  // Preferred time ordering
  /** Preferred time order for scoring (lower index = higher preference) */
  preferredTimeOfDayOrder: TimeOfDayBucket[];
  /** Set the preferred time order */
  setPreferredTimeOfDayOrder: (order: TimeOfDayBucket[]) => void;
  /** Remove a time from the preference order */
  removePreferredTime: (index: number) => void;
  /** Add a time to the preference order (if not already present) */
  addPreferredTime: (time: TimeOfDayBucket) => void;
  /** Reset to default time preferences */
  resetPreferredTimeOrder: () => void;

  // Search mode
  /** Schedule generation algorithm mode */
  scheduleSearchMode: ScheduleSearchMode;
  /** Set the search mode */
  setScheduleSearchMode: (mode: ScheduleSearchMode) => void;

  // Minimize campus days
  /** Whether to prioritize schedules with fewer on-campus days */
  minimizeDaysOnCampus: boolean;
  /** Set the minimize campus days flag */
  setMinimizeDaysOnCampus: (minimize: boolean) => void;
  /** Toggle the minimize campus days flag */
  toggleMinimizeDaysOnCampus: () => void;
}

/**
 * A React hook for managing schedule generation preferences
 *
 * @returns Schedule preferences state and management functions
 *
 * @example
 * ```tsx
 * const {
 *   preferredTimeOfDayOrder,
 *   addPreferredTime,
 *   scheduleSearchMode,
 *   setScheduleSearchMode,
 *   minimizeDaysOnCampus,
 *   toggleMinimizeDaysOnCampus,
 * } = useSchedulePreferences();
 *
 * // Add morning as preferred time
 * addPreferredTime('morning');
 *
 * // Set search mode
 * setScheduleSearchMode('exhaustive');
 *
 * // Toggle campus day minimization
 * toggleMinimizeDaysOnCampus();
 * ```
 */
export function useSchedulePreferences(): UseSchedulePreferencesReturn {
  // Preferred time ordering - explicit types
  const [preferredTimeOfDayOrder, setPreferredTimeOfDayOrder] = useLocalStorage(
    LOCAL_STORAGE_KEYS.PREFERRED_TIME_OF_DAY,
    [...DEFAULT_VALUES.PREFERRED_TIMES_ORDER] as TimeOfDayBucket[]
  );

  // Search mode
  const [scheduleSearchMode, setScheduleSearchMode] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SCHEDULE_SEARCH_MODE,
    DEFAULT_VALUES.SEARCH_MODE
  );

  // Minimize campus days
  const [minimizeDaysOnCampus, setMinimizeDaysOnCampus] = useLocalStorage(
    LOCAL_STORAGE_KEYS.MINIMIZE_DAYS_ON_CAMPUS,
    DEFAULT_VALUES.MINIMIZE_DAYS_ON_CAMPUS
  );

  // Preferred time handlers
  const removePreferredTime = useCallback(
    (index: number) => {
      setPreferredTimeOfDayOrder((prev: TimeOfDayBucket[]) =>
        prev.filter((_: TimeOfDayBucket, i: number) => i !== index)
      );
    },
    [setPreferredTimeOfDayOrder]
  );

  const addPreferredTime = useCallback(
    (time: TimeOfDayBucket) => {
      setPreferredTimeOfDayOrder((prev: TimeOfDayBucket[]) =>
        prev.includes(time) ? prev : [...prev, time]
      );
    },
    [setPreferredTimeOfDayOrder]
  );

  const resetPreferredTimeOrder = useCallback(() => {
    setPreferredTimeOfDayOrder([...DEFAULT_VALUES.PREFERRED_TIMES_ORDER] as TimeOfDayBucket[]);
  }, [setPreferredTimeOfDayOrder]);

  // Minimize campus days handlers
  const toggleMinimizeDaysOnCampus = useCallback(() => {
    setMinimizeDaysOnCampus((prev: boolean) => !prev);
  }, [setMinimizeDaysOnCampus]);

  return {
    // Preferred time ordering
    preferredTimeOfDayOrder,
    setPreferredTimeOfDayOrder,
    removePreferredTime,
    addPreferredTime,
    resetPreferredTimeOrder,

    // Search mode
    scheduleSearchMode,
    setScheduleSearchMode,

    // Minimize campus days
    minimizeDaysOnCampus,
    setMinimizeDaysOnCampus,
    toggleMinimizeDaysOnCampus,
  };
}
