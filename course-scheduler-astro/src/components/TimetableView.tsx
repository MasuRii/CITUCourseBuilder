import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateIcsContent } from '@/utils/generateIcs';
import { parseSchedule } from '@/utils/parseSchedule';
import type { Course, DayCode } from '@/types/index';

/**
 * Time slots for the timetable grid (30-minute intervals from 7:00 AM to 10:00 PM)
 */
const TIME_SLOTS: readonly string[] = [
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
] as const;

/**
 * Day codes for the timetable columns
 */
const DAYS: readonly DayCode[] = ['M', 'T', 'W', 'TH', 'F', 'S', 'SU'] as const;

/**
 * Full day names for accessibility labels
 */
const DAY_NAMES: readonly string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/**
 * Converts a 24-hour format time string to 12-hour format with AM/PM
 *
 * @param timeStr - Time string in "HH:MM" 24-hour format
 * @returns Time in 12-hour format (e.g., "1:30 PM")
 */
function formatTo12Hour(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Course data extended with slot-specific information for timetable rendering
 */
interface CourseInSlot extends Course {
  slotStartTime: string;
  slotEndTime: string;
  isStartOfCourseSlot: boolean;
  slotRoom: string;
}

/**
 * Props for the TimetableView component
 */
export interface TimetableViewProps {
  /** Array of locked course objects to display in the timetable */
  readonly lockedCourses: readonly Course[];
  /** Set of course IDs that have schedule conflicts */
  readonly conflictingLockedCourseIds?: ReadonlySet<string>;
  /** Callback to show a toast message */
  readonly onToast?: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

/**
 * Dropdown menu component for export options
 */
interface DropdownMenuProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onExportPng: () => void;
  readonly onExportPdf: () => void;
  readonly onExportIcs: () => void;
}

function DropdownMenu({
  isOpen,
  onClose,
  onExportPng,
  onExportPdf,
  onExportIcs,
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClickOutside, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-border-primary bg-surface-secondary py-1 shadow-lg"
      role="menu"
      aria-orientation="vertical"
    >
      <button
        onClick={() => {
          onExportPng();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-content-primary hover:bg-surface-tertiary"
        role="menuitem"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Export as PNG
      </button>
      <button
        onClick={() => {
          onExportPdf();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-content-primary hover:bg-surface-tertiary"
        role="menuitem"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Export as PDF
      </button>
      <button
        onClick={() => {
          onExportIcs();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-content-primary hover:bg-surface-tertiary"
        role="menuitem"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Export as .ics
      </button>
    </div>
  );
}

/**
 * Component to display a visual timetable for locked courses
 *
 * Renders a weekly timetable grid showing all locked courses by day and time.
 * Supports export to PNG, PDF, and iCalendar (.ics) formats.
 *
 * @param props - Component props
 * @param props.lockedCourses - Array of locked course objects
 * @param props.conflictingLockedCourseIds - Set of conflicting locked course IDs
 * @param props.onToast - Callback for toast notifications
 */
export default function TimetableView({
  lockedCourses,
  conflictingLockedCourseIds = new Set(),
  onToast,
}: TimetableViewProps): React.ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const timetableRef = useRef<HTMLTableElement>(null);

  /**
   * Handle export as PNG image
   */
  const handleExportAsPng = async (): Promise<void> => {
    if (!timetableRef.current) {
      onToast?.('Could not find timetable element to export', 'error');
      return;
    }
    onToast?.('Exporting timetable as PNG...', 'info');

    const options = {
      cacheBust: true,
      quality: 1,
      skipFonts: true,
      fontEmbedCSS: '',
      filter: (node: Node): boolean => {
        return node.nodeName !== 'SCRIPT';
      },
    };

    try {
      const dataUrl = await toPng(timetableRef.current, options);
      const link = document.createElement('a');
      link.download = 'timetable_export.png';
      link.href = dataUrl;
      link.click();
      onToast?.('Timetable exported as PNG successfully!', 'success');
    } catch (error) {
      console.error('Error exporting timetable as PNG:', error);
      onToast?.('Failed to export timetable as PNG. Please try again.', 'error');
    }
  };

  /**
   * Handle export as PDF document
   */
  const handleExportAsPdf = async (): Promise<void> => {
    if (!timetableRef.current) {
      onToast?.('Could not find timetable element to export', 'error');
      return;
    }
    onToast?.('Exporting timetable as PDF...', 'info');

    try {
      const options = {
        cacheBust: true,
        quality: 1,
        skipFonts: true,
        fontEmbedCSS: '',
        filter: (node: Node): boolean => {
          return node.nodeName !== 'SCRIPT';
        },
      };

      const dataUrl = await toPng(timetableRef.current, options);
      const img = new Image();
      img.src = dataUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width + 40, img.height + 60],
      });

      pdf.setFontSize(16);
      pdf.text('CITU Course Schedule', 20, 30);

      const now = new Date();
      pdf.setFontSize(10);
      pdf.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 20, 45);

      pdf.addImage(dataUrl, 'PNG', 20, 60, img.width, img.height);
      pdf.save('timetable_export.pdf');

      onToast?.('Timetable exported as PDF successfully!', 'success');
    } catch (error) {
      console.error('Error exporting timetable as PDF:', error);
      onToast?.('Failed to export timetable as PDF. Please try again.', 'error');
    }
  };

  /**
   * Handle export as iCalendar (.ics) file
   */
  const handleExportAsIcs = (): void => {
    if (!lockedCourses || lockedCourses.length === 0) {
      onToast?.('No locked courses to export.', 'warning');
      return;
    }
    onToast?.('Generating .ics file...', 'info');

    try {
      const icsContent = generateIcsContent(lockedCourses);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'timetable.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast?.('Timetable exported as .ics successfully!', 'success');
    } catch (error) {
      console.error('Error generating .ics file:', error);
      onToast?.('Failed to export timetable as .ics. Please try again.', 'error');
    }
  };

  // Show empty state if no locked courses
  if (!lockedCourses || lockedCourses.length === 0) {
    return (
      <div className="rounded-lg bg-surface-secondary p-8 text-center shadow-md">
        <p className="text-content-secondary">No locked courses to display in timetable.</p>
      </div>
    );
  }

  // Calculate summary statistics
  const totalUnits = lockedCourses.reduce((sum, course) => {
    const units = parseFloat(course.creditedUnits || course.units);
    return isNaN(units) ? sum : sum + units;
  }, 0);
  const uniqueSubjects = new Set(lockedCourses.map((course) => course.subject)).size;

  // Build courses by time and day mapping
  const coursesByTimeAndDay: Record<string, Record<string, CourseInSlot[]>> = {};

  lockedCourses.forEach((course) => {
    const scheduleResult = parseSchedule(course.schedule);
    if (
      !scheduleResult ||
      scheduleResult.isTBA ||
      !scheduleResult.allTimeSlots ||
      scheduleResult.allTimeSlots.length === 0
    ) {
      return;
    }

    scheduleResult.allTimeSlots.forEach((slot) => {
      const { days, startTime, endTime, room } = slot;
      if (!startTime || !endTime) return;

      days.forEach((day) => {
        let isFirstOverlappingSlotFound = false;

        for (let i = 0; i < TIME_SLOTS.length; i++) {
          const timeGridSlot = TIME_SLOTS[i];
          const nextTimeGridSlot = TIME_SLOTS[i + 1] || '23:59';

          // A grid slot overlaps if: max(slotStart, gridStart) < min(slotEnd, gridEnd)
          const overlapStart = startTime > timeGridSlot ? startTime : timeGridSlot;
          const overlapEnd = endTime < nextTimeGridSlot ? endTime : nextTimeGridSlot;

          if (overlapStart < overlapEnd) {
            if (!coursesByTimeAndDay[timeGridSlot]) {
              coursesByTimeAndDay[timeGridSlot] = {};
            }
            if (!coursesByTimeAndDay[timeGridSlot][day]) {
              coursesByTimeAndDay[timeGridSlot][day] = [];
            }

            const isStartOfCourseSlot = !isFirstOverlappingSlotFound;
            isFirstOverlappingSlotFound = true;

            const courseAlreadyInCellForThisSlot = coursesByTimeAndDay[timeGridSlot][day].find(
              (c) =>
                c.id === course.id && c.slotStartTime === startTime && c.slotEndTime === endTime
            );
            if (!courseAlreadyInCellForThisSlot) {
              coursesByTimeAndDay[timeGridSlot][day].push({
                ...course,
                slotStartTime: startTime,
                slotEndTime: endTime,
                isStartOfCourseSlot: isStartOfCourseSlot,
                slotRoom: room || course.room,
              });
            }
          }
        }
      });
    });
  });

  /**
   * Render a course cell in the timetable
   */
  const renderCourseCell = (coursesInGridCell: CourseInSlot[] | undefined): React.ReactNode => {
    if (!coursesInGridCell || coursesInGridCell.length === 0) return null;

    const startCourses = coursesInGridCell.filter((c) => c.isStartOfCourseSlot);
    if (startCourses.length === 0) {
      return <div className="h-full bg-accent opacity-70"></div>;
    }

    return startCourses.map((course, index) => {
      const isConflicting = conflictingLockedCourseIds.has(course.id);
      return (
        <div
          key={`${course.id}-${course.slotStartTime}-${index}`}
          className={`h-full overflow-hidden rounded p-1 text-xs text-white transition-all ${
            isConflicting
              ? 'border-l-4 border-l-[#a5283a] bg-[#a5283a22]'
              : 'bg-accent hover:bg-accent-hover'
          }`}
          tabIndex={0}
          aria-label={`Locked course: ${course.subject} section ${course.section} in room ${course.slotRoom}, from ${course.slotStartTime} to ${course.slotEndTime}${isConflicting ? ' (conflict)' : ''}`}
        >
          <div className="font-semibold whitespace-nowrap">{course.subject}</div>
          <div className="text-[0.65rem] opacity-90">{course.section}</div>
          <div className="text-[0.65rem] opacity-80">{course.slotRoom}</div>
          {isConflicting && (
            <span
              title="Schedule conflict with another locked course"
              aria-label="Schedule conflict"
              className="ml-1 text-sm align-middle"
              style={{ color: '#a5283a' }}
            >
              ⚠️
            </span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="mt-6 w-full overflow-x-auto">
      {/* Header with title and export menu */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-content-primary">Weekly Timetable</h3>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center rounded-lg p-2 text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content-primary"
            aria-label="Export timetable options"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <DropdownMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onExportPng={handleExportAsPng}
            onExportPdf={handleExportAsPdf}
            onExportIcs={handleExportAsIcs}
          />
        </div>
      </div>

      {/* Timetable grid */}
      <table
        className="w-full border-collapse overflow-hidden rounded-lg bg-surface-secondary shadow-md"
        style={{ tableLayout: 'fixed' }}
        role="table"
        aria-label="Weekly timetable of locked courses"
        ref={timetableRef}
      >
        <caption className="sr-only">
          Weekly timetable showing locked courses by day and time slot.
        </caption>
        <thead>
          <tr role="row">
            <th
              className="sticky left-0 z-[3] w-[70px] border border-border-primary bg-accent-light p-1 text-center font-bold text-content-primary"
              role="columnheader"
              aria-label="Time"
              scope="col"
            >
              Time
            </th>
            {DAYS.map((day, index) => (
              <th
                key={day}
                className="sticky top-0 z-[2] min-w-[110px] border border-border-primary bg-accent-light p-1 text-center font-bold text-content-primary"
                role="columnheader"
                aria-label={DAY_NAMES[index]}
                scope="col"
              >
                <div className="text-sm font-bold">{day}</div>
                <div className="text-[0.65rem] opacity-80">{DAY_NAMES[index]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((timeSlot) => (
            <tr key={timeSlot} className="time-row" role="row">
              <td
                className="sticky left-0 z-[1] border border-border-primary bg-accent-light/50 p-1 text-center font-semibold text-content-primary text-xs whitespace-nowrap"
                role="rowheader"
                aria-label={formatTo12Hour(timeSlot)}
                scope="row"
              >
                {formatTo12Hour(timeSlot)}
              </td>
              {DAYS.map((day) => (
                <td
                  key={`${day}-${timeSlot}`}
                  className="h-[50px] border border-border-primary p-0.5 align-top"
                  role="cell"
                  tabIndex={0}
                  aria-label={`Courses on ${DAY_NAMES[DAYS.indexOf(day)]} at ${formatTo12Hour(timeSlot)}`}
                >
                  {coursesByTimeAndDay[timeSlot]?.[day]
                    ? renderCourseCell(coursesByTimeAndDay[timeSlot][day])
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary section */}
      <div className="mt-4 rounded-lg bg-surface-secondary p-3 shadow-md">
        <div className="flex flex-wrap justify-between gap-4 text-sm text-content-primary">
          <span>
            <strong>Total Units:</strong> {totalUnits}
          </span>
          <span>
            <strong>Subjects:</strong> {uniqueSubjects}
          </span>
          <span>
            <strong>Courses:</strong> {lockedCourses.length}
          </span>
        </div>
      </div>
    </div>
  );
}
