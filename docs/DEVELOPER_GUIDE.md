# CIT-U Course Builder Developer Guide

This guide provides comprehensive documentation for developers working on the CIT-U Course Builder application. It covers local development setup, testing approaches, component structure, and utility functions.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing Approach](#testing-approach)
5. [Component Architecture](#component-architecture)
6. [Utility Functions](#utility-functions)
7. [State Management](#state-management)
8. [Theme System](#theme-system)
9. [Debugging Tips](#debugging-tips)

---

## Local Development Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Bun**: v1.0.0 or higher (recommended package manager)
- **Git**: For version control

### Initial Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/MasuRii/CITUCourseBuilder.git
   cd CITUCourseBuilder
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Navigate to the Astro project:**

   ```bash
   cd course-scheduler-astro
   bun install
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   ```

The application will be available at `http://localhost:4321/CITUCourseBuilder/`

### Available Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `bun run dev`        | Start development server with hot reload |
| `bun run build`      | Build for production                     |
| `bun run preview`    | Preview production build locally         |
| `bun run typecheck`  | Run TypeScript type checking             |
| `bun run test`       | Run unit tests once                      |
| `bun run test:watch` | Run tests in watch mode                  |
| `bun run test:e2e`   | Run E2E tests with Playwright            |

### Root-Level Scripts

| Script                 | Description                        |
| ---------------------- | ---------------------------------- |
| `bun run lint`         | Run ESLint on all files            |
| `bun run lint:fix`     | Run ESLint with auto-fix           |
| `bun run format`       | Format all files with Prettier     |
| `bun run format:check` | Check formatting without modifying |

---

## Project Structure

```
CITUCourseBuilder/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── .husky/                     # Git hooks (pre-commit, commit-msg)
├── course-scheduler-astro/     # Primary application (Astro + React)
│   ├── src/
│   │   ├── algorithms/         # Scheduling algorithm re-exports
│   │   ├── components/         # React islands and Astro components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Astro layouts
│   │   ├── pages/              # Astro pages (routes)
│   │   ├── styles/             # Global CSS with Tailwind v4 theme
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Core utility functions
│   ├── tests/                  # Test files
│   │   └── e2e/                # Playwright E2E tests
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── vitest.config.ts        # Unit test configuration
│   └── playwright.config.ts    # E2E test configuration
├── docs/
│   ├── architecture/           # Architecture documentation
│   │   └── decisions/          # Architecture Decision Records
│   ├── BRANCH_PROTECTION.md
│   └── DEVELOPER_GUIDE.md      # This file
├── package.json                # Root package.json (linting, formatting)
├── AGENTS.md                   # AI agent context file
└── README.md
```

### Key Directories

- **`src/components/`**: React island components (`.tsx`) and Astro components (`.astro`)
- **`src/hooks/`**: Custom React hooks for state management
- **`src/utils/`**: Core utility functions (schedule parsing, data conversion, ICS generation)
- **`src/types/`**: TypeScript interfaces for all data structures
- **`src/styles/`**: Global CSS with Tailwind v4 theme configuration
- **`tests/`**: Unit tests (Vitest) and E2E tests (Playwright)

---

## Development Workflow

### Branch Strategy

- **main**: Production branch, protected with required status checks
- Feature branches should be created from `main` and merged via PR

### Commit Convention

This project uses [Conventional Commits 1.0.0](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, whitespace
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test additions/changes
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

**Example:**

```
feat(schedule): add support for hybrid class schedules

Add parsing support for hybrid schedules that combine F2F and online
time slots in a single schedule string.

Task-Id: T3.1.1
Refs: #123
```

### Pre-commit Hooks

The project uses Husky for automated checks:

1. **Pre-commit**: Runs ESLint and Prettier on staged files
2. **Commit-msg**: Validates commit message format

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Run all verification checks locally:
   ```bash
   bun run lint
   bun run typecheck
   bun run test
   bun run build
   ```
4. Push your branch and create a PR
5. Wait for CI checks to pass (lint, typecheck, test, build)
6. Request review and address feedback

---

## Testing Approach

The project has a comprehensive test suite with multiple testing layers:

### Test Categories

| Category            | Tool                     | Location                          | Purpose                              |
| ------------------- | ------------------------ | --------------------------------- | ------------------------------------ |
| Unit Tests          | Vitest                   | `tests/*.test.ts`                 | Utility functions, hooks, algorithms |
| Component Tests     | Vitest + Testing Library | `src/**/*.test.tsx`               | React component behavior             |
| Integration Tests   | Vitest + Testing Library | `tests/integration.test.tsx`      | User flows across components         |
| E2E Tests           | Playwright               | `tests/e2e/*.test.ts`             | Full user journeys                   |
| Visual Regression   | Playwright               | `tests/e2e/visual.test.ts`        | UI consistency                       |
| Accessibility Tests | axe-core + Playwright    | `tests/e2e/accessibility.test.ts` | WCAG compliance                      |
| Color Contrast      | Vitest                   | `tests/colorContrast.test.ts`     | WCAG AA contrast ratios              |

### Running Tests

```bash
# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test -- --coverage

# Run E2E tests
bun run test:e2e

# Run specific E2E test file
bun run test:e2e tests/e2e/smoke.test.ts

# Update visual regression snapshots
bun run test:e2e -- --update-snapshots
```

### Test Coverage

Current coverage: **91.9% line coverage**, **96.55% function coverage**

Coverage requirements:

- Utility functions: ≥ 80%
- Scheduling algorithms: ≥ 80%
- No `any` types in codebase

### Writing Tests

**Unit Test Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { parseSchedule } from '@/utils/parseSchedule';

describe('parseSchedule', () => {
  it('should parse a valid single-slot schedule', () => {
    const result = parseSchedule('MWF 7:30 AM - 9:00 AM');
    expect(result).not.toBeNull();
    expect(result!.days).toEqual(['M', 'W', 'F']);
    expect(result!.timeSlots[0].startTime).toBe('07:30');
  });
});
```

**Component Test Example:**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import RawDataInput from '@/components/RawDataInput';

describe('RawDataInput', () => {
  it('should call onSubmit when import button is clicked', async () => {
    const onSubmit = vi.fn();
    render(<RawDataInput value="" onChange={() => {}} onSubmit={onSubmit} />);

    const button = screen.getByRole('button', { name: /import/i });
    await userEvent.click(button);

    expect(onSubmit).toHaveBeenCalled();
  });
});
```

---

## Component Architecture

### Astro + React Islands

The application uses Astro 5.x with React 19 islands architecture:

- **Static content** is rendered as HTML (no JavaScript)
- **Interactive components** are React islands that hydrate on the client

### Hydration Strategies

| Directive        | When to Use                       | Examples                                      |
| ---------------- | --------------------------------- | --------------------------------------------- |
| `client:load`    | Immediate interactivity required  | App, RawDataInput, CourseTable, ConfirmDialog |
| `client:visible` | Lazy load when scrolled into view | TimeFilter, TimetableView                     |
| `client:idle`    | Load when browser is idle         | Non-critical features                         |

### Component Hierarchy

```
BaseLayout.astro
└── Header.astro
    └── ThemeToggle.tsx (React island)
└── App.tsx (React island, client:load)
    ├── RawDataInput.tsx
    ├── TimeFilter.tsx (client:visible)
    ├── CourseTable.tsx
    ├── TimetableView.tsx (client:visible)
    ├── ConfirmDialog.tsx
    └── Toast.tsx
```

### Component Conventions

1. **TypeScript Props**: All components have explicit prop interfaces with JSDoc comments
2. **No `any` Types**: Use strict TypeScript throughout
3. **Tailwind Styling**: Use theme-aware CSS custom properties (e.g., `bg-surface-primary`, `text-content-secondary`)
4. **Accessibility**: All interactive elements must be keyboard accessible with proper ARIA attributes
5. **Icons**: Use Lucide-react icons (not inline SVGs)

### Creating a New Component

1. Create the file in `src/components/`
2. Define TypeScript interface for props
3. Use Tailwind classes for styling
4. Add JSDoc comments for public APIs
5. Write tests in `tests/` or co-located `*.test.tsx`
6. Export from `src/components/index.ts` if needed

---

## Utility Functions

### Core Utilities

| File                    | Purpose                                     | Lines |
| ----------------------- | ------------------------------------------- | ----- |
| `parseSchedule.ts`      | Parse schedule strings into structured data | 467   |
| `parseRawData.ts`       | Parse WITS/AIMS course data                 | 398   |
| `scheduleAlgorithms.ts` | Schedule generation algorithms              | 640+  |
| `generateIcs.ts`        | ICS calendar file generation                | 134   |
| `convertToRawData.ts`   | Convert courses back to raw format          | 57    |

### parseSchedule

Parses schedule strings into structured `ParsedSchedule` objects.

```typescript
import { parseSchedule } from '@/utils/parseSchedule';

// Single slot schedule
const schedule = parseSchedule('MWF 7:30 AM - 9:00 AM LAB 601');
// Returns: { days: ['M', 'W', 'F'], timeSlots: [...], room: 'LAB 601', scheduleType: 'single' }

// Multi-slot schedule
const multi = parseSchedule('MWF 7:30-9:00 LAB 601; TTH 10:00-11:30 LEC 401');
// Returns: { days: [...], timeSlots: [slot1, slot2], scheduleType: 'multi' }

// TBA schedule
const tba = parseSchedule('TBA');
// Returns: { days: [], timeSlots: [], room: 'TBA', scheduleType: 'tba' }
```

**Important**: This function can return `null` for invalid schedules. Always check the result.

### parseRawData

Parses raw course data from WITS or AIMS formats.

```typescript
import { parseRawCourseData } from '@/utils/parseRawData';

// WITS HTML format
const courses = parseRawCourseData('<table>...</table>', 'WITS');

// AIMS tab-separated format
const courses = parseRawCourseData('ID\tSUBJECT\t...', 'AIMS');
```

### Scheduling Algorithms

Located in `scheduleAlgorithms.ts`, these functions handle schedule generation:

**Key Functions:**

- `checkTimeOverlap`: Check if two time ranges conflict
- `isScheduleConflictFree`: Verify a schedule has no conflicts
- `generateExhaustiveBestSchedule`: Find optimal schedule via exhaustive search
- `generateBestPartialSchedule`: Find best partial schedule with heuristics
- `exceedsMaxUnits`: Check unit limit
- `exceedsMaxGap`: Check gap between classes
- `countCampusDays`: Count unique days on campus

```typescript
import { checkTimeOverlap, generateExhaustiveBestSchedule } from '@/utils/scheduleAlgorithms';

// Check time overlap
const overlaps = checkTimeOverlap('07:30', '09:00', '08:00', '09:30');
// Returns: true

// Generate optimal schedule
const result = generateExhaustiveBestSchedule(
  courses, // Course[]
  lockedCourses, // Course[]
  parseSchedule, // ParseScheduleFunction
  checkTimeOverlap, // CheckTimeOverlapFunction
  maxUnits, // number
  maxGapHours, // number
  preferredTimeOrder // TimeOfDayBucket[]
);
```

### generateIcsContent

Generates iCalendar (.ics) file content from locked courses.

```typescript
import { generateIcsContent } from '@/utils/generateIcs';

const icsContent = generateIcsContent(lockedCourses, 'Fall 2024');
// Returns: Valid iCalendar format string
```

### Preserved Logic Files

⚠️ **Critical**: The following files contain logic that MUST NOT be modified:

1. `parseSchedule.ts` - Schedule string parsing
2. `parseRawData.ts` - Course data parsing
3. `generateIcs.ts` - ICS calendar generation
4. `convertToRawData.ts` - Raw data conversion
5. `scheduleAlgorithms.ts` - Scheduling algorithms

These are preserved from the original React application and must maintain identical behavior.

---

## State Management

The application uses React state with custom hooks. No external state library (Redux, Zustand, etc.) is used.

### Custom Hooks

| Hook                     | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `useLocalStorage`        | Generic localStorage persistence with validation |
| `useTheme`               | Theme/palette state with DOM sync                |
| `useCourseState`         | Course data, grouping, filtering, locking        |
| `useFilterState`         | Day/time exclusion filters                       |
| `useSchedulePreferences` | Time preference, search mode                     |
| `useScheduleGeneration`  | Transient state for schedule generation          |

### LocalStorage Keys

All keys use the `courseBuilder_` prefix:

| Key                                | Type               | Default                             |
| ---------------------------------- | ------------------ | ----------------------------------- |
| `courseBuilder_allCourses`         | Course[]           | []                                  |
| `courseBuilder_theme`              | 'light' \| 'dark'  | 'light'                             |
| `courseBuilder_palette`            | Palette            | 'original'                          |
| `courseBuilder_excludedDays`       | DayCode[]          | []                                  |
| `courseBuilder_excludedTimeRanges` | TimeRange[]        | []                                  |
| `courseBuilder_sectionTypes`       | string[]           | []                                  |
| `courseBuilder_statusFilter`       | StatusFilter       | 'open'                              |
| `courseBuilder_grouping`           | GroupingMode       | 'subject'                           |
| `courseBuilder_lockedCourses`      | Course[]           | []                                  |
| `courseBuilder_maxUnits`           | number             | 24                                  |
| `courseBuilder_maxGapHours`        | number             | 4                                   |
| `courseBuilder_preferredTimeOrder` | TimeOfDayBucket[]  | ['morning', 'afternoon', 'evening'] |
| `courseBuilder_searchMode`         | ScheduleSearchMode | 'partial'                           |

### Using Hooks

```typescript
import { useCourseState, useFilterState } from '@/hooks';

function MyComponent() {
  const { courses, lockedCourses, toggleLockCourse, deleteCourse } = useCourseState();

  const { excludedDays, toggleDayExclusion } = useFilterState();

  // ...
}
```

---

## Theme System

### Theme Combinations

The application supports 6 theme combinations:

| Theme | Palettes                 |
| ----- | ------------------------ |
| Light | Original, Comfort, Space |
| Dark  | Original, Comfort, Space |

### CSS Custom Properties

Theme colors are defined using CSS custom properties in `src/styles/global.css`:

```css
/* Semantic colors */
--color-surface-primary
--color-surface-secondary
--color-content-primary
--color-content-secondary
--color-accent
--color-border
```

### Theme Switching

Themes are applied via `data-theme` and `data-palette` attributes on `<html>`:

```typescript
// In useTheme hook
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-palette', 'space');
```

### Subject Colors

12 subject colors are defined for timetable visualization:

```css
--subject-1 through --subject-12
```

Use `getSubjectColor(subject)` utility to get consistent colors per subject.

---

## Debugging Tips

### Common Issues

1. **Import errors with `@types/*`**
   - Use `@/types/*` instead of `@types/*` for local type imports
   - The path alias `@types/*` conflicts with TypeScript's `@types/` package convention

2. **Component not hydrating**
   - Check that the hydration directive is correct
   - Ensure the component is imported with `.tsx` extension
   - Verify `client:visible` components are scrolled into view

3. **Theme flash on page load**
   - The inline script in `BaseLayout.astro` handles this
   - Ensure `is:inline` directive is used on the script

4. **localStorage not persisting**
   - Check the key has the `courseBuilder_` prefix
   - Verify the value passes validation in `useLocalStorage`

5. **E2E tests timing out**
   - Use `page.waitForSelector()` for dynamic content
   - Add `await page.waitForTimeout()` for animations
   - Disable Astro dev toolbar: `page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })`

### Useful Debug Commands

```bash
# Check TypeScript errors
bun run typecheck

# Check for any types
grep -r ": any" course-scheduler-astro/src/

# Run specific test file
bun run test tests/parseSchedule.test.ts

# Debug E2E tests
bun run test:e2e -- --debug

# View build output
bun run build && ls -la course-scheduler-astro/dist/
```

### VS Code Settings

Recommended settings for development:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "[astro]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Additional Resources

- [Architecture Documentation](./architecture/ARCHITECTURE.md)
- [React Islands Hydration Strategy](./architecture/REACT_ISLANDS_HYDRATION.md)
- [Scheduling Algorithms](./architecture/SCHEDULING_ALGORITHMS.md)
- [Test Coverage Baseline](./architecture/TEST_COVERAGE_BASELINE.md)
- [Performance Baseline](./architecture/PERFORMANCE_BASELINE.md)
- [CSS Architecture](./architecture/CSS_ARCHITECTURE.md)
- [ADR-001: Framework Migration](./architecture/decisions/ADR-001-framework-migration-approach.md)
- [ADR-002: UI Component Strategy](./architecture/decisions/ADR-002-ui-component-strategy.md)
- [ADR-003: State Management](./architecture/decisions/ADR-003-state-management-approach.md)
