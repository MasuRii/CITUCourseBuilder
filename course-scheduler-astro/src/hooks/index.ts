/**
 * Custom React Hooks for CITU Course Builder
 *
 * This module exports all custom hooks for state management.
 * Each hook encapsulates a specific domain of state with localStorage persistence.
 *
 * @module hooks
 * @task T3.2.8 - Extract state management from App.jsx
 */

// Generic localStorage hook
export { useLocalStorage } from './useLocalStorage';

// Theme management
export { useTheme } from './useTheme';
export type { UseThemeReturn } from './useTheme';

// Course state management
export { useCourseState } from './useCourseState';
export type { UseCourseStateReturn } from './useCourseState';

// Filter state management
export { useFilterState } from './useFilterState';
export type { UseFilterStateReturn } from './useFilterState';

// Schedule preferences
export { useSchedulePreferences } from './useSchedulePreferences';
export type { UseSchedulePreferencesReturn } from './useSchedulePreferences';

// Schedule generation state
export { useScheduleGeneration } from './useScheduleGeneration';
export type { UseScheduleGenerationReturn } from './useScheduleGeneration';
