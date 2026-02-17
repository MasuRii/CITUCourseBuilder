/**
 * Schedule generation state management hook
 *
 * Manages transient state for schedule generation:
 * - Generated schedules storage
 * - Current schedule index
 * - Generation loading state
 * - Timetable visibility
 *
 * @module hooks/useScheduleGeneration
 * @task T3.2.8 - Extract state management from App.jsx
 */

import { useCallback, useRef, useState } from 'react';

/**
 * Return type for useScheduleGeneration hook
 */
export interface UseScheduleGenerationReturn {
  // Generated schedules
  /** Array of generated schedule key arrays */
  generatedSchedules: string[][];
  /** Set the generated schedules array */
  setGeneratedSchedules: React.Dispatch<React.SetStateAction<string[][]>>;
  /** Add a new schedule to the list */
  addGeneratedSchedule: (scheduleKeys: string[]) => void;
  /** Check if a schedule already exists */
  hasSchedule: (scheduleKeys: string[]) => boolean;

  // Current schedule index
  /** Index of currently displayed schedule */
  currentScheduleIndex: number;
  /** Set the current schedule index */
  setCurrentScheduleIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Navigate to the next schedule (wraps around) */
  nextSchedule: () => void;
  /** Navigate to the previous schedule (wraps around) */
  prevSchedule: () => void;

  // Generation count
  /** Count of generated schedules in current session */
  generatedScheduleCount: number;
  /** Increment the generated schedule count */
  incrementScheduleCount: () => void;

  // Loading state
  /** Whether schedule generation is in progress */
  isGenerating: boolean;
  /** Set the generating state */
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;

  // Timetable visibility
  /** Whether timetable view is visible */
  showTimetable: boolean;
  /** Set timetable visibility */
  setShowTimetable: React.Dispatch<React.SetStateAction<boolean>>;
  /** Toggle timetable visibility */
  toggleTimetable: () => void;

  // Session tracking
  /** Set of tried schedule combination keys (persists without re-renders) */
  triedCombinations: Set<string>;
  /** Add a combination key to tried set */
  addTriedCombination: (key: string) => void;
  /** Clear all tried combinations */
  clearTriedCombinations: () => void;

  // Reset
  /** Clear all schedule generation state */
  clearAllSchedules: () => void;
}

/**
 * A React hook for managing schedule generation transient state
 *
 * This hook manages UI state that doesn't need to be persisted to localStorage:
 * - Generated schedules list
 * - Current schedule navigation
 * - Loading indicators
 * - Timetable visibility
 *
 * @returns Schedule generation state and management functions
 *
 * @example
 * ```tsx
 * const {
 *   generatedSchedules,
 *   addGeneratedSchedule,
 *   currentScheduleIndex,
 *   nextSchedule,
 *   prevSchedule,
 *   isGenerating,
 *   setIsGenerating,
 *   showTimetable,
 *   toggleTimetable,
 * } = useScheduleGeneration();
 *
 * // Start generation
 * setIsGenerating(true);
 *
 * // Add generated schedule
 * addGeneratedSchedule(['course-key-1', 'course-key-2']);
 *
 * // Navigate schedules
 * nextSchedule();
 * ```
 */
export function useScheduleGeneration(): UseScheduleGenerationReturn {
  // Generated schedules (not persisted - resets on page reload)
  const [generatedSchedules, setGeneratedSchedules] = useState<string[][]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [generatedScheduleCount, setGeneratedScheduleCount] = useState(0);

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Timetable visibility
  const [showTimetable, setShowTimetable] = useState(false);

  // Session tracking (useRef to avoid re-renders)
  const triedCombinations = useRef(new Set<string>()).current;

  // Add generated schedule
  const addGeneratedSchedule = useCallback((scheduleKeys: string[]) => {
    setGeneratedSchedules((prev) => {
      // Check if schedule already exists
      const existingIdx = prev.findIndex(
        (sched) =>
          sched.length === scheduleKeys.length && sched.every((id, i) => id === scheduleKeys[i])
      );

      if (existingIdx === -1) {
        // New schedule - add and set index
        setCurrentScheduleIndex(prev.length);
        return [...prev, scheduleKeys];
      } else {
        // Existing schedule - just set index
        setCurrentScheduleIndex(existingIdx);
        return prev;
      }
    });
  }, []);

  // Check if schedule exists
  const hasSchedule = useCallback(
    (scheduleKeys: string[]) => {
      return generatedSchedules.some(
        (sched) =>
          sched.length === scheduleKeys.length && sched.every((id, i) => id === scheduleKeys[i])
      );
    },
    [generatedSchedules]
  );

  // Navigation helpers
  const nextSchedule = useCallback(() => {
    if (generatedSchedules.length === 0) return;
    setCurrentScheduleIndex((prev) => (prev + 1) % generatedSchedules.length);
  }, [generatedSchedules.length]);

  const prevSchedule = useCallback(() => {
    if (generatedSchedules.length === 0) return;
    setCurrentScheduleIndex(
      (prev) => (prev - 1 + generatedSchedules.length) % generatedSchedules.length
    );
  }, [generatedSchedules.length]);

  // Increment count
  const incrementScheduleCount = useCallback(() => {
    setGeneratedScheduleCount((prev) => prev + 1);
  }, []);

  // Toggle timetable
  const toggleTimetable = useCallback(() => {
    setShowTimetable((prev) => !prev);
  }, []);

  // Session tracking
  const addTriedCombination = useCallback(
    (key: string) => {
      triedCombinations.add(key);
    },
    [triedCombinations]
  );

  const clearTriedCombinations = useCallback(() => {
    triedCombinations.clear();
  }, [triedCombinations]);

  // Reset all state
  const clearAllSchedules = useCallback(() => {
    triedCombinations.clear();
    setGeneratedScheduleCount(0);
    setGeneratedSchedules([]);
    setCurrentScheduleIndex(0);
  }, [triedCombinations]);

  return {
    // Generated schedules
    generatedSchedules,
    setGeneratedSchedules,
    addGeneratedSchedule,
    hasSchedule,

    // Current schedule index
    currentScheduleIndex,
    setCurrentScheduleIndex,
    nextSchedule,
    prevSchedule,

    // Generation count
    generatedScheduleCount,
    incrementScheduleCount,

    // Loading state
    isGenerating,
    setIsGenerating,

    // Timetable visibility
    showTimetable,
    setShowTimetable,
    toggleTimetable,

    // Session tracking
    triedCombinations,
    addTriedCombination,
    clearTriedCombinations,

    // Reset
    clearAllSchedules,
  };
}
