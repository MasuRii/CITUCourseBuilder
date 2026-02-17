/**
 * TypeScript Interface Definitions for CITU Course Builder
 *
 * This file contains all TypeScript interfaces for the application.
 * These types provide strict type safety for the scheduling algorithms,
 * data structures, and UI state management.
 *
 * @module types
 * @version 1.0.0
 * @task T1.1.6 - TypeScript Interface Design
 */

// ============================================================================
// Core Data Types
// ============================================================================

/**
 * Day codes used in schedule strings
 * - M = Monday
 * - T = Tuesday
 * - W = Wednesday
 * - TH = Thursday
 * - F = Friday
 * - S = Saturday
 * - SU = Sunday
 */
export type DayCode = 'M' | 'T' | 'W' | 'TH' | 'F' | 'S' | 'SU';

/**
 * Time of day bucket for preference scoring
 * - morning: Before 12:00 PM
 * - afternoon: 12:00 PM - 5:00 PM
 * - evening: After 5:00 PM
 * - any: No specific preference or unable to determine
 */
export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'any';

/**
 * Schedule search mode
 * - 'partial': Heuristic-based, maximizes subjects even if not all fit (default)
 * - 'exhaustive': Tries all combinations, fails if can't fit all subjects
 * - 'fast': Random sampling, may miss optimal schedules
 */
export type ScheduleSearchMode = 'partial' | 'exhaustive' | 'fast';

/**
 * Grouping mode for course display
 * - 'none': Flat list of courses
 * - 'subject': Group by subject code
 * - 'offeringDept': Group by offering department
 */
export type GroupingMode = 'none' | 'subject' | 'offeringDept';

/**
 * Status filter for courses
 * - 'all': Show all courses
 * - 'open': Show only courses with available slots
 * - 'closed': Show only courses with no available slots
 */
export type StatusFilter = 'all' | 'open' | 'closed';

/**
 * Theme mode for UI theming
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Color palette options for theme customization
 */
export type ColorPalette = 'original' | 'comfort' | 'space';

/**
 * Section type suffix for course classification
 * - AP3: Online Class
 * - AP4: Face-to-Face
 * - AP5: Hybrid (F2F & Online)
 */
export type SectionTypeSuffix = 'AP3' | 'AP4' | 'AP5';

// ============================================================================
// Time Slot Types
// ============================================================================

/**
 * Represents a single time slot in a parsed schedule
 *
 * @example
 * // A class on Monday/Wednesday/Friday from 9:00 AM to 10:30 AM
 * const slot: TimeSlot = {
 *   days: ['M', 'W', 'F'],
 *   startTime: '09:00',
 *   endTime: '10:30',
 *   room: 'ACAD309'
 * };
 */
export interface TimeSlot {
  /** Array of day codes for this slot */
  readonly days: readonly DayCode[];
  /** Start time in HH:mm format (24-hour) */
  readonly startTime: string | null;
  /** End time in HH:mm format (24-hour) */
  readonly endTime: string | null;
  /** Room/location for this slot */
  readonly room?: string;
}

/**
 * Result of parsing a schedule string.
 * Can represent TBA schedules, single slots, or multi-slot schedules.
 *
 * @example
 * // TBA schedule
 * const tbaSchedule: ParsedSchedule = {
 *   allTimeSlots: [],
 *   representativeDays: [],
 *   isTBA: true,
 *   days: [],
 *   startTime: null,
 *   endTime: null
 * };
 *
 * @example
 * // Multi-slot schedule (e.g., hybrid class)
 * const hybridSchedule: ParsedSchedule = {
 *   allTimeSlots: [
 *     { days: ['M', 'W'], startTime: '09:00', endTime: '10:30', room: 'online' },
 *     { days: ['F'], startTime: '09:00', endTime: '12:00', room: 'ACAD309' }
 *   ],
 *   representativeDays: ['F', 'M', 'W'],
 *   isTBA: false,
 *   rawScheduleString: 'M/W | 9:00AM-10:30AM | Room#online + F | 9:00AM-12:00PM | ACAD309',
 *   days: ['M', 'W'],
 *   startTime: '09:00',
 *   endTime: '10:30'
 * };
 */
export interface ParsedSchedule {
  /** All time slots extracted from the schedule */
  readonly allTimeSlots: readonly TimeSlot[];
  /** Representative days (union of all slot days, sorted) */
  readonly representativeDays: readonly DayCode[];
  /** Whether this is a TBA (To Be Announced) schedule */
  readonly isTBA: boolean;
  /** Original schedule string before parsing */
  readonly rawScheduleString?: string;
  /** Days from the first time slot (backward compatibility) */
  readonly days: readonly DayCode[];
  /** Start time from the first time slot (backward compatibility) */
  readonly startTime: string | null;
  /** End time from the first time slot (backward compatibility) */
  readonly endTime: string | null;
}

// ============================================================================
// Discriminated Unions for Schedule Types
// ============================================================================

/**
 * TBA (To Be Announced) schedule type
 * Used when schedule details are not yet determined
 */
export interface TBASchedule {
  readonly type: 'tba';
}

/**
 * Single-slot schedule type
 * Represents a schedule with one time slot
 */
export interface SingleSlotSchedule {
  readonly type: 'single';
  readonly slot: TimeSlot;
}

/**
 * Multi-slot schedule type
 * Represents a schedule with multiple time slots (e.g., hybrid classes)
 */
export interface MultiSlotSchedule {
  readonly type: 'multi';
  readonly slots: readonly TimeSlot[];
}

/**
 * Discriminated union for schedule types
 * Use this for type-safe schedule handling
 */
export type ScheduleType = TBASchedule | SingleSlotSchedule | MultiSlotSchedule;

/**
 * Type guard to check if a parsed schedule is TBA
 *
 * @param parsed - The parsed schedule to check
 * @returns true if the schedule is TBA
 */
export function isTBASchedule(parsed: ParsedSchedule): parsed is ParsedSchedule & { isTBA: true } {
  return parsed.isTBA;
}

/**
 * Type guard to check if a parsed schedule has a single time slot
 *
 * @param parsed - The parsed schedule to check
 * @returns true if the schedule has exactly one time slot
 */
export function isSingleSlotSchedule(parsed: ParsedSchedule): boolean {
  return !parsed.isTBA && parsed.allTimeSlots.length === 1;
}

/**
 * Type guard to check if a parsed schedule has multiple time slots
 *
 * @param parsed - The parsed schedule to check
 * @returns true if the schedule has multiple time slots
 */
export function isMultiSlotSchedule(parsed: ParsedSchedule): boolean {
  return !parsed.isTBA && parsed.allTimeSlots.length > 1;
}

/**
 * Converts a ParsedSchedule to a ScheduleType discriminated union
 *
 * @param parsed - The parsed schedule to convert
 * @returns A ScheduleType discriminated union
 */
export function toScheduleType(parsed: ParsedSchedule): ScheduleType {
  if (parsed.isTBA) {
    return { type: 'tba' };
  }
  if (parsed.allTimeSlots.length === 1) {
    return { type: 'single', slot: parsed.allTimeSlots[0]! };
  }
  return { type: 'multi', slots: parsed.allTimeSlots };
}

// ============================================================================
// Course Types
// ============================================================================

/**
 * Unique identifier for a course (compound key)
 * A course is uniquely identified by the combination of id, subject, and section
 */
export interface CourseIdentity {
  /** Unique identifier (often timestamp-based) */
  readonly id: string;
  /** Subject code (e.g., 'IT 111') */
  readonly subject: string;
  /** Section identifier (e.g., 'BSIT-1A-AP3') */
  readonly section: string;
}

/**
 * Represents a single course offering
 *
 * @example
 * const course: Course = {
 *   id: '1708123456789-0',
 *   subject: 'IT 111',
 *   subjectTitle: 'Introduction to Computing',
 *   section: 'BSIT-1A-AP3',
 *   schedule: 'TTH | 9:00AM-10:30AM | Room#online',
 *   room: 'online',
 *   units: '3',
 *   isLocked: false,
 *   isClosed: false,
 *   enrolled: 25,
 *   assessed: 25,
 *   totalSlots: 40,
 *   availableSlots: 15,
 *   offeringDept: 'DCIT'
 * };
 */
export interface Course extends CourseIdentity {
  /** Full title of the subject */
  readonly subjectTitle: string;
  /** Raw schedule string (e.g., "TTH | 9:00AM-10:30AM | ROOM") */
  readonly schedule: string;
  /** Room/location */
  readonly room: string;
  /** Number of units (as string from data source) */
  readonly units: string;
  /** Credited units (may differ from enrolled units for cross-enrolled students) */
  readonly creditedUnits?: string;
  /** Whether this course is locked in the schedule */
  readonly isLocked: boolean;
  /** Whether this course section is closed (full) */
  readonly isClosed: boolean;
  /** Number of enrolled students */
  readonly enrolled: number;
  /** Number of assessed students */
  readonly assessed: number;
  /** Total available slots for this section */
  readonly totalSlots: number;
  /** Available (remaining) slots */
  readonly availableSlots: number;
  /** Department offering the course */
  readonly offeringDept?: string;
}

/**
 * Mutable version of Course for state updates
 * Used internally by React state management
 */
export interface MutableCourse extends Omit<Course, keyof CourseIdentity> {
  id: string;
  subject: string;
  section: string;
}

/**
 * Grouped courses for display in the course table
 */
export interface GroupedCourse {
  /** Value to group by (subject name, department, etc.) */
  readonly groupValue: string;
  /** Courses in this group */
  readonly courses: readonly Course[];
}

/**
 * Courses indexed by subject code
 * Used for schedule generation algorithms
 */
export type CoursesBySubject = Record<string, readonly Course[]>;

// ============================================================================
// Filter & Preference Types
// ============================================================================

/**
 * Time range for exclusion filtering
 */
export interface TimeRange {
  /** Unique identifier for this range */
  readonly id: number;
  /** Start time in HH:mm format */
  readonly start: string;
  /** End time in HH:mm format */
  readonly end: string;
}

/**
 * Filter state for course filtering
 */
export interface FilterState {
  /** Days to exclude from schedules */
  readonly excludedDays: readonly DayCode[];
  /** Time ranges to exclude */
  readonly excludedTimeRanges: readonly TimeRange[];
  /** Section types to filter (AP3, AP4, AP5) */
  readonly selectedSectionTypes: readonly SectionTypeSuffix[];
  /** Status filter (all/open/closed) */
  readonly selectedStatusFilter: StatusFilter;
  /** Grouping mode for display */
  readonly groupingKey: GroupingMode;
}

/**
 * User preferences for schedule generation
 */
export interface SchedulePreferences {
  /** Maximum allowed units per schedule (empty string = no limit) */
  readonly maxUnits: string;
  /** Maximum gap between classes in hours (empty string = no limit) */
  readonly maxGapHours: string;
  /** Preferred time ordering for scoring (lower index = higher preference) */
  readonly preferredTimeOfDayOrder: readonly TimeOfDayBucket[];
  /** Schedule search algorithm mode */
  readonly scheduleSearchMode: ScheduleSearchMode;
  /** Whether to prioritize schedules with fewer on-campus days */
  readonly minimizeDaysOnCampus: boolean;
}

// ============================================================================
// Schedule Generation Types
// ============================================================================

/**
 * Result of schedule generation algorithms
 */
export interface ScheduleGenerationResult {
  /** Best schedule found (array of courses) */
  readonly bestSchedule: readonly Course[];
  /** Score based on (courses * 100 + total units) */
  readonly bestScore: number;
  /** Time preference score (lower is better, based on user preferences) */
  readonly bestTimePrefScore: number;
  /** Number of unique on-campus days */
  readonly bestCampusDays: number;
}

/**
 * Options for schedule generation algorithms
 */
export interface ScheduleAlgorithmOptions {
  /** Courses grouped by subject code */
  readonly coursesBySubject: CoursesBySubject;
  /** Preferred time ordering for scoring */
  readonly preferredTimeOfDayOrder: readonly TimeOfDayBucket[];
  /** Maximum units constraint (empty string = no limit) */
  readonly maxUnits: string;
  /** Maximum gap hours constraint (empty string = no limit) */
  readonly maxGapHours: string;
  /** Whether to minimize campus days */
  readonly minimizeDaysOnCampus: boolean;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Theme palette state - stores palette preference for each theme mode
 */
export interface ThemePaletteState {
  /** Palette for light theme */
  readonly light: ColorPalette;
  /** Palette for dark theme */
  readonly dark: ColorPalette;
}

/**
 * Dialog configuration for confirmation dialogs
 */
export interface DialogState {
  /** Whether the dialog is open */
  readonly open: boolean;
  /** Dialog title */
  readonly title: string;
  /** Dialog message/content */
  readonly message: string;
  /** Callback when user confirms */
  readonly onConfirm: (() => void) | null;
  /** Callback when user cancels */
  readonly onCancel: (() => void) | null;
  /** Text for confirm button */
  readonly confirmText: string;
  /** Text for cancel button */
  readonly cancelText: string;
}

/**
 * Complete application state
 * Represents all state managed by the App component
 */
export interface AppState {
  // Core Data
  /** Master list of all imported courses */
  readonly allCourses: readonly Course[];
  /** Filtered/grouped courses for display */
  readonly processedCourses: readonly Course[] | readonly GroupedCourse[];
  /** Raw input text for import */
  readonly rawData: string;

  // Theme
  /** Current theme mode */
  readonly theme: ThemeMode;
  /** Palette preferences per theme */
  readonly themePalette: ThemePaletteState;

  // Filters
  /** Current filter state */
  readonly filterState: FilterState;

  // Preferences
  /** Schedule generation preferences */
  readonly preferences: SchedulePreferences;

  // UI State
  /** IDs of courses with schedule conflicts */
  readonly conflictingLockedCourseIds: ReadonlySet<string>;
  /** Whether timetable view is visible */
  readonly showTimetable: boolean;
  /** Count of generated schedules in current session */
  readonly generatedScheduleCount: number;
  /** Array of generated schedule key arrays */
  readonly generatedSchedules: readonly (readonly string[])[];
  /** Index of currently displayed schedule */
  readonly currentScheduleIndex: number;
  /** Whether schedule generation is in progress */
  readonly isGenerating: boolean;
  /** Current dialog state */
  readonly confirmDialog: DialogState;
}

// ============================================================================
// Local Storage Types
// ============================================================================

/**
 * Local storage key identifiers
 */
export const LOCAL_STORAGE_KEYS = {
  COURSES: 'courseBuilder_allCourses',
  EXCLUDED_DAYS: 'courseBuilder_excludedDays',
  EXCLUDED_RANGES: 'courseBuilder_excludedTimeRanges',
  THEME: 'courseBuilder_theme',
  THEME_PALETTE: 'courseBuilder_themePalette',
  GROUPING: 'courseBuilder_groupingKey',
  SECTION_TYPES: 'courseBuilder_selectedSectionTypes',
  STATUS_FILTER: 'courseBuilder_selectedStatusFilter',
  MAX_UNITS: 'courseBuilder_maxUnits',
  MAX_CLASS_GAP_HOURS: 'courseBuilder_maxClassGapHours',
  PREFERRED_TIME_OF_DAY: 'courseBuilder_preferredTimeOfDay',
  SCHEDULE_SEARCH_MODE: 'courseBuilder_scheduleSearchMode',
  MINIMIZE_DAYS_ON_CAMPUS: 'courseBuilder_minimizeDaysOnCampus',
} as const;

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed values for various filters and preferences
 */
export const ALLOWED_VALUES = {
  GROUPING_KEYS: ['none', 'offeringDept', 'subject'] as const,
  SECTION_TYPE_SUFFIXES: ['AP3', 'AP4', 'AP5'] as const,
  STATUS_FILTERS: ['all', 'open', 'closed'] as const,
  PREFERRED_TIMES: ['any', 'morning', 'afternoon', 'evening'] as const,
  SEARCH_MODES: ['fast', 'exhaustive', 'partial'] as const,
  PALETTES: ['original', 'comfort', 'space'] as const,
} as const;

/**
 * Default values for preferences
 */
export const DEFAULT_VALUES = {
  PREFERRED_TIMES_ORDER: ['morning', 'afternoon', 'evening', 'any'] as const,
  THEME: 'dark' as const,
  THEME_PALETTE: { light: 'original', dark: 'original' } as const,
  GROUPING: 'subject' as const,
  STATUS_FILTER: 'open' as const,
  SEARCH_MODE: 'partial' as const,
  MINIMIZE_DAYS_ON_CAMPUS: false,
};

/**
 * Threshold for switching from exhaustive to heuristic search
 */
export const SMALL_N_THRESHOLD_PARTIAL = 12;

// ============================================================================
// Function Type Signatures
// ============================================================================

/**
 * Parse function signature for schedule strings
 * @param scheduleString - The raw schedule string to parse
 * @returns Parsed schedule with time slots and metadata, or null if parsing fails
 */
export type ParseScheduleFunction = (scheduleString: string) => ParsedSchedule | null;

/**
 * Time overlap check function signature
 * @param start1 - Start time of first range (HH:mm)
 * @param end1 - End time of first range (HH:mm)
 * @param start2 - Start time of second range (HH:mm)
 * @param end2 - End time of second range (HH:mm)
 * @returns true if the time ranges overlap
 */
export type CheckTimeOverlapFunction = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
) => boolean;

/**
 * Schedule conflict check function signature
 * @param schedule - Array of courses to check for conflicts
 * @param parseFn - Function to parse schedule strings
 * @param overlapFn - Function to check time overlaps
 * @returns true if schedule has no time conflicts
 */
export type IsScheduleConflictFreeFunction = (
  schedule: readonly Course[],
  parseFn: ParseScheduleFunction,
  overlapFn: CheckTimeOverlapFunction
) => boolean;

/**
 * Time of day bucket function signature
 * @param time - Time string in HH:mm format (can be null/undefined)
 * @returns The time bucket category
 */
export type GetTimeOfDayBucketFunction = (time: string | null | undefined) => TimeOfDayBucket;

/**
 * Schedule scoring function signature
 * @param schedule - Array of courses to score
 * @param prefOrder - Preferred time order for scoring
 * @returns Score value (lower is better)
 */
export type ScoreScheduleByTimePreferenceFunction = (
  schedule: readonly Course[],
  prefOrder: readonly TimeOfDayBucket[]
) => number;

/**
 * Max units check function signature
 * @param schedule - Array of courses to check
 * @param maxUnits - Maximum allowed units (empty string = no limit)
 * @returns true if schedule exceeds the max units limit
 */
export type ExceedsMaxUnitsFunction = (schedule: readonly Course[], maxUnits: string) => boolean;

/**
 * Max gap check function signature
 * @param schedule - Array of courses to check
 * @param maxGapHours - Maximum allowed gap in hours (empty string = no limit)
 * @returns true if schedule has gaps exceeding the limit
 */
export type ExceedsMaxGapFunction = (schedule: readonly Course[], maxGapHours: string) => boolean;

/**
 * Campus days count function signature
 * @param schedule - Array of courses to count days for
 * @returns Number of unique on-campus days
 */
export type CountCampusDaysFunction = (schedule: readonly Course[]) => number;

/**
 * Local storage loader function signature
 * @param key - Storage key to load
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value or default
 */
export type LoadFromLocalStorageFunction = <T>(key: string, defaultValue: T) => T;

/**
 * Section type suffix extractor function signature
 * @param sectionString - Section string to extract from
 * @returns The section type suffix or null
 */
export type GetSectionTypeSuffixFunction = (sectionString: string) => SectionTypeSuffix | null;

/**
 * Subset generator function signature
 * @param arr - Array to generate subsets from
 * @returns Array of all possible subsets
 */
export type GetAllSubsetsFunction = <T>(arr: readonly T[]) => readonly (readonly T[])[];

/**
 * Exhaustive schedule generator function signature
 */
export type GenerateExhaustiveBestScheduleFunction = (
  options: ScheduleAlgorithmOptions
) => ScheduleGenerationResult | null;

/**
 * Heuristic schedule generator function signature
 */
export type GenerateBestPartialScheduleHeuristicFunction = (
  options: ScheduleAlgorithmOptions
) => ScheduleGenerationResult | null;

/**
 * Main partial schedule generator function signature
 */
export type GenerateBestPartialScheduleFunction = (
  options: ScheduleAlgorithmOptions
) => ScheduleGenerationResult | null;
