/**
 * Course state management hook
 *
 * Manages all course-related state including:
 * - Master course list
 * - Grouping and filtering
 * - Lock/unlock functionality
 * - Conflict detection
 *
 * @module hooks/useCourseState
 * @task T3.2.8 - Extract state management from App.jsx
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_VALUES, LOCAL_STORAGE_KEYS } from '@/types/index';
import type {
  Course,
  DayCode,
  GroupedCourse,
  GroupingMode,
  SectionTypeSuffix,
  StatusFilter,
} from '@/types/index';
import { checkTimeOverlap } from '@/utils/scheduleAlgorithms';
import { parseSchedule } from '@/utils/parseSchedule';

/**
 * Return type for useCourseState hook
 */
export interface UseCourseStateReturn {
  // Core state
  /** Master list of all imported courses */
  allCourses: Course[];
  /** Set the entire courses array */
  setAllCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  /** Add new courses to the existing list */
  addCourses: (courses: Course[]) => void;

  // Grouping state
  /** Current grouping mode for the course table */
  groupingKey: GroupingMode;
  /** Set the grouping mode */
  setGroupingKey: (key: GroupingMode) => void;

  // Filter state
  /** Current status filter */
  selectedStatusFilter: StatusFilter;
  /** Set the status filter */
  setSelectedStatusFilter: (filter: StatusFilter) => void;
  /** Current section type filters */
  selectedSectionTypes: SectionTypeSuffix[];
  /** Set section type filters */
  setSelectedSectionTypes: (types: SectionTypeSuffix[]) => void;

  // Derived state
  /** Processed (filtered and grouped) courses for display */
  processedCourses: Course[] | GroupedCourse[];
  /** Courses that are currently locked */
  lockedCourses: Course[];
  /** Count of locked courses */
  lockedCoursesCount: number;
  /** Total units from locked courses */
  totalUnits: number;
  /** Count of unique subjects in locked courses */
  uniqueSubjects: number;
  /** IDs of locked courses that have schedule conflicts */
  conflictingLockedCourseIds: Set<string>;

  // Handlers
  /** Toggle lock status for a course */
  toggleLockCourse: (identity: { id: string; subject: string; section: string }) => void;
  /** Unlock all courses */
  clearAllLocks: () => void;
  /** Delete a specific course */
  deleteCourse: (identity: { id: string; subject: string; section: string }) => void;
  /** Delete all courses */
  deleteAllCourses: () => void;
  /** Apply a schedule by setting locked status */
  applySchedule: (courseKeys: string[]) => void;

  // Filter handlers
  /** Toggle a section type filter */
  toggleSectionType: (type: SectionTypeSuffix) => void;
}

/**
 * Extract section type suffix from section string
 *
 * @param sectionString - The section string (e.g., 'BSIT-1A-AP3')
 * @returns The section type suffix or null
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
 * Create a unique key for a course
 */
function getCourseKey(course: Course): string {
  return `${course.id}-${course.subject}-${course.section}`;
}

/**
 * A React hook for managing course state with localStorage persistence
 *
 * @returns Course state and management functions
 *
 * @example
 * ```tsx
 * const {
 *   allCourses,
 *   lockedCourses,
 *   toggleLockCourse,
 *   totalUnits,
 * } = useCourseState();
 *
 * // Lock a course
 * toggleLockCourse({ id: '123', subject: 'IT 111', section: 'BSIT-1A' });
 * ```
 */
export function useCourseState(): UseCourseStateReturn {
  // Core state - explicit types
  const [allCourses, setAllCourses] = useLocalStorage(LOCAL_STORAGE_KEYS.COURSES, [] as Course[]);

  // Grouping state
  const [groupingKey, setGroupingKey] = useLocalStorage(
    LOCAL_STORAGE_KEYS.GROUPING,
    DEFAULT_VALUES.GROUPING
  );

  // Filter state
  const [selectedStatusFilter, setSelectedStatusFilter] = useLocalStorage(
    LOCAL_STORAGE_KEYS.STATUS_FILTER,
    DEFAULT_VALUES.STATUS_FILTER
  );

  const [selectedSectionTypes, setSelectedSectionTypes] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SECTION_TYPES,
    [] as SectionTypeSuffix[]
  );

  // UI state (not persisted)
  const [conflictingLockedCourseIds, setConflictingLockedCourseIds] = useState<Set<string>>(
    new Set()
  );

  const [processedCourses, setProcessedCourses] = useState<Course[] | GroupedCourse[]>([]);

  // Derived state
  const lockedCourses = useMemo(() => {
    return allCourses.filter((course: Course) => course.isLocked);
  }, [allCourses]);

  const lockedCoursesCount = useMemo(() => lockedCourses.length, [lockedCourses]);

  const totalUnits = useMemo(() => {
    return lockedCourses.reduce((sum: number, course: Course) => {
      const units = parseFloat(course.creditedUnits || course.units);
      return isNaN(units) ? sum : sum + units;
    }, 0);
  }, [lockedCourses]);

  const uniqueSubjects = useMemo(() => {
    const uniqueSet = new Set<string>();
    lockedCourses.forEach((course: Course) => {
      if (course.subject) {
        uniqueSet.add(course.subject);
      }
    });
    return uniqueSet.size;
  }, [lockedCourses]);

  // Add courses handler
  const addCourses = useCallback(
    (courses: Course[]) => {
      setAllCourses((prev: Course[]) => [...prev, ...courses]);
    },
    [setAllCourses]
  );

  // Toggle lock course handler
  const toggleLockCourse = useCallback(
    (identity: { id: string; subject: string; section: string }) => {
      const { id, subject, section } = identity;

      const courseIndex = allCourses.findIndex(
        (c: Course) => c.id === id && c.subject === subject && c.section === section
      );

      if (courseIndex === -1) return;

      const course = allCourses[courseIndex];
      if (!course) return;

      // If unlocking, just do it
      if (course.isLocked) {
        setAllCourses((prev: Course[]) =>
          prev.map((c: Course) =>
            c.id === id && c.subject === subject && c.section === section
              ? { ...c, isLocked: false }
              : c
          )
        );
        return;
      }

      // Check if course has available slots
      if (course.availableSlots <= 0) {
        console.warn('[useCourseState] Cannot lock course - no available slots');
        return;
      }

      // Lock the course (conflict checking is handled separately)
      setAllCourses((prev: Course[]) =>
        prev.map((c: Course) =>
          c.id === id && c.subject === subject && c.section === section
            ? { ...c, isLocked: true }
            : c
        )
      );
    },
    [allCourses, setAllCourses]
  );

  // Clear all locks handler
  const clearAllLocks = useCallback(() => {
    setAllCourses((prev: Course[]) => prev.map((c: Course) => ({ ...c, isLocked: false })));
  }, [setAllCourses]);

  // Delete course handler
  const deleteCourse = useCallback(
    (identity: { id: string; subject: string; section: string }) => {
      const { id, subject, section } = identity;
      setAllCourses((prev: Course[]) =>
        prev.filter((c: Course) => !(c.id === id && c.subject === subject && c.section === section))
      );
    },
    [setAllCourses]
  );

  // Delete all courses handler
  const deleteAllCourses = useCallback(() => {
    setAllCourses([]);
  }, [setAllCourses]);

  // Apply schedule handler
  const applySchedule = useCallback(
    (courseKeys: string[]) => {
      const keysSet = new Set(courseKeys);
      setAllCourses((prev: Course[]) =>
        prev.map((course: Course) => ({
          ...course,
          isLocked: keysSet.has(getCourseKey(course)),
        }))
      );
    },
    [setAllCourses]
  );

  // Toggle section type handler
  const toggleSectionType = useCallback(
    (type: SectionTypeSuffix) => {
      setSelectedSectionTypes((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      );
    },
    [setSelectedSectionTypes]
  );

  // Effect: Process courses (filter and group)
  useEffect(() => {
    const filtered = allCourses.filter((course: Course) => {
      // Always show locked courses
      if (course.isLocked) return true;

      // Status filter
      if (selectedStatusFilter === 'open' && course.isClosed === true) return false;
      if (selectedStatusFilter === 'closed' && course.isClosed === false) return false;

      // Section type filter
      if (selectedSectionTypes.length > 0) {
        const courseSectionType = getSectionTypeSuffix(course.section);
        if (!courseSectionType || !selectedSectionTypes.includes(courseSectionType)) {
          return false;
        }
      }

      return true;
    });

    // Group courses
    if (groupingKey === 'none') {
      setProcessedCourses(filtered);
    } else {
      const groups = filtered.reduce<Record<string, Course[]>>((acc, course: Course) => {
        const groupValue = (course[groupingKey] as string | undefined) || 'Unknown';
        if (!acc[groupValue]) {
          acc[groupValue] = [];
        }
        acc[groupValue].push(course);
        return acc;
      }, {});

      const groupedArray: GroupedCourse[] = Object.entries(groups)
        .map(([groupValue, courses]) => ({
          groupValue,
          courses: courses.sort((a: Course, b: Course) => {
            const subjectCompare = a.subject.localeCompare(b.subject);
            if (subjectCompare !== 0) return subjectCompare;
            return a.section.localeCompare(b.section);
          }),
        }))
        .sort((a, b) => a.groupValue.localeCompare(b.groupValue));

      setProcessedCourses(groupedArray);
    }
  }, [allCourses, groupingKey, selectedSectionTypes, selectedStatusFilter]);

  // Effect: Detect conflicts among locked courses
  useEffect(() => {
    const currentLockedCourses = allCourses.filter((course: Course) => course.isLocked);
    const conflicts = new Set<string>();

    for (let i = 0; i < currentLockedCourses.length; i++) {
      for (let j = i + 1; j < currentLockedCourses.length; j++) {
        const course1 = currentLockedCourses[i];
        const course2 = currentLockedCourses[j];

        if (!course1 || !course2) continue;

        const schedule1Result = parseSchedule(course1.schedule);
        const schedule2Result = parseSchedule(course2.schedule);

        // Skip TBA or invalid schedules
        if (
          !schedule1Result ||
          schedule1Result.isTBA ||
          !schedule1Result.allTimeSlots ||
          schedule1Result.allTimeSlots.length === 0 ||
          !schedule2Result ||
          schedule2Result.isTBA ||
          !schedule2Result.allTimeSlots ||
          schedule2Result.allTimeSlots.length === 0
        ) {
          continue;
        }

        // Check for time overlap on common days
        for (const slot1 of schedule1Result.allTimeSlots) {
          for (const slot2 of schedule2Result.allTimeSlots) {
            const commonDays = slot1.days.filter((day: DayCode) => slot2.days.includes(day));
            if (commonDays.length > 0) {
              if (slot1.startTime && slot1.endTime && slot2.startTime && slot2.endTime) {
                if (
                  checkTimeOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)
                ) {
                  conflicts.add(course1.id);
                  conflicts.add(course2.id);
                  break;
                }
              }
            }
          }
          if (conflicts.has(course1.id) && conflicts.has(course2.id)) break;
        }
      }
    }

    setConflictingLockedCourseIds(conflicts);
  }, [allCourses]);

  return {
    // Core state
    allCourses,
    setAllCourses,
    addCourses,

    // Grouping state
    groupingKey,
    setGroupingKey,

    // Filter state
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedSectionTypes,
    setSelectedSectionTypes,

    // Derived state
    processedCourses,
    lockedCourses,
    lockedCoursesCount,
    totalUnits,
    uniqueSubjects,
    conflictingLockedCourseIds,

    // Handlers
    toggleLockCourse,
    clearAllLocks,
    deleteCourse,
    deleteAllCourses,
    applySchedule,

    // Filter handlers
    toggleSectionType,
  };
}
