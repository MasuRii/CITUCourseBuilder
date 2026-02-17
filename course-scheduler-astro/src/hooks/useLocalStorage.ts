/**
 * Generic localStorage persistence hook with type safety and validation
 *
 * Provides a useState-like interface that automatically persists values to localStorage.
 * Includes validation for known keys and graceful fallback for SSR environments.
 *
 * @module hooks/useLocalStorage
 * @task T3.2.8 - Extract state management from App.jsx
 */

import { useCallback, useState } from 'react';
import { ALLOWED_VALUES, LOCAL_STORAGE_KEYS } from '@/types/index';
import type {
  ColorPalette,
  Course,
  DayCode,
  GroupingMode,
  LocalStorageKey,
  ScheduleSearchMode,
  SectionTypeSuffix,
  StatusFilter,
  ThemeMode,
  ThemePaletteState,
  TimeOfDayBucket,
  TimeRange,
} from '@/types/index';

/**
 * Type mapping for localStorage keys to their value types
 * Uses string literal types for the keys
 */
type LocalStorageValueMap = {
  courseBuilder_allCourses: Course[];
  courseBuilder_excludedDays: DayCode[];
  courseBuilder_excludedTimeRanges: TimeRange[];
  courseBuilder_theme: ThemeMode;
  courseBuilder_themePalette: ThemePaletteState;
  courseBuilder_groupingKey: GroupingMode;
  courseBuilder_selectedSectionTypes: SectionTypeSuffix[];
  courseBuilder_selectedStatusFilter: StatusFilter;
  courseBuilder_maxUnits: string;
  courseBuilder_maxClassGapHours: string;
  courseBuilder_preferredTimeOfDay: TimeOfDayBucket[];
  courseBuilder_scheduleSearchMode: ScheduleSearchMode;
  courseBuilder_minimizeDaysOnCampus: boolean;
};

/**
 * Validator function type for localStorage values
 */
type Validator<T> = (value: unknown) => T | null;

/**
 * Validates a theme mode value
 */
const validateTheme = (value: unknown): ThemeMode | null => {
  return value === 'light' ? 'light' : 'dark';
};

/**
 * Validates a theme palette state
 */
const validateThemePalette = (value: unknown): ThemePaletteState | null => {
  if (value && typeof value === 'object' && value !== null && 'light' in value && 'dark' in value) {
    const palette = value as { light: unknown; dark: unknown };
    if (
      ALLOWED_VALUES.PALETTES.includes(palette.light as ColorPalette) &&
      ALLOWED_VALUES.PALETTES.includes(palette.dark as ColorPalette)
    ) {
      return palette as ThemePaletteState;
    }
  }
  return null;
};

/**
 * Validates a grouping mode value
 */
const validateGrouping = (value: unknown): GroupingMode | null => {
  if (typeof value === 'string' && ALLOWED_VALUES.GROUPING_KEYS.includes(value as GroupingMode)) {
    return value as GroupingMode;
  }
  return null;
};

/**
 * Validates a status filter value
 */
const validateStatusFilter = (value: unknown): StatusFilter | null => {
  if (typeof value === 'string' && ALLOWED_VALUES.STATUS_FILTERS.includes(value as StatusFilter)) {
    return value as StatusFilter;
  }
  return null;
};

/**
 * Validates a schedule search mode value
 */
const validateSearchMode = (value: unknown): ScheduleSearchMode | null => {
  if (
    typeof value === 'string' &&
    ALLOWED_VALUES.SEARCH_MODES.includes(value as ScheduleSearchMode)
  ) {
    return value as ScheduleSearchMode;
  }
  return null;
};

/**
 * Validates a courses array
 */
const validateCourses = (value: unknown): Course[] | null => {
  if (Array.isArray(value)) {
    return value as Course[];
  }
  return null;
};

/**
 * Validates an excluded days array
 */
const validateExcludedDays = (value: unknown): DayCode[] | null => {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as DayCode[];
  }
  return null;
};

/**
 * Validates a time ranges array
 */
const validateTimeRanges = (value: unknown): TimeRange[] | null => {
  if (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'start' in item &&
        'end' in item
    )
  ) {
    return value as TimeRange[];
  }
  return null;
};

/**
 * Validates section types array
 */
const validateSectionTypes = (value: unknown): SectionTypeSuffix[] | null => {
  if (Array.isArray(value)) {
    return value.filter((type): type is SectionTypeSuffix =>
      ALLOWED_VALUES.SECTION_TYPE_SUFFIXES.includes(type)
    );
  }
  return null;
};

/**
 * Validates a string value (for maxUnits, maxGapHours)
 */
const validateString = (value: unknown): string | null => {
  return typeof value === 'string' ? value : null;
};

/**
 * Validates a preferred time order array
 */
const validatePreferredTimeOrder = (value: unknown): TimeOfDayBucket[] | null => {
  if (
    typeof value === 'string' &&
    ALLOWED_VALUES.PREFERRED_TIMES.includes(value as TimeOfDayBucket)
  ) {
    return [value as TimeOfDayBucket];
  }
  if (
    Array.isArray(value) &&
    value.every((item) => ALLOWED_VALUES.PREFERRED_TIMES.includes(item as TimeOfDayBucket))
  ) {
    return value as TimeOfDayBucket[];
  }
  return null;
};

/**
 * Validates a boolean value
 */
const validateBoolean = (value: unknown): boolean | null => {
  return typeof value === 'boolean' ? value : null;
};

/**
 * Validator map for each localStorage key
 */
const validators: Record<LocalStorageKey, Validator<unknown>> = {
  [LOCAL_STORAGE_KEYS.COURSES]: validateCourses,
  [LOCAL_STORAGE_KEYS.EXCLUDED_DAYS]: validateExcludedDays,
  [LOCAL_STORAGE_KEYS.EXCLUDED_RANGES]: validateTimeRanges,
  [LOCAL_STORAGE_KEYS.THEME]: validateTheme,
  [LOCAL_STORAGE_KEYS.THEME_PALETTE]: validateThemePalette,
  [LOCAL_STORAGE_KEYS.GROUPING]: validateGrouping,
  [LOCAL_STORAGE_KEYS.SECTION_TYPES]: validateSectionTypes,
  [LOCAL_STORAGE_KEYS.STATUS_FILTER]: validateStatusFilter,
  [LOCAL_STORAGE_KEYS.MAX_UNITS]: validateString,
  [LOCAL_STORAGE_KEYS.MAX_CLASS_GAP_HOURS]: validateString,
  [LOCAL_STORAGE_KEYS.PREFERRED_TIME_OF_DAY]: validatePreferredTimeOrder,
  [LOCAL_STORAGE_KEYS.SCHEDULE_SEARCH_MODE]: validateSearchMode,
  [LOCAL_STORAGE_KEYS.MINIMIZE_DAYS_ON_CAMPUS]: validateBoolean,
};

/**
 * Load a value from localStorage with validation
 *
 * @param key - The localStorage key to load from
 * @param defaultValue - The default value if key doesn't exist or validation fails
 * @returns The validated stored value or the default value
 */
function loadFromStorage<K extends LocalStorageKey>(
  key: K,
  defaultValue: LocalStorageValueMap[K]
): LocalStorageValueMap[K] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }

  try {
    const saved = localStorage.getItem(key);
    if (saved === null) {
      return defaultValue;
    }

    const parsed: unknown = JSON.parse(saved);
    const validator = validators[key];
    const validated = validator(parsed);

    if (validated !== null) {
      return validated as LocalStorageValueMap[K];
    }

    console.error(`[useLocalStorage] Validation failed for key "${key}", using default`);
    return defaultValue;
  } catch (error) {
    console.error(`[useLocalStorage] Failed to parse ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * A React hook for persisting state to localStorage with type safety and validation
 *
 * @template K - The localStorage key type (must be a valid LocalStorageKey)
 * @param key - The localStorage key to use
 * @param defaultValue - The default value if the key doesn't exist
 * @returns A tuple of [value, setValue] similar to useState
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage(
 *   LOCAL_STORAGE_KEYS.THEME,
 *   DEFAULT_VALUES.THEME
 * );
 *
 * // Update theme (automatically persisted)
 * setTheme('light');
 * ```
 */
export function useLocalStorage<K extends LocalStorageKey>(
  key: K,
  defaultValue: LocalStorageValueMap[K]
): [
  LocalStorageValueMap[K],
  (
    value: LocalStorageValueMap[K] | ((prev: LocalStorageValueMap[K]) => LocalStorageValueMap[K])
  ) => void,
] {
  // Initialize state with loaded value
  const [storedValue, setStoredValue] = useState<LocalStorageValueMap[K]>(() =>
    loadFromStorage(key, defaultValue)
  );

  /**
   * Update the stored value and persist to localStorage
   */
  const setValue = useCallback(
    (
      value: LocalStorageValueMap[K] | ((prev: LocalStorageValueMap[K]) => LocalStorageValueMap[K])
    ) => {
      setStoredValue((prevValue) => {
        const newValue = value instanceof Function ? value(prevValue) : value;

        // Persist to localStorage (only on client)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(key, JSON.stringify(newValue));
          } catch (error) {
            console.error(`[useLocalStorage] Failed to save ${key} to localStorage:`, error);
          }
        }

        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Export individual validators for use in other hooks
 */
export {
  validateTheme,
  validateThemePalette,
  validateGrouping,
  validateStatusFilter,
  validateSearchMode,
  validateCourses,
  validateExcludedDays,
  validateTimeRanges,
  validateSectionTypes,
  validateString,
  validatePreferredTimeOrder,
  validateBoolean,
};
