/**
 * CourseTable Component
 *
 * A React island component for displaying and managing course data in a table format.
 * Supports grouping by subject/department, status filtering, export functionality,
 * and course locking for schedule generation.
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
 * Unlock icon SVG component
 */
function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
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
 * Trash icon SVG component
 */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
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
 * Renders a single course row
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
        border-b border-border-primary transition-colors duration-150
        ${rowIndex % 2 === 0 ? 'bg-surface-primary' : 'bg-surface-secondary'}
        ${isLocked ? 'bg-accent/5' : ''}
        ${hasConflict ? 'border-l-4 border-l-danger-border' : ''}
        hover:bg-surface-hover
      `}
    >
      <td className="px-3 py-2 text-sm text-content-primary">{course.subject}</td>
      <td className="px-3 py-2 text-sm text-content-primary">{course.subjectTitle}</td>
      <td className="px-3 py-2 text-sm text-content-secondary text-center">
        {course.creditedUnits ?? course.units}
      </td>
      <td className="px-3 py-2 text-sm text-content-primary">{course.section}</td>
      <td className="px-3 py-2 text-sm text-content-primary font-mono">{course.schedule}</td>
      <td className="px-3 py-2 text-sm text-content-secondary">{course.room}</td>
      <td className="px-3 py-2 text-sm">
        <StatusBadge
          isClosed={course.isClosed}
          availableSlots={course.availableSlots}
          enrolled={course.enrolled}
          assessed={course.assessed}
          totalSlots={course.totalSlots}
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {hasConflict && (
            <span
              className="text-warning"
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
              px-2 py-1 text-xs font-medium rounded transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-accent/30
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isLocked
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-surface-secondary text-content-secondary hover:bg-surface-hover border border-border-primary'
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
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-content-secondary hover:text-danger-button-bg transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-danger-button-bg/30 rounded"
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
 * Status badge component
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
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-danger-surface text-danger-text">
        Closed
      </span>
    );
  }

  if (availableSlots <= 0) {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning-surface text-warning-text">
        Slots full: {enrolled + assessed}/{totalSlots}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success-surface text-success-text">
      Available: {availableSlots}/{totalSlots}
    </span>
  );
}

/**
 * Custom dropdown menu component
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
        className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-hover
                   rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2
                   focus:ring-accent/30"
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MenuIcon />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-56 bg-surface-secondary border border-border-primary
                     rounded-lg shadow-lg z-[var(--z-dropdown)]"
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleItemClick(item.onClick)}
              className="w-full px-4 py-2 text-left text-sm text-content-primary
                         hover:bg-surface-hover transition-colors duration-150
                         first:rounded-t-lg last:rounded-b-lg"
              role="menuitem"
            >
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
                     whitespace-nowrap z-[var(--z-tooltip)]"
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
 * - Course locking for schedule generation
 * - Conflict highlighting for locked courses
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
      <div className="p-4 border-b border-border-primary">
        <div className="flex flex-wrap items-center gap-4">
          {/* Title */}
          <h2 className="text-xl font-semibold text-content-primary m-0">Course List</h2>

          {/* Grouping Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-content-secondary">Group by:</label>
            <select
              value={groupingKey}
              onChange={onGroupingChange}
              className="px-3 py-1.5 text-sm bg-surface-secondary border border-border-primary
                         rounded-lg text-content-primary focus:outline-none focus:ring-2
                         focus:ring-accent/30 cursor-pointer"
            >
              <option value="none">None</option>
              <option value="subject">Subject</option>
              <option value="offeringDept">Department</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-content-secondary">Filter:</span>
            <div className="flex gap-1">
              {(['all', 'open', 'closed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onStatusFilterChange(filter)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-accent/30
                    ${
                      selectedStatusFilter === filter
                        ? 'bg-accent text-white'
                        : 'bg-surface-secondary text-content-secondary hover:bg-surface-hover'
                    }
                  `}
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
            <div className="ml-auto text-sm text-content-secondary">
              {totalUnitsDisplay} units ({uniqueSubjectsDisplay} subjects) -{' '}
              {lockedCoursesCountDisplay} courses locked
            </div>
          )}

          {/* Export Menu */}
          <DropdownMenu items={exportMenuItems} triggerLabel="Export menu" />
        </div>

        {/* Conflict Warning */}
        {conflictingLockedCourseIds.size > 0 && (
          <div className="mt-3 px-3 py-2 text-sm text-warning-text bg-warning-surface rounded-lg">
            Note: Courses highlighted with a red border have schedule conflicts with other locked
            courses.
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-tertiary">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Subject
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Title
              </th>
              <th className="px-3 py-2 text-center text-sm font-semibold text-content-secondary">
                Units
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Section
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Schedule
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Room
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Status
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-content-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* No Data Row */}
            {(!courses || (Array.isArray(courses) && courses.length === 0)) && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-content-secondary">
                  No courses to display.
                </td>
              </tr>
            )}

            {/* Grouped Courses */}
            {isGrouped &&
              groupedCourses.map((group, groupIndex) => (
                <Fragment key={`group-${group.groupValue}-${groupIndex}`}>
                  {/* Group Header */}
                  <tr className="bg-surface-tertiary border-t border-b border-border-secondary">
                    <td
                      colSpan={8}
                      className="px-3 py-2 text-sm font-semibold text-content-primary"
                    >
                      {group.groupValue} ({group.courses?.length ?? 0}{' '}
                      {!group.courses || group.courses.length === 1 ? 'course' : 'courses'})
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
      <div className="p-4 border-t border-border-primary flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearAllLocks}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                       bg-surface-secondary text-content-primary border border-border-primary
                       rounded-lg hover:bg-surface-hover transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <UnlockIcon className="w-4 h-4" />
            Clear All Locks
          </button>
          <button
            type="button"
            onClick={onDeleteAllCourses}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                       bg-danger-surface text-danger-button-text border border-danger-border
                       rounded-lg hover:bg-danger-hover transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-danger-button-bg/30"
          >
            <TrashIcon className="w-4 h-4" />
            Delete All Courses
          </button>
        </div>

        <div className="text-sm text-content-secondary">
          Showing {displayedCount} courses
          {displayedCount !== allCoursesCount && (
            <span> (filtered from {allCoursesCount} total)</span>
          )}
        </div>
      </div>
    </div>
  );
}
