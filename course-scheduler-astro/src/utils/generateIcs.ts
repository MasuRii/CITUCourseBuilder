import { parseSchedule } from './parseSchedule';
import type { Course, DayCode } from '@/types/index';

/**
 * Converts a local date and HH:mm time string to an iCalendar DATETIME string (YYYYMMDDTHHMMSS).
 *
 * @param dateObj - The date object.
 * @param timeStr - Time string in "HH:MM" 24-hour format.
 * @returns iCalendar DATETIME string.
 */
function formatToICalDateTime(dateObj: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}T${hours!.padStart(2, '0')}${minutes!.padStart(2, '0')}00`;
}

/**
 * Gets the date of the Monday of the current week.
 *
 * @returns Date object for the Monday of the current week.
 */
function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(today.setDate(diff));
}

/**
 * Maps local day codes to iCalendar BYDAY values.
 *
 * @param localDays - Array of local day codes (e.g., ['M', 'TH', 'F']).
 * @returns Comma-separated iCalendar BYDAY string (e.g., "MO,TH,FR").
 */
function mapDaysToICalByDay(localDays: readonly DayCode[]): string {
  const map: Record<DayCode, string> = {
    M: 'MO',
    T: 'TU',
    W: 'WE',
    TH: 'TH',
    F: 'FR',
    S: 'SA',
    SU: 'SU',
  };
  return localDays
    .map((day) => map[day])
    .filter(Boolean)
    .join(',');
}

/**
 * Generates iCalendar (.ics) content from a list of locked courses.
 *
 * @param lockedCourses - Array of locked course objects.
 * @returns The iCalendar content as a string.
 */
export function generateIcsContent(lockedCourses: readonly Course[]): string {
  const calName = 'CITU Timetable Export';
  const prodId = '-//CITU Course Builder//NONSGML Timetable//EN';
  let icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calName}
`;
  const mondayOfThisWeek = getMondayOfCurrentWeek();
  const semesterEndDate = new Date(mondayOfThisWeek);
  semesterEndDate.setDate(semesterEndDate.getDate() + 16 * 7);
  const dtStamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  lockedCourses.forEach((course) => {
    const scheduleResult = parseSchedule(course.schedule);
    if (!scheduleResult || scheduleResult.isTBA || !scheduleResult.allTimeSlots) {
      return;
    }

    scheduleResult.allTimeSlots.forEach((slot, index) => {
      if (!slot.startTime || !slot.endTime || slot.days.length === 0) {
        return;
      }

      const byDayRule = mapDaysToICalByDay(slot.days);
      if (!byDayRule) return;

      const firstDayCode = slot.days[0];
      const dayOffsetMap: Record<DayCode, number> = {
        M: 0,
        T: 1,
        W: 2,
        TH: 3,
        F: 4,
        S: 5,
        SU: 6,
      };
      const firstEventDate = new Date(mondayOfThisWeek);
      firstEventDate.setDate(mondayOfThisWeek.getDate() + dayOffsetMap[firstDayCode]);

      const uid = `${course.id}-${course.section}-${index}-${slot.startTime.replace(':', '')}-${slot.days.join('')}@citucoursebuilder.com`;
      const summary = `${course.subject} - ${course.subjectTitle || course.section}`;
      const location = slot.room || course.room || 'N/A';
      const dtStart = formatToICalDateTime(firstEventDate, slot.startTime);
      const dtEnd = formatToICalDateTime(firstEventDate, slot.endTime);
      const rrule = `FREQ=WEEKLY;BYDAY=${byDayRule};COUNT=16`;

      let description = `Section: ${course.section}\n`;
      description += `Title: ${course.subjectTitle || 'N/A'}\n`;
      description += `Units: ${course.creditedUnits || course.units || 'N/A'}\n`;
      description += `Offering Dept: ${course.offeringDept || 'N/A'}\n`;
      description += `Raw Schedule: ${
        course.schedule ? course.schedule.split('\n').join(' ') : 'N/A'
      }\n`;
      description += `Status: ${course.isClosed ? 'Closed' : 'Open'}\n`;
      description += `Slots: ${course.enrolled || '-'}/${course.totalSlots || '-'}`;

      icsString += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${summary.replace(/,/g, '\\,')}
LOCATION:${location.replace(/,/g, '\\,')}
DESCRIPTION:${description.replace(/,/g, '\\,')}
RRULE:${rrule}
END:VEVENT
`;
    });
  });

  icsString += 'END:VCALENDAR';
  return icsString;
}
