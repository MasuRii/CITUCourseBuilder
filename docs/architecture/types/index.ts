/**
 * TypeScript Interface Definitions for CITU Course Builder
 * 
 * This file contains all TypeScript interfaces needed for the application.
 * These interfaces will be used when migrating to the Astro project.
 * 
 * @module types
 * @generated 2026-02-17
 * @task T1.1.2 - Catalog all scheduling algorithms and their dependencies
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
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Color palette options
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
  days: DayCode[];
  /** Start time in HH:mm format (24-hour) */
  startTime: string | null;
  /** End time in HH:mm format (24-hour) */
  endTime: string | null;
  /** Room/location for this slot */
  room?: string;
}

/**
 * Result of parsing a schedule string
 * Can represent TBA schedules, single slots, or multi-slot schedules
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
  allTimeSlots: TimeSlot[];
  /** Representative days (union of all slot days, sorted) */
  representativeDays: DayCode[];
  /** Whether this is a TBA (To Be Announced) schedule */
  isTBA: boolean;
  /** Original schedule string before parsing */
  rawScheduleString?: string;
  // Backward compatibility properties (first slot)
  /** Days from the first time slot (backward compatibility) */
  days: DayCode[];
  /** Start time from the first time slot (backward compatibility) */
  startTime: string | null;
  /** End time from the first time slot (backward compatibility) */
  endTime: string | null;
}

/**
 * Discriminated union for schedule types
 * Use this for type-safe schedule handling
 */
export type ScheduleType = 
  | { type: 'tba' }
  | { type: 'single'; slot: TimeSlot }
  | { type: 'multi'; slots: TimeSlot[] };

/**
 * Helper function type guard for schedule types
 */
export function isTBASchedule(parsed: ParsedSchedule): boolean {
  return parsed.isTBA;
}

export function isSingleSlotSchedule(parsed: ParsedSchedule): boolean {
  return !parsed.isTBA && parsed.allTimeSlots.length === 1;
}

export function isMultiSlotSchedule(parsed: ParsedSchedule): boolean {
  return !parsed.isTBA && parsed.allTimeSlots.length > 1;
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
  id: string;
  /** Subject code (e.g., 'IT 111') */
  subject: string;
  /** Section identifier (e.g., 'BSIT-1A-AP3') */
  section: string;
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
  subjectTitle: string;
  /** Raw schedule string (e.g., "TTH | 9:00AM-10:30AM | ROOM") */
  schedule: string;
  /** Room/location */
  room: string;
  /** Number of units (as string from data source) */
  units: string;
  /** Credited units (may differ from enrolled units for cross-enrolled students) */
  creditedUnits?: string;
  /** Whether this course is locked in the schedule */
  isLocked: boolean;
  /** Whether this course section is closed (full) */
  isClosed: boolean;
  /** Number of enrolled students */
  enrolled: number;
  /** Number of assessed students */
  assessed: number;
  /** Total available slots for this section */
  totalSlots: number;
  /** Available (remaining) slots */
  availableSlots: number;
  /** Department offering the course */
  offeringDept?: string;
}

/**
 * Grouped courses for display in the course table
 */
export interface GroupedCourse {
  /** Value to group by (subject name, department, etc.) */
  groupValue: string;
  /** Courses in this group */
  courses: Course[];
}

/**
 * Courses indexed by subject code
 * Used for schedule generation algorithms
 */
export type CoursesBySubject = Record<string, Course[]>;

// ============================================================================
// Filter & Preference Types
// ============================================================================

/**
 * Time range for exclusion filtering
 */
export interface TimeRange {
  /** Unique identifier for this range */
  id: number;
  /** Start time in HH:mm format */
  start: string;
  /** End time in HH:mm format */
  end: string;
}

/**
 * Filter state for course filtering
 */
export interface FilterState {
  /** Days to exclude from schedules */
  excludedDays: DayCode[];
  /** Time ranges to exclude */
  excludedTimeRanges: TimeRange[];
  /** Section types to filter (AP3, AP4, AP5) */
  selectedSectionTypes: SectionTypeSuffix[];
  /** Status filter (all/open/closed) */
  selectedStatusFilter: StatusFilter;
  /** Grouping mode for display */
  groupingKey: GroupingMode;
}

/**
 * User preferences for schedule generation
 */
export interface SchedulePreferences {
  /** Maximum allowed units per schedule (empty string = no limit) */
  maxUnits: string;
  /** Maximum gap between classes in hours (empty string = no limit) */
  maxGapHours: string;
  /** Preferred time ordering for scoring (lower index = higher preference) */
  preferredTimeOfDayOrder: TimeOfDayBucket[];
  /** Schedule search algorithm mode */
  scheduleSearchMode: ScheduleSearchMode;
  /** Whether to prioritize schedules with fewer on-campus days */
  minimizeDaysOnCampus: boolean;
}

// ============================================================================
// Schedule Generation Types
// ============================================================================

/**
 * Result of schedule generation algorithms
 */
export interface ScheduleGenerationResult {
  /** Best schedule found (array of courses) */
  bestSchedule: Course[];
  /** Score based on (courses * 100 + total units) */
  bestScore: number;
  /** Time preference score (lower is better, based on user preferences) */
  bestTimePrefScore: number;
  /** Number of unique on-campus days */
  bestCampusDays: number;
}

/**
 * Options for schedule generation algorithms
 */
export interface ScheduleAlgorithmOptions {
  /** Courses grouped by subject code */
  coursesBySubject: CoursesBySubject;
  /** Preferred time ordering for scoring */
  preferredTimeOfDayOrder: TimeOfDayBucket[];
  /** Maximum units constraint (empty string = no limit) */
  maxUnits: string;
  /** Maximum gap hours constraint (empty string = no limit) */
  maxGapHours: string;
  /** Whether to minimize campus days */
  minimizeDaysOnCampus: boolean;
}

/**
 * Internal state for heuristic algorithm
 * Not exported, used internally by generateBestPartialSchedule_Heuristic
 */
interface HeuristicState {
  currentSchedule: Course[];
  currentSubjectsSet: Set<string>;
  poolOfCandidates: Course[];
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Theme palette state - stores palette preference for each theme mode
 */
export interface ThemePaletteState {
  /** Palette for light theme */
  light: ColorPalette;
  /** Palette for dark theme */
  dark: ColorPalette;
}

/**
 * Dialog configuration for confirmation dialogs
 */
export interface DialogState {
  /** Whether the dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/content */
  message: string;
  /** Callback when user confirms */
  onConfirm: (() => void) | null;
  /** Callback when user cancels */
  onCancel: (() => void) | null;
  /** Text for confirm button */
  confirmText: string;
  /** Text for cancel button */
  cancelText: string;
}

/**
 * Complete application state
 * Represents all state managed by the App component
 */
export interface AppState {
  // Core Data
  /** Master list of all imported courses */
  allCourses: Course[];
  /** Filtered/grouped courses for display */
  processedCourses: Course[] | GroupedCourse[];
  /** Raw input text for import */
  rawData: string;
  
  // Theme
  /** Current theme mode */
  theme: ThemeMode;
  /** Palette preferences per theme */
  themePalette: ThemePaletteState;
  
  // Filters
  /** Current filter state */
  filterState: FilterState;
  
  // Preferences
  /** Schedule generation preferences */
  preferences: SchedulePreferences;
  
  // UI State
  /** IDs of courses with schedule conflicts */
  conflictingLockedCourseIds: Set<string>;
  /** Whether timetable view is visible */
  showTimetable: boolean;
  /** Count of generated schedules in current session */
  generatedScheduleCount: number;
  /** Array of generated schedule key arrays */
  generatedSchedules: string[][];
  /** Index of currently displayed schedule */
  currentScheduleIndex: number;
  /** Whether schedule generation is in progress */
  isGenerating: boolean;
  /** Current dialog state */
  confirmDialog: DialogState;
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

export type LocalStorageKey = typeof LOCAL_STORAGE_KEYS[keyof typeof LOCAL_STORAGE_KEYS];

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
  PREFERRED_TIMES_ORDER: ['morning', 'afternoon', 'evening', 'any'] as TimeOfDayBucket[],
  THEME: 'dark' as ThemeMode,
  THEME_PALETTE: { light: 'original', dark: 'original' } as ThemePaletteState,
  GROUPING: 'subject' as GroupingMode,
  STATUS_FILTER: 'open' as StatusFilter,
  SEARCH_MODE: 'partial' as ScheduleSearchMode,
  MINIMIZE_DAYS_ON_CAMPUS: false,
};

/**
 * Threshold for switching from exhaustive to heuristic search
 */
export const SMALL_N_THRESHOLD_PARTIAL = 12;
