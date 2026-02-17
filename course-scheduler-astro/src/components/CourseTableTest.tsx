/**
 * CourseTableTest Component
 *
 * A wrapper component for testing the CourseTable component with sample data.
 * Provides interactive controls and sample courses for demonstration.
 *
 * @module components/CourseTableTest
 */

import { useState, useCallback, type ReactNode } from 'react';
import CourseTable from './CourseTable';
import type { Course, GroupingMode, StatusFilter, CourseIdentity } from '@/types/index';

/**
 * Sample courses for testing
 */
const sampleCourses: Course[] = [
  {
    id: '1',
    subject: 'IT 111',
    subjectTitle: 'Introduction to Computing',
    section: 'BSIT-1A-AP3',
    schedule: 'TTH | 9:00AM-10:30AM | Room#online',
    room: 'online',
    units: '3',
    isLocked: false,
    isClosed: false,
    enrolled: 25,
    assessed: 5,
    totalSlots: 40,
    availableSlots: 10,
    offeringDept: 'DCIT',
  },
  {
    id: '2',
    subject: 'IT 112',
    subjectTitle: 'Computer Programming I',
    section: 'BSIT-1A-AP4',
    schedule: 'MWF | 1:00PM-2:00PM | ACAD309',
    room: 'ACAD309',
    units: '3',
    isLocked: true,
    isClosed: false,
    enrolled: 35,
    assessed: 5,
    totalSlots: 40,
    availableSlots: 0,
    offeringDept: 'DCIT',
  },
  {
    id: '3',
    subject: 'IT 113',
    subjectTitle: 'Data Structures and Algorithms',
    section: 'BSIT-2A-AP5',
    schedule: 'TTH | 2:00PM-3:30PM | ACAD401',
    room: 'ACAD401',
    units: '3',
    isLocked: false,
    isClosed: true,
    enrolled: 40,
    assessed: 0,
    totalSlots: 40,
    availableSlots: 0,
    offeringDept: 'DCIT',
  },
  {
    id: '4',
    subject: 'MATH 101',
    subjectTitle: 'College Algebra',
    section: 'BSIT-1B-AP3',
    schedule: 'MWF | 7:30AM-8:30AM | Room#online',
    room: 'online',
    units: '3',
    isLocked: false,
    isClosed: false,
    enrolled: 20,
    assessed: 10,
    totalSlots: 50,
    availableSlots: 20,
    offeringDept: 'DMATH',
  },
  {
    id: '5',
    subject: 'ENG 101',
    subjectTitle: 'English Communication Skills',
    section: 'BSIT-1A-AP4',
    schedule: 'TTH | 10:30AM-12:00PM | ACAD205',
    room: 'ACAD205',
    units: '3',
    isLocked: false,
    isClosed: false,
    enrolled: 30,
    assessed: 5,
    totalSlots: 45,
    availableSlots: 10,
    offeringDept: 'DENGL',
  },
];

/**
 * Group courses by a specified key
 */
function groupCourses(
  courses: readonly Course[],
  groupingKey: GroupingMode
): readonly Course[] | readonly { groupValue: string; courses: readonly Course[] }[] {
  if (groupingKey === 'none') {
    return courses;
  }

  const groups = new Map<string, Course[]>();

  for (const course of courses) {
    const key = groupingKey === 'subject' ? course.subject : (course.offeringDept ?? 'Unknown');
    const existing = groups.get(key);
    if (existing) {
      existing.push(course);
    } else {
      groups.set(key, [course]);
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupValue, groupCourses]) => ({
      groupValue,
      courses: groupCourses,
    }));
}

/**
 * Test wrapper for CourseTable component
 */
export default function CourseTableTest(): ReactNode {
  const [courses, setCourses] = useState<readonly Course[]>(sampleCourses);
  const [groupingKey, setGroupingKey] = useState<GroupingMode>('subject');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [conflictingIds, setConflictingIds] = useState<ReadonlySet<string>>(new Set(['2']));

  // Handle grouping change
  const handleGroupingChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setGroupingKey(event.target.value as GroupingMode);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter);
  }, []);

  // Handle course deletion
  const handleDeleteCourse = useCallback((identity: CourseIdentity) => {
    setCourses((prev) => prev.filter((c) => c.id !== identity.id));
  }, []);

  // Handle course lock toggle
  const handleToggleLockCourse = useCallback((identity: CourseIdentity) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === identity.id && c.subject === identity.subject && c.section === identity.section
          ? { ...c, isLocked: !c.isLocked }
          : c
      )
    );
  }, []);

  // Handle clear all locks
  const handleClearAllLocks = useCallback(() => {
    setCourses((prev) => prev.map((c) => ({ ...c, isLocked: false })));
    setConflictingIds(new Set());
  }, []);

  // Handle delete all courses
  const handleDeleteAllCourses = useCallback(() => {
    setCourses([]);
  }, []);

  // Filter courses by status
  const filteredCourses = courses.filter((course) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return course.availableSlots > 0 && !course.isClosed;
    if (statusFilter === 'closed') return course.availableSlots <= 0 || course.isClosed;
    return true;
  });

  // Group courses
  const processedCourses = groupCourses(filteredCourses, groupingKey);

  // Calculate stats
  const totalUnits = courses.reduce((sum, c) => sum + parseInt(c.units, 10), 0);
  const uniqueSubjects = new Set(courses.map((c) => c.subject)).size;
  const lockedCount = courses.filter((c) => c.isLocked).length;

  return (
    <div>
      <div className="mb-4 p-4 bg-surface-tertiary rounded-lg">
        <p className="text-sm text-content-secondary mb-2">
          This is a test instance with sample course data. Try the grouping, filtering, locking, and
          export features.
        </p>
        <p className="text-xs text-content-secondary">
          <strong>Note:</strong> Course IT 112 is pre-locked and shows a conflict warning
          (simulated). Courses IT 112 and IT 113 are full or closed to demonstrate status badges.
        </p>
      </div>

      <CourseTable
        courses={processedCourses}
        allCoursesCount={courses.length}
        groupingKey={groupingKey}
        onGroupingChange={handleGroupingChange}
        selectedStatusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onDeleteCourse={handleDeleteCourse}
        onToggleLockCourse={handleToggleLockCourse}
        conflictingLockedCourseIds={conflictingIds}
        onClearAllLocks={handleClearAllLocks}
        onDeleteAllCourses={handleDeleteAllCourses}
        totalUnitsDisplay={totalUnits}
        uniqueSubjectsDisplay={uniqueSubjects}
        lockedCoursesCountDisplay={lockedCount}
      />

      {/* State display for debugging */}
      <div className="mt-4 p-4 bg-surface-tertiary rounded-lg">
        <h4 className="text-sm font-medium text-content-primary mb-2">Current State:</h4>
        <div className="text-xs text-content-secondary space-y-1">
          <p>
            Grouping: <code className="text-content-primary">{groupingKey}</code>
          </p>
          <p>
            Status Filter: <code className="text-content-primary">{statusFilter}</code>
          </p>
          <p>
            Courses: <code className="text-content-primary">{courses.length}</code>
          </p>
          <p>
            Locked: <code className="text-content-primary">{lockedCount}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
