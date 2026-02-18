import { describe, it, expect } from 'vitest';
import { parseSchedule } from '@/utils/parseSchedule';
import { parseRawCourseData } from '@/utils/parseRawData';
import { generateIcsContent } from '@/utils/generateIcs';
import { convertCoursesToRawData } from '@/utils/convertToRawData';
import {
  checkTimeOverlap,
  exceedsMaxUnits,
  exceedsMaxGap,
  generateBestPartialSchedule,
} from '@/utils/scheduleAlgorithms';
import type { Course } from '@/types/index';

const mockCourse: Course = {
  id: '1',
  subject: 'SUBJ1',
  subjectTitle: 'Title 1',
  section: 'SEC1',
  schedule: 'M | 09:00AM-10:00AM | ROOM1',
  room: 'ROOM1',
  units: '3',
  creditedUnits: '3',
  offeringDept: 'DEPT',
  totalSlots: 40,
  enrolled: 20,
  assessed: 0,
  availableSlots: 20,
  isClosed: false,
  isLocked: false,
};

describe('Utility Edge Cases - Coverage T5.1.1', () => {
  describe('parseSchedule Edge Cases', () => {
    it('should handle invalid time format in convertAmPmTo24Hour (lines 27-30)', () => {
      const result = parseSchedule('M | 9:00-10:00AM | ROOM');
      expect(result).toBeNull();
    });

    it('should handle comma separated time ranges (lines 90-95)', () => {
      const result = parseSchedule('M | 09:00AM-10:00AM, 10:00AM-11:00AM | ROOM');
      expect(result).not.toBeNull();
      expect(result?.allTimeSlots[0].startTime).toBe('09:00');
    });

    it('should handle invalid time in range (lines 104-105)', () => {
      const result = parseSchedule('M | INVALID-10:00AM | ROOM');
      expect(result).toBeNull();
    });

    it('should handle empty cleaned schedule part (line 174)', () => {
      const result = parseSchedule(' | | ');
      expect(result).toBeNull();
    });

    it('should handle more times than days (lines 315-327)', () => {
      const result = parseSchedule('M | 09:00AM-10:00AM/10:00AM-11:00AM | ROOM');
      expect(result?.allTimeSlots).toHaveLength(2);
      expect(result?.allTimeSlots[0].days).toEqual(['M']);
      expect(result?.allTimeSlots[1].days).toEqual(['M']);
    });

    it('should handle multiple day groups, single time (lines 347-358)', () => {
      const result = parseSchedule('M/W | 09:00AM-10:00AM | ROOM');
      expect(result?.allTimeSlots).toHaveLength(2);
      expect(result?.allTimeSlots[0].days).toEqual(['M']);
      expect(result?.allTimeSlots[1].days).toEqual(['W']);
    });

    it('should handle ambiguous day/time pairing (lines 362-383)', () => {
      // Trigger else branch by having 0 time segments
      const result = parseSchedule('M | | ROOM');
      expect(result).toBeNull(); // resultingTimeSlots.length === 0, returns null
    });

    it('should handle no valid time slots found (lines 439-443)', () => {
      const result = parseSchedule('INVALID_FORMAT');
      expect(result).toBeNull();
    });

    it('should handle null/undefined/non-string input', () => {
      expect(parseSchedule(null as unknown as string)).toBeNull();
      expect(parseSchedule(undefined as unknown as string)).toBeNull();
      expect(parseSchedule(123 as unknown as string)).toBeNull();
    });
  });

  describe('parseRawData Edge Cases', () => {
    it('should handle empty/null input', () => {
      expect(parseRawCourseData(null as unknown as string)).toEqual([]);
      expect(parseRawCourseData('')).toEqual([]);
    });

    it('should handle HTML where header regex fails but rows exist (lines 165-167)', () => {
      const html = `
        <table>
          <tr>
            <td>BSIT-1A</td>
            <td>IT 111</td>
            <td>09:00AM-10:30AM</td>
            <td>TTH</td>
            <td>ROOM1</td>
            <td>LEC</td>
            <td>20/40</td>
            <td>F2F</td>
            <td>Open</td>
          </tr>
        </table>
      `;
      const result = parseRawCourseData(html);
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('IT 111');
    });

    it('should handle tab-separated parsing with 6 columns on second line and missing status (line 327)', () => {
      const line1 = 'ID\tDept\tSubj\tTitle\t3\tSec\tSched';
      const line2 = 'Sched2\tRoom\t40\t20\t20\t'; // 6th column is empty
      const input = `${line1}\n${line2}`;
      const result = parseRawCourseData(input);
      expect(result).toHaveLength(1);
      expect(result[0].isClosed).toBe(false); // Should default to 'No' -> false
    });

    it('should handle tab-separated parsing errors/skips (lines 327, 337, 343)', () => {
      const input = 'ID\tDept\tSubj\tTitle\t3\tSec\tSched';
      const result = parseRawCourseData(input);
      expect(result).toEqual([]);
    });
  });

  describe('scheduleAlgorithms Edge Cases', () => {
    it('should handle invalid time formats in checkTimeOverlap', () => {
      expect(checkTimeOverlap('invalid', '10:00', '09:00', '11:00')).toBe(false);
    });

    it('should handle empty maxUnits/maxGapHours', () => {
      expect(exceedsMaxUnits([mockCourse], '')).toBe(false);
      expect(exceedsMaxGap([mockCourse], '')).toBe(false);
    });

    it('should handle courses with invalid units', () => {
      const badCourse = { ...mockCourse, creditedUnits: 'invalid', units: 'invalid' };
      expect(exceedsMaxUnits([badCourse], '10')).toBe(false);
    });

    it('should handle minimizeDaysOnCampus in generateBestPartialSchedule (lines 615-631)', () => {
      const courses = [mockCourse];
      const result = generateBestPartialSchedule(courses, '', '', ['morning'], true);
      expect(result).toHaveLength(1);
    });

    it('should handle minimizeDaysOnCampus in generateBestPartialSchedule_Heuristic (lines 530-545)', () => {
      const courses: Course[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockCourse,
        id: `${i}`,
        subject: `SUBJ${i}`,
        schedule: `M | ${String((7 + i) % 12 || 12).padStart(2, '0')}:00${i < 5 ? 'AM' : 'PM'}-${String((7 + i) % 12 || 12).padStart(2, '0')}:30${i < 5 ? 'AM' : 'PM'} | ROOM`,
      }));
      const result = generateBestPartialSchedule(courses, '', '', ['morning'], true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateIcs Edge Cases', () => {
    it('should handle missing startTime/endTime in generateIcs (line 82)', () => {
      const courses: Course[] = [
        {
          ...mockCourse,
          schedule: 'TBA',
        },
      ];
      const result = generateIcsContent(courses);
      expect(result).toContain('VCALENDAR');
      expect(result).not.toContain('VEVENT');
    });
  });

  describe('convertToRawData Edge Cases', () => {
    it('should handle empty units (lines 56-58)', () => {
      const courses: Course[] = [
        {
          ...mockCourse,
          creditedUnits: undefined,
          units: '',
        },
      ];
      const result = convertCoursesToRawData(courses);
      expect(result).toContain('0');
    });
  });
});
