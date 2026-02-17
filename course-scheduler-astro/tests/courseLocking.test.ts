/**
 * Course Locking Verification Tests
 *
 * Tests for T3.3.3 - Verify course locking
 * Verifies: lock/unlock toggle, conflict detection, conflict warning dialog, available slots check
 *
 * @module tests/courseLocking.test
 * @task T3.3.3 - Verify course locking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Course, DayCode } from '../src/types/index';
import { checkTimeOverlap, isScheduleConflictFree } from '../src/utils/scheduleAlgorithms';
import { parseSchedule } from '../src/utils/parseSchedule';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock course for testing
 */
function createMockCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'test-id-1',
    subject: 'IT 111',
    subjectTitle: 'Introduction to Computing',
    section: 'BSIT-1A-AP4',
    schedule: 'M/W/F | 9:00AM-10:30AM | ACAD309',
    room: 'ACAD309',
    units: '3',
    creditedUnits: '3',
    enrolled: 20,
    assessed: 20,
    totalSlots: 30,
    availableSlots: 10,
    isClosed: false,
    isLocked: false,
    offeringDept: 'DCIT',
    ...overrides,
  };
}

/**
 * Create a set of test courses for conflict testing
 */
function createConflictTestCourses(): Course[] {
  return [
    // Course 1: M/W/F 9:00AM-10:30AM
    createMockCourse({
      id: 'conflict-1',
      subject: 'IT 111',
      section: 'BSIT-1A',
      schedule: 'M/W/F | 9:00AM-10:30AM | ACAD309',
      availableSlots: 10,
      isLocked: false,
    }),
    // Course 2: M/W/F 10:00AM-11:30AM (overlaps with Course 1)
    createMockCourse({
      id: 'conflict-2',
      subject: 'IT 112',
      section: 'BSIT-1B',
      schedule: 'M/W/F | 10:00AM-11:30AM | ACAD310',
      availableSlots: 5,
      isLocked: false,
    }),
    // Course 3: T/TH 2:00PM-3:30PM (no conflict with Course 1 or 2)
    createMockCourse({
      id: 'conflict-3',
      subject: 'MATH 101',
      section: 'BSIT-2A',
      schedule: 'T/TH | 2:00PM-3:30PM | ACAD201',
      availableSlots: 15,
      isLocked: false,
    }),
    // Course 4: M/W/F 9:00AM-10:30AM (exact same time as Course 1)
    createMockCourse({
      id: 'conflict-4',
      subject: 'CS 101',
      section: 'BSCS-1A',
      schedule: 'M/W/F | 9:00AM-10:30AM | ACAD405',
      availableSlots: 20,
      isLocked: false,
    }),
    // Course 5: TBA schedule
    createMockCourse({
      id: 'conflict-5',
      subject: 'PE 101',
      section: 'BSIT-1A',
      schedule: 'TBA',
      availableSlots: 40,
      isLocked: false,
    }),
    // Course 6: Online class (no room conflict but time overlap)
    createMockCourse({
      id: 'conflict-6',
      subject: 'IT 113',
      section: 'BSIT-1C-AP3',
      schedule: 'M/W/F | 9:00AM-10:30AM | online',
      availableSlots: 30,
      isLocked: false,
    }),
    // Course 7: M/W/F 11:00AM-12:30PM (no overlap with Course 1)
    createMockCourse({
      id: 'conflict-7',
      subject: 'ENG 101',
      section: 'BSIT-1A',
      schedule: 'M/W/F | 11:00AM-12:30PM | ACAD205',
      availableSlots: 25,
      isLocked: false,
    }),
    // Course 8: Closed course (no available slots)
    createMockCourse({
      id: 'conflict-8',
      subject: 'IT 114',
      section: 'BSIT-2B',
      schedule: 'T/TH | 9:00AM-10:30AM | ACAD312',
      enrolled: 30,
      totalSlots: 30,
      availableSlots: 0,
      isClosed: true,
      isLocked: false,
    }),
    // Course 9: Hybrid class with multiple time slots
    createMockCourse({
      id: 'conflict-9',
      subject: 'IT 115',
      section: 'BSIT-3A-AP5',
      schedule: 'M/W | 2:00PM-3:30PM | online + F | 2:00PM-5:00PM | ACAD309',
      availableSlots: 10,
      isLocked: false,
    }),
    // Course 10: Overlaps with hybrid course on F
    createMockCourse({
      id: 'conflict-10',
      subject: 'IT 116',
      section: 'BSIT-3B',
      schedule: 'F | 3:00PM-6:00PM | ACAD310',
      availableSlots: 8,
      isLocked: false,
    }),
  ];
}

/**
 * Toggle lock status for a course in an array (pure function)
 */
function toggleLockCourse(
  courses: Course[],
  identity: { id: string; subject: string; section: string }
): Course[] {
  const { id, subject, section } = identity;
  const course = courses.find((c) => c.id === id && c.subject === subject && c.section === section);

  if (!course) return courses;

  // If unlocking, just do it
  if (course.isLocked) {
    return courses.map((c) =>
      c.id === id && c.subject === subject && c.section === section ? { ...c, isLocked: false } : c
    );
  }

  // Check available slots before locking
  if (course.availableSlots <= 0) {
    return courses; // No change
  }

  // Lock the course
  return courses.map((c) =>
    c.id === id && c.subject === subject && c.section === section ? { ...c, isLocked: true } : c
  );
}

/**
 * Detect conflicts among locked courses
 * Returns a Set of course IDs that have conflicts
 */
function detectConflicts(courses: Course[]): Set<string> {
  const lockedCourses = courses.filter((c) => c.isLocked);
  const conflicts = new Set<string>();

  for (let i = 0; i < lockedCourses.length; i++) {
    for (let j = i + 1; j < lockedCourses.length; j++) {
      const course1 = lockedCourses[i];
      const course2 = lockedCourses[j];

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

  return conflicts;
}

/**
 * Clear all locks from courses
 */
function clearAllLocks(courses: Course[]): Course[] {
  return courses.map((c) => ({ ...c, isLocked: false }));
}

/**
 * Check if a course can be locked (has available slots)
 */
function canLockCourse(course: Course): boolean {
  return course.availableSlots > 0;
}

/**
 * Get locked courses from array
 */
function getLockedCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.isLocked);
}

// ============================================================================
// Tests: Lock/Unlock Toggle
// ============================================================================

describe('Lock/Unlock Toggle', () => {
  let testCourses: Course[];

  beforeEach(() => {
    testCourses = createConflictTestCourses();
  });

  describe('Locking a course', () => {
    it('should lock an unlocked course with available slots', () => {
      const courseToLock = testCourses[0]!;
      expect(courseToLock.isLocked).toBe(false);

      const result = toggleLockCourse(testCourses, {
        id: courseToLock.id,
        subject: courseToLock.subject,
        section: courseToLock.section,
      });

      const lockedCourse = result.find((c) => c.id === courseToLock.id);
      expect(lockedCourse!.isLocked).toBe(true);
    });

    it('should not lock a course with no available slots', () => {
      const closedCourse = testCourses.find((c) => c.availableSlots <= 0)!;
      expect(closedCourse).toBeDefined();

      const result = toggleLockCourse(testCourses, {
        id: closedCourse.id,
        subject: closedCourse.subject,
        section: closedCourse.section,
      });

      const course = result.find((c) => c.id === closedCourse.id);
      expect(course!.isLocked).toBe(false);
    });

    it('should lock a course with exactly 1 available slot', () => {
      const lastSlotCourse = createMockCourse({
        id: 'last-slot',
        availableSlots: 1,
        isLocked: false,
      });
      testCourses.push(lastSlotCourse);

      const result = toggleLockCourse(testCourses, {
        id: 'last-slot',
        subject: 'IT 111',
        section: 'BSIT-1A-AP4',
      });

      const course = result.find((c) => c.id === 'last-slot');
      expect(course!.isLocked).toBe(true);
    });

    it('should use identity tuple (id, subject, section) for matching', () => {
      // Create two courses with same id but different subject/section
      const course1 = createMockCourse({
        id: 'same-id',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      const course2 = createMockCourse({
        id: 'same-id',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });
      testCourses = [course1, course2];

      // Lock the first course
      const result = toggleLockCourse(testCourses, {
        id: 'same-id',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });

      // Only the course matching all three fields should be locked
      const locked = result.filter((c) => c.isLocked);
      expect(locked.length).toBe(1);
      expect(locked[0]!.subject).toBe('IT 111');
    });

    it('should not modify the original array', () => {
      const courseToLock = testCourses[0]!;
      const originalLockedStatus = courseToLock.isLocked;

      toggleLockCourse(testCourses, {
        id: courseToLock.id,
        subject: courseToLock.subject,
        section: courseToLock.section,
      });

      // Original array should not be modified
      expect(courseToLock.isLocked).toBe(originalLockedStatus);
    });
  });

  describe('Unlocking a course', () => {
    it('should unlock a locked course', () => {
      // First lock a course
      const courseToLock = testCourses[0]!;
      let result = toggleLockCourse(testCourses, {
        id: courseToLock.id,
        subject: courseToLock.subject,
        section: courseToLock.section,
      });

      expect(result.find((c) => c.id === courseToLock.id)!.isLocked).toBe(true);

      // Then unlock it
      result = toggleLockCourse(result, {
        id: courseToLock.id,
        subject: courseToLock.subject,
        section: courseToLock.section,
      });

      expect(result.find((c) => c.id === courseToLock.id)!.isLocked).toBe(false);
    });

    it('should allow re-locking after unlock', () => {
      const course = testCourses[0]!;

      // Lock
      let result = toggleLockCourse(testCourses, {
        id: course.id,
        subject: course.subject,
        section: course.section,
      });
      expect(result.find((c) => c.id === course.id)!.isLocked).toBe(true);

      // Unlock
      result = toggleLockCourse(result, {
        id: course.id,
        subject: course.subject,
        section: course.section,
      });
      expect(result.find((c) => c.id === course.id)!.isLocked).toBe(false);

      // Lock again
      result = toggleLockCourse(result, {
        id: course.id,
        subject: course.subject,
        section: course.section,
      });
      expect(result.find((c) => c.id === course.id)!.isLocked).toBe(true);
    });
  });

  describe('Clear all locks', () => {
    it('should unlock all locked courses', () => {
      // Lock multiple courses
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-3',
        subject: 'MATH 101',
        section: 'BSIT-2A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-7',
        subject: 'ENG 101',
        section: 'BSIT-1A',
      });

      expect(getLockedCourses(result).length).toBe(3);

      // Clear all locks
      result = clearAllLocks(result);

      expect(getLockedCourses(result).length).toBe(0);
    });

    it('should work on array with no locked courses', () => {
      const result = clearAllLocks(testCourses);

      expect(getLockedCourses(result).length).toBe(0);
    });
  });
});

// ============================================================================
// Tests: Conflict Detection
// ============================================================================

describe('Conflict Detection', () => {
  let testCourses: Course[];

  beforeEach(() => {
    testCourses = createConflictTestCourses();
  });

  describe('Time overlap detection', () => {
    it('should detect overlapping time ranges', () => {
      // 9:00AM-10:30AM overlaps with 10:00AM-11:30AM
      const overlap = checkTimeOverlap('09:00', '10:30', '10:00', '11:30');
      expect(overlap).toBe(true);
    });

    it('should not detect overlap for adjacent time ranges', () => {
      // 9:00AM-10:30AM does NOT overlap with 10:30AM-12:00PM (end == start)
      const overlap = checkTimeOverlap('09:00', '10:30', '10:30', '12:00');
      expect(overlap).toBe(false);
    });

    it('should not detect overlap for separate time ranges', () => {
      // 9:00AM-10:30AM does NOT overlap with 11:00AM-12:30PM
      const overlap = checkTimeOverlap('09:00', '10:30', '11:00', '12:30');
      expect(overlap).toBe(false);
    });

    it('should detect complete time overlap (one inside another)', () => {
      // 9:00AM-12:00PM contains 10:00AM-11:00AM
      const overlap = checkTimeOverlap('09:00', '12:00', '10:00', '11:00');
      expect(overlap).toBe(true);
    });

    it('should return false for invalid time formats', () => {
      expect(checkTimeOverlap('invalid', '10:30', '10:00', '11:30')).toBe(false);
      expect(checkTimeOverlap('09:00', 'invalid', '10:00', '11:30')).toBe(false);
    });
  });

  describe('Schedule conflict detection', () => {
    it('should detect conflict between courses on same day with overlapping times', () => {
      // Lock two courses that conflict (Course 1 and Course 2)
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.has('conflict-1')).toBe(true);
      expect(conflicts.has('conflict-2')).toBe(true);
    });

    it('should detect conflict for courses with exact same schedule', () => {
      // Course 1 and Course 4 have the same time (M/W/F 9:00AM-10:30AM)
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-4',
        subject: 'CS 101',
        section: 'BSCS-1A',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.size).toBe(2);
      expect(conflicts.has('conflict-1')).toBe(true);
      expect(conflicts.has('conflict-4')).toBe(true);
    });

    it('should NOT detect conflict for courses on different days', () => {
      // Course 1 (M/W/F) and Course 3 (T/TH) - no overlap
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-3',
        subject: 'MATH 101',
        section: 'BSIT-2A',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.size).toBe(0);
    });

    it('should NOT detect conflict for courses on same day but non-overlapping times', () => {
      // Course 1 (M/W/F 9:00AM-10:30AM) and Course 7 (M/W/F 11:00AM-12:30PM)
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-7',
        subject: 'ENG 101',
        section: 'BSIT-1A',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.size).toBe(0);
    });

    it('should handle TBA schedules as non-conflicting', () => {
      // Course 1 (M/W/F 9:00AM-10:30AM) and Course 5 (TBA)
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-5',
        subject: 'PE 101',
        section: 'BSIT-1A',
      });

      const conflicts = detectConflicts(result);

      // TBA should not cause conflicts
      expect(conflicts.size).toBe(0);
    });

    it('should detect conflict with online classes based on time', () => {
      // Course 1 (M/W/F 9:00AM-10:30AM) and Course 6 (online, same time)
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-6',
        subject: 'IT 113',
        section: 'BSIT-1C-AP3',
      });

      const conflicts = detectConflicts(result);

      // Online classes still conflict by time
      expect(conflicts.has('conflict-1')).toBe(true);
      expect(conflicts.has('conflict-6')).toBe(true);
    });

    it('should handle hybrid classes with multiple time slots', () => {
      // Course 9 has two time slots: M/W 2:00PM-3:30PM (online) and F 2:00PM-5:00PM
      // Course 10 overlaps with Course 9 on F (3:00PM-6:00PM vs 2:00PM-5:00PM)
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-9',
        subject: 'IT 115',
        section: 'BSIT-3A-AP5',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-10',
        subject: 'IT 116',
        section: 'BSIT-3B',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.has('conflict-9')).toBe(true);
      expect(conflicts.has('conflict-10')).toBe(true);
    });

    it('should detect multiple conflicts in a set of locked courses', () => {
      // Lock 4 courses: 1 conflicts with 2, 9 conflicts with 10
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-9',
        subject: 'IT 115',
        section: 'BSIT-3A-AP5',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-10',
        subject: 'IT 116',
        section: 'BSIT-3B',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.size).toBe(4);
      expect(conflicts.has('conflict-1')).toBe(true);
      expect(conflicts.has('conflict-2')).toBe(true);
      expect(conflicts.has('conflict-9')).toBe(true);
      expect(conflicts.has('conflict-10')).toBe(true);
    });
  });

  describe('isScheduleConflictFree utility', () => {
    it('should return true for empty schedule', () => {
      expect(isScheduleConflictFree([], parseSchedule, checkTimeOverlap)).toBe(true);
    });

    it('should return true for single course', () => {
      const singleCourse = [testCourses[0]!];
      expect(isScheduleConflictFree(singleCourse, parseSchedule, checkTimeOverlap)).toBe(true);
    });

    it('should return false for conflicting courses', () => {
      const conflictingPair = [testCourses[0]!, testCourses[1]!]; // Course 1 and 2 conflict
      expect(isScheduleConflictFree(conflictingPair, parseSchedule, checkTimeOverlap)).toBe(false);
    });

    it('should return true for non-conflicting courses', () => {
      const nonConflictingPair = [testCourses[0]!, testCourses[2]!]; // Course 1 and 3 don't conflict
      expect(isScheduleConflictFree(nonConflictingPair, parseSchedule, checkTimeOverlap)).toBe(
        true
      );
    });
  });
});

// ============================================================================
// Tests: Available Slots Check
// ============================================================================

describe('Available Slots Check', () => {
  let testCourses: Course[];

  beforeEach(() => {
    testCourses = createConflictTestCourses();
  });

  describe('canLockCourse', () => {
    it('should return true for course with available slots', () => {
      const openCourse = testCourses.find((c) => c.availableSlots > 0)!;
      expect(canLockCourse(openCourse)).toBe(true);
    });

    it('should return true for course with exactly 1 available slot', () => {
      const lastSlot = createMockCourse({ availableSlots: 1 });
      expect(canLockCourse(lastSlot)).toBe(true);
    });

    it('should return false for course with 0 available slots', () => {
      const fullCourse = testCourses.find((c) => c.availableSlots === 0)!;
      expect(canLockCourse(fullCourse)).toBe(false);
    });

    it('should return false for course with negative available slots', () => {
      const overbookedCourse = createMockCourse({ availableSlots: -1 });
      expect(canLockCourse(overbookedCourse)).toBe(false);
    });
  });

  describe('Locking behavior with available slots', () => {
    it('should allow locking a course with many available slots', () => {
      const openCourse = testCourses.find((c) => c.availableSlots >= 10)!;

      const result = toggleLockCourse(testCourses, {
        id: openCourse!.id,
        subject: openCourse!.subject,
        section: openCourse!.section,
      });

      expect(result.find((c) => c.id === openCourse!.id)!.isLocked).toBe(true);
    });

    it('should prevent locking a closed course (no available slots)', () => {
      const closedCourse = testCourses.find((c) => c.availableSlots <= 0)!;

      const result = toggleLockCourse(testCourses, {
        id: closedCourse!.id,
        subject: closedCourse!.subject,
        section: closedCourse!.section,
      });

      expect(result.find((c) => c.id === closedCourse!.id)!.isLocked).toBe(false);
    });

    it('should allow unlocking a closed course that was previously locked', () => {
      // Create a scenario where a course was locked, then became full
      const wasLocked = createMockCourse({
        id: 'was-locked',
        availableSlots: 0,
        isLocked: true, // Was locked when slots were available
        isClosed: true,
      });
      testCourses = [...testCourses, wasLocked];

      // Should be able to unlock
      const result = toggleLockCourse(testCourses, {
        id: 'was-locked',
        subject: 'IT 111',
        section: 'BSIT-1A-AP4',
      });

      expect(result.find((c) => c.id === 'was-locked')!.isLocked).toBe(false);
    });
  });
});

// ============================================================================
// Tests: Conflict Warning Dialog Scenarios
// ============================================================================

describe('Conflict Warning Dialog Scenarios', () => {
  let testCourses: Course[];

  beforeEach(() => {
    testCourses = createConflictTestCourses();
  });

  describe('Dialog trigger conditions', () => {
    it('should identify when dialog should be shown (conflicts exist)', () => {
      // Lock two conflicting courses
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      const conflicts = detectConflicts(result);
      const shouldShowWarning = conflicts.size > 0;

      expect(shouldShowWarning).toBe(true);
    });

    it('should identify when dialog should NOT be shown (no conflicts)', () => {
      // Lock two non-conflicting courses
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-3',
        subject: 'MATH 101',
        section: 'BSIT-2A',
      });

      const conflicts = detectConflicts(result);
      const shouldShowWarning = conflicts.size > 0;

      expect(shouldShowWarning).toBe(false);
    });

    it('should identify conflict pairs for dialog display', () => {
      // Lock two conflicting courses
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      const conflicts = detectConflicts(result);
      const lockedCourses = getLockedCourses(result);
      const conflictingCourses = lockedCourses.filter((c) => conflicts.has(c.id));

      // Dialog should show both conflicting courses
      expect(conflictingCourses.length).toBe(2);

      const course1 = conflictingCourses.find((c) => c.id === 'conflict-1');
      const course2 = conflictingCourses.find((c) => c.id === 'conflict-2');

      expect(course1).toBeDefined();
      expect(course2).toBeDefined();
    });
  });

  describe('Conflict resolution scenarios', () => {
    it('should resolve conflict by unlocking one course', () => {
      // Create conflict
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      expect(detectConflicts(result).size).toBe(2);

      // Resolve by unlocking one course
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      expect(detectConflicts(result).size).toBe(0);
    });

    it('should resolve conflict by unlocking both courses', () => {
      // Create conflict
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      expect(detectConflicts(result).size).toBe(2);

      // Resolve by unlocking both
      result = toggleLockCourse(result, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      expect(detectConflicts(result).size).toBe(0);
      expect(getLockedCourses(result).length).toBe(0);
    });

    it('should resolve conflict by swapping with non-conflicting course', () => {
      // Create conflict with Course 1 and 2
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      expect(detectConflicts(result).size).toBe(2);

      // Swap Course 2 for Course 3 (non-conflicting)
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-3',
        subject: 'MATH 101',
        section: 'BSIT-2A',
      });

      expect(detectConflicts(result).size).toBe(0);
      expect(getLockedCourses(result).length).toBe(2);
    });
  });

  describe('Dialog information extraction', () => {
    it('should extract conflict details for display', () => {
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });

      const conflicts = detectConflicts(result);
      const lockedCourses = getLockedCourses(result);

      // Extract conflict info for dialog
      const conflictInfo = lockedCourses
        .filter((c) => conflicts.has(c.id))
        .map((c) => ({
          subject: c.subject,
          section: c.section,
          schedule: c.schedule,
        }));

      expect(conflictInfo.length).toBe(2);
      expect(conflictInfo[0]!.subject).toBeDefined();
      expect(conflictInfo[0]!.section).toBeDefined();
      expect(conflictInfo[0]!.schedule).toBeDefined();
    });

    it('should count total conflicts for summary', () => {
      // Create multiple conflicts
      let result = toggleLockCourse(testCourses, {
        id: 'conflict-1',
        subject: 'IT 111',
        section: 'BSIT-1A',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-2',
        subject: 'IT 112',
        section: 'BSIT-1B',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-9',
        subject: 'IT 115',
        section: 'BSIT-3A-AP5',
      });
      result = toggleLockCourse(result, {
        id: 'conflict-10',
        subject: 'IT 116',
        section: 'BSIT-3B',
      });

      const conflicts = detectConflicts(result);

      expect(conflicts.size).toBe(4);
    });
  });
});

// ============================================================================
// Tests: Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty course list for conflict detection', () => {
    const conflicts = detectConflicts([]);
    expect(conflicts.size).toBe(0);
  });

  it('should handle single course for conflict detection', () => {
    const singleCourse = [createMockCourse({ isLocked: true })];
    const conflicts = detectConflicts(singleCourse);
    expect(conflicts.size).toBe(0);
  });

  it('should handle all TBA courses', () => {
    const tbaCourses = [
      createMockCourse({ id: 'tba-1', schedule: 'TBA', isLocked: true }),
      createMockCourse({ id: 'tba-2', schedule: 'TBA', isLocked: true }),
    ];

    const conflicts = detectConflicts(tbaCourses);
    expect(conflicts.size).toBe(0);
  });

  it('should handle malformed schedule strings gracefully', () => {
    const malformedCourses = [
      createMockCourse({
        id: 'malformed-1',
        schedule: 'Invalid Schedule Format',
        isLocked: true,
      }),
      createMockCourse({
        id: 'malformed-2',
        schedule: '',
        isLocked: true,
      }),
    ];

    // Should not throw
    expect(() => detectConflicts(malformedCourses)).not.toThrow();
  });

  it('should handle course with missing schedule', () => {
    const missingSchedule = [
      createMockCourse({
        id: 'missing-schedule',
        schedule: undefined as unknown as string,
        isLocked: true,
      }),
    ];

    // Should not throw
    expect(() => detectConflicts(missingSchedule)).not.toThrow();
  });

  it('should handle locking non-existent course', () => {
    const result = toggleLockCourse([createMockCourse()], {
      id: 'non-existent',
      subject: 'FAKE',
      section: 'FAKE-1A',
    });

    // Should return unchanged array
    expect(result.length).toBe(1);
    expect(result[0]!.isLocked).toBe(false);
  });

  it('should handle large number of locked courses', () => {
    // Create 20 non-conflicting courses on different days with proper time slots
    const days = ['M', 'T', 'W', 'TH', 'F'];
    const timeSlots = [
      '7:30AM-9:00AM',
      '9:00AM-10:30AM',
      '10:30AM-12:00PM',
      '1:00PM-2:30PM',
      '2:30PM-4:00PM',
    ];
    const manyCourses: Course[] = [];
    for (let i = 0; i < 20; i++) {
      const day = days[i % 5];
      const timeSlot = timeSlots[Math.floor(i / 5)];
      manyCourses.push(
        createMockCourse({
          id: `course-${i}`,
          subject: `SUBJ ${i.toString().padStart(3, '0')}`,
          section: `SEC-${i}`,
          schedule: `${day} | ${timeSlot} | ROOM${i}`, // Different days/times
          isLocked: true,
        })
      );
    }

    // Should handle efficiently
    const startTime = performance.now();
    const conflicts = detectConflicts(manyCourses);
    const endTime = performance.now();

    expect(conflicts.size).toBe(0);
    expect(endTime - startTime).toBeLessThan(100); // Should be fast
  });

  it('should handle mixed locked and unlocked courses', () => {
    const mixedCourses = [
      createMockCourse({ id: 'locked-1', isLocked: true }),
      createMockCourse({ id: 'locked-2', isLocked: true }),
      createMockCourse({ id: 'unlocked-1', isLocked: false }),
      createMockCourse({ id: 'unlocked-2', isLocked: false }),
    ];

    const lockedCount = getLockedCourses(mixedCourses).length;
    expect(lockedCount).toBe(2);
  });
});

// ============================================================================
// Tests: Integration with Schedule Generation
// ============================================================================

describe('Integration with Schedule Generation', () => {
  it('should consider locked courses in conflict-free check', () => {
    const testCourses = createConflictTestCourses();

    // Lock two conflicting courses
    let result = toggleLockCourse(testCourses, {
      id: 'conflict-1',
      subject: 'IT 111',
      section: 'BSIT-1A',
    });
    result = toggleLockCourse(result, {
      id: 'conflict-2',
      subject: 'IT 112',
      section: 'BSIT-1B',
    });

    // Schedule with locked courses should report conflict
    const lockedCourses = getLockedCourses(result);
    const isConflictFree = isScheduleConflictFree(lockedCourses, parseSchedule, checkTimeOverlap);

    expect(isConflictFree).toBe(false);
  });

  it('should allow non-conflicting locked courses', () => {
    const testCourses = createConflictTestCourses();

    // Lock two non-conflicting courses
    let result = toggleLockCourse(testCourses, {
      id: 'conflict-1',
      subject: 'IT 111',
      section: 'BSIT-1A',
    });
    result = toggleLockCourse(result, {
      id: 'conflict-3',
      subject: 'MATH 101',
      section: 'BSIT-2A',
    });

    const lockedCourses = getLockedCourses(result);
    const isConflictFree = isScheduleConflictFree(lockedCourses, parseSchedule, checkTimeOverlap);

    expect(isConflictFree).toBe(true);
  });

  it('should calculate totals correctly with locked courses', () => {
    const testCourses = createConflictTestCourses();

    let result = toggleLockCourse(testCourses, {
      id: 'conflict-1',
      subject: 'IT 111',
      section: 'BSIT-1A',
    });
    result = toggleLockCourse(result, {
      id: 'conflict-3',
      subject: 'MATH 101',
      section: 'BSIT-2A',
    });

    const lockedCourses = getLockedCourses(result);

    // Calculate totals
    const totalUnits = lockedCourses.reduce((sum, c) => {
      const units = parseFloat(c.creditedUnits || c.units);
      return isNaN(units) ? sum : sum + units;
    }, 0);

    const uniqueSubjects = new Set(lockedCourses.map((c) => c.subject)).size;

    expect(totalUnits).toBe(6); // 3 units each
    expect(uniqueSubjects).toBe(2); // IT 111 and MATH 101
  });
});
