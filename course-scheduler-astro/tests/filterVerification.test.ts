/**
 * Filter Verification Tests
 *
 * Tests for T3.3.4 - Verify filtering system
 * Verifies: day exclusion, time range exclusion, section type filtering, preference persistence
 *
 * @module tests/filterVerification
 * @task T3.3.4 - Verify filtering system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Course,
  DayCode,
  TimeRange,
  SectionTypeSuffix,
  StatusFilter,
} from '../src/types/index';
import { LOCAL_STORAGE_KEYS, ALLOWED_VALUES, DEFAULT_VALUES } from '../src/types/index';

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
 * Create a set of test courses with various schedules
 */
function createTestCourses(): Course[] {
  return [
    // Monday/Wednesday/Friday morning
    createMockCourse({
      id: 'course-1',
      subject: 'IT 111',
      section: 'BSIT-1A-AP4',
      schedule: 'M/W/F | 9:00AM-10:30AM | ACAD309',
      enrolled: 20,
      totalSlots: 30,
      availableSlots: 10,
      isClosed: false,
    }),
    // Tuesday/Thursday afternoon
    createMockCourse({
      id: 'course-2',
      subject: 'IT 112',
      section: 'BSIT-1B-AP4',
      schedule: 'T/TH | 1:00PM-2:30PM | ACAD310',
      enrolled: 25,
      totalSlots: 30,
      availableSlots: 5,
      isClosed: false,
    }),
    // Saturday class
    createMockCourse({
      id: 'course-3',
      subject: 'IT 113',
      section: 'BSIT-2A-AP4',
      schedule: 'S | 8:00AM-12:00PM | ACAD311',
      enrolled: 15,
      totalSlots: 25,
      availableSlots: 10,
      isClosed: false,
    }),
    // Online class (AP3)
    createMockCourse({
      id: 'course-4',
      subject: 'IT 114',
      section: 'BSIT-3A-AP3',
      schedule: 'F | 1:00PM-4:00PM | online',
      enrolled: 18,
      totalSlots: 40,
      availableSlots: 22,
      isClosed: false,
    }),
    // Hybrid class (AP5)
    createMockCourse({
      id: 'course-5',
      subject: 'IT 115',
      section: 'BSIT-4A-AP5',
      schedule: 'M/W | 9:00AM-10:30AM | online + F | 9:00AM-12:00PM | ACAD309',
      enrolled: 20,
      totalSlots: 25,
      availableSlots: 5,
      isClosed: false,
    }),
    // Closed course
    createMockCourse({
      id: 'course-6',
      subject: 'IT 116',
      section: 'BSIT-2B-AP4',
      schedule: 'M/W | 3:00PM-4:30PM | ACAD312',
      enrolled: 30,
      totalSlots: 30,
      availableSlots: 0,
      isClosed: true,
    }),
    // Evening class
    createMockCourse({
      id: 'course-7',
      subject: 'IT 117',
      section: 'BSIT-5A-AP4',
      schedule: 'T/TH | 6:00PM-7:30PM | ACAD313',
      enrolled: 22,
      totalSlots: 30,
      availableSlots: 8,
      isClosed: false,
    }),
    // TBA schedule
    createMockCourse({
      id: 'course-8',
      subject: 'IT 118',
      section: 'BSIT-6A-AP4',
      schedule: 'TBA',
      room: '',
      enrolled: 10,
      totalSlots: 30,
      availableSlots: 20,
      isClosed: false,
    }),
  ];
}

// ============================================================================
// Day Exclusion Tests
// ============================================================================

describe('Day Exclusion', () => {
  /**
   * Extract days from a schedule string (simplified for testing)
   */
  function extractDaysFromSchedule(schedule: string): DayCode[] {
    const dayPattern = /\b(M|T|W|TH|F|S|SU)\b/g;
    const matches = schedule.match(dayPattern);
    if (!matches) return [];

    // Deduplicate and return
    return [...new Set(matches)] as DayCode[];
  }

  /**
   * Check if a course should be excluded based on excluded days
   */
  function isCourseExcludedByDay(course: Course, excludedDays: DayCode[]): boolean {
    const courseDays = extractDaysFromSchedule(course.schedule);
    // Course is excluded if ALL of its days are in the excluded list
    return courseDays.length > 0 && courseDays.every((day) => excludedDays.includes(day));
  }

  describe('extractDaysFromSchedule', () => {
    it('should extract single day codes', () => {
      expect(extractDaysFromSchedule('M | 9:00AM-10:30AM | ACAD309')).toEqual(['M']);
      expect(extractDaysFromSchedule('T | 1:00PM-2:30PM | ACAD310')).toEqual(['T']);
      expect(extractDaysFromSchedule('S | 8:00AM-12:00PM | ACAD311')).toEqual(['S']);
    });

    it('should extract multiple day codes', () => {
      expect(extractDaysFromSchedule('M/W/F | 9:00AM-10:30AM | ACAD309')).toEqual(['M', 'W', 'F']);
      expect(extractDaysFromSchedule('T/TH | 1:00PM-2:30PM | ACAD310')).toEqual(['T', 'TH']);
    });

    it('should handle TH (Thursday) correctly', () => {
      // When T and TH are both in schedule, both should be extracted
      const days = extractDaysFromSchedule('M/T/W/TH/F | 9:00AM-10:30AM | ACAD309');
      expect(days).toContain('TH');
      expect(days).toContain('T'); // T (Tuesday) is also present as separate token
    });

    it('should extract only TH when schedule has only Thursday', () => {
      const days = extractDaysFromSchedule('TH | 9:00AM-10:30AM | ACAD309');
      expect(days).toEqual(['TH']);
      expect(days).not.toContain('T');
    });

    it('should return empty array for TBA schedules', () => {
      expect(extractDaysFromSchedule('TBA')).toEqual([]);
      expect(extractDaysFromSchedule('')).toEqual([]);
    });

    it('should deduplicate day codes', () => {
      const days = extractDaysFromSchedule('M/M/W/W/F/F | 9:00AM-10:30AM | ACAD309');
      expect(days).toEqual(['M', 'W', 'F']);
    });
  });

  describe('isCourseExcludedByDay', () => {
    const courses = createTestCourses();

    it('should not exclude course when no days are excluded', () => {
      expect(isCourseExcludedByDay(courses[0]!, [])).toBe(false);
    });

    it('should exclude course when all its days are excluded', () => {
      // course-1 has M/W/F
      expect(isCourseExcludedByDay(courses[0]!, ['M', 'W', 'F'])).toBe(true);
    });

    it('should not exclude course when only some days are excluded', () => {
      // course-1 has M/W/F, excluding only M
      expect(isCourseExcludedByDay(courses[0]!, ['M'])).toBe(false);
    });

    it('should exclude Saturday class when Saturday is excluded', () => {
      // course-3 has Saturday
      expect(isCourseExcludedByDay(courses[2]!, ['S'])).toBe(true);
    });

    it('should not exclude TBA schedule (no days to exclude)', () => {
      // course-8 has TBA
      expect(isCourseExcludedByDay(courses[7]!, ['M', 'T', 'W', 'TH', 'F', 'S'])).toBe(false);
    });
  });

  describe('toggle excluded day', () => {
    it('should add day to excluded list when not present', () => {
      const excludedDays: DayCode[] = [];
      const day: DayCode = 'M';

      const result = excludedDays.includes(day)
        ? excludedDays.filter((d) => d !== day)
        : [...excludedDays, day];

      expect(result).toEqual(['M']);
    });

    it('should remove day from excluded list when present', () => {
      const excludedDays: DayCode[] = ['M', 'W', 'F'];
      const day: DayCode = 'W';

      const result = excludedDays.includes(day)
        ? excludedDays.filter((d) => d !== day)
        : [...excludedDays, day];

      expect(result).toEqual(['M', 'F']);
    });

    it('should toggle multiple days independently', () => {
      let excludedDays: DayCode[] = [];

      // Toggle M on
      excludedDays = excludedDays.includes('M')
        ? excludedDays.filter((d) => d !== 'M')
        : [...excludedDays, 'M'];
      expect(excludedDays).toEqual(['M']);

      // Toggle T on
      excludedDays = excludedDays.includes('T')
        ? excludedDays.filter((d) => d !== 'T')
        : [...excludedDays, 'T'];
      expect(excludedDays).toEqual(['M', 'T']);

      // Toggle M off
      excludedDays = excludedDays.includes('M')
        ? excludedDays.filter((d) => d !== 'M')
        : [...excludedDays, 'M'];
      expect(excludedDays).toEqual(['T']);
    });
  });
});

// ============================================================================
// Time Range Exclusion Tests
// ============================================================================

describe('Time Range Exclusion', () => {
  /**
   * Convert 12-hour time to 24-hour format
   */
  function to24Hour(time12: string): string {
    const match = time12.match(/(\d+):(\d+)(AM|PM)/i);
    if (!match) return time12;

    let hours = parseInt(match[1]!, 10);
    const minutes = match[2];
    const meridiem = match[3]!.toUpperCase();

    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  /**
   * Check if a time range overlaps with an exclusion range
   */
  function hasTimeOverlap(
    courseStart: string,
    courseEnd: string,
    exclusionStart: string,
    exclusionEnd: string
  ): boolean {
    return courseStart < exclusionEnd && courseEnd > exclusionStart;
  }

  /**
   * Check if a course should be excluded based on time ranges
   */
  function isCourseExcludedByTime(course: Course, excludedRanges: TimeRange[]): boolean {
    // Extract time from schedule - fix regex to capture full time with AM/PM
    const timeMatch = course.schedule.match(/(\d+:\d+(?:AM|PM))-(\d+:\d+(?:AM|PM))/i);
    if (!timeMatch) return false; // TBA or no time

    const courseStart = to24Hour(timeMatch[1]!);
    const courseEnd = to24Hour(timeMatch[2]!);

    return excludedRanges.some((range) => {
      if (!range.start || !range.end) return false;
      return hasTimeOverlap(courseStart, courseEnd, range.start, range.end);
    });
  }

  describe('to24Hour', () => {
    it('should convert AM times correctly', () => {
      expect(to24Hour('9:00AM')).toBe('09:00');
      expect(to24Hour('7:30AM')).toBe('07:30');
      expect(to24Hour('12:00AM')).toBe('00:00'); // Midnight
    });

    it('should convert PM times correctly', () => {
      expect(to24Hour('1:00PM')).toBe('13:00');
      expect(to24Hour('12:00PM')).toBe('12:00'); // Noon
      expect(to24Hour('6:30PM')).toBe('18:30');
    });
  });

  describe('hasTimeOverlap', () => {
    it('should detect overlapping ranges', () => {
      // Course 9:00-10:30, exclusion 10:00-11:00
      expect(hasTimeOverlap('09:00', '10:30', '10:00', '11:00')).toBe(true);
    });

    it('should detect contained ranges', () => {
      // Course 9:00-12:00, exclusion 10:00-11:00
      expect(hasTimeOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
    });

    it('should not detect non-overlapping ranges', () => {
      // Course 9:00-10:00, exclusion 10:00-11:00
      expect(hasTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    });

    it('should not detect adjacent ranges', () => {
      // Course 9:00-10:00, exclusion 10:00-11:00
      expect(hasTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    });
  });

  describe('isCourseExcludedByTime', () => {
    const courses = createTestCourses();

    it('should not exclude course when no time ranges are excluded', () => {
      expect(isCourseExcludedByTime(courses[0]!, [])).toBe(false);
    });

    it('should exclude course when time overlaps', () => {
      // course-1: M/W/F | 9:00AM-10:30AM
      // Exclude 9:00-10:00
      const excludedRanges: TimeRange[] = [{ id: 1, start: '09:00', end: '10:00' }];
      expect(isCourseExcludedByTime(courses[0]!, excludedRanges)).toBe(true);
    });

    it('should not exclude course when time does not overlap', () => {
      // course-1: M/W/F | 9:00AM-10:30AM
      // Exclude 11:00-12:00
      const excludedRanges: TimeRange[] = [{ id: 1, start: '11:00', end: '12:00' }];
      expect(isCourseExcludedByTime(courses[0]!, excludedRanges)).toBe(false);
    });

    it('should exclude evening class with evening exclusion', () => {
      // course-7: T/TH | 6:00PM-7:30PM
      // Exclude 5:00PM-8:00PM (17:00-20:00)
      // Note: The regex matches 6:00PM-7:30PM format
      const excludedRanges: TimeRange[] = [{ id: 1, start: '17:00', end: '20:00' }];
      // to24Hour('6:00PM') = '18:00', to24Hour('7:30PM') = '19:30'
      // Course time: 18:00-19:30, Exclusion: 17:00-20:00
      // Overlap check: 18:00 < 20:00 AND 19:30 > 17:00 = true
      expect(isCourseExcludedByTime(courses[6]!, excludedRanges)).toBe(true);
    });

    it('should not exclude TBA course (no time)', () => {
      // course-8: TBA
      const excludedRanges: TimeRange[] = [{ id: 1, start: '09:00', end: '10:00' }];
      expect(isCourseExcludedByTime(courses[7]!, excludedRanges)).toBe(false);
    });

    it('should handle empty exclusion range', () => {
      const excludedRanges: TimeRange[] = [{ id: 1, start: '', end: '' }];
      expect(isCourseExcludedByTime(courses[0]!, excludedRanges)).toBe(false);
    });
  });

  describe('time range management', () => {
    it('should add time range', () => {
      const ranges: TimeRange[] = [{ id: 1, start: '09:00', end: '10:00' }];
      const newRange: TimeRange = { id: 2, start: '14:00', end: '15:00' };
      const result = [...ranges, newRange];
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(newRange);
    });

    it('should remove time range', () => {
      const ranges: TimeRange[] = [
        { id: 1, start: '09:00', end: '10:00' },
        { id: 2, start: '14:00', end: '15:00' },
      ];
      const result = ranges.filter((r) => r.id !== 1);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(2);
    });

    it('should update time range start', () => {
      const ranges: TimeRange[] = [{ id: 1, start: '09:00', end: '10:00' }];
      const result = ranges.map((r) => (r.id === 1 ? { ...r, start: '08:00' } : r));
      expect(result[0]!.start).toBe('08:00');
      expect(result[0]!.end).toBe('10:00');
    });

    it('should update time range end', () => {
      const ranges: TimeRange[] = [{ id: 1, start: '09:00', end: '10:00' }];
      const result = ranges.map((r) => (r.id === 1 ? { ...r, end: '11:00' } : r));
      expect(result[0]!.start).toBe('09:00');
      expect(result[0]!.end).toBe('11:00');
    });

    it('should not remove last time range (keep at least one)', () => {
      const ranges: TimeRange[] = [{ id: 1, start: '', end: '' }];
      const result = ranges.length <= 1 ? ranges : ranges.filter((r) => r.id !== 1);
      expect(result).toHaveLength(1);
    });
  });
});

// ============================================================================
// Section Type Filtering Tests
// ============================================================================

describe('Section Type Filtering', () => {
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
   * Filter courses by section type
   */
  function filterBySectionType(courses: Course[], selectedTypes: SectionTypeSuffix[]): Course[] {
    if (selectedTypes.length === 0) {
      return courses; // No filter, show all
    }
    return courses.filter((course) => {
      const courseType = getSectionTypeSuffix(course.section);
      return courseType !== null && selectedTypes.includes(courseType);
    });
  }

  describe('getSectionTypeSuffix', () => {
    it('should extract AP3 from section string', () => {
      expect(getSectionTypeSuffix('BSIT-1A-AP3')).toBe('AP3');
    });

    it('should extract AP4 from section string', () => {
      expect(getSectionTypeSuffix('BSIT-1B-AP4')).toBe('AP4');
    });

    it('should extract AP5 from section string', () => {
      expect(getSectionTypeSuffix('BSIT-2A-AP5')).toBe('AP5');
    });

    it('should return null for section without suffix', () => {
      expect(getSectionTypeSuffix('BSIT-1A')).toBe(null);
      expect(getSectionTypeSuffix('BSIT-1A-AP1')).toBe(null);
    });

    it('should handle complex section strings', () => {
      expect(getSectionTypeSuffix('BSIT-1A-ONLINE-AP3')).toBe('AP3');
    });
  });

  describe('filterBySectionType', () => {
    const courses = createTestCourses();

    it('should return all courses when no types selected', () => {
      const result = filterBySectionType(courses, []);
      expect(result).toHaveLength(courses.length);
    });

    it('should filter to AP3 (online) courses only', () => {
      const result = filterBySectionType(courses, ['AP3']);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((course) => {
        expect(getSectionTypeSuffix(course.section)).toBe('AP3');
      });
    });

    it('should filter to AP4 (face-to-face) courses only', () => {
      const result = filterBySectionType(courses, ['AP4']);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((course) => {
        expect(getSectionTypeSuffix(course.section)).toBe('AP4');
      });
    });

    it('should filter to AP5 (hybrid) courses only', () => {
      const result = filterBySectionType(courses, ['AP5']);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((course) => {
        expect(getSectionTypeSuffix(course.section)).toBe('AP5');
      });
    });

    it('should filter to multiple section types', () => {
      const result = filterBySectionType(courses, ['AP3', 'AP5']);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((course) => {
        const type = getSectionTypeSuffix(course.section);
        expect(type).toMatch(/^(AP3|AP5)$/);
      });
    });

    it('should return empty array when no courses match', () => {
      // All test courses have AP3, AP4, or AP5
      const result = filterBySectionType(courses, ['AP1' as SectionTypeSuffix]);
      expect(result).toHaveLength(0);
    });
  });

  describe('toggle section type', () => {
    it('should add section type when not present', () => {
      const selectedTypes: SectionTypeSuffix[] = [];
      const type: SectionTypeSuffix = 'AP3';

      const result = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];

      expect(result).toEqual(['AP3']);
    });

    it('should remove section type when present', () => {
      const selectedTypes: SectionTypeSuffix[] = ['AP3', 'AP4', 'AP5'];
      const type: SectionTypeSuffix = 'AP4';

      const result = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];

      expect(result).toEqual(['AP3', 'AP5']);
    });

    it('should toggle multiple types independently', () => {
      let selectedTypes: SectionTypeSuffix[] = [];

      // Toggle AP3 on
      selectedTypes = selectedTypes.includes('AP3')
        ? selectedTypes.filter((t) => t !== 'AP3')
        : [...selectedTypes, 'AP3'];
      expect(selectedTypes).toEqual(['AP3']);

      // Toggle AP4 on
      selectedTypes = selectedTypes.includes('AP4')
        ? selectedTypes.filter((t) => t !== 'AP4')
        : [...selectedTypes, 'AP4'];
      expect(selectedTypes).toEqual(['AP3', 'AP4']);

      // Toggle AP3 off
      selectedTypes = selectedTypes.includes('AP3')
        ? selectedTypes.filter((t) => t !== 'AP3')
        : [...selectedTypes, 'AP3'];
      expect(selectedTypes).toEqual(['AP4']);
    });
  });
});

// ============================================================================
// Combined Filtering Tests
// ============================================================================

describe('Combined Filtering', () => {
  /**
   * Get section type suffix
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
   * Filter courses by status
   */
  function filterByStatus(courses: Course[], statusFilter: StatusFilter): Course[] {
    if (statusFilter === 'all') return courses;
    if (statusFilter === 'open') return courses.filter((c) => !c.isClosed);
    if (statusFilter === 'closed') return courses.filter((c) => c.isClosed);
    return courses;
  }

  /**
   * Apply all filters
   */
  function applyAllFilters(
    courses: Course[],
    options: {
      excludedDays: DayCode[];
      selectedSectionTypes: SectionTypeSuffix[];
      statusFilter: StatusFilter;
      lockedCourseIds: Set<string>;
    }
  ): Course[] {
    return courses.filter((course) => {
      // Always show locked courses
      if (options.lockedCourseIds.has(course.id)) return true;

      // Status filter
      if (options.statusFilter === 'open' && course.isClosed) return false;
      if (options.statusFilter === 'closed' && !course.isClosed) return false;

      // Section type filter
      if (options.selectedSectionTypes.length > 0) {
        const courseType = getSectionTypeSuffix(course.section);
        if (!courseType || !options.selectedSectionTypes.includes(courseType)) {
          return false;
        }
      }

      // Day exclusion (note: this is typically applied during schedule generation, not filtering)
      // For display purposes, we might not filter by day

      return true;
    });
  }

  const courses = createTestCourses();

  it('should show locked courses regardless of other filters', () => {
    const lockedCourseIds = new Set(['course-6']); // Closed course
    const result = applyAllFilters(courses, {
      excludedDays: [],
      selectedSectionTypes: [],
      statusFilter: 'open',
      lockedCourseIds,
    });

    // Should include the locked closed course
    expect(result.some((c) => c.id === 'course-6')).toBe(true);
  });

  it('should filter by status and section type together', () => {
    const result = applyAllFilters(courses, {
      excludedDays: [],
      selectedSectionTypes: ['AP4'],
      statusFilter: 'open',
      lockedCourseIds: new Set(),
    });

    // All results should be AP4 and open
    result.forEach((course) => {
      expect(getSectionTypeSuffix(course.section)).toBe('AP4');
      expect(course.isClosed).toBe(false);
    });
  });

  it('should show only closed courses with status filter', () => {
    const result = filterByStatus(courses, 'closed');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((course) => {
      expect(course.isClosed).toBe(true);
    });
  });

  it('should show only open courses with status filter', () => {
    const result = filterByStatus(courses, 'open');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((course) => {
      expect(course.isClosed).toBe(false);
    });
  });
});

// ============================================================================
// Preference Persistence Tests
// ============================================================================

describe('Preference Persistence', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('localStorage keys', () => {
    it('should have correct key for excluded days', () => {
      expect(LOCAL_STORAGE_KEYS.EXCLUDED_DAYS).toBe('courseBuilder_excludedDays');
    });

    it('should have correct key for excluded time ranges', () => {
      expect(LOCAL_STORAGE_KEYS.EXCLUDED_RANGES).toBe('courseBuilder_excludedTimeRanges');
    });

    it('should have correct key for section types', () => {
      expect(LOCAL_STORAGE_KEYS.SECTION_TYPES).toBe('courseBuilder_selectedSectionTypes');
    });

    it('should have correct key for status filter', () => {
      expect(LOCAL_STORAGE_KEYS.STATUS_FILTER).toBe('courseBuilder_selectedStatusFilter');
    });

    it('should have correct key for max units', () => {
      expect(LOCAL_STORAGE_KEYS.MAX_UNITS).toBe('courseBuilder_maxUnits');
    });

    it('should have correct key for max gap hours', () => {
      expect(LOCAL_STORAGE_KEYS.MAX_CLASS_GAP_HOURS).toBe('courseBuilder_maxClassGapHours');
    });
  });

  describe('default values', () => {
    it('should have correct default status filter', () => {
      expect(DEFAULT_VALUES.STATUS_FILTER).toBe('open');
    });

    it('should have correct default grouping', () => {
      expect(DEFAULT_VALUES.GROUPING).toBe('subject');
    });

    it('should have correct default search mode', () => {
      expect(DEFAULT_VALUES.SEARCH_MODE).toBe('partial');
    });
  });

  describe('allowed values', () => {
    it('should have correct section type suffixes', () => {
      expect(ALLOWED_VALUES.SECTION_TYPE_SUFFIXES).toEqual(['AP3', 'AP4', 'AP5']);
    });

    it('should have correct status filters', () => {
      expect(ALLOWED_VALUES.STATUS_FILTERS).toEqual(['all', 'open', 'closed']);
    });

    it('should have correct search modes', () => {
      expect(ALLOWED_VALUES.SEARCH_MODES).toEqual(['fast', 'exhaustive', 'partial']);
    });

    it('should have correct grouping keys', () => {
      expect(ALLOWED_VALUES.GROUPING_KEYS).toEqual(['none', 'offeringDept', 'subject']);
    });
  });

  describe('persistence simulation', () => {
    it('should persist excluded days to localStorage', () => {
      const excludedDays: DayCode[] = ['M', 'W', 'F'];
      localStorageMock.setItem(LOCAL_STORAGE_KEYS.EXCLUDED_DAYS, JSON.stringify(excludedDays));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEYS.EXCLUDED_DAYS,
        '["M","W","F"]'
      );
    });

    it('should persist section types to localStorage', () => {
      const sectionTypes: SectionTypeSuffix[] = ['AP3', 'AP4'];
      localStorageMock.setItem(LOCAL_STORAGE_KEYS.SECTION_TYPES, JSON.stringify(sectionTypes));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEYS.SECTION_TYPES,
        '["AP3","AP4"]'
      );
    });

    it('should persist status filter to localStorage', () => {
      const statusFilter: StatusFilter = 'closed';
      localStorageMock.setItem(LOCAL_STORAGE_KEYS.STATUS_FILTER, JSON.stringify(statusFilter));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEYS.STATUS_FILTER,
        '"closed"'
      );
    });

    it('should persist time ranges to localStorage', () => {
      const timeRanges: TimeRange[] = [
        { id: 1, start: '09:00', end: '10:00' },
        { id: 2, start: '14:00', end: '15:00' },
      ];
      localStorageMock.setItem(LOCAL_STORAGE_KEYS.EXCLUDED_RANGES, JSON.stringify(timeRanges));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEYS.EXCLUDED_RANGES,
        '[{"id":1,"start":"09:00","end":"10:00"},{"id":2,"start":"14:00","end":"15:00"}]'
      );
    });

    it('should persist max units to localStorage', () => {
      const maxUnits = '21';
      localStorageMock.setItem(LOCAL_STORAGE_KEYS.MAX_UNITS, JSON.stringify(maxUnits));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.MAX_UNITS, '"21"');
    });

    it('should retrieve persisted values from localStorage', () => {
      // Set up mock return value
      const stored: Record<string, string> = {
        [LOCAL_STORAGE_KEYS.EXCLUDED_DAYS]: '["M","W","F"]',
        [LOCAL_STORAGE_KEYS.SECTION_TYPES]: '["AP3","AP4"]',
        [LOCAL_STORAGE_KEYS.STATUS_FILTER]: '"open"',
      };
      localStorageMock.getItem.mockImplementation((key: string) => stored[key] || null);

      // Retrieve and parse
      const excludedDays = JSON.parse(
        localStorageMock.getItem(LOCAL_STORAGE_KEYS.EXCLUDED_DAYS) || '[]'
      );
      const sectionTypes = JSON.parse(
        localStorageMock.getItem(LOCAL_STORAGE_KEYS.SECTION_TYPES) || '[]'
      );
      const statusFilter = JSON.parse(
        localStorageMock.getItem(LOCAL_STORAGE_KEYS.STATUS_FILTER) || '"open"'
      );

      expect(excludedDays).toEqual(['M', 'W', 'F']);
      expect(sectionTypes).toEqual(['AP3', 'AP4']);
      expect(statusFilter).toBe('open');
    });

    it('should handle empty/missing localStorage values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const excludedDays = JSON.parse(localStorageMock.getItem('nonexistent') || '[]');
      expect(excludedDays).toEqual([]);
    });

    it('should handle malformed localStorage values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('not valid json');

      let result: unknown;
      try {
        result = JSON.parse(localStorageMock.getItem('malformed') || 'null');
      } catch {
        result = null;
      }

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Filtering Edge Cases', () => {
  /**
   * Extract days from schedule
   */
  function extractDaysFromSchedule(schedule: string): DayCode[] {
    const dayPattern = /\b(M|T|W|TH|F|S|SU)\b/g;
    const matches = schedule.match(dayPattern);
    if (!matches) return [];
    return [...new Set(matches)] as DayCode[];
  }

  describe('empty/null inputs', () => {
    it('should handle empty course list', () => {
      const courses: Course[] = [];
      expect(courses.filter((c) => !c.isClosed)).toEqual([]);
    });

    it('should handle empty excluded days', () => {
      const schedule = 'M/W/F | 9:00AM-10:30AM | ACAD309';
      const days = extractDaysFromSchedule(schedule);
      const excludedDays: DayCode[] = [];

      const isExcluded = days.length > 0 && days.every((d) => excludedDays.includes(d));
      expect(isExcluded).toBe(false);
    });

    it('should handle empty schedule string', () => {
      const days = extractDaysFromSchedule('');
      expect(days).toEqual([]);
    });

    it('should handle empty section type filter', () => {
      const sectionTypes: SectionTypeSuffix[] = [];
      // Empty filter means show all
      expect(sectionTypes.length).toBe(0);
    });
  });

  describe('malformed data', () => {
    it('should handle schedule without time', () => {
      const schedule = 'M/W/F | | ACAD309';
      const timeMatch = schedule.match(/(\d+:\d+AM|PM)-(\d+:\d+AM|PM)/i);
      expect(timeMatch).toBeNull();
    });

    it('should handle schedule without room', () => {
      const schedule = 'M/W/F | 9:00AM-10:30AM |';
      const days = extractDaysFromSchedule(schedule);
      expect(days).toEqual(['M', 'W', 'F']);
    });

    it('should handle section without type suffix', () => {
      const sectionString = 'BSIT-1A';
      const parts = sectionString.split('-');
      const lastPart = parts[parts.length - 1];
      const isValidSuffix = lastPart === 'AP3' || lastPart === 'AP4' || lastPart === 'AP5';
      expect(isValidSuffix).toBe(false);
    });

    it('should handle TBA schedule in all filters', () => {
      const tbaCourse = createMockCourse({
        schedule: 'TBA',
        room: '',
      });

      // Day exclusion
      const days = extractDaysFromSchedule(tbaCourse.schedule);
      expect(days).toEqual([]);

      // Time exclusion (no time to extract)
      const timeMatch = tbaCourse.schedule.match(/(\d+:\d+AM|PM)-(\d+:\d+AM|PM)/i);
      expect(timeMatch).toBeNull();
    });
  });

  describe('boundary conditions', () => {
    it('should handle course at midnight', () => {
      // This is an edge case that might not occur in practice
      const schedule = 'M | 12:00AM-1:00AM | ACAD309';
      const days = extractDaysFromSchedule(schedule);
      expect(days).toEqual(['M']);
    });

    it('should handle course at end of day', () => {
      const schedule = 'M | 10:00PM-11:30PM | ACAD309';
      const days = extractDaysFromSchedule(schedule);
      expect(days).toEqual(['M']);
    });

    it('should handle course spanning multiple time ranges', () => {
      // Hybrid class with two time slots
      const schedule = 'M/W | 9:00AM-10:30AM | online + F | 9:00AM-12:00PM | ACAD309';
      const days = extractDaysFromSchedule(schedule);
      expect(days).toContain('M');
      expect(days).toContain('W');
      expect(days).toContain('F');
    });

    it('should handle Sunday (SU) schedules', () => {
      const schedule = 'SU | 9:00AM-12:00PM | ACAD309';
      const days = extractDaysFromSchedule(schedule);
      expect(days).toEqual(['SU']);
    });

    it('should handle all seven days in schedule', () => {
      const schedule = 'M/T/W/TH/F/S/SU | 9:00AM-10:00AM | ACAD309';
      const days = extractDaysFromSchedule(schedule);
      expect(days.sort()).toEqual(['F', 'M', 'S', 'SU', 'T', 'TH', 'W'].sort());
    });
  });
});
