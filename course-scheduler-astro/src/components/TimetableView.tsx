import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  FileText,
  Calendar,
  Download,
  AlertTriangle,
  Calculator,
  BookOpen,
  Archive,
} from 'lucide-react';
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
 * Color palette for subject color coding (playful, vibrant colors)
 */
const SUBJECT_COLORS: readonly string[] = [
  'bg-violet-500', // Purple
  'bg-blue-500', // Blue
  'bg-emerald-500', // Green
  'bg-amber-500', // Amber
  'bg-rose-500', // Rose
  'bg-cyan-500', // Cyan
  'bg-orange-500', // Orange
  'bg-pink-500', // Pink
  'bg-teal-500', // Teal
  'bg-indigo-500', // Indigo
  'bg-lime-500', // Lime
  'bg-sky-500', // Sky
] as const;

/**
 * Lighter variants for course card backgrounds
 */
const SUBJECT_COLORS_LIGHT: readonly string[] = [
  'bg-violet-100 dark:bg-violet-900/40',
  'bg-blue-100 dark:bg-blue-900/40',
  'bg-emerald-100 dark:bg-emerald-900/40',
  'bg-amber-100 dark:bg-amber-900/40',
  'bg-rose-100 dark:bg-rose-900/40',
  'bg-cyan-100 dark:bg-cyan-900/40',
  'bg-orange-100 dark:bg-orange-900/40',
  'bg-pink-100 dark:bg-pink-900/40',
  'bg-teal-100 dark:bg-teal-900/40',
  'bg-indigo-100 dark:bg-indigo-900/40',
  'bg-lime-100 dark:bg-lime-900/40',
  'bg-sky-100 dark:bg-sky-900/40',
] as const;

/**
 * Border colors for course cards
 */
const SUBJECT_BORDER_COLORS: readonly string[] = [
  'border-violet-400 dark:border-violet-500',
  'border-blue-400 dark:border-blue-500',
  'border-emerald-400 dark:border-emerald-500',
  'border-amber-400 dark:border-amber-500',
  'border-rose-400 dark:border-rose-500',
  'border-cyan-400 dark:border-cyan-500',
  'border-orange-400 dark:border-orange-500',
  'border-pink-400 dark:border-pink-500',
  'border-teal-400 dark:border-teal-500',
  'border-indigo-400 dark:border-indigo-500',
  'border-lime-400 dark:border-lime-500',
  'border-sky-400 dark:border-sky-500',
] as const;

/**
 * Text colors for subject labels (darker variants for readability)
 */
const SUBJECT_TEXT_COLORS: readonly string[] = [
  'text-violet-700 dark:text-violet-200',
  'text-blue-700 dark:text-blue-200',
  'text-emerald-700 dark:text-emerald-200',
  'text-amber-700 dark:text-amber-200',
  'text-rose-700 dark:text-rose-200',
  'text-cyan-700 dark:text-cyan-200',
  'text-orange-700 dark:text-orange-200',
  'text-pink-700 dark:text-pink-200',
  'text-teal-700 dark:text-teal-200',
  'text-indigo-700 dark:text-indigo-200',
  'text-lime-700 dark:text-lime-200',
  'text-sky-700 dark:text-sky-200',
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
 * Generates a consistent color index for a subject using a simple hash function
 *
 * @param subject - Subject code (e.g., "CS 101")
 * @returns Index into the color palette arrays
 */
function getSubjectColorIndex(subject: string): number {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    const char = subject.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % SUBJECT_COLORS.length;
}

/**
 * Course data extended with slot-specific information for timetable rendering
 */
interface CourseInSlot extends Course {
  slotStartTime: string;
  slotEndTime: string;
  isStartOfCourseSlot: boolean;
  slotRoom: string;
  colorIndex: number;
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
 * Dropdown menu component for export options with animated icons
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
}: DropdownMenuProps): React.ReactNode {
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
      className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-border-primary bg-surface-secondary py-2 shadow-xl animate-slide-up"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-content-secondary">
        Export Options
      </div>
      <button
        onClick={() => {
          onExportPng();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-content-primary hover:bg-surface-tertiary transition-colors group"
        role="menuitem"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
          <Image className="h-4 w-4" />
        </span>
        <div>
          <div className="font-medium">Export as PNG</div>
          <div className="text-xs text-content-secondary">High-quality image</div>
        </div>
      </button>
      <button
        onClick={() => {
          onExportPdf();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-content-primary hover:bg-surface-tertiary transition-colors group"
        role="menuitem"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
          <FileText className="h-4 w-4" />
        </span>
        <div>
          <div className="font-medium">Export as PDF</div>
          <div className="text-xs text-content-secondary">Print-ready document</div>
        </div>
      </button>
      <button
        onClick={() => {
          onExportIcs();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-content-primary hover:bg-surface-tertiary transition-colors group"
        role="menuitem"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
          <Calendar className="h-4 w-4" />
        </span>
        <div>
          <div className="font-medium">Export as .ics</div>
          <div className="text-xs text-content-secondary">Calendar file</div>
        </div>
      </button>
    </div>
  );
}

/**
 * Tooltip component for course details on hover
 */
interface TooltipProps {
  readonly course: CourseInSlot;
  readonly children: React.ReactNode;
}

function Tooltip({ course, children }: TooltipProps): React.ReactNode {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg shadow-lg animate-fade-in pointer-events-none"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            minWidth: '180px',
          }}
        >
          <div className="font-semibold text-content-primary mb-1">{course.subject}</div>
          <div className="text-content-secondary">
            <div>Section: {course.section}</div>
            <div>Room: {course.slotRoom}</div>
            <div>
              Time: {course.slotStartTime} - {course.slotEndTime}
            </div>
            <div>Units: {course.units}</div>
          </div>
          {/* Tooltip arrow */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'var(--border-color)' }}
          />
        </div>
      )}
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
  const timetableRef = useRef<HTMLDivElement>(null);

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
      const img = document.createElement('img');
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

  // Calculate summary statistics
  const { totalUnits, uniqueSubjects, subjectColorMap } = useMemo(() => {
    const units = lockedCourses.reduce((sum, course) => {
      const courseUnits = parseFloat(course.creditedUnits || course.units);
      return isNaN(courseUnits) ? sum : sum + courseUnits;
    }, 0);
    const subjects = new Set(lockedCourses.map((course) => course.subject));

    // Assign colors to subjects
    const colorMap = new Map<string, number>();
    subjects.forEach((subject) => {
      colorMap.set(subject, getSubjectColorIndex(subject));
    });

    return { totalUnits: units, uniqueSubjects: subjects.size, subjectColorMap: colorMap };
  }, [lockedCourses]);

  // Show empty state if no locked courses
  if (!lockedCourses || lockedCourses.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-secondary p-8 text-center shadow-md border border-border-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
            <Calendar className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content-primary font-display">
              No Schedule to Display
            </h3>
            <p className="text-content-secondary mt-1">
              Lock some courses to see them in your weekly timetable.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

    const colorIndex = subjectColorMap.get(course.subject) ?? 0;

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
                colorIndex: colorIndex,
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
      return <div className="h-full rounded-md bg-accent/30" />;
    }

    return startCourses.map((course, index) => {
      const isConflicting = conflictingLockedCourseIds.has(course.id);
      const bgColor = SUBJECT_COLORS_LIGHT[course.colorIndex];
      const borderColor = SUBJECT_BORDER_COLORS[course.colorIndex];
      const textColor = SUBJECT_TEXT_COLORS[course.colorIndex];

      return (
        <Tooltip key={`${course.id}-${course.slotStartTime}-${index}`} course={course}>
          <div
            className={`h-full overflow-hidden rounded-lg border-2 p-1.5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
              isConflicting
                ? 'border-l-4 border-l-[#a5283a] !bg-red-100 dark:!bg-red-900/30 !border-red-300 dark:!border-red-700'
                : `${bgColor} ${borderColor}`
            }`}
            tabIndex={0}
            aria-label={`Locked course: ${course.subject} section ${course.section} in room ${course.slotRoom}, from ${course.slotStartTime} to ${course.slotEndTime}${isConflicting ? ' (conflict)' : ''}`}
          >
            <div
              className={`font-bold text-xs truncate ${isConflicting ? 'text-red-700 dark:text-red-300' : textColor}`}
            >
              {course.subject}
            </div>
            <div
              className={`text-[0.65rem] truncate ${isConflicting ? 'text-red-600 dark:text-red-400' : 'text-content-secondary'}`}
            >
              {course.section}
            </div>
            <div
              className={`text-[0.6rem] truncate ${isConflicting ? 'text-red-500 dark:text-red-400' : 'text-content-secondary opacity-75'}`}
            >
              {course.slotRoom}
            </div>
            {isConflicting && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[0.6rem] text-red-500 font-medium">Conflict</span>
              </div>
            )}
          </div>
        </Tooltip>
      );
    });
  };

  return (
    <div className="mt-6 w-full">
      {/* Header with title and export menu - responsive for tablet */}
      <div className="mb-3 md:mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-accent-light">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold text-content-primary font-display truncate">
              Weekly Timetable
            </h3>
            <p className="text-[0.65rem] md:text-xs text-content-secondary hidden sm:block">
              Your locked courses visualized
            </p>
          </div>
        </div>
        <div className="relative flex justify-end">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] touch-target ${
              isMenuOpen
                ? 'bg-accent text-white shadow-md'
                : 'bg-surface-secondary text-content-primary border border-border-primary hover:border-accent hover:bg-accent-light'
            }`}
            aria-label="Export timetable options"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <Download
              className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
            />
            <span>Export</span>
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

      {/* Timetable grid - responsive for tablet */}
      <div
        ref={timetableRef}
        className="overflow-x-auto rounded-2xl border border-border-primary bg-surface-secondary shadow-lg"
      >
        <table
          className="w-full border-collapse min-w-[600px] md:min-w-[700px] lg:min-w-[800px]"
          style={{ tableLayout: 'fixed' }}
          role="table"
          aria-label="Weekly timetable of locked courses"
        >
          <caption className="sr-only">
            Weekly timetable showing locked courses by day and time slot.
          </caption>
          <thead>
            <tr role="row">
              <th
                className="sticky left-0 z-[3] w-[55px] md:w-[60px] lg:w-[70px] border-b-2 border-r border-border-primary bg-accent-light p-1.5 md:p-2 text-center"
                role="columnheader"
                aria-label="Time"
                scope="col"
              >
                <span className="text-[0.6rem] md:text-xs font-bold text-content-primary">
                  Time
                </span>
              </th>
              {DAYS.map((day, index) => (
                <th
                  key={day}
                  className="sticky top-0 z-[2] min-w-[75px] md:min-w-[85px] lg:min-w-[100px] border-b-2 border-border-primary bg-accent-light p-1.5 md:p-2 text-center"
                  role="columnheader"
                  aria-label={DAY_NAMES[index]}
                  scope="col"
                >
                  <div className="text-xs md:text-sm font-bold text-content-primary">{day}</div>
                  <div className="text-[0.55rem] md:text-[0.65rem] text-content-secondary hidden md:block">
                    {DAY_NAMES[index]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot, rowIndex) => (
              <tr
                key={timeSlot}
                className={`time-row ${rowIndex % 2 === 0 ? 'bg-surface-secondary' : 'bg-surface-tertiary/30'}`}
                role="row"
              >
                <td
                  className="sticky left-0 z-[1] border-r border-border-primary bg-accent-light/50 p-1 md:p-1.5 text-center"
                  role="rowheader"
                  aria-label={formatTo12Hour(timeSlot)}
                  scope="row"
                >
                  <span className="text-[0.55rem] md:text-[0.65rem] font-semibold text-content-primary whitespace-nowrap">
                    {formatTo12Hour(timeSlot)}
                  </span>
                </td>
                {DAYS.map((day) => (
                  <td
                    key={`${day}-${timeSlot}`}
                    className="h-[42px] md:h-[48px] lg:h-[52px] border-r border-b border-border-primary/50 p-0.5 align-top"
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
      </div>

      {/* Summary section with playful design - responsive for tablet */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-3 md:p-4 border border-emerald-200 dark:border-emerald-800 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
            <Calculator className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[0.65rem] md:text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Total Units
            </span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-emerald-800 dark:text-emerald-200 font-display">
            {totalUnits}
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3 md:p-4 border border-blue-200 dark:border-blue-800 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
            <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[0.65rem] md:text-xs font-medium text-blue-700 dark:text-blue-300">
              Subjects
            </span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-800 dark:text-blue-200 font-display">
            {uniqueSubjects}
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-3 md:p-4 border border-violet-200 dark:border-violet-800 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
            <Archive className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-[0.65rem] md:text-xs font-medium text-violet-700 dark:text-violet-300">
              Courses
            </span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-violet-800 dark:text-violet-200 font-display">
            {lockedCourses.length}
          </div>
        </div>
      </div>
    </div>
  );
}
