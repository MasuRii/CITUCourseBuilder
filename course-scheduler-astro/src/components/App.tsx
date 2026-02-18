/**
 * Main App Component
 *
 * The primary React island component for CITU Course Builder.
 * Integrates all child components and manages application state through custom hooks.
 *
 * @module components/App
 * @see docs/architecture/REACT_ISLANDS_HYDRATION.md - Uses client:load for immediate interactivity
 */

import { useState, useCallback, useEffect, useMemo, type ChangeEvent, type ReactNode } from 'react';
import {
  Moon,
  Sun,
  Palette,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  useCourseState,
  useFilterState,
  useSchedulePreferences,
  useScheduleGeneration,
  useTheme,
} from '@/hooks';
import type {
  Course,
  DayCode,
  SectionTypeSuffix,
  StatusFilter,
  TimeOfDayBucket,
  CourseIdentity,
  TimeRange,
  ScheduleSearchMode,
  GroupingMode,
} from '@/types/index';
import { DEFAULT_VALUES } from '@/types/index';
import { parseRawCourseData } from '@/utils/parseRawData';
import { parseSchedule } from '@/utils/parseSchedule';
import {
  checkTimeOverlap,
  isScheduleConflictFree,
  scoreScheduleByTimePreference,
  exceedsMaxUnits,
  exceedsMaxGap,
  countCampusDays,
  generateExhaustiveBestSchedule,
  generateBestPartialSchedule,
} from '@/utils/scheduleAlgorithms';

import ConfirmDialog, { type DialogVariant } from './ConfirmDialog';
import CourseTable from './CourseTable';
import RawDataInput from './RawDataInput';
import TimeFilter from './TimeFilter';
import TimetableView from './TimetableView';
import { ToastContainer, subscribeToToasts, type ToastMessage, toast } from './Toast';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal dialog state for confirmation dialogs
 */
interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  confirmText: string;
  cancelText: string;
  variant: DialogVariant;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract section type suffix from section string
 */
function getSectionTypeSuffix(sectionString: string): SectionTypeSuffix | null {
  const parts = sectionString.split('-');
  const lastPart = parts[parts.length - 1];
  if (lastPart === 'AP3' || lastPart === 'AP4' || lastPart === 'AP5') {
    return lastPart;
  }
  return null;
}

/**
 * Generate unique key for a course
 */
function getCourseKey(course: Course): string {
  return `${course.id}-${course.subject}-${course.section}`;
}

/**
 * Generate combination key for schedule deduplication
 */
function generateCombinationKey(courses: readonly Course[]): string {
  return courses
    .map((c) => c.id)
    .sort()
    .join(',');
}

// ============================================================================
// Constants
// ============================================================================

const SECTION_TYPE_SUFFIXES: readonly SectionTypeSuffix[] = ['AP3', 'AP4', 'AP5'];

const SECTION_TYPE_DESCRIPTIONS: Record<SectionTypeSuffix, string> = {
  AP3: 'Online Class',
  AP4: 'Face-to-Face',
  AP5: 'Hybrid (F2F & Online)',
};

// ============================================================================
// Toast System Integration
// ============================================================================

/**
 * Toast helper object that wraps the toast function with the callback
 * This allows external callbacks (like onToast prop) to be notified
 */
let globalOnToast: ((message: string, type: ToastMessage['type']) => void) | undefined;

const toastHelper = {
  success: (message: string): void => {
    toast.success(message);
    globalOnToast?.(message, 'success');
  },
  error: (message: string): void => {
    toast.error(message);
    globalOnToast?.(message, 'error');
  },
  warning: (message: string): void => {
    toast.warning(message);
    globalOnToast?.(message, 'warning');
  },
  info: (message: string): void => {
    toast.info(message);
    globalOnToast?.(message, 'info');
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Main App Component Props
 */
export interface AppProps {
  /** Optional callback when toast is shown (for testing) */
  onToast?: (message: string, type: ToastMessage['type']) => void;
}

/**
 * Main App Component
 *
 * Features:
 * - Course data import (WITS/AIMS)
 * - Course table with grouping and filtering
 * - Schedule generation with multiple modes
 * - Timetable visualization
 * - Theme and palette customization
 *
 * @example
 * ```tsx
 * <App />
 * ```
 */
export default function App({ onToast }: AppProps): ReactNode {
  // =========================================================================
  // Custom Hooks
  // =========================================================================

  const courseState = useCourseState();
  const filterState = useFilterState();
  const schedulePreferences = useSchedulePreferences();
  const scheduleGeneration = useScheduleGeneration();
  const themeState = useTheme();

  // =========================================================================
  // Local State
  // =========================================================================

  const [rawData, setRawData] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info',
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // =========================================================================
  // Collapsible Sections State
  // =========================================================================

  /**
   * Track which sections are collapsed on mobile
   * Sections start expanded by default
   */
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  /**
   * Toggle a section's collapsed state
   */
  const toggleSection = useCallback((sectionId: string): void => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // =========================================================================
  // Toast System Setup
  // =========================================================================

  useEffect(() => {
    // Set the global callback for external notification
    globalOnToast = onToast;

    // Subscribe to toast messages and update local state
    const unsubscribe = subscribeToToasts((newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
    });

    return () => {
      unsubscribe();
      globalOnToast = undefined;
    };
  }, [onToast]);

  /**
   * Handle dismissing a toast notification
   */
  const handleDismissToast = useCallback((id: number): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // =========================================================================
  // Derived State
  // =========================================================================

  /**
   * Filter courses for schedule generation
   * Applies status filter, section type filter, and day/time exclusions
   */
  const filteredCoursesForGeneration = useMemo(() => {
    return courseState.allCourses.filter((course: Course) => {
      // Status filter
      if (courseState.selectedStatusFilter === 'open' && course.isClosed === true) {
        return false;
      }
      if (courseState.selectedStatusFilter === 'closed' && course.isClosed === false) {
        return false;
      }

      // Available slots check
      if (course.availableSlots <= 0) {
        return false;
      }

      // Section type filter
      if (courseState.selectedSectionTypes.length > 0) {
        const courseSectionType = getSectionTypeSuffix(course.section);
        if (!courseSectionType || !courseState.selectedSectionTypes.includes(courseSectionType)) {
          return false;
        }
      }

      // Day/time exclusion filter
      const parsedScheduleResult = parseSchedule(course.schedule);
      if (
        !parsedScheduleResult ||
        parsedScheduleResult.isTBA ||
        !parsedScheduleResult.allTimeSlots ||
        parsedScheduleResult.allTimeSlots.length === 0
      ) {
        return true; // Include TBA/invalid schedules
      }

      const anySlotIsExcluded = parsedScheduleResult.allTimeSlots.some((slot) => {
        // Check day exclusion
        const slotIsOnExcludedDay = slot.days.some((day: DayCode) =>
          filterState.excludedDays.includes(day)
        );
        if (slotIsOnExcludedDay) return true;

        // Check time range exclusion
        const slotOverlapsAnExcludedTimeRange = filterState.excludedTimeRanges.some(
          (excludedRange: TimeRange) => {
            if (excludedRange.start && excludedRange.end && slot.startTime && slot.endTime) {
              return checkTimeOverlap(
                slot.startTime,
                slot.endTime,
                excludedRange.start,
                excludedRange.end
              );
            }
            return false;
          }
        );
        return slotOverlapsAnExcludedTimeRange;
      });

      return !anySlotIsExcluded;
    });
  }, [
    courseState.allCourses,
    courseState.selectedStatusFilter,
    courseState.selectedSectionTypes,
    filterState.excludedDays,
    filterState.excludedTimeRanges,
  ]);

  // =========================================================================
  // Event Handlers - Data Import
  // =========================================================================

  /**
   * Handle loading raw data from WITS or AIMS
   * Returns true on success, false on failure for visual feedback
   */
  const handleLoadRawData = useCallback(
    (mode: 'WITS' | 'AIMS'): boolean => {
      try {
        const parsed = parseRawCourseData(rawData);
        if (parsed.length === 0) {
          toastHelper.error(
            `No courses found using ${mode} format. Please ensure you copied the data correctly.`
          );
          return false;
        }

        const coursesWithDefaults: Course[] = parsed.map(
          (course, index) =>
            ({
              ...course,
              id: course.id ?? `${Date.now()}-${index}`,
              units: String(course.creditedUnits),
              creditedUnits: String(course.creditedUnits),
              isLocked: course.isLocked ?? false,
              isClosed:
                course.isClosed ?? (course.totalSlots > 0 && course.enrolled >= course.totalSlots),
            }) as Course
        );

        courseState.addCourses(coursesWithDefaults);
        toastHelper.success(
          `Successfully imported ${coursesWithDefaults.length} courses from ${mode}!`
        );
        return true;
      } catch (error) {
        console.error('Error parsing raw data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toastHelper.error(`Error loading data: ${errorMessage}`);
        return false;
      }
    },
    [rawData, courseState]
  );

  // =========================================================================
  // Event Handlers - Course Management
  // =========================================================================

  /**
   * Handle toggling lock on a course
   * Checks for conflicts with existing locked courses
   */
  const handleToggleLockCourse = useCallback(
    (identity: CourseIdentity): void => {
      const { id, subject, section } = identity;

      const courseBeforeToggle = courseState.allCourses.find(
        (c: Course) => c.id === id && c.subject === subject && c.section === section
      );

      if (!courseBeforeToggle) return;

      // Check available slots
      if (!courseBeforeToggle.isLocked && courseBeforeToggle.availableSlots <= 0) {
        toastHelper.error('Cannot lock - no available slots');
        return;
      }

      // If unlocking, just do it
      if (courseBeforeToggle.isLocked) {
        courseState.toggleLockCourse(identity);
        return;
      }

      // Check for conflicts with existing locked courses
      const lockedCourses = courseState.lockedCourses;
      const scheduleToLock = parseSchedule(courseBeforeToggle.schedule);

      if (
        !scheduleToLock ||
        scheduleToLock.isTBA ||
        !scheduleToLock.allTimeSlots ||
        scheduleToLock.allTimeSlots.length === 0
      ) {
        // TBA or invalid schedule - just lock it
        courseState.toggleLockCourse(identity);
        scheduleGeneration.setShowTimetable(true);
        return;
      }

      // Check for conflicts
      const conflictingCourses: Course[] = [];
      for (const lockedCourse of lockedCourses) {
        const lockedSchedule = parseSchedule(lockedCourse.schedule);

        if (
          !lockedSchedule ||
          lockedSchedule.isTBA ||
          !lockedSchedule.allTimeSlots ||
          lockedSchedule.allTimeSlots.length === 0
        ) {
          continue;
        }

        let hasTimeOverlap = false;
        for (const slot1 of scheduleToLock.allTimeSlots) {
          for (const slot2 of lockedSchedule.allTimeSlots) {
            const commonDays = slot1.days.filter((day: DayCode) => slot2.days.includes(day));
            if (commonDays.length > 0) {
              if (slot1.startTime && slot1.endTime && slot2.startTime && slot2.endTime) {
                if (
                  checkTimeOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)
                ) {
                  hasTimeOverlap = true;
                  break;
                }
              }
            }
          }
          if (hasTimeOverlap) break;
        }

        if (hasTimeOverlap) {
          conflictingCourses.push(lockedCourse);
        }
      }

      if (conflictingCourses.length > 0) {
        const attemptedCourseDetails = `${courseBeforeToggle.subject} ${courseBeforeToggle.section} (${courseBeforeToggle.schedule})`;
        const conflictingDetails = conflictingCourses
          .map((c) => `${c.subject} ${c.section} (${c.schedule})`)
          .join('; ');

        toastHelper.error(
          `Lock failed: Attempted to lock ${attemptedCourseDetails}, but it conflicts with: ${conflictingDetails}`
        );

        setConfirmDialog({
          open: true,
          title: 'Schedule Conflict',
          message: `You attempted to lock ${attemptedCourseDetails}, but it conflicts with the following locked course(s):\n${conflictingDetails}.\nDo you still want to lock it?`,
          confirmText: 'Lock Anyway',
          cancelText: 'Cancel',
          variant: 'warning',
          onConfirm: () => {
            courseState.toggleLockCourse(identity);
            scheduleGeneration.setShowTimetable(true);
            setConfirmDialog((d) => ({ ...d, open: false }));
          },
          onCancel: () => {
            setConfirmDialog((d) => ({ ...d, open: false }));
          },
        });
        return;
      }

      // No conflicts - lock the course
      courseState.toggleLockCourse(identity);
      const { setShowTimetable } = scheduleGeneration;
      setShowTimetable(true);
    },
    [courseState, scheduleGeneration]
  );

  /**
   * Handle deleting a course
   */
  const handleDeleteCourse = useCallback(
    (identity: CourseIdentity): void => {
      courseState.deleteCourse(identity);
    },
    [courseState]
  );

  /**
   * Handle deleting all courses
   */
  const handleDeleteAllCourses = useCallback((): void => {
    setConfirmDialog({
      open: true,
      title: 'Delete All Courses',
      message: 'Delete ALL courses? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        courseState.deleteAllCourses();
        setRawData('');
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
      onCancel: () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  }, [courseState]);

  /**
   * Handle clearing all locks
   */
  const handleClearAllLocks = useCallback((): void => {
    setConfirmDialog({
      open: true,
      title: 'Clear All Locks',
      message: 'Are you sure you want to clear all locks? This will unlock all courses.',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      variant: 'info',
      onConfirm: () => {
        courseState.clearAllLocks();
        setConfirmDialog((d) => ({ ...d, open: false }));
        toastHelper.success('All locks cleared!');
      },
      onCancel: () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  }, [courseState]);

  // =========================================================================
  // Event Handlers - Filters
  // =========================================================================

  /**
   * Handle day exclusion change
   */
  const handleDayChange = useCallback(
    (dayCode: DayCode, _isExcluded: boolean): void => {
      filterState.toggleExcludedDay(dayCode);
    },
    [filterState]
  );

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = useCallback(
    (id: number, field: 'start' | 'end', value: string): void => {
      filterState.updateTimeRange(id, field, value);
    },
    [filterState]
  );

  /**
   * Handle adding time range
   */
  const handleAddTimeRange = useCallback((): void => {
    filterState.addTimeRange();
  }, [filterState]);

  /**
   * Handle removing time range
   */
  const handleRemoveTimeRange = useCallback(
    (id: number): void => {
      filterState.removeTimeRange(id);
    },
    [filterState]
  );

  /**
   * Handle grouping change
   */
  const handleGroupingChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      courseState.setGroupingKey(event.target.value as GroupingMode);
    },
    [courseState]
  );

  /**
   * Handle section type change
   */
  const handleSectionTypeChange = useCallback(
    (typeId: SectionTypeSuffix, isSelected: boolean): void => {
      if (isSelected) {
        if (!courseState.selectedSectionTypes.includes(typeId)) {
          courseState.setSelectedSectionTypes([...courseState.selectedSectionTypes, typeId]);
        }
      } else {
        courseState.setSelectedSectionTypes(
          courseState.selectedSectionTypes.filter((t) => t !== typeId)
        );
      }
    },
    [courseState]
  );

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = useCallback(
    (statusValue: StatusFilter): void => {
      courseState.setSelectedStatusFilter(statusValue);
    },
    [courseState]
  );

  // =========================================================================
  // Event Handlers - Preferences
  // =========================================================================

  /**
   * Handle max units change
   */
  const handleMaxUnitsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      if (value === '' || (/^[0-9]*$/.test(value) && parseInt(value, 10) >= 0)) {
        filterState.setMaxUnits(value);
      }
    },
    [filterState]
  );

  /**
   * Handle max gap change
   */
  const handleMaxGapChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>): void => {
      filterState.setMaxClassGapHours(e.target.value);
    },
    [filterState]
  );

  /**
   * Handle remove time preference
   */
  const handleRemoveTimePref = useCallback(
    (index: number): void => {
      schedulePreferences.removePreferredTime(index);
    },
    [schedulePreferences]
  );

  /**
   * Handle add time preference
   */
  const handleAddTimePref = useCallback(
    (time: TimeOfDayBucket): void => {
      schedulePreferences.addPreferredTime(time);
    },
    [schedulePreferences]
  );

  /**
   * Handle reset time preferences
   */
  const handleResetTimePrefs = useCallback((): void => {
    schedulePreferences.resetPreferredTimeOrder();
  }, [schedulePreferences]);

  // =========================================================================
  // Event Handlers - Schedule Generation
  // =========================================================================

  /**
   * Apply a generated schedule by locking the appropriate courses
   */
  const applyScheduleByIndex = useCallback(
    (index: number): void => {
      const schedule = scheduleGeneration.generatedSchedules[index];
      if (!schedule) return;

      courseState.applySchedule(schedule);
      scheduleGeneration.setCurrentScheduleIndex(index);
    },
    [scheduleGeneration, courseState]
  );

  /**
   * Navigate to next schedule
   */
  const handleNextSchedule = useCallback((): void => {
    if (scheduleGeneration.generatedSchedules.length === 0) return;
    const nextIndex =
      (scheduleGeneration.currentScheduleIndex + 1) % scheduleGeneration.generatedSchedules.length;
    applyScheduleByIndex(nextIndex);
  }, [scheduleGeneration, applyScheduleByIndex]);

  /**
   * Navigate to previous schedule
   */
  const handlePrevSchedule = useCallback((): void => {
    if (scheduleGeneration.generatedSchedules.length === 0) return;
    const prevIndex =
      (scheduleGeneration.currentScheduleIndex - 1 + scheduleGeneration.generatedSchedules.length) %
      scheduleGeneration.generatedSchedules.length;
    applyScheduleByIndex(prevIndex);
  }, [scheduleGeneration, applyScheduleByIndex]);

  /**
   * Clear all generated schedules
   */
  const handleClearGeneratedSchedules = useCallback((): void => {
    setConfirmDialog({
      open: true,
      title: 'Reset Schedule & Clear Locks',
      message:
        'Are you sure you want to reset the current schedule and clear all locks? This will remove all generated schedules and unlock all courses.',
      confirmText: 'Reset & Clear',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        scheduleGeneration.clearAllSchedules();
        courseState.clearAllLocks();
        setConfirmDialog((d) => ({ ...d, open: false }));
        toastHelper.success('Schedule reset and all locks cleared!');
      },
      onCancel: () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  }, [scheduleGeneration, courseState]);

  /**
   * Main schedule generation function
   */
  const generateBestSchedule = useCallback(async (): Promise<void> => {
    if (scheduleGeneration.isGenerating) return;
    scheduleGeneration.setIsGenerating(true);

    // Yield to allow UI update
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // Build courses by subject for exhaustive/partial modes
      const coursesBySubject: Record<string, Course[]> = {};
      for (const course of filteredCoursesForGeneration) {
        if (!coursesBySubject[course.subject]) {
          coursesBySubject[course.subject] = [];
        }
        coursesBySubject[course.subject].push(course);
      }

      const { preferredTimeOfDayOrder, minimizeDaysOnCampus, scheduleSearchMode } =
        schedulePreferences;
      const { maxUnits, maxClassGapHours } = filterState;

      // Warn for exhaustive search with many subjects
      if (scheduleSearchMode === 'exhaustive' && Object.keys(coursesBySubject).length > 12) {
        toastHelper.info(
          'Warning: Exhaustive search may be very slow for more than 12 subjects. Consider using Fast mode.'
        );
      }

      // Exhaustive mode
      if (scheduleSearchMode === 'exhaustive') {
        const result = generateExhaustiveBestSchedule(
          coursesBySubject,
          preferredTimeOfDayOrder,
          maxUnits,
          maxClassGapHours,
          minimizeDaysOnCampus
        );

        if (result && result.bestSchedule.length > 0) {
          const isActuallyConflictFree = isScheduleConflictFree(
            result.bestSchedule,
            parseSchedule,
            checkTimeOverlap
          );

          if (!isActuallyConflictFree) {
            toastHelper.error(
              'The best schedule found still had conflicts. Please try again or adjust filters. No schedule applied.'
            );
            return;
          }

          const scheduleKeys = result.bestSchedule.map(getCourseKey);
          courseState.applySchedule(scheduleKeys);
          scheduleGeneration.addGeneratedSchedule(scheduleKeys);
          scheduleGeneration.incrementScheduleCount();

          toastHelper.success(
            `Generated schedule #${scheduleGeneration.generatedScheduleCount + 1} with ${result.bestSchedule.length} courses (${result.bestScore - result.bestSchedule.length * 100} units)`
          );
        } else {
          toastHelper.error("Couldn't generate a valid schedule with current filters");
        }
        return;
      }

      // Partial mode
      if (scheduleSearchMode === 'partial') {
        // Flatten courses for partial schedule
        const flatCourses = Object.values(coursesBySubject).flat();
        const bestPartial = generateBestPartialSchedule(
          flatCourses,
          maxUnits,
          maxClassGapHours,
          preferredTimeOfDayOrder,
          minimizeDaysOnCampus
        );

        if (bestPartial && bestPartial.length > 0) {
          const scheduleKeys = bestPartial.map(getCourseKey);
          courseState.applySchedule(scheduleKeys);
          scheduleGeneration.addGeneratedSchedule(scheduleKeys);
          scheduleGeneration.incrementScheduleCount();

          const totalUnits = bestPartial.reduce(
            (sum, c) => sum + (parseFloat(c.creditedUnits || c.units) || 0),
            0
          );
          const uniqueSubjects = new Set(bestPartial.map((c) => c.subject)).size;

          toastHelper.success(
            `Generated schedule #${scheduleGeneration.generatedScheduleCount + 1} with ${bestPartial.length} courses (${totalUnits} units, ${uniqueSubjects} subjects)`
          );
        } else {
          toastHelper.error("Couldn't generate a valid partial schedule with current filters");
        }
        return;
      }

      // Fast mode (random sampling)
      let bestSchedule: Course[] = [];
      let bestScore = -1;
      let bestTimePrefScore = Infinity;
      let bestCampusDays = Infinity;
      const maxAttempts = 1000;
      let attempts = 0;

      while (attempts < maxAttempts) {
        attempts++;
        const currentSchedule: Course[] = [];

        Object.values(coursesBySubject).forEach((subjectCourses) => {
          const shuffledCourses = [...subjectCourses].sort(() => Math.random() - 0.5);

          for (const course of shuffledCourses) {
            const courseScheduleResult = parseSchedule(course.schedule);

            if (
              !courseScheduleResult ||
              courseScheduleResult.isTBA ||
              !courseScheduleResult.allTimeSlots ||
              courseScheduleResult.allTimeSlots.length === 0
            ) {
              currentSchedule.push(course);
              break;
            }

            let hasConflictWithCurrentSelection = false;
            for (const existingCourse of currentSchedule) {
              const existingScheduleResult = parseSchedule(existingCourse.schedule);

              if (
                !existingScheduleResult ||
                existingScheduleResult.isTBA ||
                !existingScheduleResult.allTimeSlots ||
                existingScheduleResult.allTimeSlots.length === 0
              ) {
                continue;
              }

              for (const newSlot of courseScheduleResult.allTimeSlots) {
                for (const existingSlot of existingScheduleResult.allTimeSlots) {
                  const commonDays = newSlot.days.filter((day: DayCode) =>
                    existingSlot.days.includes(day)
                  );
                  if (commonDays.length > 0) {
                    if (
                      newSlot.startTime &&
                      newSlot.endTime &&
                      existingSlot.startTime &&
                      existingSlot.endTime
                    ) {
                      if (
                        checkTimeOverlap(
                          newSlot.startTime,
                          newSlot.endTime,
                          existingSlot.startTime,
                          existingSlot.endTime
                        )
                      ) {
                        hasConflictWithCurrentSelection = true;
                        break;
                      }
                    }
                  }
                }
                if (hasConflictWithCurrentSelection) break;
              }
              if (hasConflictWithCurrentSelection) break;
            }

            if (!hasConflictWithCurrentSelection) {
              currentSchedule.push(course);
              break;
            }
          }
        });

        // Validate schedule
        if (!isScheduleConflictFree(currentSchedule, parseSchedule, checkTimeOverlap)) {
          continue;
        }
        if (exceedsMaxUnits(currentSchedule, maxUnits)) {
          continue;
        }
        if (exceedsMaxGap(currentSchedule, maxClassGapHours)) {
          continue;
        }

        // Check if already tried
        const scheduleKey = generateCombinationKey(currentSchedule);
        if (scheduleGeneration.triedCombinations.has(scheduleKey)) {
          continue;
        }
        scheduleGeneration.addTriedCombination(scheduleKey);

        // Calculate score
        const totalCourses = currentSchedule.length;
        const totalUnits = currentSchedule.reduce((sum, course) => {
          const units = parseFloat(course.creditedUnits || course.units);
          return isNaN(units) ? sum : sum + units;
        }, 0);
        const score = totalCourses * 100 + totalUnits;
        const timePrefScore = scoreScheduleByTimePreference(
          currentSchedule,
          preferredTimeOfDayOrder
        );
        const campusDays = minimizeDaysOnCampus ? countCampusDays(currentSchedule) : 0;

        if (minimizeDaysOnCampus) {
          if (
            campusDays < bestCampusDays ||
            (campusDays === bestCampusDays && score > bestScore) ||
            (campusDays === bestCampusDays &&
              score === bestScore &&
              timePrefScore < bestTimePrefScore)
          ) {
            bestCampusDays = campusDays;
            bestScore = score;
            bestTimePrefScore = timePrefScore;
            bestSchedule = currentSchedule;
          }
        } else {
          if (score > bestScore || (score === bestScore && timePrefScore < bestTimePrefScore)) {
            bestScore = score;
            bestTimePrefScore = timePrefScore;
            bestCampusDays = campusDays;
            bestSchedule = currentSchedule;
          }
        }

        // Early exit if found complete schedule
        if (bestSchedule.length === Object.keys(coursesBySubject).length) {
          break;
        }
      }

      if (bestSchedule.length > 0) {
        const isActuallyConflictFree = isScheduleConflictFree(
          bestSchedule,
          parseSchedule,
          checkTimeOverlap
        );

        if (!isActuallyConflictFree) {
          toastHelper.error(
            'The best schedule found still had conflicts. Please try again or adjust filters. No schedule applied.'
          );
          return;
        }

        const scheduleKeys = bestSchedule.map(getCourseKey);
        courseState.applySchedule(scheduleKeys);

        // Destructure to ensure we're using the latest functions
        const { addGeneratedSchedule, incrementScheduleCount, setShowTimetable } =
          scheduleGeneration;

        addGeneratedSchedule(scheduleKeys);
        incrementScheduleCount();
        setShowTimetable(true);

        toastHelper.success(
          `Generated schedule #${scheduleGeneration.generatedScheduleCount + 1} with ${bestSchedule.length} courses (${bestScore - bestSchedule.length * 100} units)`
        );
      } else {
        toastHelper.error("Couldn't generate a valid schedule with current filters");
      }
    } finally {
      scheduleGeneration.setIsGenerating(false);
    }
  }, [
    courseState,
    filteredCoursesForGeneration,
    scheduleGeneration,
    schedulePreferences,
    filterState,
  ]);

  // =========================================================================
  // Effect: Sync current schedule index
  // =========================================================================

  const { generatedSchedules, currentScheduleIndex, setCurrentScheduleIndex } = scheduleGeneration;
  useEffect(() => {
    if (generatedSchedules.length === 0) {
      setCurrentScheduleIndex(0);
    } else if (currentScheduleIndex > generatedSchedules.length - 1) {
      setCurrentScheduleIndex(generatedSchedules.length - 1);
    }
  }, [generatedSchedules, currentScheduleIndex, setCurrentScheduleIndex]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} position="top-center" />

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mobile-header-controls">
        {/* Theme Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={themeState.toggleTheme}
            className="px-4 py-2.5 rounded-lg bg-surface-secondary border border-default
                     text-content-primary hover:bg-surface-hover transition-colors
                     flex items-center gap-2 min-h-[44px] touch-target"
          >
            {themeState.theme === 'light' ? (
              <>
                <Moon className="w-5 h-5" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            )}
          </button>

          <button
            onClick={themeState.cyclePalette}
            className="px-4 py-2.5 rounded-lg bg-surface-secondary border border-default
                     text-content-primary hover:bg-surface-hover transition-colors
                     flex items-center gap-2 min-h-[44px] touch-target"
          >
            <Palette className="w-5 h-5" />
            <span className="hidden sm:inline">
              {themeState.currentPalette === 'original'
                ? 'Comfort'
                : themeState.currentPalette === 'comfort'
                  ? 'Space'
                  : 'Original'}
            </span>
          </button>
        </div>

        {/* Schedule Generation Controls */}
        <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
          <button
            onClick={generateBestSchedule}
            disabled={courseState.allCourses.length === 0 || scheduleGeneration.isGenerating}
            className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg
                     shadow-md hover:bg-accent-hover disabled:opacity-50
                     disabled:cursor-not-allowed transition-all flex items-center gap-2
                     min-h-[44px] touch-target flex-1 md:flex-none justify-center"
          >
            {scheduleGeneration.isGenerating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {scheduleGeneration.generatedSchedules.length > 0
                  ? 'Generate Next'
                  : 'Generate Schedule'}
              </>
            )}
          </button>

          {scheduleGeneration.generatedSchedules.length > 1 && (
            <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={handlePrevSchedule}
                className="px-3 py-2.5 bg-surface-secondary border border-default rounded-lg
                         hover:bg-surface-hover transition-colors flex items-center gap-1
                         min-h-[44px] touch-target"
                aria-label="Previous Schedule"
              >
                <ChevronLeft className="w-5 h-5" />
                Prev
              </button>

              <span className="px-4 py-2.5 bg-accent-light text-accent font-medium rounded-lg min-h-[44px] flex items-center text-sm md:text-base whitespace-nowrap">
                {scheduleGeneration.currentScheduleIndex + 1} /{' '}
                {scheduleGeneration.generatedSchedules.length}
              </span>

              <button
                onClick={handleNextSchedule}
                className="px-3 py-2.5 bg-surface-secondary border border-default rounded-lg
                         hover:bg-surface-hover transition-colors flex items-center gap-1
                         min-h-[44px] touch-target"
                aria-label="Next Schedule"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {scheduleGeneration.generatedSchedules.length > 0 && (
            <button
              onClick={handleClearGeneratedSchedules}
              className="px-3 py-2.5 bg-danger text-white rounded-lg hover:opacity-90
                       transition-opacity flex items-center gap-2 min-h-[44px] touch-target"
            >
              <Trash2 className="w-5 h-5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Timetable Section */}
      {courseState.lockedCoursesCount > 0 && (
        <div className="bg-surface-secondary rounded-lg border border-default p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-content-primary m-0">Timetable View</h2>
            <button
              onClick={scheduleGeneration.toggleTimetable}
              className="px-4 py-2.5 bg-surface-tertiary border border-default rounded-lg
                       hover:bg-surface-hover transition-colors flex items-center gap-2
                       min-h-[44px] touch-target"
            >
              {scheduleGeneration.showTimetable ? (
                <>
                  <EyeOff className="w-5 h-5" />
                  Hide Timetable
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Show Timetable
                </>
              )}
            </button>
          </div>

          {scheduleGeneration.showTimetable && (
            <TimetableView
              lockedCourses={courseState.lockedCourses}
              conflictingLockedCourseIds={courseState.conflictingLockedCourseIds}
              onToast={onToast}
            />
          )}

          {!scheduleGeneration.showTimetable && (
            <div className="flex gap-6 text-content-secondary">
              <span>
                <strong className="text-content-primary">Total Units:</strong>{' '}
                {courseState.totalUnits}
              </span>
              <span>
                <strong className="text-content-primary">Subjects:</strong>{' '}
                {courseState.uniqueSubjects}
              </span>
              <span>
                <strong className="text-content-primary">Locked Courses:</strong>{' '}
                {courseState.lockedCoursesCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* User Preferences Section */}
      <div className="bg-surface-secondary rounded-lg border border-default p-4">
        <button
          type="button"
          onClick={() => toggleSection('user-preferences')}
          className="w-full flex items-center justify-between text-left mb-4 md:cursor-default"
          aria-expanded={!collapsedSections.has('user-preferences')}
          aria-controls="user-preferences-content"
        >
          <h2 className="text-xl font-semibold text-content-primary m-0">User Preferences</h2>
          <ChevronDown
            className={`w-5 h-5 text-content-secondary transition-transform duration-200 md:hidden ${
              collapsedSections.has('user-preferences') ? '-rotate-90' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        <div
          id="user-preferences-content"
          className={`transition-all duration-200 overflow-hidden ${
            collapsedSections.has('user-preferences') ? 'max-h-0 md:max-h-none' : 'max-h-[2000px]'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              {/* Search Mode */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="searchModeSelect"
                  className="text-sm font-medium text-content-primary flex items-center gap-2"
                >
                  Schedule Search Mode
                  <span className="text-content-secondary text-xs">(i)</span>
                </label>
                <select
                  id="searchModeSelect"
                  value={schedulePreferences.scheduleSearchMode}
                  onChange={(e) =>
                    schedulePreferences.setScheduleSearchMode(e.target.value as ScheduleSearchMode)
                  }
                  className="px-3 py-2.5 rounded-lg border border-input bg-surface-input
                         text-content-input focus:outline-none focus:border-accent
                         focus:ring-2 focus:ring-accent/30 min-h-[44px] touch-target"
                >
                  <option value="partial">Recommended (Flexible, Best Fit)</option>
                  <option value="exhaustive">Full Coverage (All Subjects, Strict)</option>
                  <option value="fast">Quick (Fast, May Miss Best)</option>
                </select>
              </div>

              {/* Max Units */}
              <div className="flex flex-col gap-2">
                <label htmlFor="maxUnitsInput" className="text-sm font-medium text-content-primary">
                  Maximum Units
                </label>
                <input
                  type="number"
                  id="maxUnitsInput"
                  value={filterState.maxUnits}
                  onChange={handleMaxUnitsChange}
                  placeholder="e.g., 18"
                  min="0"
                  className="px-3 py-2.5 rounded-lg border border-input bg-surface-input
                         text-content-input focus:outline-none focus:border-accent
                         focus:ring-2 focus:ring-accent/30 min-h-[44px] touch-target"
                />
              </div>

              {/* Max Gap */}
              <div className="flex flex-col gap-2">
                <label htmlFor="maxGapInput" className="text-sm font-medium text-content-primary">
                  Maximum Break Between Classes
                </label>
                <select
                  id="maxGapInput"
                  value={filterState.maxClassGapHours}
                  onChange={handleMaxGapChange}
                  className="px-3 py-2.5 rounded-lg border border-input bg-surface-input
                         text-content-input focus:outline-none focus:border-accent
                         focus:ring-2 focus:ring-accent/30 min-h-[44px] touch-target"
                >
                  <option value="">Any</option>
                  {[...Array(11).keys()].map((i) => {
                    const hours = Math.floor(i / 2);
                    const minutes = (i % 2) * 30;
                    const value = i * 0.5;
                    const label =
                      value === 0
                        ? '0 minutes (back-to-back)'
                        : `${hours ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}${hours && minutes ? ' ' : ''}${minutes ? minutes + ' minutes' : ''}`.trim();
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Minimize Campus Days */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="minimizeDaysOnCampus"
                  checked={schedulePreferences.minimizeDaysOnCampus}
                  onChange={(e) => schedulePreferences.setMinimizeDaysOnCampus(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <label htmlFor="minimizeDaysOnCampus" className="text-sm text-content-primary">
                  Try to minimize days on campus
                </label>
              </div>
            </div>

            {/* Right Column - Preferred Time Order */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-content-primary">
                Preferred Time of Day (Order)
              </label>
              <p className="text-xs text-content-secondary">
                Drag to reorder your preferred times of day.
              </p>
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {schedulePreferences.preferredTimeOfDayOrder.length === 0 && (
                  <li className="text-sm text-content-secondary italic">
                    No preference set (all times treated equally)
                  </li>
                )}
                {schedulePreferences.preferredTimeOfDayOrder.map(
                  (time: TimeOfDayBucket, idx: number) => (
                    <li
                      key={time}
                      className="flex items-center justify-between px-3 py-2
                             bg-surface-tertiary rounded border border-default"
                    >
                      <span className="text-sm text-content-primary">
                        {time === 'morning'
                          ? 'Morning (before 12 PM)'
                          : time === 'afternoon'
                            ? 'Afternoon (12 PM - 5 PM)'
                            : time === 'evening'
                              ? 'Evening (after 5 PM)'
                              : 'Any'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimePref(idx)}
                        className="text-content-secondary hover:text-danger"
                      >
                        ✕
                      </button>
                    </li>
                  )
                )}
              </ul>
              <div className="flex flex-wrap gap-2 mt-2">
                {[...DEFAULT_VALUES.PREFERRED_TIMES_ORDER]
                  .filter((t) => !schedulePreferences.preferredTimeOfDayOrder.includes(t))
                  .map((time: TimeOfDayBucket) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleAddTimePref(time)}
                      className="px-3 py-2 text-sm bg-surface-tertiary border border-default
                             rounded hover:bg-surface-hover transition-colors
                             min-h-[44px] touch-target"
                    >
                      Add {time.charAt(0).toUpperCase() + time.slice(1)}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={handleResetTimePrefs}
                  className="px-3 py-2 text-sm bg-surface-tertiary border border-default
                         rounded hover:bg-surface-hover transition-colors
                          min-h-[44px] touch-target"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Filters Section */}
      <div className="bg-surface-secondary rounded-lg border border-default p-4">
        <button
          type="button"
          onClick={() => toggleSection('course-filters')}
          className="w-full flex items-center justify-between text-left mb-4 md:cursor-default"
          aria-expanded={!collapsedSections.has('course-filters')}
          aria-controls="course-filters-content"
        >
          <h2 className="text-xl font-semibold text-content-primary m-0">Course Filters</h2>
          <ChevronDown
            className={`w-5 h-5 text-content-secondary transition-transform duration-200 md:hidden ${
              collapsedSections.has('course-filters') ? '-rotate-90' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        <div
          id="course-filters-content"
          className={`transition-all duration-200 overflow-hidden ${
            collapsedSections.has('course-filters') ? 'max-h-0 md:max-h-none' : 'max-h-[2000px]'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TimeFilter
              excludedDays={filterState.excludedDays}
              excludedTimeRanges={filterState.excludedTimeRanges}
              onDayChange={handleDayChange}
              onTimeRangeChange={handleTimeRangeChange}
              onAddTimeRange={handleAddTimeRange}
              onRemoveTimeRange={handleRemoveTimeRange}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-content-primary">Class Types:</label>
              <div className="flex flex-col gap-2">
                {SECTION_TYPE_SUFFIXES.map((typeId) => (
                  <label
                    key={typeId}
                    className="flex items-center gap-2 text-sm text-content-primary"
                  >
                    <input
                      type="checkbox"
                      checked={courseState.selectedSectionTypes.includes(typeId)}
                      onChange={(e) => handleSectionTypeChange(typeId, e.target.checked)}
                      className="w-4 h-4 accent-accent"
                    />
                    <span>
                      {typeId} - {SECTION_TYPE_DESCRIPTIONS[typeId]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Table */}
      <CourseTable
        courses={courseState.processedCourses}
        allCoursesCount={courseState.allCourses.length}
        groupingKey={courseState.groupingKey}
        onGroupingChange={handleGroupingChange}
        selectedStatusFilter={courseState.selectedStatusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onDeleteCourse={handleDeleteCourse}
        onToggleLockCourse={handleToggleLockCourse}
        conflictingLockedCourseIds={courseState.conflictingLockedCourseIds}
        onClearAllLocks={handleClearAllLocks}
        onDeleteAllCourses={handleDeleteAllCourses}
        totalUnitsDisplay={courseState.totalUnits}
        uniqueSubjectsDisplay={courseState.uniqueSubjects}
        lockedCoursesCountDisplay={courseState.lockedCoursesCount}
      />

      {/* Import Section */}
      <div className="bg-surface-secondary rounded-lg border border-default p-4">
        <h2 className="text-xl font-semibold text-content-primary m-0 mb-2">Import Data</h2>
        <p className="text-sm text-content-secondary mb-4">
          Need help? Check out the{' '}
          <a
            href="https://github.com/MasuRii/CITUCourseBuilder/blob/main/UsageGuide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Usage Guide
          </a>{' '}
          for instructions on how to get your course data.
        </p>
        <RawDataInput
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          onSubmit={handleLoadRawData}
        />
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm ?? (() => {})}
        onCancel={confirmDialog.onCancel ?? (() => {})}
      />
    </div>
  );
}
