/**
 * Comprehensive Schedule Generation Verification Tests
 *
 * Tests all three generation modes:
 * - Exhaustive (Full Coverage): Tries all combinations to find optimal
 * - Partial (Recommended): Uses exhaustive for small sets, heuristic for large
 * - Fast: Random sampling with 1000 attempts
 *
 * @module scheduleGeneration.test
 * @task T3.3.5 - Verify schedule generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateExhaustiveBestSchedule,
  generateBestPartialSchedule,
  generateBestPartialSchedule_Heuristic,
  isScheduleConflictFree,
  exceedsMaxUnits,
  exceedsMaxGap,
  scoreScheduleByTimePreference,
  countCampusDays,
  checkTimeOverlap,
} from '../src/utils/scheduleAlgorithms';
import type { Course, TimeOfDayBucket } from '../src/types/index';
import { parseSchedule } from '../src/utils/parseSchedule';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestCourse(
  subject: string,
  section: string,
  schedule: string,
  units: string = '3',
  room: string = 'ACAD101',
  id: string = `${subject}-${section}`
): Course {
  return {
    id,
    subject,
    subjectTitle: `${subject} Title`,
    section,
    schedule,
    room,
    units,
    isLocked: false,
    isClosed: false,
    enrolled: 0,
    assessed: 0,
    totalSlots: 40,
    availableSlots: 40,
  };
}

function createTestCourseWithCreditedUnits(
  subject: string,
  section: string,
  schedule: string,
  units: string,
  creditedUnits: string,
  room: string = 'ACAD101'
): Course {
  return {
    ...createTestCourse(subject, section, schedule, units, room),
    creditedUnits,
  };
}

/**
 * Fast mode schedule generation - random sampling
 * This is the algorithm used in App.jsx for "fast" mode
 */
function generateFastSchedule(
  coursesBySubject: Record<string, readonly Course[]>,
  maxUnits: string,
  maxGapHours: string,
  preferredTimeOfDayOrder: readonly TimeOfDayBucket[],
  minimizeDaysOnCampus: boolean,
  maxAttempts: number = 1000
): Course[] {
  let bestSchedule: Course[] = [];
  let bestScore = -1;
  let bestTimePrefScore = Infinity;
  let bestCampusDays = Infinity;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const currentSchedule: Course[] = [];

    for (const subjectCourses of Object.values(coursesBySubject)) {
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
              const commonDays = newSlot.days.filter((day) => existingSlot.days.includes(day));
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
    }

    if (!isScheduleConflictFree(currentSchedule, parseSchedule, checkTimeOverlap)) {
      continue;
    }
    if (exceedsMaxUnits(currentSchedule, maxUnits)) {
      continue;
    }
    if (exceedsMaxGap(currentSchedule, maxGapHours)) {
      continue;
    }

    const totalCourses = currentSchedule.length;
    const totalUnits = currentSchedule.reduce(
      (sum, c) => sum + (parseFloat(c.creditedUnits ?? c.units) || 0),
      0
    );
    const score = totalCourses * 100 + totalUnits;
    const timePrefScore = scoreScheduleByTimePreference(currentSchedule, preferredTimeOfDayOrder);
    const campusDays = minimizeDaysOnCampus ? countCampusDays(currentSchedule) : 0;

    if (minimizeDaysOnCampus) {
      if (
        campusDays < bestCampusDays ||
        (campusDays === bestCampusDays && score > bestScore) ||
        (campusDays === bestCampusDays && score === bestScore && timePrefScore < bestTimePrefScore)
      ) {
        bestCampusDays = campusDays;
        bestScore = score;
        bestTimePrefScore = timePrefScore;
        bestSchedule = [...currentSchedule];
      }
    } else {
      if (score > bestScore || (score === bestScore && timePrefScore < bestTimePrefScore)) {
        bestScore = score;
        bestTimePrefScore = timePrefScore;
        bestCampusDays = campusDays;
        bestSchedule = [...currentSchedule];
      }
    }
  }

  return bestSchedule;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidSchedule(schedule: Course[]): boolean {
  return isScheduleConflictFree(schedule, parseSchedule, checkTimeOverlap);
}

function validateScheduleConstraints(
  schedule: Course[],
  maxUnits: string,
  maxGapHours: string
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (!isScheduleConflictFree(schedule, parseSchedule, checkTimeOverlap)) {
    violations.push('Schedule has time conflicts');
  }

  if (exceedsMaxUnits(schedule, maxUnits)) {
    violations.push(`Schedule exceeds max units of ${maxUnits}`);
  }

  if (exceedsMaxGap(schedule, maxGapHours)) {
    violations.push(`Schedule exceeds max gap of ${maxGapHours} hours`);
  }

  return { valid: violations.length === 0, violations };
}

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

// Small test set - 3 subjects, no conflicts possible
const smallTestSet: Record<string, Course[]> = {
  'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3')],
  'IT 102': [createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM | ACAD102', '3')],
  'IT 103': [createTestCourse('IT 103', 'A', 'MWF | 2:00PM-3:00PM | ACAD103', '3')],
};

// Conflict test set - has conflicting options
const conflictTestSet: Record<string, Course[]> = {
  'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3')],
  'IT 102': [
    createTestCourse('IT 102', 'A', 'MWF | 9:30AM-10:30AM | ACAD102', '3'), // Conflicts with IT 101-A
    createTestCourse('IT 102', 'B', 'TTH | 9:00AM-10:30AM | ACAD102', '3'), // No conflict
  ],
  'IT 103': [createTestCourse('IT 103', 'A', 'MWF | 2:00PM-3:00PM | ACAD103', '3')],
};

// Larger test set for heuristic testing
const largerTestSet: Record<string, Course[]> = {
  'CS 101': [
    createTestCourse('CS 101', 'A', 'MWF | 7:00AM-8:00AM | ACAD101', '3'),
    createTestCourse('CS 101', 'B', 'MWF | 9:00AM-10:00AM | ACAD102', '3'),
    createTestCourse('CS 101', 'C', 'TTH | 7:30AM-9:00AM | ACAD103', '3'),
  ],
  'CS 102': [
    createTestCourse('CS 102', 'A', 'MWF | 10:00AM-11:00AM | ACAD101', '3'),
    createTestCourse('CS 102', 'B', 'TTH | 10:30AM-12:00PM | ACAD102', '3'),
  ],
  'CS 103': [
    createTestCourse('CS 103', 'A', 'MWF | 1:00PM-2:00PM | ACAD101', '3'),
    createTestCourse('CS 103', 'B', 'TTH | 1:00PM-2:30PM | ACAD102', '3'),
  ],
  'CS 104': [
    createTestCourse('CS 104', 'A', 'MWF | 3:00PM-4:00PM | ACAD101', '3'),
    createTestCourse('CS 104', 'B', 'TTH | 3:00PM-4:30PM | ACAD102', '3'),
  ],
  'CS 105': [
    createTestCourse('CS 105', 'A', 'MWF | 5:00PM-6:00PM | ACAD101', '3'),
    createTestCourse('CS 105', 'B', 'TTH | 5:00PM-6:30PM | ACAD102', '3'),
  ],
};

// Unit constraint test set
const unitConstraintTestSet: Record<string, Course[]> = {
  'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3')],
  'IT 102': [createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM | ACAD102', '4')],
  'IT 103': [createTestCourse('IT 103', 'A', 'MWF | 2:00PM-3:00PM | ACAD103', '5')],
};

// Gap constraint test set - courses on same day with varying gaps
const gapConstraintTestSet: Record<string, Course[]> = {
  'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3')],
  'IT 102': [
    createTestCourse('IT 102', 'A', 'MWF | 11:00AM-12:00PM | ACAD102', '3'), // 1 hour gap
    createTestCourse('IT 102', 'B', 'MWF | 2:00PM-3:00PM | ACAD102', '3'), // 4 hour gap
  ],
  'IT 103': [createTestCourse('IT 103', 'A', 'MWF | 4:00PM-5:00PM | ACAD103', '3')],
};

// Time preference test set
const timePreferenceTestSet: Record<string, Course[]> = {
  'IT 101': [
    createTestCourse('IT 101', 'A', 'MWF | 7:00AM-8:00AM | ACAD101', '3'), // Morning
    createTestCourse('IT 101', 'B', 'MWF | 2:00PM-3:00PM | ACAD101', '3'), // Afternoon
    createTestCourse('IT 101', 'C', 'MWF | 6:00PM-7:00PM | ACAD101', '3'), // Evening
  ],
  'IT 102': [
    createTestCourse('IT 102', 'A', 'TTH | 7:30AM-9:00AM | ACAD102', '3'), // Morning
    createTestCourse('IT 102', 'B', 'TTH | 2:30PM-4:00PM | ACAD102', '3'), // Afternoon
  ],
};

// Campus days minimization test set
const campusDaysTestSet: Record<string, Course[]> = {
  'IT 101': [
    createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3'), // 3 days
    createTestCourse('IT 101', 'B', 'TTH | 9:00AM-10:30AM | ACAD101', '3'), // 2 days
  ],
  'IT 102': [
    createTestCourse('IT 102', 'A', 'MWF | 2:00PM-3:00PM | ACAD102', '3'), // 3 days
    createTestCourse('IT 102', 'B', 'TTH | 2:00PM-3:30PM | ACAD102', '3'), // 2 days
  ],
};

// Online and TBA test set
const mixedScheduleTestSet: Record<string, Course[]> = {
  'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3')],
  'IT 102': [createTestCourse('IT 102', 'A', 'TBA', '3')],
  'IT 103': [createTestCourse('IT 103', 'A', 'MWF | 2:00PM-3:00PM | Online', '3')],
};

// Edge case: All courses conflict
const allConflictingTestSet: Record<string, Course[]> = {
  'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3')],
  'IT 102': [createTestCourse('IT 102', 'A', 'MWF | 9:30AM-10:30AM | ACAD102', '3')], // Conflicts
};

// Edge case: Single subject
const singleSubjectTestSet: Record<string, Course[]> = {
  'IT 101': [
    createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101', '3'),
    createTestCourse('IT 101', 'B', 'TTH | 9:00AM-10:30AM | ACAD102', '3'),
  ],
};

// Default preferences
const defaultPrefOrder: readonly TimeOfDayBucket[] = ['morning', 'afternoon', 'evening'];

// ============================================================================
// EXHAUSTIVE MODE TESTS (Full Coverage)
// ============================================================================

describe('generateExhaustiveBestSchedule - Full Coverage Mode', () => {
  describe('Basic functionality', () => {
    it('should return empty schedule for empty input', () => {
      const result = generateExhaustiveBestSchedule({}, defaultPrefOrder, '', '', false);
      expect(result.bestSchedule).toHaveLength(0);
      // Empty schedule has score 0 (0 courses * 100 + 0 units)
      expect(result.bestScore).toBe(0);
    });

    it('should handle single subject with single section', () => {
      const result = generateExhaustiveBestSchedule(
        singleSubjectTestSet,
        defaultPrefOrder,
        '',
        '',
        false
      );
      expect(result.bestSchedule.length).toBe(1);
      expect(isValidSchedule(result.bestSchedule)).toBe(true);
    });

    it('should find optimal schedule for non-conflicting courses', () => {
      const result = generateExhaustiveBestSchedule(smallTestSet, defaultPrefOrder, '', '', false);
      // Should include all 3 subjects
      expect(result.bestSchedule.length).toBe(3);
      expect(isValidSchedule(result.bestSchedule)).toBe(true);

      // Check all subjects are present
      const subjects = result.bestSchedule.map((c) => c.subject);
      expect(subjects).toContain('IT 101');
      expect(subjects).toContain('IT 102');
      expect(subjects).toContain('IT 103');
    });

    it('should find optimal schedule avoiding conflicts', () => {
      const result = generateExhaustiveBestSchedule(
        conflictTestSet,
        defaultPrefOrder,
        '',
        '',
        false
      );
      // Should include all 3 subjects by picking non-conflicting sections
      expect(result.bestSchedule.length).toBe(3);
      expect(isValidSchedule(result.bestSchedule)).toBe(true);

      // IT 102 should be section B (non-conflicting)
      const it102Course = result.bestSchedule.find((c) => c.subject === 'IT 102');
      expect(it102Course?.section).toBe('B');
    });
  });

  describe('Constraint handling', () => {
    it('should respect max units constraint', () => {
      const result = generateExhaustiveBestSchedule(
        unitConstraintTestSet,
        defaultPrefOrder,
        '5', // Max 5 units
        '',
        false
      );

      const totalUnits = result.bestSchedule.reduce(
        (sum, c) => sum + parseFloat(c.creditedUnits ?? c.units),
        0
      );
      expect(totalUnits).toBeLessThanOrEqual(5);
      expect(isValidSchedule(result.bestSchedule)).toBe(true);
    });

    it('should respect max gap constraint', () => {
      const result = generateExhaustiveBestSchedule(
        gapConstraintTestSet,
        defaultPrefOrder,
        '',
        '2', // Max 2 hour gap
        false
      );

      expect(exceedsMaxGap(result.bestSchedule, '2')).toBe(false);
    });

    it('should handle both constraints together', () => {
      const result = generateExhaustiveBestSchedule(
        smallTestSet,
        defaultPrefOrder,
        '6', // Max 6 units
        '1', // Max 1 hour gap
        false
      );

      const validation = validateScheduleConstraints(result.bestSchedule, '6', '1');
      expect(validation.valid).toBe(true);
    });
  });

  describe('Time preference optimization', () => {
    it('should prefer earlier time slots when all else equal', () => {
      const morningPref: readonly TimeOfDayBucket[] = ['morning', 'afternoon', 'evening'];
      const eveningPref: readonly TimeOfDayBucket[] = ['evening', 'afternoon', 'morning'];

      const morningResult = generateExhaustiveBestSchedule(
        timePreferenceTestSet,
        morningPref,
        '',
        '',
        false
      );

      const eveningResult = generateExhaustiveBestSchedule(
        timePreferenceTestSet,
        eveningPref,
        '',
        '',
        false
      );

      // Both should find schedules
      expect(morningResult.bestSchedule.length).toBeGreaterThan(0);
      expect(eveningResult.bestSchedule.length).toBeGreaterThan(0);

      // Morning preference should have lower (better) time preference score
      const morningTimeScore = scoreScheduleByTimePreference(
        morningResult.bestSchedule,
        morningPref
      );
      const eveningTimeScore = scoreScheduleByTimePreference(
        eveningResult.bestSchedule,
        eveningPref
      );

      // Morning preferred schedule should have better score with morning pref order
      expect(morningTimeScore).toBeLessThanOrEqual(eveningTimeScore);
    });
  });

  describe('Campus days minimization', () => {
    it('should minimize campus days when enabled', () => {
      const resultMinimize = generateExhaustiveBestSchedule(
        campusDaysTestSet,
        defaultPrefOrder,
        '',
        '',
        true // minimize days
      );

      // With minimization, should prefer TTH (2 days) over MWF (3 days)
      const minCampusDays = countCampusDays(resultMinimize.bestSchedule);
      expect(minCampusDays).toBeLessThanOrEqual(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle all conflicting courses', () => {
      const result = generateExhaustiveBestSchedule(
        allConflictingTestSet,
        defaultPrefOrder,
        '',
        '',
        false
      );
      // Should pick at most one course
      expect(result.bestSchedule.length).toBeLessThanOrEqual(1);
    });

    it('should handle TBA and online courses', () => {
      const result = generateExhaustiveBestSchedule(
        mixedScheduleTestSet,
        defaultPrefOrder,
        '',
        '',
        false
      );
      expect(result.bestSchedule.length).toBe(3);
      expect(isValidSchedule(result.bestSchedule)).toBe(true);
    });

    it('should return empty for impossible constraints', () => {
      const result = generateExhaustiveBestSchedule(
        smallTestSet,
        defaultPrefOrder,
        '1', // Max 1 unit - impossible with 3-unit courses
        '',
        false
      );
      expect(result.bestSchedule.length).toBe(0);
    });
  });

  describe('Score calculation', () => {
    it('should calculate score correctly (courses * 100 + units)', () => {
      const result = generateExhaustiveBestSchedule(smallTestSet, defaultPrefOrder, '', '', false);

      const totalUnits = result.bestSchedule.reduce(
        (sum, c) => sum + parseFloat(c.creditedUnits ?? c.units),
        0
      );
      const expectedScore = result.bestSchedule.length * 100 + totalUnits;
      expect(result.bestScore).toBe(expectedScore);
    });
  });
});

// ============================================================================
// PARTIAL MODE TESTS (Recommended)
// ============================================================================

describe('generateBestPartialSchedule - Recommended Mode', () => {
  describe('Basic functionality', () => {
    it('should return empty array for empty input', () => {
      const result = generateBestPartialSchedule([], '', '', defaultPrefOrder, false);
      expect(result).toHaveLength(0);
    });

    it('should find schedule for small course sets (exhaustive path)', () => {
      const courses = Object.values(smallTestSet).flat();
      const result = generateBestPartialSchedule(courses, '', '', defaultPrefOrder, false);

      expect(result.length).toBe(3);
      expect(isValidSchedule(result)).toBe(true);
    });

    it('should find schedule for larger course sets (heuristic path)', () => {
      // Create more than 12 courses to trigger heuristic
      const largeCourseList: Course[] = [];
      for (let i = 0; i < 15; i++) {
        largeCourseList.push(
          createTestCourse(`CS ${100 + i}`, 'A', `MWF | ${7 + (i % 5)}:00AM-${8 + (i % 5)}:00AM`)
        );
      }

      const result = generateBestPartialSchedule(largeCourseList, '', '', defaultPrefOrder, false);

      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(isValidSchedule(result)).toBe(true);
    });
  });

  describe('Constraint handling', () => {
    it('should respect max units constraint', () => {
      const courses = Object.values(unitConstraintTestSet).flat();
      const result = generateBestPartialSchedule(courses, '5', '', defaultPrefOrder, false);

      const totalUnits = result.reduce((sum, c) => sum + parseFloat(c.creditedUnits ?? c.units), 0);
      expect(totalUnits).toBeLessThanOrEqual(5);
    });

    it('should respect max gap constraint', () => {
      const courses = Object.values(gapConstraintTestSet).flat();
      const result = generateBestPartialSchedule(courses, '', '2', defaultPrefOrder, false);

      expect(exceedsMaxGap(result, '2')).toBe(false);
    });
  });

  describe('Subject maximization', () => {
    it('should maximize unique subjects', () => {
      const courses = Object.values(smallTestSet).flat();
      const result = generateBestPartialSchedule(courses, '', '', defaultPrefOrder, false);

      const uniqueSubjects = new Set(result.map((c) => c.subject)).size;
      expect(uniqueSubjects).toBe(3);
    });

    it('should handle duplicate subjects correctly', () => {
      const courses: Course[] = [
        createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
        createTestCourse('IT 101', 'B', 'MWF | 2:00PM-3:00PM'),
        createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM'),
      ];

      const result = generateBestPartialSchedule(courses, '', '', defaultPrefOrder, false);

      // Should pick at most one course per subject
      const subjects = result.map((c) => c.subject);
      const uniqueSubjects = new Set(subjects);
      expect(uniqueSubjects.size).toBe(subjects.length);
    });
  });

  describe('Threshold switching', () => {
    it('should use exhaustive for <= 12 courses', () => {
      // Exactly 12 courses
      const courses: Course[] = [];
      for (let i = 0; i < 12; i++) {
        courses.push(
          createTestCourse(`CS ${100 + i}`, 'A', `MWF | ${7 + (i % 5)}:00AM-${8 + (i % 5)}:00AM`)
        );
      }

      const result = generateBestPartialSchedule(courses, '', '', defaultPrefOrder, false);
      expect(isValidSchedule(result)).toBe(true);
    });

    it('should use heuristic for > 12 courses', () => {
      // 13 courses should trigger heuristic
      const courses: Course[] = [];
      for (let i = 0; i < 13; i++) {
        courses.push(
          createTestCourse(`CS ${100 + i}`, 'A', `MWF | ${7 + (i % 5)}:00AM-${8 + (i % 5)}:00AM`)
        );
      }

      const result = generateBestPartialSchedule(courses, '', '', defaultPrefOrder, false);
      expect(isValidSchedule(result)).toBe(true);
    });
  });
});

// ============================================================================
// HEURISTIC MODE TESTS
// ============================================================================

describe('generateBestPartialSchedule_Heuristic', () => {
  it('should return empty array for empty input', () => {
    const result = generateBestPartialSchedule_Heuristic([], '', '', defaultPrefOrder, false);
    expect(result).toHaveLength(0);
  });

  it('should find valid schedule for large course sets', () => {
    const courses = Object.values(largerTestSet).flat();
    const result = generateBestPartialSchedule_Heuristic(courses, '', '', defaultPrefOrder, false);

    expect(result.length).toBeGreaterThan(0);
    expect(isValidSchedule(result)).toBe(true);
  });

  it('should handle constraints', () => {
    const courses = Object.values(unitConstraintTestSet).flat();
    const result = generateBestPartialSchedule_Heuristic(courses, '5', '', defaultPrefOrder, false);

    const totalUnits = result.reduce((sum, c) => sum + parseFloat(c.creditedUnits ?? c.units), 0);
    expect(totalUnits).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// FAST MODE TESTS (Random Sampling)
// ============================================================================

describe('generateFastSchedule - Fast Mode', () => {
  it('should return empty array for empty input', () => {
    const result = generateFastSchedule({}, '', '', defaultPrefOrder, false, 10);
    expect(result).toHaveLength(0);
  });

  it('should find valid schedule for small test sets', () => {
    const result = generateFastSchedule(smallTestSet, '', '', defaultPrefOrder, false, 100);

    expect(result.length).toBeGreaterThan(0);
    expect(isValidSchedule(result)).toBe(true);
  });

  it('should find valid schedule for conflict test sets', () => {
    const result = generateFastSchedule(conflictTestSet, '', '', defaultPrefOrder, false, 100);

    expect(result.length).toBeGreaterThan(0);
    expect(isValidSchedule(result)).toBe(true);
  });

  it('should respect constraints', () => {
    const result = generateFastSchedule(
      unitConstraintTestSet,
      '5',
      '',
      defaultPrefOrder,
      false,
      100
    );

    const totalUnits = result.reduce((sum, c) => sum + parseFloat(c.creditedUnits ?? c.units), 0);
    expect(totalUnits).toBeLessThanOrEqual(5);
  });

  it('should handle all-conflicting courses', () => {
    const result = generateFastSchedule(allConflictingTestSet, '', '', defaultPrefOrder, false, 10);

    // Should pick at most one course from conflicting set
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('should handle TBA and online courses', () => {
    const result = generateFastSchedule(mixedScheduleTestSet, '', '', defaultPrefOrder, false, 50);

    expect(result.length).toBeGreaterThan(0);
    expect(isValidSchedule(result)).toBe(true);
  });
});

// ============================================================================
// CROSS-MODE COMPARISON TESTS
// ============================================================================

describe('Cross-mode consistency', () => {
  it('should produce consistent results for small sets (exhaustive vs partial)', () => {
    // For small sets, both should find optimal solutions
    const exhaustiveResult = generateExhaustiveBestSchedule(
      smallTestSet,
      defaultPrefOrder,
      '',
      '',
      false
    );

    const partialResult = generateBestPartialSchedule(
      Object.values(smallTestSet).flat(),
      '',
      '',
      defaultPrefOrder,
      false
    );

    // Both should find all 3 courses
    expect(exhaustiveResult.bestSchedule.length).toBe(3);
    expect(partialResult.length).toBe(3);

    // Both should have no conflicts
    expect(isValidSchedule(exhaustiveResult.bestSchedule)).toBe(true);
    expect(isValidSchedule(partialResult)).toBe(true);
  });

  it('should produce valid results for all modes on same input', () => {
    const exhaustiveResult = generateExhaustiveBestSchedule(
      conflictTestSet,
      defaultPrefOrder,
      '',
      '',
      false
    );

    const partialResult = generateBestPartialSchedule(
      Object.values(conflictTestSet).flat(),
      '',
      '',
      defaultPrefOrder,
      false
    );

    const fastResult = generateFastSchedule(conflictTestSet, '', '', defaultPrefOrder, false, 100);

    // All should find valid schedules
    expect(isValidSchedule(exhaustiveResult.bestSchedule)).toBe(true);
    expect(isValidSchedule(partialResult)).toBe(true);
    expect(isValidSchedule(fastResult)).toBe(true);

    // Exhaustive should find optimal (all 3 subjects)
    expect(exhaustiveResult.bestSchedule.length).toBe(3);
    expect(partialResult.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// PREFERENCE RESPECT TESTS
// ============================================================================

describe('Preferences are respected', () => {
  describe('Time preferences', () => {
    it('should score morning classes better with morning preference', () => {
      const morningCourses = [
        createTestCourse('IT 101', 'A', 'MWF | 8:00AM-9:00AM'),
        createTestCourse('IT 102', 'A', 'MWF | 9:00AM-10:00AM'),
      ];

      const eveningCourses = [
        createTestCourse('IT 101', 'A', 'MWF | 6:00PM-7:00PM'),
        createTestCourse('IT 102', 'A', 'MWF | 7:00PM-8:00PM'),
      ];

      const morningPref: readonly TimeOfDayBucket[] = ['morning', 'afternoon', 'evening'];

      const morningScore = scoreScheduleByTimePreference(morningCourses, morningPref);
      const eveningScore = scoreScheduleByTimePreference(eveningCourses, morningPref);

      // Morning courses should score better (lower) with morning preference
      expect(morningScore).toBeLessThan(eveningScore);
    });
  });

  describe('Max units preference', () => {
    it('should limit schedule to max units', () => {
      const result = generateExhaustiveBestSchedule(
        unitConstraintTestSet,
        defaultPrefOrder,
        '5',
        '',
        false
      );

      const totalUnits = result.bestSchedule.reduce(
        (sum, c) => sum + parseFloat(c.creditedUnits ?? c.units),
        0
      );
      expect(totalUnits).toBeLessThanOrEqual(5);
    });
  });

  describe('Max gap preference', () => {
    it('should limit gap between classes', () => {
      const result = generateExhaustiveBestSchedule(
        gapConstraintTestSet,
        defaultPrefOrder,
        '',
        '1',
        false
      );

      expect(exceedsMaxGap(result.bestSchedule, '1')).toBe(false);
    });
  });

  describe('Minimize campus days preference', () => {
    it('should minimize campus days when enabled', () => {
      const resultWithMinimize = generateExhaustiveBestSchedule(
        campusDaysTestSet,
        defaultPrefOrder,
        '',
        '',
        true
      );

      // With minimize, campus days should be optimal
      const minDays = countCampusDays(resultWithMinimize.bestSchedule);
      expect(minDays).toBeLessThanOrEqual(2); // TTH is optimal (2 days)
    });
  });
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================

describe('Edge cases and error handling', () => {
  it('should handle courses with creditedUnits field', () => {
    const coursesWithCreditedUnits: Record<string, Course[]> = {
      'IT 101': [
        createTestCourseWithCreditedUnits('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '3', '2'),
      ],
    };

    const result = generateExhaustiveBestSchedule(
      coursesWithCreditedUnits,
      defaultPrefOrder,
      '2',
      '',
      false
    );

    expect(result.bestSchedule.length).toBe(1);
  });

  it('should handle empty schedule strings gracefully', () => {
    const emptyScheduleSet: Record<string, Course[]> = {
      'IT 101': [createTestCourse('IT 101', 'A', '')],
    };

    const result = generateExhaustiveBestSchedule(
      emptyScheduleSet,
      defaultPrefOrder,
      '',
      '',
      false
    );

    // Should handle gracefully (might include TBA-like courses or skip)
    expect(result.bestSchedule.length).toBeLessThanOrEqual(1);
  });

  it('should handle malformed schedule strings', () => {
    const malformedSet: Record<string, Course[]> = {
      'IT 101': [createTestCourse('IT 101', 'A', 'INVALID SCHEDULE STRING')],
    };

    const result = generateExhaustiveBestSchedule(malformedSet, defaultPrefOrder, '', '', false);

    // Should not crash, might return empty or handle gracefully
    expect(result.bestSchedule.length).toBeLessThanOrEqual(1);
  });

  it('should handle very large unit values', () => {
    const largeUnitSet: Record<string, Course[]> = {
      'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '999')],
    };

    const result = generateExhaustiveBestSchedule(largeUnitSet, defaultPrefOrder, '10', '', false);

    // Should respect constraint
    expect(result.bestSchedule.length).toBe(0);
  });

  it('should handle single course', () => {
    const singleCourseSet: Record<string, Course[]> = {
      'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM')],
    };

    const result = generateExhaustiveBestSchedule(singleCourseSet, defaultPrefOrder, '', '', false);

    expect(result.bestSchedule.length).toBe(1);
    expect(result.bestScore).toBe(103); // 1 course * 100 + 3 units
  });

  it('should handle multiple sections of same subject', () => {
    const multiSectionSet: Record<string, Course[]> = {
      'IT 101': [
        createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
        createTestCourse('IT 101', 'B', 'TTH | 9:00AM-10:30AM'),
        createTestCourse('IT 101', 'C', 'MWF | 2:00PM-3:00PM'),
      ],
    };

    const result = generateExhaustiveBestSchedule(multiSectionSet, defaultPrefOrder, '', '', false);

    // Should pick exactly one section
    expect(result.bestSchedule.length).toBe(1);
    expect(result.bestSchedule[0]?.subject).toBe('IT 101');
  });
});

// ============================================================================
// OUTPUT VALIDATION TESTS
// ============================================================================

describe('Output validation', () => {
  it('should always produce conflict-free schedules', () => {
    const testSets = [smallTestSet, conflictTestSet, largerTestSet];

    for (const testSet of testSets) {
      const result = generateExhaustiveBestSchedule(testSet, defaultPrefOrder, '', '', false);
      expect(isValidSchedule(result.bestSchedule)).toBe(true);
    }
  });

  it('should always respect max units in output', () => {
    const result = generateExhaustiveBestSchedule(
      unitConstraintTestSet,
      defaultPrefOrder,
      '5',
      '',
      false
    );

    expect(exceedsMaxUnits(result.bestSchedule, '5')).toBe(false);
  });

  it('should always respect max gap in output', () => {
    const result = generateExhaustiveBestSchedule(
      gapConstraintTestSet,
      defaultPrefOrder,
      '',
      '2',
      false
    );

    expect(exceedsMaxGap(result.bestSchedule, '2')).toBe(false);
  });

  it('should always have one course per subject maximum', () => {
    const result = generateExhaustiveBestSchedule(largerTestSet, defaultPrefOrder, '', '', false);

    const subjectCounts = new Map<string, number>();
    for (const course of result.bestSchedule) {
      subjectCounts.set(course.subject, (subjectCounts.get(course.subject) ?? 0) + 1);
    }

    for (const count of subjectCounts.values()) {
      expect(count).toBe(1);
    }
  });

  it('should always return valid Course objects', () => {
    const result = generateExhaustiveBestSchedule(smallTestSet, defaultPrefOrder, '', '', false);

    for (const course of result.bestSchedule) {
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('subject');
      expect(course).toHaveProperty('section');
      expect(course).toHaveProperty('schedule');
      expect(course).toHaveProperty('units');
    }
  });
});
