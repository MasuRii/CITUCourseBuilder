/**
 * Converts an array of course objects back to the original tab-separated raw format
 *
 * @param courses - Array of course objects to convert
 * @returns Tab-separated string matching the original import format, or empty string if no courses
 *
 * @example
 * const courses: Course[] = [
 *   {
 *     id: '1708123456789-0',
 *     subject: 'IT 111',
 *     subjectTitle: 'Introduction to Computing',
 *     section: 'BSIT-1A-AP3',
 *     schedule: 'TTH | 9:00AM-10:30AM | Room#online',
 *     room: 'online',
 *     units: '3',
 *     isLocked: false,
 *     isClosed: false,
 *     enrolled: 25,
 *     assessed: 25,
 *     totalSlots: 40,
 *     availableSlots: 15,
 *     offeringDept: 'DCIT'
 *   }
 * ];
 * const rawData = convertCoursesToRawData(courses);
 * // Returns: "1708123456789-0\tDCIT\tIT 111\tIntroduction to Computing\t3\tBSIT-1A-AP3\tTTH | 9:00AM-10:30AM | Room#online\tonline\t40\t25\t25\tno"
 *
 * @task T3.1.4 - Migrate convertToRawData.js to TypeScript
 */

import type { Course } from '@/types/index';

/**
 * Converts an array of course objects back to the original tab-separated raw format
 *
 * @param courses - Array of course objects to convert
 * @returns Tab-separated string matching the original import format, or empty string if no courses
 */
export const convertCoursesToRawData = (courses: readonly Course[]): string => {
  if (!Array.isArray(courses) || courses.length === 0) {
    return '';
  }

  return courses
    .map((course) => {
      const fields = [
        course.id || '',
        course.offeringDept || '',
        course.subject || '',
        course.subjectTitle || '',
        course.creditedUnits?.toString() || '0',
        course.section || '',
        course.schedule || '',
        course.room || '',
        course.totalSlots?.toString() || '0',
        course.enrolled?.toString() || '0',
        course.assessed?.toString() || '0',
        course.isClosed ? 'yes' : 'no',
      ];

      return fields.join('\t');
    })
    .join('\n');
};
