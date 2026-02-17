import { useState } from 'react';
import TimetableView from './TimetableView';
import type { Course } from '@/types/index';

/**
 * Sample locked courses for testing the TimetableView component
 */
const SAMPLE_LOCKED_COURSES: Course[] = [
  {
    id: 'sample-1',
    subject: 'IT 111',
    subjectTitle: 'Introduction to Computing',
    section: 'BSIT-1A-AP3',
    schedule: 'M/W | 9:00AM-10:30AM | Room#online',
    room: 'online',
    units: '3',
    isLocked: true,
    isClosed: false,
    enrolled: 25,
    assessed: 25,
    totalSlots: 40,
    availableSlots: 15,
    offeringDept: 'DCIT',
  },
  {
    id: 'sample-2',
    subject: 'IT 112',
    subjectTitle: 'Computer Programming I',
    section: 'BSIT-1A-AP4',
    schedule: 'T/TH | 1:00PM-2:30PM | ACAD309',
    room: 'ACAD309',
    units: '3',
    isLocked: true,
    isClosed: false,
    enrolled: 30,
    assessed: 30,
    totalSlots: 40,
    availableSlots: 10,
    offeringDept: 'DCIT',
  },
  {
    id: 'sample-3',
    subject: 'IT 113',
    subjectTitle: 'Data Structures',
    section: 'BSIT-2A-AP4',
    schedule: 'F | 8:00AM-11:00AM | LAB201',
    room: 'LAB201',
    units: '3',
    isLocked: true,
    isClosed: true,
    enrolled: 40,
    assessed: 40,
    totalSlots: 40,
    availableSlots: 0,
    offeringDept: 'DCIT',
  },
  {
    id: 'sample-4',
    subject: 'MATH 101',
    subjectTitle: 'Calculus I',
    section: 'BSIT-1B-AP4',
    schedule: 'M/W/F | 3:00PM-4:00PM | ACAD101',
    room: 'ACAD101',
    units: '3',
    isLocked: true,
    isClosed: false,
    enrolled: 35,
    assessed: 35,
    totalSlots: 45,
    availableSlots: 10,
    offeringDept: 'DMATH',
  },
];

/**
 * Toast message type
 */
interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

/**
 * Simple toast notification component
 */
function Toast({
  message,
  type,
}: {
  readonly message: string;
  readonly type: ToastMessage['type'];
}) {
  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  }[type];

  return (
    <div className={`${bgColor} rounded-lg px-4 py-2 text-white shadow-lg`} role="alert">
      {message}
    </div>
  );
}

/**
 * Test wrapper component for TimetableView
 *
 * Provides sample data and toast notification functionality for testing.
 */
export default function TimetableViewTest(): React.ReactNode {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showConflictDemo, setShowConflictDemo] = useState(false);

  /**
   * Show a toast notification
   */
  const handleToast = (message: string, type: ToastMessage['type']): void => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  /**
   * Toggle conflict highlighting demo
   */
  const conflictingIds: ReadonlySet<string> = showConflictDemo
    ? new Set(['sample-1', 'sample-4']) // Conflict between IT 111 and MATH 101 on M/W
    : new Set<string>();

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="border-b border-border-primary pb-4">
        <h2 className="text-xl font-bold text-content-primary">TimetableView Component</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Visual weekly timetable for locked courses with export options (PNG, PDF, ICS)
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowConflictDemo(!showConflictDemo)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showConflictDemo
              ? 'bg-danger-button-bg text-white hover:bg-danger-button-bg-hover'
              : 'bg-surface-tertiary text-content-primary hover:bg-accent hover:text-white'
          }`}
        >
          {showConflictDemo ? 'Hide Conflict Demo' : 'Show Conflict Demo'}
        </button>
        <p className="text-xs text-content-secondary">
          Toggle to see conflict highlighting between IT 111 and MATH 101 (both on M/W)
        </p>
      </div>

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      {/* TimetableView component */}
      <TimetableView
        lockedCourses={SAMPLE_LOCKED_COURSES}
        conflictingLockedCourseIds={conflictingIds}
        onToast={handleToast}
      />

      {/* Empty state demo */}
      <div className="mt-8 border-t border-border-primary pt-6">
        <h3 className="mb-4 text-lg font-semibold text-content-primary">Empty State Demo</h3>
        <TimetableView lockedCourses={[]} onToast={handleToast} />
      </div>
    </div>
  );
}
