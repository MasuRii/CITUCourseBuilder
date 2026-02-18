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
import {
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  MoreVertical,
  Info,
  Trash2,
  Download,
  Copy,
  BookOpen,
  Clock,
  MapPin,
} from 'lucide-react';
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

// ============================================================================
// Icon Components (using Lucide)
// ============================================================================

/**
 * Checkmark icon for available status
 */
function CheckIcon({ className }: { className?: string }) {
  return <Check className={className ?? 'w-3 h-3'} aria-hidden="true" />;
}

/**
 * X icon for closed status
 */
function XIcon({ className }: { className?: string }) {
  return <X className={className ?? 'w-3 h-3'} aria-hidden="true" />;
}

/**
 * Alert triangle icon for warning/full status
 */
function AlertTriangleIcon({ className }: { className?: string }) {
  return <AlertTriangle className={className ?? 'w-3 h-3'} aria-hidden="true" />;
}

/**
 * Lock icon for locked courses
 */
function LockIcon({ className }: { className?: string }) {
  return <Lock className={className ?? 'w-3.5 h-3.5'} aria-hidden="true" />;
}

/**
 * Unlock icon for unlocked courses
 */
function UnlockIcon({ className }: { className?: string }) {
  return <Unlock className={className ?? 'w-3.5 h-3.5'} aria-hidden="true" />;
}

/**
 * Menu icon (more vertical) for dropdown menus
 */
function MenuIcon({ className }: { className?: string }) {
  return <MoreVertical className={className ?? 'w-5 h-5'} aria-hidden="true" />;
}

/**
 * Info icon
 */
function InfoIcon({ className }: { className?: string }) {
  return <Info className={className ?? 'w-4.5 h-4.5'} aria-hidden="true" />;
}

/**
 * Trash icon for delete actions
 */
function TrashIcon({ className }: { className?: string }) {
  return <Trash2 className={className ?? 'w-4 h-4'} aria-hidden="true" />;
}

/**
 * Warning icon (same as AlertTriangle)
 */
function WarningIcon({ className }: { className?: string }) {
  return <AlertTriangle className={className ?? 'w-4 h-4'} aria-hidden="true" />;
}

/**
 * Download icon for export
 */
function DownloadIcon({ className }: { className?: string }) {
  return <Download className={className ?? 'w-4 h-4'} aria-hidden="true" />;
}

/**
 * Copy icon for clipboard
 */
function CopyIcon({ className }: { className?: string }) {
  return <Copy className={className ?? 'w-4 h-4'} aria-hidden="true" />;
}

/**
 * Book icon for subject column
 */
function BookIcon({ className }: { className?: string }) {
  return <BookOpen className={className ?? 'w-3.5 h-3.5'} aria-hidden="true" />;
}

/**
 * Clock icon for schedule column
 */
function ClockIcon({ className }: { className?: string }) {
  return <Clock className={className ?? 'w-3.5 h-3.5'} aria-hidden="true" />;
}

/**
 * Map pin icon for room column
 */
function MapPinIcon({ className }: { className?: string }) {
  return <MapPin className={className ?? 'w-3.5 h-3.5'} aria-hidden="true" />;
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
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5 text-xs md:text-sm text-content-primary font-medium">
        {course.subject}
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5 text-xs md:text-sm text-content-secondary hidden md:table-cell max-w-[120px] lg:max-w-none truncate lg:whitespace-normal">
        {course.subjectTitle}
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5 text-xs md:text-sm text-content-secondary text-center font-mono">
        {course.creditedUnits ?? course.units}
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5 text-xs md:text-sm text-content-primary font-medium">
        {course.section}
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5 text-[0.65rem] md:text-xs lg:text-sm text-content-primary font-mono">
        {course.schedule}
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5 text-xs md:text-sm text-content-secondary hidden md:table-cell">
        {course.room}
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5">
        <StatusBadge
          isClosed={course.isClosed}
          availableSlots={course.availableSlots}
          enrolled={course.enrolled}
          assessed={course.assessed}
          totalSlots={course.totalSlots}
        />
      </td>
      <td className="px-2 py-2 md:px-2 md:py-2 lg:px-3 lg:py-2.5">
        <div className="flex items-center gap-1 md:gap-2">
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
              inline-flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-3 md:py-2 text-[0.65rem] md:text-xs font-semibold rounded-full
              transition-all duration-200 ease-out transform
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              active:scale-95 min-h-[36px] md:min-h-[44px] touch-target
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
                <LockIcon className="opacity-90 w-3 h-3 md:w-auto md:h-auto" />
                <span className="hidden sm:inline">Locked</span>
              </>
            ) : (
              <>
                <UnlockIcon className="w-3 h-3 md:w-auto md:h-auto" />
                <span className="hidden sm:inline">Lock</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 md:p-2.5 text-content-secondary/60 hover:text-danger-button-bg hover:bg-danger/10
                       transition-all duration-200 ease-out transform
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-button-bg/50 rounded-lg
                       opacity-0 group-hover:opacity-100 active:scale-90 min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px]
                       flex items-center justify-center touch-target"
            title="Delete Course"
            aria-label="Delete course"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
      {/* Header Controls - responsive for tablet */}
      <div className="p-3 md:p-4 border-b border-border-primary bg-surface-secondary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {/* Title */}
            <h2 className="text-lg md:text-xl font-semibold text-content-primary m-0 font-display flex items-center gap-2">
              <BookIcon className="text-accent w-4 h-4 md:w-auto md:h-auto" />
              Course List
            </h2>

            {/* Grouping Controls */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <label className="text-xs md:text-sm text-content-secondary font-medium">
                Group by:
              </label>
              <select
                value={groupingKey}
                onChange={onGroupingChange}
                className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm bg-surface-secondary border border-border-primary
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
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-xs md:text-sm text-content-secondary font-medium">Filter:</span>
              <div className="flex gap-1 md:gap-1.5">
                {(['all', 'open', 'closed'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => onStatusFilterChange(filter)}
                    className={`
                      px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-200 ease-out
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                      ${
                        selectedStatusFilter === filter
                          ? 'bg-accent text-white shadow-md transform scale-[1.02]'
                          : 'bg-surface-secondary text-content-secondary border border-border-primary hover:border-accent hover:text-content-primary'
                      }
                    `}
                    aria-pressed={selectedStatusFilter === filter}
                  >
                    {filter === 'all' ? 'All' : filter === 'open' ? 'Open' : 'Closed'}
                  </button>
                ))}
              </div>
              <Tooltip text="This filter affects the courses shown below and those available for schedule generation.">
                <InfoIcon className="text-accent cursor-help w-3.5 h-3.5 md:w-auto md:h-auto" />
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
            {/* Stats Display */}
            {totalUnitsDisplay > 0 && (
              <div className="text-xs md:text-sm text-content-secondary flex items-center gap-2 md:gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 md:gap-1.5 px-1.5 py-0.5 md:px-2 bg-accent/10 text-accent rounded-full text-[0.65rem] md:text-xs font-medium">
                  {totalUnitsDisplay} units
                </span>
                <span className="hidden sm:inline">{uniqueSubjectsDisplay} subjects</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden sm:inline">{lockedCoursesCountDisplay} locked</span>
              </div>
            )}

            {/* Export Menu */}
            <div className="ml-auto md:ml-0">
              <DropdownMenu items={exportMenuItems} triggerLabel="Export menu" />
            </div>
          </div>
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
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <BookIcon className="w-3 h-3 md:w-auto md:h-auto" />
                  Subject
                </div>
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider hidden md:table-cell">
                Title
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-center text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Units
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Section
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <ClockIcon className="w-3 h-3 md:w-auto md:h-auto" />
                  Schedule
                </div>
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider hidden md:table-cell">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <MapPinIcon className="w-3 h-3 md:w-auto md:h-auto" />
                  Room
                </div>
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 py-2 md:px-2 md:py-2.5 lg:px-3 lg:py-3 text-left text-[0.6rem] md:text-xs font-semibold text-content-secondary uppercase tracking-wider">
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
