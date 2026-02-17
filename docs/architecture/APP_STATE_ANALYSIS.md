# App.jsx Component Structure & State Management Analysis

**Generated:** 2026-02-17
**Task:** T1.1.1 - Analyze App.jsx component structure and extract state management patterns

---

## 1. Component Hierarchy

```
App.jsx (Root Component)
├── ToastContainer (react-toastify)
├── header.app-header
│   └── App
│       └── app-title (logo + h1)
├── div.App (Main Content)
│   ├── div.header-controls
│   │   ├── div.app-controls (Theme/Palette toggles)
│   │   └── div.auto-schedule-controls (Generate buttons)
│   ├── div.timetable-section (Conditional)
│   │   └── TimetableView (React Component)
│   ├── div.section-container.user-preferences-section
│   │   ├── select (Search Mode)
│   │   ├── input (Max Units)
│   │   ├── select (Max Gap)
│   │   ├── checkbox (Minimize Days)
│   │   └── div.preferred-time-order-container (Drag reorder)
│   ├── div.section-container (Course Filters)
│   │   ├── TimeFilter (React Component)
│   │   └── div.section-type-filters (AP3/AP4/AP5 checkboxes)
│   ├── CourseTable (React Component)
│   └── div.section-container (Import Data)
│       └── RawDataInput (React Component)
└── ConfirmDialog (React Component - Modal)
```

---

## 2. useState Hooks Inventory (22 Total)

### Core Data State

| #   | State Variable       | Type          | Initial Value                                               | Purpose                                               |
| --- | -------------------- | ------------- | ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| 1   | `allCourses`         | `Course[]`    | `loadFromLocalStorage(COURSES, [])`                         | Master list of all imported courses                   |
| 2   | `excludedDays`       | `string[]`    | `loadFromLocalStorage(EXCLUDED_DAYS, [])`                   | Days to exclude from schedule (M, T, W, TH, F, S, SU) |
| 3   | `excludedTimeRanges` | `TimeRange[]` | `loadFromLocalStorage(EXCLUDED_RANGES, [{id, start, end}])` | Time ranges to exclude                                |
| 4   | `rawData`            | `string`      | `''`                                                        | Raw input text for import                             |
| 5   | `processedCourses`   | `Course[]     | GroupedCourse[]`                                            | `[]`                                                  | Filtered/grouped courses for display |

### Theme State

| #   | State Variable | Type                            | Initial Value                                | Purpose                                    |
| --- | -------------- | ------------------------------- | -------------------------------------------- | ------------------------------------------ | ------------------ |
| 6   | `theme`        | `'light'                        | 'dark'`                                      | `loadFromLocalStorage(THEME, 'dark')`      | Current theme mode |
| 7   | `themePalette` | `{light: string, dark: string}` | `loadFromLocalStorage(THEME_PALETTE, {...})` | Palette per theme (original/comfort/space) |

### Filter/Preference State

| #   | State Variable            | Type       | Initial Value                                   | Purpose                     |
| --- | ------------------------- | ---------- | ----------------------------------------------- | --------------------------- | --------------------------------------------- | ----------------------------- | ----------------------------- |
| 8   | `groupingKey`             | `'none'    | 'subject'                                       | 'offeringDept'`             | `loadFromLocalStorage(GROUPING, 'subject')`   | How to group courses in table |
| 9   | `selectedSectionTypes`    | `string[]` | `loadFromLocalStorage(SECTION_TYPES, [])`       | AP3/AP4/AP5 filter          |
| 10  | `selectedStatusFilter`    | `'all'     | 'open'                                          | 'closed'`                   | `loadFromLocalStorage(STATUS_FILTER, 'open')` | Course status filter          |
| 11  | `maxUnits`                | `string`   | `loadFromLocalStorage(MAX_UNITS, '')`           | Maximum units constraint    |
| 12  | `maxClassGapHours`        | `string`   | `loadFromLocalStorage(MAX_CLASS_GAP_HOURS, '')` | Maximum gap between classes |
| 13  | `preferredTimeOfDayOrder` | `string[]` | `loadFromLocalStorage(...)                      | DEFAULT`                    | Preferred time ordering                       |
| 14  | `scheduleSearchMode`      | `'fast'    | 'exhaustive'                                    | 'partial'`                  | `loadFromLocalStorage(...)                    | 'partial'`                    | Schedule generation algorithm |
| 15  | `minimizeDaysOnCampus`    | `boolean`  | `loadFromLocalStorage(...)                      | false`                      | Prefer fewer campus days                      |

### UI State

| #   | State Variable               | Type          | Initial Value | Purpose                                |
| --- | ---------------------------- | ------------- | ------------- | -------------------------------------- |
| 16  | `conflictingLockedCourseIds` | `Set<string>` | `new Set()`   | IDs of courses with schedule conflicts |
| 17  | `showTimetable`              | `boolean`     | `false`       | Toggle timetable visibility            |
| 18  | `generatedScheduleCount`     | `number`      | `0`           | Count of generated schedules           |
| 19  | `generatedSchedules`         | `string[][]`  | `[]`          | Array of schedule key arrays           |
| 20  | `currentScheduleIndex`       | `number`      | `0`           | Index of currently displayed schedule  |
| 21  | `isGenerating`               | `boolean`     | `false`       | Loading state for schedule generation  |

### Dialog State

| #   | State Variable  | Type          | Initial Value                                      | Purpose                      |
| --- | --------------- | ------------- | -------------------------------------------------- | ---------------------------- |
| 22  | `confirmDialog` | `DialogState` | `{open, title, message, onConfirm, onCancel, ...}` | Confirm dialog configuration |

### useRef

| Variable                    | Type          | Purpose                                                      |
| --------------------------- | ------------- | ------------------------------------------------------------ |
| `triedScheduleCombinations` | `Set<string>` | Track tried schedule combinations (persisted across renders) |

### useMemo

| Variable             | Dependencies    | Purpose                                    |
| -------------------- | --------------- | ------------------------------------------ |
| `lockedCourses`      | `allCourses`    | Filtered list of locked courses            |
| `lockedCoursesCount` | `lockedCourses` | Count of locked courses                    |
| `totalUnits`         | `lockedCourses` | Sum of locked course units                 |
| `uniqueSubjects`     | `lockedCourses` | Count of unique subjects in locked courses |

---

## 3. Prop Drilling Patterns

### Data Flow: App.jsx → Child Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              App.jsx (State Owner)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  TimeFilter   │           │  CourseTable  │           │ TimetableView │
├───────────────┤           ├───────────────┤           ├───────────────┤
│ Props IN:     │           │ Props IN:     │           │ Props IN:     │
│ - excludedDays│           │ - courses     │           │ - lockedCourses│
│ - excludedTime│           │ - allCoursesCount│        │ - conflictingIds│
│   Ranges      │           │ - groupingKey │           └───────────────┘
│               │           │ - selectedStatus│
│ Props OUT:   │           │ - conflictingIds│
│ - onDayChange │           │ - totalUnits  │
│ - onTimeRange │           │ - uniqueSubjects│
│   Change      │           │ - lockedCount │
│ - onAddRange  │           │               │
│ - onRemoveRange│          │ Props OUT:    │
└───────────────┘           │ - onGroupingChange│
                            │ - onStatusFilter│
                            │ - onDeleteCourse│
                            │ - onToggleLock │
                            │ - onClearAllLocks│
                            │ - onDeleteAll │
                            └───────────────┘
        │
        ▼
┌───────────────┐           ┌───────────────┐
│  RawDataInput │           │ ConfirmDialog │
├───────────────┤           ├───────────────┤
│ Props IN:     │           │ Props IN:     │
│ - value       │           │ - open        │
│               │           │ - title       │
│ Props OUT:    │           │ - message     │
│ - onChange    │           │ - confirmText │
│ - onSubmit    │           │ - cancelText  │
└───────────────┘           │ - onConfirm   │
                            │ - onCancel    │
                            └───────────────┘
```

### Prop Drilling Depth Analysis

| Component     | Prop Count | Props from App | Props Drilled Further |
| ------------- | ---------- | -------------- | --------------------- |
| TimeFilter    | 5          | 5 (all)        | 0                     |
| CourseTable   | 14         | 14 (all)       | 0                     |
| TimetableView | 2          | 2 (all)        | 0                     |
| RawDataInput  | 3          | 3 (all)        | 0                     |
| ConfirmDialog | 7          | 7 (all)        | 0                     |

**Analysis:** No deep prop drilling exists. All components receive props directly from App.jsx with maximum depth of 1. This is a flat component architecture.

---

## 4. Side Effects (useEffect) Analysis

### Persistence Effects (13 total - one per localStorage key)

| #   | Effect                                                      | Dependencies                | Purpose                 |
| --- | ----------------------------------------------------------- | --------------------------- | ----------------------- |
| 1   | `localStorage.setItem(COURSES, JSON.stringify(allCourses))` | `[allCourses]`              | Persist courses         |
| 2   | `localStorage.setItem(EXCLUDED_DAYS, ...)`                  | `[excludedDays]`            | Persist excluded days   |
| 3   | `localStorage.setItem(EXCLUDED_RANGES, ...)`                | `[excludedTimeRanges]`      | Persist time ranges     |
| 4   | Theme + DOM attribute update                                | `[theme, themePalette]`     | Apply theme to document |
| 5   | `localStorage.setItem(THEME_PALETTE, ...)`                  | `[themePalette]`            | Persist palette         |
| 6   | `localStorage.setItem(GROUPING, ...)`                       | `[groupingKey]`             | Persist grouping        |
| 7   | `localStorage.setItem(SECTION_TYPES, ...)`                  | `[selectedSectionTypes]`    | Persist section types   |
| 8   | `localStorage.setItem(STATUS_FILTER, ...)`                  | `[selectedStatusFilter]`    | Persist status filter   |
| 9   | `localStorage.setItem(MAX_UNITS, ...)`                      | `[maxUnits]`                | Persist max units       |
| 10  | `localStorage.setItem(MAX_CLASS_GAP, ...)`                  | `[maxClassGapHours]`        | Persist max gap         |
| 11  | `localStorage.setItem(PREFERRED_TIME, ...)`                 | `[preferredTimeOfDayOrder]` | Persist time preference |
| 12  | `localStorage.setItem(SEARCH_MODE, ...)`                    | `[scheduleSearchMode]`      | Persist search mode     |
| 13  | `localStorage.setItem(MINIMIZE_DAYS, ...)`                  | `[minimizeDaysOnCampus]`    | Persist minimize flag   |

### Computed State Effects

| #   | Effect                               | Dependencies                                                                                              | Purpose                                        |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 14  | `setProcessedCourses(...)`           | `[allCourses, excludedDays, excludedTimeRanges, groupingKey, selectedSectionTypes, selectedStatusFilter]` | Filter and group courses for display           |
| 15  | `setConflictingLockedCourseIds(...)` | `[allCourses]`                                                                                            | Detect schedule conflicts among locked courses |
| 16  | `setCurrentScheduleIndex(...)`       | `[generatedSchedules, currentScheduleIndex]`                                                              | Keep schedule index in bounds                  |

---

## 5. Event Handlers

### Course Management

- `handleDeleteCourse(courseIdentity)` - Remove single course
- `handleDeleteAllCourses()` - Remove all courses (with confirmation)
- `handleToggleLockCourse(courseIdentity)` - Toggle course lock status
- `handleClearAllLocks()` - Unlock all courses

### Data Import

- `handleLoadRawData(mode)` - Parse and import course data

### Filter/Preference Handlers

- `handleDayChange(dayCode, isChecked)` - Toggle excluded day
- `handleTimeRangeChange(id, field, value)` - Update time range
- `handleAddTimeRange()` - Add new time range
- `handleRemoveTimeRange(id)` - Remove time range
- `handleGroupingChange(event)` - Change grouping mode
- `handleSectionTypeChange(typeId, isSelected)` - Toggle section type
- `handleStatusFilterChange(statusValue)` - Change status filter
- `handleMaxUnitsChange(e)` - Update max units
- `handleMaxClassGapHoursChange(e)` - Update max gap
- `handleRemoveTimePref(index)` - Remove time preference
- `handleResetTimePrefs()` - Reset to defaults
- `handleAddTimePref(time)` - Add time preference

### Theme Handlers

- `handleToggleTheme()` - Switch light/dark
- `handleTogglePalette()` - Cycle through palettes

### Schedule Generation

- `generateBestSchedule()` - Main schedule generation (async)
- `handleNextSchedule()` - Navigate to next schedule
- `handlePrevSchedule()` - Navigate to previous schedule
- `handleClearGeneratedSchedules()` - Reset schedules
- `toggleTimetable()` - Toggle timetable visibility
- `applyScheduleByIndex(index)` - Apply schedule by index

---

## 6. Scheduling Algorithms (Defined in App.jsx)

These are pure functions that should be extracted to separate modules:

| Function                                               | Purpose                                      | Lines |
| ------------------------------------------------------ | -------------------------------------------- | ----- |
| `checkTimeOverlap(start1, end1, start2, end2)`         | Check if two time ranges overlap             | ~7    |
| `isScheduleConflictFree(schedule, parseFn, overlapFn)` | Check schedule for conflicts                 | ~30   |
| `getTimeOfDayBucket(time)`                             | Categorize time as morning/afternoon/evening | ~7    |
| `scoreScheduleByTimePreference(schedule, prefOrder)`   | Score schedule by time preference            | ~15   |
| `exceedsMaxUnits(schedule, maxUnits)`                  | Check if schedule exceeds unit limit         | ~7    |
| `exceedsMaxGap(schedule, maxGapHours)`                 | Check if schedule has too large gaps         | ~28   |
| `countCampusDays(schedule)`                            | Count unique on-campus days                  | ~17   |
| `generateExhaustiveBestSchedule(...)`                  | Exhaustive search algorithm                  | ~80   |
| `getAllSubsets(arr)`                                   | Generate all subsets                         | ~10   |
| `generateBestPartialSchedule_Heuristic(...)`           | Heuristic partial schedule                   | ~110  |
| `generateBestPartialSchedule(...)`                     | Main partial schedule generator              | ~60   |

**Total algorithm code:** ~370 lines

---

## 7. LocalStorage Keys

| Key                                  | Type            | Purpose               |
| ------------------------------------ | --------------- | --------------------- | ---------------- |
| `courseBuilder_allCourses`           | `Course[]`      | Persisted course data |
| `courseBuilder_excludedDays`         | `string[]`      | Excluded day codes    |
| `courseBuilder_excludedTimeRanges`   | `TimeRange[]`   | Excluded time ranges  |
| `courseBuilder_theme`                | `'light'        | 'dark'`               | Theme preference |
| `courseBuilder_themePalette`         | `{light, dark}` | Palette per theme     |
| `courseBuilder_groupingKey`          | `string`        | Table grouping mode   |
| `courseBuilder_selectedSectionTypes` | `string[]`      | Section type filter   |
| `courseBuilder_selectedStatusFilter` | `string`        | Status filter         |
| `courseBuilder_maxUnits`             | `string`        | Max units constraint  |
| `courseBuilder_maxClassGapHours`     | `string`        | Max gap constraint    |
| `courseBuilder_preferredTimeOfDay`   | `string[]`      | Time preference order |
| `courseBuilder_scheduleSearchMode`   | `string`        | Search algorithm mode |
| `courseBuilder_minimizeDaysOnCampus` | `boolean`       | Minimize campus days  |

---

## 8. Migration Recommendations

### State Extraction Candidates

1. **useCourseState hook** - Extract course-related state:
   - `allCourses`, `processedCourses`, `groupingKey`, `selectedStatusFilter`, `selectedSectionTypes`

2. **useFilterState hook** - Extract filter-related state:
   - `excludedDays`, `excludedTimeRanges`, `maxUnits`, `maxClassGapHours`

3. **useThemeState hook** - Extract theme state:
   - `theme`, `themePalette`

4. **useScheduleGenerationState hook** - Extract generation state:
   - `generatedSchedules`, `currentScheduleIndex`, `generatedScheduleCount`, `isGenerating`

5. **useLocalStorage hook** - Generic localStorage persistence hook

### Algorithm Extraction

All 11 scheduling algorithms should be moved to:

- `src/utils/scheduleAlgorithms.ts` or
- `src/algorithms/scheduleGeneration.ts`

### TypeScript Interface Needs

```typescript
interface Course {
  id: string;
  subject: string;
  subjectTitle: string;
  section: string;
  schedule: string;
  room: string;
  units: string;
  creditedUnits?: string;
  isLocked: boolean;
  isClosed: boolean;
  enrolled: number;
  assessed: number;
  totalSlots: number;
  availableSlots: number;
  offeringDept?: string;
}

interface TimeRange {
  id: number;
  start: string;
  end: string;
}

interface GroupedCourse {
  groupValue: string;
  courses: Course[];
}

interface DialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  confirmText: string;
  cancelText: string;
}
```

---

## 9. Key Findings

1. **Flat Architecture**: No prop drilling beyond 1 level - all components are direct children of App.jsx
2. **Heavy State Concentration**: 22 useState hooks in single component - needs extraction
3. **13 localStorage Persistence Effects**: One per persisted state variable
4. **Pure Algorithm Functions**: 11 scheduling algorithms (~370 lines) should be extracted
5. **No External State Management**: Using only React built-in state (localStorage for persistence)
6. **useMemo for Derived State**: Locked courses and totals are properly memoized
7. **useRef for Session State**: `triedScheduleCombinations` persists without causing re-renders
