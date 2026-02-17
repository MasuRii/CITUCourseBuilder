/**
 * CourseTable Component
 *
 * A React island component for displaying and managing course data in a table format.
 * Features playful, modern styling with animated buttons, status badges with icons,
 * and smooth grouping transitions.
 *
 * @module components/CourseTable
 * @see docs/architecture/REACT_ISLANDS_HYDRATION.md - Uses client:load for immediate interactivity
 */

import { Fragment, useMemo, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type {
  Course,
  GroupedCourse,
  GroupingMode,
  StatusFilter,
  CourseIdentity,
} from '@/types/index';
import { convertCoursesToRawData } from '@/utils/convertToRawData';

/**
 * Props for the CourseTable component
 */
export interface CourseTableProps {
  /** Courses to display (flat array or grouped array) */
  courses: readonly Course[] | readonly GroupedCourse[];
  /** Total count of all courses (before filtering) */
  allCoursesCount: number;
  /** Current grouping mode */
  groupingKey: GroupingMode;
  /** Callback when grouping mode changes */
  onGroupingChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Current status filter */
  selectedStatusFilter: StatusFilter;
  /** Callback when status filter changes */
  onStatusFilterChange: (filter: StatusFilter) => void;
  /** Callback to delete a course */
  onDeleteCourse: (identity: CourseIdentity) => void;
  /** Callback to toggle course lock state */
  onToggleLockCourse: (identity: CourseIdentity) => void;
  /** Set of course IDs with schedule conflicts */
  conflictingLockedCourseIds: ReadonlySet<string>;
  /** Callback to clear all locked courses */
  onClearAllLocks: () => void;
  /** Callback to delete all courses */
  onDeleteAllCourses: () => void;
  /** Total units to display */
  totalUnitsDisplay: number;
  /** Number of unique subjects to display */
  uniqueSubjectsDisplay: number;
  /** Number of locked courses to display */
  lockedCoursesCountDisplay: number;
}

/**
 * Props for individual row rendering
 */
interface CourseRowProps {
  course: Course;
  rowIndex: number;
  onToggleLockCourse: (identity: CourseIdentity) => void;
  onDeleteCourse: (identity: CourseIdentity) => void;
  conflictingLockedCourseIds: ReadonlySet<string>;
}

/**
 * Checkmark icon for available status
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * X icon for closed status
 */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * Alert triangle icon for warning/full status
 */
function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Lock icon for locked courses
 */
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * Unlock icon for unlocked courses
 */
function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

/**
 * Menu icon SVG component
 */
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

/**
 * Info icon SVG component
 */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * Trash icon SVG component
 */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

/**
 * Warning icon SVG component
 */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Download icon for export
 */
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

/**
 * Copy icon for clipboard
 */
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

/**
 * Book icon for subject column
 */
function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

/**
 * Clock icon for schedule column
 */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/**
 * Map pin icon for room column
 */
function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Renders a single course row with enhanced animations
 */
function CourseRow({
  course,
  rowIndex,
  onToggleLockCourse,
  onDeleteCourse,
  conflictingLockedCourseIds,
}: CourseRowProps): ReactNode {
  const isLocked = course.isLocked;
  const hasConflict = isLocked && conflictingLockedCourseIds.has(course.id);
  const canLock = course.availableSlots > 0;

  const handleToggleLock = useCallback(() => {
    onToggleLockCourse({
      id: course.id,
      subject: course.subject,
      section: course.section,
    });
  }, [course.id, course.subject, course.section, onToggleLockCourse]);

  const handleDelete = useCallback(() => {
    onDeleteCourse({
      id: course.id,
      subject: course.subject,
      section: course.section,
    });
  }, [course.id, course.subject, course.section, onDeleteCourse]);

  return (
    <tr
      className={`
        border-b border-border-primary transition-all duration-200
        ${rowIndex % 2 === 0 ? 'bg-surface-primary' : 'bg-surface-secondary'}
        ${isLocked ? 'bg-accent/5' : ''}
        ${hasConflict ? 'border-l-4 border-l-danger-border' : ''}
        hover:bg-surface-hover hover:shadow-sm
        group
      `}
    >
      <td className="px-3 py-2.5 text-sm text-content-primary font-medium">{course.subject}</td>
      <td className="px-3 py-2.5 text-sm text-content-secondary">{course.subjectTitle}</td>
      <td className="px-3 py-2.5 text-sm text-content-secondary text-center font-mono">
        {course.creditedUnits ?? course.units}
      </td>
      <td className="px-3 py-2.5 text-sm text-content-primary font-medium">{course.section}</td>
      <td className="px-3 py-2.5 text-sm text-content-primary font-mono">{course.schedule}</td>
      <td className="px-3 py-2.5 text-sm text-content-secondary">{course.room}</td>
      <td className="px-3 py-2.5">
        <StatusBadge
          isClosed={course.isClosed}
          availableSlots={course.availableSlots}
          enrolled={course.enrolled}
          assessed={course.assessed}
          totalSlots={course.totalSlots}
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          {hasConflict && (
            <span
              className="text-warning animate-pulse"
              title="Schedule conflict with another locked course"
              aria-label="Schedule conflict"
            >
              <WarningIcon />
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleLock}
            disabled={!isLocked && !canLock}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full
              transition-all duration-200 ease-out transform
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              active:scale-95
              ${
                isLocked
                  ? 'bg-accent text-white shadow-md hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-lg'
                  : 'bg-surface-secondary text-content-secondary border border-border-primary hover:border-accent hover:text-accent hover:-translate-y-0.5'
              }
            `}
            title={
              isLocked
                ? 'Unlock Course'
                : canLock
                  ? 'Lock Course'
                  : 'Cannot lock - no available slots'
            }
          >
            {isLocked ? (
              <>
                <LockIcon className="opacity-90" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <UnlockIcon />
                <span>Lock</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-content-secondary/60 hover:text-danger-button-bg hover:bg-danger/10
                       transition-all duration-200 ease-out transform
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-button-bg/50 rounded-lg
                       opacity-0 group-hover:opacity-100 active:scale-90"
            title="Delete Course"
            aria-label="Delete course"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Status badge component with icons for visual clarity
 */
function StatusBadge({
  isClosed,
  availableSlots,
  enrolled,
  assessed,
  totalSlots,
}: {
  isClosed: boolean;
  availableSlots: number;
  enrolled: number;
  assessed: number;
  totalSlots: number;
}): ReactNode {
  if (isClosed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-danger/10 text-danger border border-danger/20">
        <XIcon />
        <span>Closed</span>
      </span>
    );
  }

  if (availableSlots <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">
        <AlertTriangleIcon />
        <span>
          Full: {enrolled + assessed}/{totalSlots}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">
      <CheckIcon />
      <span>
        {availableSlots}/{totalSlots}
      </span>
    </span>
  );
}

/**
 * Custom dropdown menu component with animations
 */
function DropdownMenu({
  items,
  triggerLabel,
  onTriggerClick,
}: {
  items: Array<{
    label: string;
    onClick: () => void;
  }>;
  triggerLabel: string;
  onTriggerClick?: () => void;
}): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    onTriggerClick?.();
  }, [onTriggerClick]);

  const handleItemClick = useCallback((onClick: () => void) => {
    onClick();
    setIsOpen(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`
          p-2 text-content-secondary rounded-lg transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
          ${isOpen ? 'bg-surface-hover text-content-primary' : 'hover:text-content-primary hover:bg-surface-hover'}
        `}
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MenuIcon />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-56 bg-surface-secondary border border-border-primary
                     rounded-xl shadow-lg z-[var(--z-dropdown)] animate-fade-in overflow-hidden"
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleItemClick(item.onClick)}
              className="w-full px-4 py-2.5 text-left text-sm text-content-primary
                         hover:bg-surface-hover transition-colors duration-150
                         first:rounded-t-xl last:rounded-b-xl
                         flex items-center gap-2"
              role="menuitem"
            >
              {item.label.includes('Copy') ? (
                <CopyIcon className="text-content-secondary" />
              ) : (
                <DownloadIcon className="text-content-secondary" />
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tooltip component for info text
 */
function Tooltip({ text, children }: { text: string; children: ReactNode }): ReactNode {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
                     text-xs text-white bg-gray-900 rounded-lg shadow-lg
                     whitespace-nowrap z-[var(--z-tooltip)] animate-fade-in"
          role="tooltip"
        >
          {text}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-4
                       border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>
  );
}

/**
 * CourseTable component for displaying and managing course data.
 *
 * Features:
 * - Grouping by subject, department, or flat list
 * - Status filtering (all, open, closed)
 * - Export to clipboard and text file
 * - Course locking for schedule generation with animations
 * - Conflict highlighting for locked courses
 * - Status badges with icons for visual clarity
 * - Smooth row hover effects and transitions
 * - Tailwind styled with theme support
 *
 * @example
 * ```tsx
 * <CourseTable
 *   courses={processedCourses}
 *   allCoursesCount={allCourses.length}
 *   groupingKey={groupingKey}
 *   onGroupingChange={handleGroupingChange}
 *   selectedStatusFilter={statusFilter}
 *   onStatusFilterChange={setStatusFilter}
 *   onDeleteCourse={handleDeleteCourse}
 *   onToggleLockCourse={handleToggleLock}
 *   conflictingLockedCourseIds={conflictingIds}
 *   onClearAllLocks={handleClearLocks}
 *   onDeleteAllCourses={handleDeleteAll}
 *   totalUnitsDisplay={totalUnits}
 *   uniqueSubjectsDisplay={uniqueSubjects}
 *   lockedCoursesCountDisplay={lockedCount}
 * />
 * ```
 */
export default function CourseTable({
  courses,
  allCoursesCount,
  groupingKey,
  onGroupingChange,
  selectedStatusFilter,
  onStatusFilterChange,
  onDeleteCourse,
  onToggleLockCourse,
  conflictingLockedCourseIds,
  onClearAllLocks,
  onDeleteAllCourses,
  totalUnitsDisplay,
  uniqueSubjectsDisplay,
  lockedCoursesCountDisplay,
}: CourseTableProps): ReactNode {
  // Check if courses are grouped
  const isGrouped =
    groupingKey !== 'none' &&
    Array.isArray(courses) &&
    courses.length > 0 &&
    'groupValue' in courses[0];

  // Calculate displayed count
  const displayedCount = useMemo(() => {
    if (!Array.isArray(courses)) return 0;
    if (groupingKey === 'none') {
      return courses.length;
    }
    return (courses as readonly GroupedCourse[]).reduce((sum, group) => {
      return sum + (group?.courses?.length ?? 0);
    }, 0);
  }, [courses, groupingKey]);

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(() => {
    const allCoursesToExport = isGrouped
      ? (courses as readonly GroupedCourse[]).flatMap((group) => group.courses)
      : (courses as readonly Course[]);
    const rawData = convertCoursesToRawData(allCoursesToExport);

    if (!rawData) {
      console.warn('No course data to copy');
      return;
    }

    navigator.clipboard
      .writeText(rawData)
      .then(() => {
        console.log('Course data copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  }, [courses, isGrouped]);

  // Handle download as text
  const handleDownloadAsText = useCallback(() => {
    const allCoursesToExport = isGrouped
      ? (courses as readonly GroupedCourse[]).flatMap((group) => group.courses)
      : (courses as readonly Course[]);
    const rawData = convertCoursesToRawData(allCoursesToExport);

    if (!rawData) {
      console.warn('No course data to download');
      return;
    }

    const blob = new Blob([rawData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_list_export.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }, [courses, isGrouped]);

  // Export menu items
  const exportMenuItems = [
    { label: 'Copy Raw Data to Clipboard', onClick: handleCopyToClipboard },
    { label: 'Download Raw Data as .txt', onClick: handleDownloadAsText },
  ];

  // Get flat courses array for non-grouped display
  const flatCourses = isGrouped ? [] : (courses as readonly Course[]);
  const groupedCourses = isGrouped ? (courses as readonly GroupedCourse[]) : [];

  return (
    <div className="bg-surface-primary border border-border-primary rounded-xl shadow-sm overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-border-primary bg-surface-secondary/30">
        <div className="flex flex-wrap items-center gap-4">
          {/* Title */}
          <h2 className="text-xl font-semibold text-content-primary m-0 font-display flex items-center gap-2">
            <BookIcon className="text-accent" />
            Course List
          </h2>

          {/* Grouping Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-content-secondary font-medium">Group by:</label>
            <select
              value={groupingKey}
              onChange={onGroupingChange}
              className="px-3 py-1.5 text-sm bg-surface-secondary border border-border-primary
                         rounded-lg text-content-primary focus:outline-none focus:ring-2
                         focus:ring-accent/30 cursor-pointer transition-all duration-150
                         hover:border-accent/50"
            >
              <option value="none">None</option>
              <option value="subject">Subject</option>
              <option value="offeringDept">Department</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-content-secondary font-medium">Filter:</span>
            <div className="flex gap-1.5">
              {(['all', 'open', 'closed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onStatusFilterChange(filter)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                    ${
                      selectedStatusFilter === filter
                        ? 'bg-accent text-white shadow-md transform scale-[1.02]'
                        : 'bg-surface-secondary text-content-secondary border border-border-primary hover:border-accent hover:text-content-primary'
                    }
                  `}
                  aria-pressed={selectedStatusFilter === filter}
                >
                  {filter === 'all'
                    ? 'All Courses'
                    : filter === 'open'
                      ? 'Open Only'
                      : 'Closed Only'}
                </button>
              ))}
            </div>
            <Tooltip text="This filter affects the courses shown below and those available for schedule generation.">
              <InfoIcon className="text-accent cursor-help" />
            </Tooltip>
          </div>

          {/* Stats Display */}
          {totalUnitsDisplay > 0 && (
            <div className="ml-auto text-sm text-content-secondary flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                {totalUnitsDisplay} units
              </span>
              <span>{uniqueSubjectsDisplay} subjects</span>
              <span>•</span>
              <span>{lockedCoursesCountDisplay} locked</span>
            </div>
          )}

          {/* Export Menu */}
          <DropdownMenu items={exportMenuItems} triggerLabel="Export menu" />
        </div>

        {/* Conflict Warning */}
        {conflictingLockedCourseIds.size > 0 && (
          <div className="mt-3 px-3 py-2 text-sm text-warning-text bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2 animate-slide-up">
            <WarningIcon />
            <span>
              Note: Courses highlighted with a red border have schedule conflicts with other locked
              courses.
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-tertiary">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <BookIcon />
                  Subject
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Title
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Units
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Section
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <ClockIcon />
                  Schedule
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <MapPinIcon />
                  Room
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* No Data Row */}
            {(!courses || (Array.isArray(courses) && courses.length === 0)) && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-content-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <BookIcon className="w-8 h-8 opacity-30" />
                    <span className="text-sm">No courses to display.</span>
                    <span className="text-xs text-content-secondary/60">
                      Import your schedule data to get started.
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {/* Grouped Courses */}
            {isGrouped &&
              groupedCourses.map((group, groupIndex) => (
                <Fragment key={`group-${group.groupValue}-${groupIndex}`}>
                  {/* Group Header */}
                  <tr className="bg-surface-tertiary/50 border-t border-b border-border-secondary">
                    <td
                      colSpan={8}
                      className="px-3 py-2 text-sm font-semibold text-content-primary"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        {group.groupValue}
                        <span className="text-xs font-normal text-content-secondary ml-1">
                          ({group.courses?.length ?? 0}{' '}
                          {!group.courses || group.courses.length === 1 ? 'course' : 'courses'})
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Group Courses */}
                  {group.courses?.map((course, courseIndex) => (
                    <CourseRow
                      key={`course-${course.id}-${courseIndex}`}
                      course={course}
                      rowIndex={courseIndex}
                      onToggleLockCourse={onToggleLockCourse}
                      onDeleteCourse={onDeleteCourse}
                      conflictingLockedCourseIds={conflictingLockedCourseIds}
                    />
                  ))}
                </Fragment>
              ))}

            {/* Non-Grouped Courses */}
            {!isGrouped &&
              flatCourses.map((course, index) => (
                <CourseRow
                  key={`course-${course.id}-${index}`}
                  course={course}
                  rowIndex={index}
                  onToggleLockCourse={onToggleLockCourse}
                  onDeleteCourse={onDeleteCourse}
                  conflictingLockedCourseIds={conflictingLockedCourseIds}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border-primary bg-surface-secondary/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearAllLocks}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                       bg-surface-secondary text-content-primary border border-border-primary
                       rounded-lg transition-all duration-200 ease-out
                       hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-md
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                       active:translate-y-0 active:shadow-sm"
          >
            <UnlockIcon className="w-4 h-4" />
            Clear All Locks
          </button>
          <button
            type="button"
            onClick={onDeleteAllCourses}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                       bg-danger/10 text-danger border border-danger/20
                       rounded-lg transition-all duration-200 ease-out
                       hover:bg-danger/20 hover:-translate-y-0.5 hover:shadow-md
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:ring-offset-2
                       active:translate-y-0 active:shadow-sm"
          >
            <TrashIcon className="w-4 h-4" />
            Delete All Courses
          </button>
        </div>

        <div className="text-sm text-content-secondary flex items-center gap-1">
          <span className="font-medium">Showing {displayedCount} courses</span>
          {displayedCount !== allCoursesCount && (
            <span className="text-content-secondary/60">
              (filtered from {allCoursesCount} total)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
