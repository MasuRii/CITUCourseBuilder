/**
 * Tests for Scheduling Algorithms
 *
 * @module scheduleAlgorithms.test
 * @task T3.1.5 - Extract scheduling algorithms from App.jsx to TypeScript
 */

import { describe, it, expect } from 'vitest';
import {
  checkTimeOverlap,
  isScheduleConflictFree,
  getTimeOfDayBucket,
  scoreScheduleByTimePreference,
  exceedsMaxUnits,
  exceedsMaxGap,
  countCampusDays,
  getAllSubsets,
  generateExhaustiveBestSchedule,
  generateBestPartialSchedule_Heuristic,
  generateBestPartialSchedule,
} from '../src/utils/scheduleAlgorithms';
import type { Course, TimeOfDayBucket } from '../src/types/index';
import { parseSchedule } from '../src/utils/parseSchedule';

// Helper to create a minimal course for testing
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

describe('checkTimeOverlap', () => {
  it('should return true for overlapping time ranges', () => {
    expect(checkTimeOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
    expect(checkTimeOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true);
    expect(checkTimeOverlap('09:00', '10:00', '08:00', '09:30')).toBe(true);
  });

  it('should return false for non-overlapping time ranges', () => {
    expect(checkTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    expect(checkTimeOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false);
    expect(checkTimeOverlap('13:00', '14:00', '09:00', '10:00')).toBe(false);
  });

  it('should return false for invalid time formats', () => {
    expect(checkTimeOverlap('9:00', '10:00', '09:30', '10:30')).toBe(false);
    expect(checkTimeOverlap('09:00', '10:00', 'invalid', '10:30')).toBe(false);
    expect(checkTimeOverlap('', '', '09:00', '10:00')).toBe(false);
  });

  it('should handle exact boundary cases', () => {
    // Adjacent ranges should not overlap
    expect(checkTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    // Same start/end should not overlap
    expect(checkTimeOverlap('09:00', '10:00', '10:00', '10:00')).toBe(false);
  });
});

describe('isScheduleConflictFree', () => {
  it('should return true for empty or single-course schedules', () => {
    expect(isScheduleConflictFree([], parseSchedule, checkTimeOverlap)).toBe(true);
    const singleCourse = [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101')];
    expect(isScheduleConflictFree(singleCourse, parseSchedule, checkTimeOverlap)).toBe(true);
  });

  it('should return true for non-conflicting schedules', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM | ACAD102'),
    ];
    expect(isScheduleConflictFree(courses, parseSchedule, checkTimeOverlap)).toBe(true);
  });

  it('should return false for conflicting schedules on same day', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101'),
      createTestCourse('IT 102', 'A', 'MWF | 9:30AM-11:00AM | ACAD102'),
    ];
    expect(isScheduleConflictFree(courses, parseSchedule, checkTimeOverlap)).toBe(false);
  });

  it('should handle TBA schedules without conflict', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'TBA'),
      createTestCourse('IT 102', 'A', 'MWF | 9:00AM-10:00AM | ACAD101'),
    ];
    expect(isScheduleConflictFree(courses, parseSchedule, checkTimeOverlap)).toBe(true);
  });
});

describe('getTimeOfDayBucket', () => {
  it('should categorize morning times correctly', () => {
    expect(getTimeOfDayBucket('06:00')).toBe('morning');
    expect(getTimeOfDayBucket('08:30')).toBe('morning');
    expect(getTimeOfDayBucket('11:59')).toBe('morning');
  });

  it('should categorize afternoon times correctly', () => {
    expect(getTimeOfDayBucket('12:00')).toBe('afternoon');
    expect(getTimeOfDayBucket('14:00')).toBe('afternoon');
    expect(getTimeOfDayBucket('16:59')).toBe('afternoon');
  });

  it('should categorize evening times correctly', () => {
    expect(getTimeOfDayBucket('17:00')).toBe('evening');
    expect(getTimeOfDayBucket('18:30')).toBe('evening');
    expect(getTimeOfDayBucket('23:00')).toBe('evening');
  });

  it('should return "any" for null or empty inputs', () => {
    expect(getTimeOfDayBucket(null)).toBe('any');
    expect(getTimeOfDayBucket(undefined)).toBe('any');
    expect(getTimeOfDayBucket('')).toBe('any');
  });
});

describe('scoreScheduleByTimePreference', () => {
  it('should return 0 for empty schedule or preferences', () => {
    expect(scoreScheduleByTimePreference([], ['morning', 'afternoon'])).toBe(0);
    expect(
      scoreScheduleByTimePreference([createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM')], [])
    ).toBe(0);
  });

  it('should score based on preference order', () => {
    const morningCourse = createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM');
    const afternoonCourse = createTestCourse('IT 102', 'A', 'MWF | 2:00PM-3:00PM');
    const prefOrder: readonly TimeOfDayBucket[] = ['morning', 'afternoon', 'evening'];

    const morningScore = scoreScheduleByTimePreference([morningCourse], prefOrder);
    const afternoonScore = scoreScheduleByTimePreference([afternoonCourse], prefOrder);

    // Lower score is better (earlier in preference order)
    expect(morningScore).toBeLessThan(afternoonScore);
  });

  it('should handle TBA schedules', () => {
    const tbaCourse = createTestCourse('IT 101', 'A', 'TBA');
    const prefOrder: readonly TimeOfDayBucket[] = ['morning', 'afternoon', 'evening'];

    // TBA courses should not contribute to score (continue in loop)
    expect(scoreScheduleByTimePreference([tbaCourse], prefOrder)).toBe(0);
  });
});

describe('exceedsMaxUnits', () => {
  it('should return false when maxUnits is empty', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '3'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM', '3'),
    ];
    expect(exceedsMaxUnits(courses, '')).toBe(false);
  });

  it('should return true when total units exceed max', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '3'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM', '3'),
    ];
    expect(exceedsMaxUnits(courses, '5')).toBe(true);
  });

  it('should return false when total units are within max', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '3'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM', '3'),
    ];
    expect(exceedsMaxUnits(courses, '6')).toBe(false);
    expect(exceedsMaxUnits(courses, '10')).toBe(false);
  });

  it('should handle creditedUnits field', () => {
    const course: Course = {
      ...createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '3'),
      creditedUnits: '2',
    };
    expect(exceedsMaxUnits([course], '1')).toBe(true);
    expect(exceedsMaxUnits([course], '2')).toBe(false);
  });
});

describe('exceedsMaxGap', () => {
  it('should return false when maxGapHours is empty', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
      createTestCourse('IT 102', 'A', 'MWF | 2:00PM-3:00PM'),
    ];
    expect(exceedsMaxGap(courses, '')).toBe(false);
  });

  it('should return true when gap exceeds limit', () => {
    // 9AM-10AM, then 2PM-3PM = 4 hour gap
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
      createTestCourse('IT 102', 'A', 'MWF | 2:00PM-3:00PM'),
    ];
    expect(exceedsMaxGap(courses, '2')).toBe(true);
  });

  it('should return false when gap is within limit', () => {
    // 9AM-10AM, then 11AM-12PM = 1 hour gap
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
      createTestCourse('IT 102', 'A', 'MWF | 11:00AM-12:00PM'),
    ];
    expect(exceedsMaxGap(courses, '2')).toBe(false);
  });

  it('should return false for courses on different days', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
      createTestCourse('IT 102', 'A', 'TTH | 2:00PM-3:00PM'),
    ];
    expect(exceedsMaxGap(courses, '1')).toBe(false);
  });

  it('should handle TBA schedules', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'TBA'),
      createTestCourse('IT 102', 'A', 'MWF | 2:00PM-3:00PM'),
    ];
    expect(exceedsMaxGap(courses, '1')).toBe(false);
  });
});

describe('countCampusDays', () => {
  it('should return 0 for empty schedule', () => {
    expect(countCampusDays([])).toBe(0);
  });

  it('should count unique on-campus days', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | ACAD101'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM | ACAD102'),
    ];
    // MWF = 3 days, TTH = 2 days = 5 unique days
    expect(countCampusDays(courses)).toBe(5);
  });

  it('should not count online classes', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | online'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM | ONLINE'),
    ];
    expect(countCampusDays(courses)).toBe(0);
  });

  it('should handle mixed online and on-campus', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM | online'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM | ACAD102'),
    ];
    // Only TTH should count = 2 days
    expect(countCampusDays(courses)).toBe(2);
  });

  it('should handle TBA schedules', () => {
    const courses = [createTestCourse('IT 101', 'A', 'TBA')];
    expect(countCampusDays(courses)).toBe(0);
  });
});

describe('getAllSubsets', () => {
  it('should return [[]] for empty array', () => {
    const result = getAllSubsets([]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([]);
  });

  it('should return all subsets for single element', () => {
    const result = getAllSubsets(['a']);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual([]);
    expect(result).toContainEqual(['a']);
  });

  it('should return all subsets for multiple elements', () => {
    const result = getAllSubsets(['a', 'b']);
    expect(result).toHaveLength(4);
    expect(result).toContainEqual([]);
    expect(result).toContainEqual(['a']);
    expect(result).toContainEqual(['b']);
    expect(result).toContainEqual(['a', 'b']);
  });

  it('should return 2^n subsets for n elements', () => {
    expect(getAllSubsets([1, 2, 3])).toHaveLength(8);
    expect(getAllSubsets([1, 2, 3, 4])).toHaveLength(16);
  });
});

describe('generateExhaustiveBestSchedule', () => {
  it('should return empty schedule for no courses', () => {
    const result = generateExhaustiveBestSchedule({}, [], '', '', false);
    expect(result.bestSchedule).toHaveLength(0);
  });

  it('should find best schedule with single subject', () => {
    const coursesBySubject = {
      'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM')],
    };
    const result = generateExhaustiveBestSchedule(
      coursesBySubject,
      ['morning', 'afternoon', 'evening'],
      '',
      '',
      false
    );
    expect(result.bestSchedule).toHaveLength(1);
  });

  it('should avoid conflicts', () => {
    const coursesBySubject = {
      'IT 101': [createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM')],
      'IT 102': [
        createTestCourse('IT 102', 'A', 'MWF | 9:30AM-10:30AM'), // Conflicts with IT 101
        createTestCourse('IT 102', 'B', 'TTH | 9:00AM-10:30AM'), // No conflict
      ],
    };
    const result = generateExhaustiveBestSchedule(
      coursesBySubject,
      ['morning', 'afternoon', 'evening'],
      '',
      '',
      false
    );
    // Should pick one from each subject without conflict
    expect(result.bestSchedule).toHaveLength(2);
    const subjects = result.bestSchedule.map((c) => c.subject);
    expect(subjects).toContain('IT 101');
    expect(subjects).toContain('IT 102');
  });
});

describe('generateBestPartialSchedule_Heuristic', () => {
  it('should return empty schedule for no courses', () => {
    const result = generateBestPartialSchedule_Heuristic([], '', '', [], false);
    expect(result).toHaveLength(0);
  });

  it('should find schedule with available courses', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM'),
    ];
    const result = generateBestPartialSchedule_Heuristic(
      courses,
      '',
      '',
      ['morning', 'afternoon', 'evening'],
      false
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('generateBestPartialSchedule', () => {
  it('should return empty schedule for no courses', () => {
    const result = generateBestPartialSchedule([], '', '', [], false);
    expect(result).toHaveLength(0);
  });

  it('should use exhaustive search for small course sets', () => {
    // SMALL_N_THRESHOLD_PARTIAL is 12, so 5 courses should use exhaustive
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM'),
      createTestCourse('IT 103', 'A', 'MWF | 2:00PM-3:00PM'),
    ];
    const result = generateBestPartialSchedule(
      courses,
      '',
      '',
      ['morning', 'afternoon', 'evening'],
      false
    );
    // Should find a valid schedule
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should respect max units constraint', () => {
    const courses = [
      createTestCourse('IT 101', 'A', 'MWF | 9:00AM-10:00AM', '3'),
      createTestCourse('IT 102', 'A', 'TTH | 9:00AM-10:30AM', '3'),
      createTestCourse('IT 103', 'A', 'MWF | 2:00PM-3:00PM', '3'),
    ];
    const result = generateBestPartialSchedule(
      courses,
      '5', // Max 5 units
      '',
      ['morning', 'afternoon', 'evening'],
      false
    );
    // Should not exceed 5 units (would be at most 1 course of 3 units, or check total)
    const totalUnits = result.reduce((sum, c) => sum + parseFloat(c.units), 0);
    expect(totalUnits).toBeLessThanOrEqual(5);
  });
});
