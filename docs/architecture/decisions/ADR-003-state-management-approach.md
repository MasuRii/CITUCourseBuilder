# ADR-003: State Management Approach

## Status

**Accepted**

## Context

The CITUCourseBuilder application manages significant client-side state across multiple interactive features. As part of the Astro migration, we need to decide on a state management strategy that:

1. **Preserves state persistence** - 13 localStorage keys for user preferences and course data
2. **Works with React islands** - State must be available within hydrated React components
3. **Maintains simplicity** - Current flat architecture has no deep prop drilling (max 1 level)
4. **Supports SSR/CSR boundary** - Astro renders static HTML, React hydrates client-side
5. **Minimizes migration effort** - Limited learning curve, straightforward extraction
6. **Preserves all functionality** - 22 useState hooks must work identically after migration

### Current State Architecture

| Category | State Count | Persistence | Purpose |
|----------|-------------|-------------|---------|
| Core Data | 5 | localStorage | Courses, filters, processed data |
| Theme | 2 | localStorage | Light/dark mode, palette |
| Filters/Preferences | 8 | localStorage | Exclusion rules, constraints |
| UI State | 5 | None | Dialogs, loading, schedule display |
| **Total** | **22** | **13 keys** | |

### State Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          App.jsx State Categories                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Persisted State (localStorage)          │  Transient State (memory only)  │
│  ─────────────────────────────────────── │  ────────────────────────────── │
│  • allCourses (Course[])                 │  • conflictingLockedCourseIds   │
│  • excludedDays (string[])               │  • showTimetable                │
│  • excludedTimeRanges (TimeRange[])      │  • generatedScheduleCount       │
│  • theme ('light' | 'dark')              │  • generatedSchedules           │
│  • themePalette ({light, dark})          │  • currentScheduleIndex         │
│  • groupingKey (string)                  │  • isGenerating                 │
│  • selectedSectionTypes (string[])       │  • confirmDialog                │
│  • selectedStatusFilter (string)         │  • rawData                      │
│  • maxUnits (string)                     │                                 │
│  • maxClassGapHours (string)             │                                 │
│  • preferredTimeOfDayOrder (string[])    │                                 │
│  • scheduleSearchMode (string)           │                                 │
│  • minimizeDaysOnCampus (boolean)        │                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Decision

**Continue with React state via islands + localStorage persistence.**

We will use React's built-in state management (useState, useReducer) within React islands, with localStorage for persistence. This approach provides:

- **No additional dependencies** - React state is already sufficient for our needs
- **Full client-side access** - Astro islands have complete access to browser APIs including localStorage
- **Simplified migration** - Extract state to custom hooks without changing patterns
- **No SSR complexity** - All state is client-side, no hydration mismatches
- **Familiar patterns** - Team already knows React state patterns

## Alternatives Considered

### Zustand

| Aspect | Pros | Cons |
|--------|------|------|
| **Simplicity** | Minimal boilerplate, easy to learn | Additional dependency (~3 KB) |
| **Persistence** | Built-in persist middleware | Overkill for island-scoped state |
| **DevTools** | Excellent debugging tools | Not needed for this project size |
| **TypeScript** | Full TypeScript support | We already have typed interfaces |
| **SSR** | Works with SSR frameworks | We don't need SSR state |

**Verdict**: Not chosen because our state is entirely client-side and scoped to React islands. Zustand's primary benefits (shared state across islands, SSR support) aren't needed. Adding a state library would increase bundle size without meaningful benefit.

### Jotai

| Aspect | Pros | Cons |
|--------|------|------|
| **Atomic model** | Fine-grained reactivity | Learning curve for atomic model |
| **Bundle size** | Very small (~2 KB) | Different mental model from useState |
| **TypeScript** | Excellent type inference | Overkill for simple state |
| **No providers** | Can use without context | Not beneficial for island-scoped state |

**Verdict**: Not chosen because the atomic state model introduces unnecessary complexity. Our current state structure (22 useState hooks) maps directly to custom hooks, making Jotai's primitives redundant.

### Nanostores

| Aspect | Pros | Cons |
|--------|------|------|
| **Framework agnostic** | Works in Astro and React | Requires learning new API |
| **Tiny bundle** | ~0.5 KB | Limited ecosystem |
| **Cross-island sharing** | Share state between islands | We don't need cross-island state |
| **SSR friendly** | Built for Astro ecosystem | All our state is client-only |

**Verdict**: Not chosen because while Nanostores is designed for Astro, our state is entirely client-side and doesn't need to be shared across islands. The App.jsx component is the only state owner, and child components receive props directly (max 1 level drilling).

### React Built-in State (Chosen)

| Aspect | Pros | Cons |
|--------|------|------|
| **Zero dependencies** | No additional bundle size | Must implement persistence manually |
| **Team familiarity** | Already using useState patterns | None significant |
| **TypeScript** | Full type safety with interfaces | None significant |
| **Island compatibility** | Works perfectly with hydration | None significant |
| **Migration simplicity** | Extract to hooks, no paradigm shift | None significant |

**Verdict**: **Chosen** because:
- State is entirely client-side (no SSR considerations)
- Flat component architecture means no complex prop drilling
- localStorage persistence is straightforward
- Custom hooks provide clean extraction pattern
- Zero additional bundle size

## Implementation Strategy

### State Extraction to Custom Hooks

Extract the 22 useState hooks into logical custom hooks:

#### 1. useLocalStorage Hook (Generic)

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}
```

#### 2. useCourseState Hook

```typescript
// src/hooks/useCourseState.ts
import { useLocalStorage } from './useLocalStorage';
import { useMemo } from 'react';
import type { Course, GroupedCourse } from '../types';

export function useCourseState() {
  const [allCourses, setAllCourses] = useLocalStorage<Course[]>('courseBuilder_allCourses', []);
  const [groupingKey, setGroupingKey] = useLocalStorage<string>('courseBuilder_groupingKey', 'subject');
  const [selectedStatusFilter, setSelectedStatusFilter] = useLocalStorage<string>('courseBuilder_selectedStatusFilter', 'open');
  const [selectedSectionTypes, setSelectedSectionTypes] = useLocalStorage<string[]>('courseBuilder_selectedSectionTypes', []);

  // Derived state
  const lockedCourses = useMemo(() => 
    allCourses.filter(c => c.isLocked), [allCourses]
  );
  
  const totalUnits = useMemo(() =>
    lockedCourses.reduce((sum, c) => sum + parseFloat(c.units || '0'), 0), [lockedCourses]
  );

  return {
    allCourses, setAllCourses,
    groupingKey, setGroupingKey,
    selectedStatusFilter, setSelectedStatusFilter,
    selectedSectionTypes, setSelectedSectionTypes,
    lockedCourses, totalUnits,
  };
}
```

#### 3. useFilterState Hook

```typescript
// src/hooks/useFilterState.ts
import { useLocalStorage } from './useLocalStorage';
import type { TimeRange } from '../types';

export function useFilterState() {
  const [excludedDays, setExcludedDays] = useLocalStorage<string[]>('courseBuilder_excludedDays', []);
  const [excludedTimeRanges, setExcludedTimeRanges] = useLocalStorage<TimeRange[]>('courseBuilder_excludedTimeRanges', []);
  const [maxUnits, setMaxUnits] = useLocalStorage<string>('courseBuilder_maxUnits', '');
  const [maxClassGapHours, setMaxClassGapHours] = useLocalStorage<string>('courseBuilder_maxClassGapHours', '');

  return {
    excludedDays, setExcludedDays,
    excludedTimeRanges, setExcludedTimeRanges,
    maxUnits, setMaxUnits,
    maxClassGapHours, setMaxClassGapHours,
  };
}
```

#### 4. useThemeState Hook

```typescript
// src/hooks/useThemeState.ts
import { useLocalStorage } from './useLocalStorage';
import { useEffect } from 'react';
import type { ThemeMode, ThemePalette } from '../types';

export function useThemeState() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('courseBuilder_theme', 'dark');
  const [themePalette, setThemePalette] = useLocalStorage<ThemePalette>(
    'courseBuilder_themePalette',
    { light: 'original', dark: 'original' }
  );

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', themePalette[theme]);
  }, [theme, themePalette]);

  return { theme, setTheme, themePalette, setThemePalette };
}
```

#### 5. useSchedulePreferences Hook

```typescript
// src/hooks/useSchedulePreferences.ts
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_TIME_ORDER = ['morning', 'afternoon', 'evening'];

export function useSchedulePreferences() {
  const [preferredTimeOfDayOrder, setPreferredTimeOfDayOrder] = useLocalStorage<string[]>(
    'courseBuilder_preferredTimeOfDay',
    DEFAULT_TIME_ORDER
  );
  const [scheduleSearchMode, setScheduleSearchMode] = useLocalStorage<'fast' | 'exhaustive' | 'partial'>(
    'courseBuilder_scheduleSearchMode',
    'partial'
  );
  const [minimizeDaysOnCampus, setMinimizeDaysOnCampus] = useLocalStorage<boolean>(
    'courseBuilder_minimizeDaysOnCampus',
    false
  );

  return {
    preferredTimeOfDayOrder, setPreferredTimeOfDayOrder,
    scheduleSearchMode, setScheduleSearchMode,
    minimizeDaysOnCampus, setMinimizeDaysOnCampus,
  };
}
```

#### 6. useScheduleGeneration Hook

```typescript
// src/hooks/useScheduleGeneration.ts
import { useState, useCallback } from 'react';

export function useScheduleGeneration() {
  const [generatedSchedules, setGeneratedSchedules] = useState<string[][]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScheduleCount, setGeneratedScheduleCount] = useState(0);

  const clearSchedules = useCallback(() => {
    setGeneratedSchedules([]);
    setCurrentScheduleIndex(0);
    setGeneratedScheduleCount(0);
  }, []);

  return {
    generatedSchedules, setGeneratedSchedules,
    currentScheduleIndex, setCurrentScheduleIndex,
    isGenerating, setIsGenerating,
    generatedScheduleCount, setGeneratedScheduleCount,
    clearSchedules,
  };
}
```

### Hook Integration in App Component

```typescript
// src/components/App.tsx
import { useCourseState } from '../hooks/useCourseState';
import { useFilterState } from '../hooks/useFilterState';
import { useThemeState } from '../hooks/useThemeState';
import { useSchedulePreferences } from '../hooks/useSchedulePreferences';
import { useScheduleGeneration } from '../hooks/useScheduleGeneration';

export function App() {
  const courseState = useCourseState();
  const filterState = useFilterState();
  const themeState = useThemeState();
  const preferences = useSchedulePreferences();
  const scheduleGen = useScheduleGeneration();

  // Pass state to child components via props
  return (
    <div>
      <TimeFilter
        excludedDays={filterState.excludedDays}
        excludedTimeRanges={filterState.excludedTimeRanges}
        onDayChange={...}
      />
      <CourseTable
        courses={courseState.processedCourses}
        groupingKey={courseState.groupingKey}
        onGroupingChange={courseState.setGroupingKey}
      />
      {/* ... */}
    </div>
  );
}
```

## SSR/CSR Boundary Handling

### Astro Static Rendering

Astro renders static HTML at build time. React islands hydrate client-side only.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Astro Rendering Pipeline                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Build Time (SSG)                    Runtime (CSR)                         │
│   ─────────────────────               ─────────────────────                 │
│   1. Astro renders static HTML        1. Browser loads HTML                 │
│   2. No React code executed           2. React island scripts load          │
│   3. No localStorage access           3. Island hydrates (client:load)      │
│   4. Default theme rendered           4. useLocalStorage reads localStorage │
│                                      5. State updates trigger re-renders    │
│                                                                             │
│   Key Insight: All state is client-only. No SSR state to hydrate.          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hydration Considerations

| Consideration | Solution |
|---------------|----------|
| **Initial render mismatch** | useLocalStorage reads on mount, not during SSR |
| **Theme flash** | Inline script in `<head>` reads localStorage before React loads |
| **Empty state on SSR** | Static HTML shows empty/default state, React populates on hydration |
| **localStorage availability** | useLocalStorage checks `window` existence |

### Theme Flash Prevention

```astro
---
// src/layouts/BaseLayout.astro
---

<html>
<head>
  <script is:inline>
    // Run before React to prevent theme flash
    const theme = localStorage.getItem('courseBuilder_theme') || 'dark';
    const palette = JSON.parse(localStorage.getItem('courseBuilder_themePalette') || '{"light":"original","dark":"original"}');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', palette[theme]);
  </script>
</head>
<body>
  <slot />
</body>
</html>
```

## State Persistence Strategy

### localStorage Keys (13 total)

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `courseBuilder_allCourses` | `Course[]` | `[]` | Imported courses |
| `courseBuilder_excludedDays` | `string[]` | `[]` | Days to exclude |
| `courseBuilder_excludedTimeRanges` | `TimeRange[]` | `[]` | Time exclusions |
| `courseBuilder_theme` | `'light' \| 'dark'` | `'dark'` | Theme mode |
| `courseBuilder_themePalette` | `{light, dark}` | `{original, original}` | Palette per theme |
| `courseBuilder_groupingKey` | `string` | `'subject'` | Table grouping |
| `courseBuilder_selectedSectionTypes` | `string[]` | `[]` | Section filters |
| `courseBuilder_selectedStatusFilter` | `string` | `'open'` | Status filter |
| `courseBuilder_maxUnits` | `string` | `''` | Max units constraint |
| `courseBuilder_maxClassGapHours` | `string` | `''` | Max gap constraint |
| `courseBuilder_preferredTimeOfDay` | `string[]` | `['morning', 'afternoon', 'evening']` | Time preference |
| `courseBuilder_scheduleSearchMode` | `string` | `'partial'` | Generation mode |
| `courseBuilder_minimizeDaysOnCampus` | `boolean` | `false` | Minimize days |

### Persistence Flow

```
User Action → State Update → localStorage.setItem → Re-render
     ↑                                              ↓
     └──────────── localStorage.getItem ←───────────┘
                    (on page reload)
```

## Consequences

### Positive

- **Zero additional dependencies** - No state library adds to bundle size
- **Familiar patterns** - Team already knows React useState and useEffect
- **Clean extraction** - Custom hooks provide clear separation of concerns
- **Type safety** - TypeScript interfaces already defined for all state
- **SSR simplicity** - No server-side state considerations
- **Easy testing** - Custom hooks are trivially testable

### Negative

- **Manual persistence** - Each hook must implement localStorage sync
- **No time-travel debugging** - Unlike Redux/Zustand devtools
- **Island isolation** - State cannot be shared between islands (not needed)
- **Prop drilling remains** - Still passing props to child components

### Neutral

- **Learning curve** - None, already using this pattern
- **Bundle size** - No change (no new dependencies)
- **Performance** - Same as current implementation

## References

- [React Hooks API Reference](https://react.dev/reference/react)
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Using localStorage with React Hooks](https://react.dev/learn/synchronizing-with-effects)
- Project State Analysis: `docs/architecture/APP_STATE_ANALYSIS.md`
- TypeScript Interfaces: `docs/architecture/types/index.ts`
- ADR-001: Framework Migration Approach
