---
title: "CITUCourseBuilder React to Astro Migration"
summary: "Migrate existing React course scheduler to Astro framework with modernized UI/UX while preserving all computation logic"
generator: "ralph-plan-command"
estimatedEffort: "7-10 days"
approach: "Incremental migration preserving logic, modernizing UI layer by layer"
assumptions:
  - CRITICAL: All JavaScript files MUST be converted to TypeScript with strict type safety
  - CRITICAL: All computation/parsing logic in parseSchedule.js, parseRawData.js, generateIcs.js, and convertToRawData.js must be preserved exactly with no modifications to function signatures or return types
  - CRITICAL: All existing features (smart import, course management, locking, filtering, schedule generation, timetable visualization, export options) must work identically after migration
  - CRITICAL: No manual human intervention allowed - all tasks must be executable by agents
  - The existing test suite (parseSchedule.test.js, parseRawData.test.js) provides ground truth for behavior verification
  - Deployment target remains GitHub Pages with /CITUCourseBuilder/ base path
  - Package manager remains Bun for consistency
  - UI aesthetic goal: "Built by a student for a hobby" - approachable, fun, playful but functional
  - React components can be wrapped as Astro islands for gradual migration
  - Tailwind CSS will replace the 2,599-line App.css with equivalent styling
  - MUI components will be replaced with custom Tailwind-styled components
  - Pre-commit hooks are currently missing and need to be added
  - WCAG 2.1 AA compliance is required for accessibility
---

# CITUCourseBuilder React to Astro Migration Plan

## Overview

This plan outlines the migration of the CITUCourseBuilder application from React 19 + Vite to Astro 5.x with enhanced UI/UX. The migration preserves all critical computation logic while modernizing the presentation layer. The result will be a faster, more accessible application with a playful "student hobby project" aesthetic while maintaining all existing functionality.

## Assumptions

### CRITICAL Constraints (Non-Negotiable)

| ID  | Assumption                                                    | Impact if Violated                                              |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| C1  | All functions in parseSchedule.js preserved exactly           | Schedule parsing breaks, conflicts with existing data           |
| C2  | All functions in parseRawData.js preserved exactly            | Data import fails, incompatibility with WITS/AIMS data          |
| C3  | All functions in generateIcs.js preserved exactly             | Calendar export breaks                                          |
| C4  | All functions in convertToRawData.js preserved exactly        | Data export format changes                                      |
| C5  | All scheduling algorithms in App.jsx preserved exactly        | Schedule generation produces different results                  |
| C6  | No manual human intervention required                         | Project cannot be completed autonomously                        |
| C7  | All JavaScript files converted to TypeScript with strict mode | Type safety failures, runtime errors from missing type checking |

### Technical Assumptions

| ID  | Assumption                        | Justification                               |
| --- | --------------------------------- | ------------------------------------------- |
| T1  | Bun remains package manager       | Existing CI/CD uses Bun; faster than npm    |
| T2  | GitHub Pages deployment unchanged | No infrastructure changes requested         |
| T3  | React islands approach valid      | Astro supports React integration            |
| T4  | Tailwind can replicate all CSS    | CSS custom properties map to Tailwind theme |
| T5  | Vitest remains test framework     | Existing tests use Vitest                   |

### UI/UX Assumptions

| ID  | Assumption                                            | Design Direction                               |
| --- | ----------------------------------------------------- | ---------------------------------------------- |
| U1  | "Hobby student" aesthetic means approachable, playful | Rounded corners, fun colors, casual typography |
| U2  | Light/dark theme support required                     | Existing feature, must be preserved            |
| U3  | Mobile responsiveness maintained                      | Existing feature, must be preserved            |
| U4  | MUI icons can be replaced with Lucide or Heroicons    | Modern icon library, smaller bundle            |

## Risks

| Risk ID | Description                                                                   | Likelihood | Impact | Mitigation                                                                                                |
| ------- | ----------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------- |
| R1      | Schedule generation algorithm produces different results after migration      | M          | H      | Create comprehensive test suite before migration; compare outputs                                         |
| R2      | Complex CSS theming (light/dark, palettes) difficult to replicate in Tailwind | M          | M      | Create Tailwind theme with CSS variables; incremental migration                                           |
| R3      | React-datepicker integration with Astro islands problematic                   | L          | M      | Evaluate alternatives; may need custom component                                                          |
| R4      | MUI components have no direct Tailwind equivalents                            | M          | M      | Build custom components with same UX                                                                      |
| R5      | html-to-image/jspdf compatibility with SSR                                    | L          | M      | Ensure client-side only rendering for export features                                                     |
| R6      | localStorage persistence in Astro context                                     | L          | L      | Astro islands have full client-side access                                                                |
| R7      | Performance regression during migration                                       | L          | M      | Establish baseline metrics; measure each phase                                                            |
| R8      | Bundle size increases with dual React + Astro                                 | M          | L      | Tree-shaking; remove unused MUI components                                                                |
| R9      | Type inference complexity for dynamic parsing functions                       | M          | M      | Create precise TypeScript interfaces for all data structures, use discriminated unions for schedule types |
| R10     | Third-party library type definitions missing                                  | L          | M      | Install @types/\* packages, create custom declaration files for untyped libraries                         |
| R11     | TypeScript strict mode revealing latent bugs                                  | M          | L      | Fix type errors incrementally, use // @ts-expect-error temporarily with TODO comments                     |

---

## Phase 1: Discovery & Analysis

### 1.1 Codebase Architecture Analysis [discovery]

- [ ] **T1.1.1**: Analyze App.jsx component structure and extract state management patterns [effort: M] [risk: L]
  - Document all useState hooks with their purposes
  - Map prop drilling patterns between components
  - Identify side effects and their dependencies
  - Create component hierarchy diagram
  - Acceptance criteria:
    - Complete list of 15+ useState hooks documented with types
    - Component dependency graph created
    - Data flow diagram saved to docs/architecture/
    - Update AGENTS.md with learnings

- [ ] **T1.1.2**: Catalog all scheduling algorithms and their dependencies [effort: M] [risk: L]
  - Document: checkTimeOverlap, isScheduleConflictFree, getTimeOfDayBucket, scoreScheduleByTimePreference, exceedsMaxUnits, exceedsMaxGap, countCampusDays, generateExhaustiveBestSchedule, getAllSubsets, generateBestPartialSchedule_Heuristic, generateBestPartialSchedule, loadFromLocalStorage
  - Create function signature documentation with TypeScript interfaces
  - Map algorithm dependencies and call graphs
  - Acceptance criteria:
    - All 12+ algorithm functions documented
    - TypeScript interface definitions created
    - Call graph diagram saved to docs/architecture/
    - Update AGENTS.md with learnings

- [ ] **T1.1.3**: Analyze CSS architecture and theming system [effort: M] [risk: L]
  - Document CSS custom properties structure
  - Map theme variables (light/dark palettes)
  - Identify component-specific styles vs global styles
  - Calculate CSS specificity patterns
  - Acceptance criteria:
    - Complete inventory of 100+ CSS custom properties
    - Theme switcher logic documented
    - Tailwind migration mapping created
    - Update AGENTS.md with learnings

- [ ] **T1.1.4**: Audit existing test coverage [effort: S] [risk: L]
  - Run existing test suite: `bun test`
  - Document current coverage percentage
  - Identify untested critical paths
  - Create coverage baseline report
  - Acceptance criteria:
    - Coverage report generated (target: baseline documented)
    - List of untested utility functions
    - Test gaps identified for scheduling algorithms
    - Update AGENTS.md with learnings

- [ ] **T1.1.5**: Document current performance metrics [effort: S] [risk: L]
  - Measure current bundle size
  - Measure build time
  - Measure Lighthouse scores (performance, accessibility, best practices, SEO)
  - Document memory usage patterns
  - Acceptance criteria:
    - Baseline bundle size ≤ 500KB gzipped (measure actual)
    - Build time baseline documented
    - Lighthouse scores captured (4 categories)
    - Update AGENTS.md with learnings

- [ ] **T1.1.6**: **[discovery] TypeScript Interface Design** - Design TypeScript interfaces for all data structures before conversion begins [effort: M] [risk: L]
  - Create interfaces for: Course, TimeSlot, Schedule, ParsedSchedule, DayCode, TimeRange, FilterState, AppState
  - Document all function signatures with parameter and return types
  - Create discriminated unions for schedule types (SingleSlot, MultiSlot, TBASchedule)
  - Create types file at src/types/index.ts with all interfaces exported
  - Acceptance criteria:
    - All interfaces documented with JSDoc comments
    - Interfaces compile without errors
    - Interfaces cover all existing data structures
    - Update AGENTS.md with learnings

### 1.2 Architecture Decision Records [discovery]

- [ ] **T1.2.1**: Create ADR for framework migration approach [effort: S] [risk: L]
  - Document decision: Astro with React islands
  - Consider alternatives: Next.js, pure Vite, Remix
  - Justify choice based on project requirements
  - Acceptance criteria:
    - ADR-001 saved to docs/architecture/decisions/
    - Alternatives table with pros/cons
    - Clear recommendation rationale
    - Update AGENTS.md with learnings

- [ ] **T1.2.2**: Create ADR for UI component strategy [effort: S] [risk: L]
  - Document decision: Custom Tailwind components replacing MUI
  - Consider alternatives: shadcn/ui, Headless UI, Radix
  - Address icon library replacement (Lucide/Heroicons)
  - Acceptance criteria:
    - ADR-002 saved to docs/architecture/decisions/
    - Component mapping table (MUI → Custom)
    - Icon replacement strategy documented
    - Update AGENTS.md with learnings

- [ ] **T1.2.3**: Create ADR for state management approach [effort: S] [risk: L]
  - Document decision: React state via islands + localStorage
  - Consider alternatives: Zustand, Jotai, Nanostores
  - Address SSR/CSR boundary for state
  - Acceptance criteria:
    - ADR-003 saved to docs/architecture/decisions/
    - State persistence strategy documented
    - SSR compatibility addressed
    - Update AGENTS.md with learnings

- [ ] **T1.2.4**: Create AGENTS.md file [effort: S] [risk: L]
  - Create docs/AGENTS.md with project context
  - Include critical file references
  - Document coding conventions
  - Add "gotchas" and important patterns
  - Acceptance criteria:
    - File exists at docs/AGENTS.md
    - Contains all critical file paths
    - Documents preserved logic files
    - Update AGENTS.md with learnings

---

## Phase 2: Foundation Setup

### 2.1 Astro Project Initialization [setup]

- [ ] **T2.1.1**: Initialize Astro project in parallel directory [effort: S] [risk: L]
  - Run: `bun create astro@latest course-scheduler-astro`
  - Select: React integration, Tailwind integration, TypeScript strict
  - Configure base path: /CITUCourseBuilder/
  - Acceptance criteria:
    - Project created at course-scheduler-astro/
    - package.json with Astro 5.x, React 19, Tailwind 4.x
    - astro.config.mjs configured with correct base
    - Update AGENTS.md with learnings

- [ ] **T2.1.2**: Configure Astro for React islands [effort: S] [risk: L]
  - Add @astrojs/react integration
  - Configure client:load, client:visible directives
  - Set up hydration strategies per component
  - Acceptance criteria:
    - React integration working
    - Test island renders correctly
    - Hydration config documented
    - Update AGENTS.md with learnings

- [ ] **T2.1.3**: **[setup] TypeScript Configuration** - Configure TypeScript with strict mode for the entire project [effort: S] [risk: M]
  - Install TypeScript and @types packages for React, React-DOM, and other dependencies
  - Create tsconfig.json with strict: true, noImplicitAny: true, strictNullChecks: true
  - Configure Astro's TypeScript integration
  - Add type-check script to package.json: "typecheck": "tsc --noEmit"
  - Acceptance criteria:
    - TypeScript compiles with zero errors (exit code 0)
    - All @types/\* packages installed and resolved
    - typecheck script added and passing
    - Update AGENTS.md with learnings

- [ ] **T2.1.4**: Configure Tailwind CSS with custom theme [effort: M] [risk: M]
  - Create tailwind.config.mjs with design tokens
  - Define color palette matching existing themes
  - Configure dark mode with class strategy
  - Set up custom utilities for existing patterns
  - Acceptance criteria:
    - Tailwind config with all design tokens
    - Dark mode toggle working
    - Color palette matches existing CSS variables
    - Update AGENTS.md with learnings

- [ ] **T2.1.5**: Set up project structure [effort: S] [risk: L]

  ```
  course-scheduler-astro/
  ├── src/
  │   ├── components/        # React components (islands)
  │   ├── layouts/           # Astro layouts
  │   ├── pages/             # Astro pages
  │   ├── styles/            # Global styles
  │   ├── utils/             # Preserved utility functions
  │   ├── hooks/             # Custom React hooks
  │   ├── types/             # TypeScript definitions
  │   └── assets/            # Static assets
  ├── public/                # Static files
  └── tests/                 # Test files
  ```

  - Acceptance criteria:
    - Directory structure created
    - TypeScript config paths set up
    - Import aliases configured
    - Update AGENTS.md with learnings

### 2.2 Pre-commit Hooks Setup [setup]

- [ ] **T2.2.1**: Install and configure lint-staged [effort: S] [risk: L]
  - Install: `bun add -d lint-staged`
  - Configure package.json with lint-staged rules
  - Set up file patterns for .js, .jsx, .ts, .tsx, .astro
  - Acceptance criteria:
    - lint-staged installed and configured
    - Runs on .js, .jsx, .ts, .tsx, .astro files
    - Configuration in package.json
    - Update AGENTS.md with learnings

- [ ] **T2.2.2**: Install and configure husky [effort: S] [risk: L]
  - Install: `bun add -d husky`
  - Initialize: `bunx husky init`
  - Add pre-commit hook running lint-staged
  - Add commit-msg hook for conventional commits
  - Acceptance criteria:
    - .husky/pre-commit runs lint-staged
    - .husky/commit-msg validates format
    - Hooks execute on git commit
    - Update AGENTS.md with learnings

- [ ] **T2.2.3**: Configure ESLint for Astro + React [effort: S] [risk: L]
  - Install: `bun add -d eslint @eslint/js eslint-plugin-astro eslint-plugin-react`
  - Create eslint.config.js with Astro + React rules
  - Configure React hooks rules
  - Acceptance criteria:
    - ESLint configured for .astro, .jsx, .tsx
    - No linting errors on initial setup
    - Rules match existing project style
    - Update AGENTS.md with learnings

- [ ] **T2.2.4**: Configure Prettier with Astro plugin [effort: S] [risk: L]
  - Install: `bun add -d prettier prettier-plugin-astro`
  - Create .prettierrc with formatting rules
  - Add format script to package.json
  - Acceptance criteria:
    - Prettier formats .astro files correctly
    - Consistent formatting across all files
    - Format script works: `bun run format`
    - Update AGENTS.md with learnings

### 2.3 CI/CD Update [setup]

- [ ] **T2.3.1**: Update GitHub Actions workflow for Astro [effort: S] [risk: L]
  - Modify .github/workflows/deploy.yml
  - Update build command for Astro
  - Update artifact path to Astro dist/
  - Add test step to CI pipeline
  - Acceptance criteria:
    - Workflow builds Astro project
    - Tests run in CI
    - Deployment to GitHub Pages works
    - Build completes in ≤ 30 seconds
    - Update AGENTS.md with learnings

- [ ] **T2.3.2**: Add CI status checks [effort: S] [risk: L]
  - Configure branch protection rules (document for manual setup)
  - Add lint check to CI
  - Add test check to CI
  - Add build check to CI
  - Acceptance criteria:
    - All 3 checks defined in workflow
    - Documentation for branch protection
    - CI fails on test/lint/build failure
    - Update AGENTS.md with learnings

---

## Phase 3: Core Migration

### 3.1 Utility Functions Migration (PRESERVED) [impl]

- [ ] **T3.1.1**: **[impl] Migrate parseSchedule.js to TypeScript** - Convert parseSchedule.js to parseSchedule.ts with full type safety while preserving ALL logic exactly [effort: M] [risk: M]
  - Copy course-scheduler-web/src/utils/parseSchedule.js to course-scheduler-astro/src/utils/parseSchedule.ts
  - Add explicit parameter and return types to all functions
  - Preserve ALL logic exactly with no modifications
  - Use interfaces from T1.1.6 for data structures
  - Acceptance criteria:
    - File renamed to .ts extension
    - All functions have explicit parameter and return types
    - No `any` types used (strict mode compliant)
    - TypeScript compiles with zero errors
    - Logic identical to original
    - Update AGENTS.md with learnings

- [ ] **T3.1.2**: **[impl] Migrate parseRawData.js to TypeScript** - Convert parseRawData.js to parseRawData.ts with full type safety while preserving ALL logic exactly [effort: M] [risk: M]
  - Copy course-scheduler-web/src/utils/parseRawData.js to course-scheduler-astro/src/utils/parseRawData.ts
  - Add explicit parameter and return types to all functions
  - Preserve ALL logic exactly with no modifications
  - Use interfaces from T1.1.6 for data structures
  - Acceptance criteria:
    - File renamed to .ts extension
    - All functions have explicit parameter and return types
    - No `any` types used (strict mode compliant)
    - TypeScript compiles with zero errors
    - Logic identical to original
    - Update AGENTS.md with learnings

- [ ] **T3.1.3**: **[impl] Migrate generateIcs.js to TypeScript** - Convert generateIcs.js to generateIcs.ts with full type safety while preserving ALL logic exactly [effort: M] [risk: M]
  - Copy course-scheduler-web/src/utils/generateIcs.js to course-scheduler-astro/src/utils/generateIcs.ts
  - Add explicit parameter and return types to all functions
  - Preserve ALL logic exactly with no modifications
  - Use interfaces from T1.1.6 for data structures
  - Acceptance criteria:
    - File renamed to .ts extension
    - All functions have explicit parameter and return types
    - No `any` types used (strict mode compliant)
    - TypeScript compiles with zero errors
    - Logic identical to original
    - Update AGENTS.md with learnings

- [ ] **T3.1.4**: **[impl] Migrate convertToRawData.js to TypeScript** - Convert convertToRawData.js to convertToRawData.ts with full type safety while preserving ALL logic exactly [effort: M] [risk: M]
  - Copy course-scheduler-web/src/utils/convertToRawData.js to course-scheduler-astro/src/utils/convertToRawData.ts
  - Add explicit parameter and return types to all functions
  - Preserve ALL logic exactly with no modifications
  - Use interfaces from T1.1.6 for data structures
  - Acceptance criteria:
    - File renamed to .ts extension
    - All functions have explicit parameter and return types
    - No `any` types used (strict mode compliant)
    - TypeScript compiles with zero errors
    - Logic identical to original
    - Update AGENTS.md with learnings

- [ ] **T3.1.5**: Extract scheduling algorithms from App.jsx to TypeScript [effort: M] [risk: M]
  - Create src/utils/scheduleAlgorithms.ts
  - Extract: checkTimeOverlap, isScheduleConflictFree, getTimeOfDayBucket, scoreScheduleByTimePreference, exceedsMaxUnits, exceedsMaxGap, countCampusDays, generateExhaustiveBestSchedule, getAllSubsets, generateBestPartialSchedule_Heuristic, generateBestPartialSchedule
  - Copy EXACTLY with no modifications to logic
  - Add explicit TypeScript types using interfaces from T1.1.6
  - Acceptance criteria:
    - All 12 functions extracted with explicit types
    - Logic identical to original
    - No `any` types used
    - Unit tests pass for all functions
    - Export statement added
    - Update AGENTS.md with learnings

- [ ] **T3.1.6**: Copy existing tests for utilities and convert to TypeScript [effort: XS] [risk: L]
  - Copy parseSchedule.test.js to new project as parseSchedule.test.ts
  - Copy parseRawData.test.js to new project as parseRawData.test.ts
  - Verify tests pass: `bun test`
  - Acceptance criteria:
    - Both test files copied and converted to .ts
    - All existing tests pass
    - Coverage matches baseline
    - Update AGENTS.md with learnings

- [ ] **T3.1.7**: Create comprehensive test suite for scheduling algorithms [effort: L] [risk: M]
  - Create scheduleAlgorithms.test.ts
  - Test checkTimeOverlap with edge cases
  - Test isScheduleConflictFree with various schedules
  - Test generateExhaustiveBestSchedule with known inputs
  - Test generateBestPartialSchedule with heuristic scenarios
  - Test exceedsMaxUnits and exceedsMaxGap
  - Acceptance criteria:
    - Test coverage ≥ 80% for all scheduling functions
    - All edge cases covered (TBA, multi-slot, hybrid)
    - Tests pass: `bun test`
    - Update AGENTS.md with learnings

- [ ] **T3.1.8**: **[impl] Extract and Type Scheduling Algorithms** - Extract all scheduling algorithms from App.jsx to TypeScript modules with strict typing [effort: L] [risk: M]
  - Create src/algorithms/scheduleGeneration.ts
  - Extract: checkTimeOverlap, isScheduleConflictFree, getTimeOfDayBucket, scoreScheduleByTimePreference, exceedsMaxUnits, exceedsMaxGap, countCampusDays, generateExhaustiveBestSchedule, getAllSubsets, generateBestPartialSchedule_Heuristic, generateBestPartialSchedule
  - All functions have explicit parameter and return types
  - Create ScheduleAlgorithmOptions interface for generation parameters
  - Acceptance criteria:
    - All algorithms compile with strict mode (zero errors)
    - All existing tests pass after extraction
    - No `any` types used
    - Update AGENTS.md with learnings

### 3.2 React Components Migration [impl]

- [ ] **T3.2.1**: Create Astro base layout [effort: S] [risk: L]
  - Create src/layouts/BaseLayout.astro
  - Include HTML head with meta tags
  - Include theme initialization script
  - Include global styles
  - Acceptance criteria:
    - Layout renders correctly
    - Theme toggle works
    - All meta tags present
    - Update AGENTS.md with learnings

- [ ] **T3.2.2**: Create Header component (Astro) [effort: S] [risk: L]
  - Create src/components/Header.astro
  - Include logo, title, theme toggle
  - Responsive navigation
  - Acceptance criteria:
    - Header renders in layout
    - Theme toggle functional
    - Mobile responsive
    - Update AGENTS.md with learnings

- [ ] **T3.2.3**: Migrate RawDataInput as React island [effort: M] [risk: L]
  - Create src/components/RawDataInput.tsx
  - Convert to TypeScript with explicit prop types
  - Use Tailwind styling
  - Remove MUI dependencies
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Component renders in Astro page
    - All functionality preserved
    - Tailwind styled, no MUI
    - Update AGENTS.md with learnings

- [ ] **T3.2.4**: Migrate ConfirmDialog as React island [effort: S] [risk: L]
  - Create src/components/ConfirmDialog.tsx
  - Convert to TypeScript with explicit prop types
  - Use Tailwind styling
  - Add keyboard accessibility (Escape to close)
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Dialog renders correctly
    - Keyboard accessible
    - Tailwind styled
    - Update AGENTS.md with learnings

- [ ] **T3.2.5**: Migrate TimeFilter as React island [effort: M] [risk: M]
  - Create src/components/TimeFilter.tsx
  - Convert to TypeScript with explicit prop types
  - Replace react-datepicker with custom Tailwind time picker
  - Use Tailwind styling
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Day exclusion checkboxes work
    - Time range picker functional
    - Tailwind styled, no react-datepicker
    - Update AGENTS.md with learnings

- [ ] **T3.2.6**: Migrate CourseTable as React island [effort: L] [risk: M]
  - Create src/components/CourseTable.tsx
  - Convert to TypeScript with explicit prop types
  - Use Tailwind styling
  - Remove MUI Menu, MenuItem, IconButton, Tooltip
  - Replace with custom dropdown and icons
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Table renders with all columns
    - Grouping functionality preserved
    - Status filter buttons work
    - Export menu functional
    - Lock/unlock buttons work
    - Tailwind styled, no MUI
    - Update AGENTS.md with learnings

- [ ] **T3.2.7**: Migrate TimetableView as React island [effort: L] [risk: M]
  - Create src/components/TimetableView.tsx
  - Convert to TypeScript with explicit prop types
  - Use Tailwind styling
  - Remove MUI dependencies
  - Ensure html-to-image and jspdf work client-side only
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Timetable grid renders correctly
    - Time slots display properly
    - Export as PNG works
    - Export as PDF works
    - Export as ICS works
    - Tailwind styled, no MUI
    - Update AGENTS.md with learnings

- [ ] **T3.2.8**: Extract state management from App.jsx [effort: L] [risk: H]
  - Create src/hooks/useCourseState.ts hook
  - Extract all useState hooks to custom hook
  - Create src/hooks/useLocalStorage.ts hook
  - Create src/hooks/useTheme.ts hook
  - Acceptance criteria:
    - All state extracted to hooks
    - LocalStorage persistence works
    - Theme switching works
    - Update AGENTS.md with learnings

- [ ] **T3.2.9**: Create main App island [effort: L] [risk: H]
  - Create src/components/App.tsx
  - Integrate all child components
  - Connect state hooks
  - Implement all event handlers
  - Acceptance criteria:
    - App component converted to .tsx
    - All state variables have explicit types
    - All event handlers have explicit parameter types
    - No `any` types used
    - All components integrated
    - All features functional
    - State management working
    - Schedule generation working
    - Update AGENTS.md with learnings

- [ ] **T3.2.10**: Create main index page [effort: S] [risk: L]
  - Create src/pages/index.astro
  - Import BaseLayout
  - Mount App island with client:load
  - Acceptance criteria:
    - Page renders correctly
    - App island hydrates
    - All features accessible
    - Update AGENTS.md with learnings

### 3.3 Feature Verification [impl]

- [ ] **T3.3.1**: Verify smart data import [effort: S] [risk: L]
  - Test WITS HTML table import
  - Test AIMS tab-separated import
  - Test compact variation import
  - Test space-separated import
  - Acceptance criteria:
    - All import formats work identically to original
    - Course data parsed correctly
    - Update AGENTS.md with learnings

- [ ] **T3.3.2**: Verify course management [effort: S] [risk: L]
  - Test grouping by subject/department/none
  - Test status filtering (all/open/closed)
  - Test course deletion (single/all)
  - Acceptance criteria:
    - All grouping modes work
    - Status filtering correct
    - Deletion works
    - Update AGENTS.md with learnings

- [ ] **T3.3.3**: Verify course locking [effort: S] [risk: L]
  - Test lock/unlock toggle
  - Test conflict detection
  - Test conflict warning dialog
  - Test available slots check
  - Acceptance criteria:
    - Locking works correctly
    - Conflicts detected and highlighted
    - Warning dialog shows conflicts
    - Update AGENTS.md with learnings

- [ ] **T3.3.4**: Verify filtering system [effort: S] [risk: L]
  - Test day exclusion
  - Test time range exclusion
  - Test section type filtering
  - Test preference persistence
  - Acceptance criteria:
    - All filters work correctly
    - Preferences persist to localStorage
    - Update AGENTS.md with learnings

- [ ] **T3.3.5**: Verify schedule generation [effort: M] [risk: M]
  - Test "Recommended" mode (partial)
  - Test "Full Coverage" mode (exhaustive)
  - Test "Quick" mode (fast random)
  - Verify algorithm outputs match original
  - Acceptance criteria:
    - All modes generate valid schedules
    - Outputs match original implementation
    - Preferences respected
    - Update AGENTS.md with learnings

- [ ] **T3.3.6**: Verify export functionality [effort: S] [risk: L]
  - Test course list copy to clipboard
  - Test course list download as .txt
  - Test timetable export as PNG
  - Test timetable export as PDF
  - Test timetable export as .ics
  - Acceptance criteria:
    - All export formats work
    - Generated files are valid
    - Update AGENTS.md with learnings

---

## Phase 4: UI/UX Modernization

### 4.1 Design System Implementation [impl]

- [ ] **T4.1.1**: Define Tailwind color palette for "hobby student" aesthetic [effort: M] [risk: L]
  - Create playful, approachable color scheme
  - Define primary, secondary, accent colors
  - Create semantic colors (success, warning, error, info)
  - Define light/dark mode variants
  - Acceptance criteria:
    - Color palette defined in tailwind.config.mjs
    - Light and dark variants
    - Accessible contrast ratios (WCAG AA)
    - Update AGENTS.md with learnings

- [ ] **T4.1.2**: Define typography scale [effort: S] [risk: L]
  - Choose playful but readable font family
  - Define heading scale (h1-h6)
  - Define body text sizes
  - Define monospace for schedule data
  - Acceptance criteria:
    - Font family loaded (Google Fonts or local)
    - Type scale in Tailwind config
    - Consistent across all components
    - Update AGENTS.md with learnings

- [ ] **T4.1.3**: Define spacing and layout tokens [effort: S] [risk: L]
  - Map existing --space-\* variables to Tailwind
  - Define container widths
  - Define responsive breakpoints
  - Acceptance criteria:
    - Spacing matches original
    - Responsive breakpoints defined
    - Container max-width set
    - Update AGENTS.md with learnings

- [ ] **T4.1.4**: Create component style variants [effort: M] [risk: L]
  - Define button variants (primary, secondary, danger, ghost)
  - Define input styles
  - Define card/section styles
  - Define status badge styles
  - Acceptance criteria:
    - All variants in Tailwind config
    - Consistent across components
    - Documented in storybook or docs
    - Update AGENTS.md with learnings

### 4.2 Component Redesign [impl]

- [ ] **T4.2.1**: Redesign Header component [effort: M] [risk: L]
  - Add playful branding elements
  - Create smooth theme toggle animation
  - Add subtle hover effects
  - Convert to TypeScript with explicit types
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Header includes: logo (verified by presence), title text, theme toggle button (verified by DOM query)
    - No accessibility violations in header (axe-core audit: 0 violations)
    - Lighthouse Accessibility score ≥ 90 for header region
    - Smooth transitions
    - Update AGENTS.md with learnings

- [ ] **T4.2.2**: Redesign RawDataInput component [effort: M] [risk: L]
  - Create welcoming input area
  - Add helpful placeholder text
  - Style mode selector with visual feedback
  - Add loading/import animations
  - Ensure TypeScript compliance
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Navigation items have hover states (verified by CSS :hover class presence)
    - Active state visually distinct (color contrast ratio ≥ 3:1)
    - All navigation items keyboard accessible (Tab navigation verified)
    - Clear instructions
    - Visual feedback on import
    - Update AGENTS.md with learnings

- [ ] **T4.2.3**: Redesign CourseTable component [effort: L] [risk: M]
  - Modern table styling with Tailwind
  - Hover effects on rows
  - Animated lock/unlock buttons
  - Status badges with icons
  - Smooth grouping transitions
  - Ensure TypeScript compliance
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Table rows have :hover pseudo-class defined
    - Sort indicators visible on sortable columns (verified by presence)
    - Row striping applied for readability (even/odd class distinction)
    - Smooth animations
    - Clear visual hierarchy
    - Update AGENTS.md with learnings

- [ ] **T4.2.4**: Redesign TimetableView component [effort: L] [risk: M]
  - Modern grid styling
  - Course cards with rounded corners
  - Color coding for different subjects
  - Hover tooltips with course details
  - Animated export buttons
  - Ensure TypeScript compliance
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Visually appealing timetable
    - Clear time/slot visualization
    - Fun color coding
    - Update AGENTS.md with learnings

- [ ] **T4.2.5**: Redesign TimeFilter component [effort: M] [risk: M]
  - Modern checkbox styling
  - Custom time picker with Tailwind
  - Drag-to-reorder time preferences (optional)
  - Visual feedback on filter changes
  - Ensure TypeScript compliance
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Modern filter UI
    - Time picker works correctly
    - Clear visual feedback
    - Update AGENTS.md with learnings

- [ ] **T4.2.6**: Create new Toast notification system [effort: S] [risk: L]
  - Replace react-toastify with custom Tailwind toasts
  - Add playful animations
  - Position notifications appropriately
  - Ensure TypeScript compliance
  - Acceptance criteria:
    - Component file uses .tsx extension
    - All props have TypeScript interface with JSDoc comments
    - No `any` types in component
    - Component type-checks with zero errors
    - Custom toast component
    - All toast types (success, error, warning, info)
    - Playful animations
    - Update AGENTS.md with learnings

- [ ] **T4.2.7**: Create custom icons [effort: M] [risk: L]
  - Install Lucide icons: `bun add lucide-react`
  - Map all MUI icons to Lucide equivalents
  - Create custom icons where needed
  - Acceptance criteria:
    - Lucide icons installed
    - All MUI icons replaced
    - Consistent icon style
    - Update AGENTS.md with learnings

### 4.3 Theme System [impl]

- [ ] **T4.3.1**: Implement dark/light theme toggle [effort: M] [risk: L]
  - Use Tailwind dark: variant with class strategy
  - Create theme toggle button
  - Persist preference to localStorage
  - Add smooth transition between themes
  - Acceptance criteria:
    - Toggle switches themes
    - Preference persists
    - Smooth transition animation
    - Update AGENTS.md with learnings

- [ ] **T4.3.2**: Implement palette variants [effort: M] [risk: L]
  - Create "Original" palette (current default)
  - Create "Comfort" palette (softer colors)
  - Create "Space" palette (cosmic theme)
  - Allow per-theme palette selection
  - Acceptance criteria:
    - 3 palette options
    - Palette persists per theme
    - Smooth palette transitions
    - Update AGENTS.md with learnings

### 4.4 Responsive Design [impl]

- [ ] **T4.4.1**: Implement mobile-first responsive layouts [effort: M] [risk: L]
  - Course table horizontal scroll on mobile
  - Collapsible filter sections
  - Responsive timetable grid
  - Touch-friendly button sizes
  - Acceptance criteria:
    - All components usable on 320px+ screens
    - Touch targets ≥ 44px
    - Horizontal scroll for tables
    - Update AGENTS.md with learnings

- [ ] **T4.4.2**: Optimize for tablet view [effort: S] [risk: L]
  - Adjust layouts for 768px breakpoint
  - Optimize course table columns
  - Adjust timetable scaling
  - Acceptance criteria:
    - Optimal layout at 768px
    - No layout issues
    - Update AGENTS.md with learnings

---

## Phase 5: Testing & Quality

### 5.1 Test Coverage [test]

- [ ] **T5.1.1**: Achieve ≥ 80% coverage for utility functions [effort: M] [risk: M]
  - Add tests for parseSchedule edge cases
  - Add tests for parseRawData variations
  - Add tests for generateIcs output format
  - Add tests for convertToRawData roundtrip
  - Acceptance criteria:
    - Test files converted to .ts extension
    - Test utilities have proper types
    - Coverage ≥ 80% for all utils
    - All edge cases covered
    - Tests for invalid input formats (malformed WITS/AIMS data) with expected error handling
    - Tests for empty/null/undefined inputs return appropriate empty/default values
    - Tests for boundary conditions (empty string, single character, max length string)
    - Tests pass: `bun test`
    - Update AGENTS.md with learnings

- [ ] **T5.1.2**: Create integration tests for components [effort: L] [risk: M]
  - Set up Testing Library for React
  - Test RawDataInput import flow
  - Test CourseTable interactions
  - Test TimetableView rendering
  - Test schedule generation flow
  - Acceptance criteria:
    - Integration test files use .ts extension
    - Testing Library configured
    - Key user flows tested
    - Test error state rendering when import fails
    - Test toast notifications display for user errors
    - Test graceful degradation when schedule generation fails
    - Tests pass: `bun test`
    - Update AGENTS.md with learnings

- [ ] **T5.1.3**: Create E2E smoke tests [effort: M] [risk: M]
  - Set up Playwright or similar
  - Test complete user journey: import → filter → generate → export
  - Test all export formats
  - Test theme switching
  - Acceptance criteria:
    - Playwright configured
    - 3+ E2E test scenarios
    - Tests pass in CI
    - Update AGENTS.md with learnings

- [ ] **T5.1.4**: **[setup] Visual Regression Testing** - Set up visual regression testing to make UI changes measurable and catch unintended visual changes [effort: M] [risk: L]
  - Install Playwright for visual comparison
  - Create baseline screenshots for: header, course table, timetable, filters, dialogs
  - Configure CI to run visual tests on every PR
  - Acceptance criteria:
    - Visual regression tests for 10+ component states (header, table, timetable, dialogs, filters, dark/light themes)
    - Baseline screenshots captured and committed to repository
    - Tests pass in CI (exit code 0)
    - Update AGENTS.md with learnings

### 5.2 Accessibility Audit [test]

- [ ] **T5.2.1**: Run automated accessibility tests [effort: S] [risk: L]
  - Install axe-core or similar
  - Run accessibility audit on all pages
  - Fix all critical violations
  - Acceptance criteria:
    - Zero critical accessibility violations
    - Zero serious violations
    - Report documented
    - Update AGENTS.md with learnings

- [ ] **T5.2.2**: Manual keyboard navigation test [effort: S] [risk: L]
  - Test Tab navigation through all interactive elements
  - Test Enter/Space activation
  - Test Escape for dialogs
  - Test arrow keys for custom controls
  - Acceptance criteria:
    - All interactive elements focusable
    - Logical focus order
    - No keyboard traps
    - Update AGENTS.md with learnings

- [ ] **T5.2.3**: Screen reader compatibility test [effort: M] [risk: L]
  - Test with NVDA (Windows) or VoiceOver (Mac)
  - Verify all elements have appropriate labels
  - Test dynamic content announcements
  - Verify toast notifications announced
  - Acceptance criteria:
    - All elements have aria-labels
    - Dynamic content announced
    - No confusing announcements
    - Update AGENTS.md with learnings

- [ ] **T5.2.4**: Color contrast verification [effort: S] [risk: L]
  - Verify all text meets WCAG AA contrast ratio (4.5:1)
  - Verify large text meets 3:1 ratio
  - Test all theme/palette combinations
  - Acceptance criteria:
    - All text passes contrast requirements
    - All themes/palettes compliant
    - Report documented
    - Update AGENTS.md with learnings

### 5.3 Performance Optimization [test]

- [ ] **T5.3.1**: Measure and optimize bundle size [effort: M] [risk: M]
  - Run bundle analysis
  - Remove unused dependencies
  - Code split React islands
  - Target: ≤ 500KB gzipped total
  - Acceptance criteria:
    - Bundle ≤ 500KB gzipped
    - No unused dependencies
    - Code splitting implemented
    - Update AGENTS.md with learnings

- [ ] **T5.3.2**: Optimize build time [effort: S] [risk: L]
  - Measure build time
  - Optimize Tailwind CSS generation
  - Enable Astro build caching
  - Target: ≤ 30 seconds
  - Acceptance criteria:
    - Build completes in ≤ 30 seconds
    - Caching enabled
    - Update AGENTS.md with learnings

- [ ] **T5.3.3**: Achieve Lighthouse score ≥ 90 [effort: M] [risk: M]
  - Run Lighthouse audit
  - Fix performance issues
  - Fix accessibility issues
  - Fix best practices issues
  - Fix SEO issues
  - Acceptance criteria:
    - Performance score ≥ 90
    - Accessibility score ≥ 90
    - Best practices score ≥ 90
    - SEO score ≥ 90
    - Update AGENTS.md with learnings

---

## Phase 6: Documentation & Deployment

### 6.1 Documentation [docs]

- [ ] **T6.1.1**: Update README.md [effort: S] [risk: L]
  - Update tech stack section
  - Update installation instructions
  - Update build commands
  - Add Astro-specific notes
  - Acceptance criteria:
    - README reflects new architecture
    - Installation steps correct
    - Build commands documented
    - Update AGENTS.md with learnings

- [ ] **T6.1.2**: Create architecture documentation [effort: M] [risk: L]
  - Document Astro + React islands architecture
  - Document state management approach
  - Document theme system
  - Document export system
  - Acceptance criteria:
    - Architecture diagram in docs/
    - All major systems documented
    - Update AGENTS.md with learnings

- [ ] **T6.1.3**: Create developer guide [effort: M] [risk: L]
  - Document local development setup
  - Document testing approach
  - Document component structure
  - Document utility functions
  - Acceptance criteria:
    - Developer guide in docs/
    - Covers all development tasks
    - Update AGENTS.md with learnings

- [ ] **T6.1.4**: Update AGENTS.md with final learnings [effort: S] [risk: L]
  - Document all discovered patterns
  - Document all gotchas encountered
  - Document best practices
  - Document common issues and solutions
  - Acceptance criteria:
    - AGENTS.md comprehensive
    - All learnings documented
    - Update AGENTS.md with learnings

### 6.2 Deployment [impl]

- [ ] **T6.2.1**: Update CI/CD pipeline [effort: S] [risk: L]
  - Update GitHub Actions workflow
  - Add test step before deployment
  - Add build caching
  - Acceptance criteria:
    - CI/CD workflow updated
    - Tests run before deploy
    - Caching implemented
    - Update AGENTS.md with learnings

- [ ] **T6.2.2**: Deploy to staging environment [effort: S] [risk: L]
  - Deploy to GitHub Pages preview
  - Run smoke tests on deployed version
  - Verify all features work
  - Acceptance criteria:
    - Staging deployment successful
    - All smoke tests pass
    - Update AGENTS.md with learnings

- [ ] **T6.2.3**: Production deployment [effort: S] [risk: L]
  - Merge to main branch
  - Verify deployment completes
  - Run final smoke tests
  - Acceptance criteria:
    - Production deployment successful
    - All features functional
    - URL: https://masurii.github.io/CITUCourseBuilder/
    - Update AGENTS.md with learnings

### 6.3 Cleanup [cleanup]

- [ ] **T6.3.1**: Remove old React project [effort: S] [risk: L]
  - Archive course-scheduler-web/ directory
  - Update repository structure
  - Update any absolute paths
  - Acceptance criteria:
    - Old project archived or removed
    - Repository clean
    - Update AGENTS.md with learnings

- [ ] **T6.3.2**: Final dependency audit [effort: S] [risk: L]
  - Run `bun audit`
  - Fix any security vulnerabilities
  - Update outdated dependencies
  - Acceptance criteria:
    - Zero security vulnerabilities
    - Dependencies up to date
    - Update AGENTS.md with learnings

- [ ] **T6.3.3**: Final test run [effort: S] [risk: L]
  - Run all tests: `bun test`
  - Run all E2E tests
  - Run Lighthouse audit
  - Run TypeScript type check: `bun run typecheck`
  - Acceptance criteria:
    - All tests pass
    - TypeScript compilation: `bun run typecheck` passes (exit code 0)
    - Zero `any` types in codebase (grep -r ': any' returns empty)
    - Lighthouse scores ≥ 90
    - Zero linting errors
    - Update AGENTS.md with learnings

---

## Notes

### Critical File Reference

| File                | Purpose                 | Lines            | Preservation Status |
| ------------------- | ----------------------- | ---------------- | ------------------- |
| parseSchedule.js    | Schedule string parsing | 427              | PRESERVE EXACTLY    |
| parseRawData.js     | Course data parsing     | 375              | PRESERVE EXACTLY    |
| generateIcs.js      | ICS calendar generation | 111              | PRESERVE EXACTLY    |
| convertToRawData.js | Raw data conversion     | 29               | PRESERVE EXACTLY    |
| App.jsx algorithms  | Schedule generation     | ~400 (extracted) | PRESERVE EXACTLY    |

### Success Metrics

| Metric                   | Baseline          | Target                                             | Verification          |
| ------------------------ | ----------------- | -------------------------------------------------- | --------------------- |
| Test Coverage            | ~40% (utils only) | ≥ 80%                                              | `bun test --coverage` |
| Bundle Size              | TBD               | ≤ 500KB gzipped                                    | Build analysis        |
| Build Time               | TBD               | ≤ 30 seconds                                       | CI timing             |
| Lighthouse Performance   | TBD               | ≥ 90                                               | Lighthouse audit      |
| Lighthouse Accessibility | TBD               | ≥ 90                                               | Lighthouse audit      |
| WCAG Compliance          | N/A               | AA                                                 | Accessibility audit   |
| TypeScript Strict Mode   | N/A               | Zero compilation errors with strict: true          | `tsc --noEmit`        |
| TypeScript Coverage      | N/A               | Zero `any` types in codebase                       | grep -r ': any'       |
| Type Safety              | N/A               | All functions have explicit parameter/return types | Code review           |

### UI/UX Design Principles

1. **Approachable**: Clean, uncluttered interface with clear visual hierarchy
2. **Playful**: Rounded corners, fun colors, subtle animations
3. **Functional**: All existing features preserved and intuitive to use
4. **Accessible**: WCAG 2.1 AA compliant, keyboard navigable, screen reader friendly
5. **Responsive**: Works on mobile (320px+), tablet, and desktop

### Migration Strategy Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION APPROACH                           │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1: Discovery    │ Analyze, document, plan               │
│  Phase 2: Foundation   │ Astro setup, pre-commit, CI/CD        │
│  Phase 3: Core         │ Preserve utils, migrate components    │
│  Phase 4: UI/UX        │ Tailwind styling, redesign            │
│  Phase 5: Testing      │ Coverage, accessibility, performance  │
│  Phase 6: Deploy       │ Documentation, deployment, cleanup    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

1. **Astro Islands**: React components load only where interactivity is needed
2. **Tailwind CSS**: Replaces 2,599 lines of CSS with utility-first approach
3. **Custom Components**: Replace MUI with Tailwind-styled equivalents
4. **Lucide Icons**: Replace MUI icons for smaller bundle
5. **Preserved Logic**: All computation files copied exactly with no modifications

---

_Plan generated by ralph-plan-command. Execute tasks sequentially within phases. Mark tasks complete as they are finished. Update AGENTS.md after each task._
