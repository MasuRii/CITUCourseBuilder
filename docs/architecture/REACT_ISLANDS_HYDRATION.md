# Astro React Islands Hydration Configuration

**Generated:** 2026-02-18
**Task:** T2.1.2 - Configure Astro for React islands

---

## Overview

This document describes the React islands hydration configuration for the CITU Course Builder Astro migration. React islands allow selective hydration of interactive components while keeping the rest of the page static.

## Configuration

### astro.config.mjs

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://masurii.github.io',
  base: '/CITUCourseBuilder/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Dependencies

| Package            | Version  | Purpose                        |
| ------------------ | -------- | ------------------------------ |
| `@astrojs/react`   | ^4.4.2   | React integration for Astro    |
| `react`            | ^19.2.4  | React library                  |
| `react-dom`        | ^19.2.4  | React DOM renderer             |
| `@types/react`     | ^19.2.14 | TypeScript types for React     |
| `@types/react-dom` | ^19.2.3  | TypeScript types for React DOM |

---

## Hydration Directives

Astro provides several hydration directives to control when components become interactive:

### client:load

**Behavior:** Hydrates the component immediately when the page loads.

**Use Cases:**

- Critical interactive components visible immediately
- Components that users interact with on first render
- Time-sensitive functionality

**Bundle Impact:** JavaScript is included in the initial bundle.

### client:visible

**Behavior:** Hydrates the component when it enters the viewport.

**Use Cases:**

- Components below the fold
- Heavy components with large dependencies
- Optional/secondary functionality

**Bundle Impact:** JavaScript is lazy-loaded, improving initial page load.

### client:idle

**Behavior:** Hydrates the component when the browser is idle (after initial load).

**Use Cases:**

- Non-critical interactive components
- Components that can wait for main content to load

### client:media

**Behavior:** Hydrates when a CSS media query is met.

**Use Cases:**

- Responsive components
- Components only needed on certain screen sizes

### client:only

**Behavior:** Skips server rendering, renders only on the client.

**Use Cases:**

- Components that depend on browser APIs
- Components that can't be server-rendered

---

## Component Hydration Strategy

Based on ADR-001, the following hydration strategy is used:

| Component     | Directive        | Rationale                                                |
| ------------- | ---------------- | -------------------------------------------------------- |
| RawDataInput  | `client:load`    | Critical for user input, must be interactive immediately |
| CourseTable   | `client:load`    | Central feature, user interacts immediately              |
| TimeFilter    | `client:visible` | Can wait until user scrolls to filter section            |
| TimetableView | `client:visible` | Heavy component with export libraries, lazy load         |
| ConfirmDialog | `client:load`    | May appear on initial interaction                        |

---

## Usage Example

### Creating a React Island

1. **Create the React component** (`.tsx` file):

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
}

export default function Counter({ initialCount = 0 }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}
```

2. **Import and use in Astro page**:

```astro
---
import Counter from '../components/Counter';
---

<Counter client:load />
```

---

## Bundle Size Analysis

### Current Build Output (Test Island)

| Chunk                        | Size      | Gzipped  |
| ---------------------------- | --------- | -------- |
| client.\*.js (React runtime) | 186.62 kB | 58.54 kB |
| index.\*.js (Page scripts)   | 7.85 kB   | 3.05 kB  |
| TestIsland.\*.js (Island)    | 1.60 kB   | 0.78 kB  |

### Key Insights

1. **React Runtime**: Only loaded when islands are present (~58.5 kB gzipped)
2. **Island Code**: Each island is code-split for optimal caching
3. **Static Content**: Zero JavaScript for non-interactive content

---

## TypeScript Configuration

React islands use TypeScript strict mode. Component props must be explicitly typed:

```typescript
// Good: Explicit prop interface
interface MyComponentProps {
  title: string;
  count?: number;
  onUpdate: (value: number) => void;
}

export default function MyComponent({ title, count = 0, onUpdate }: MyComponentProps) {
  // ...
}

// Bad: Using 'any'
export default function MyComponent(props: any) {
  // DON'T DO THIS
  // ...
}
```

---

## SSR/CSR Considerations

### localStorage Access

React islands run on the client after hydration. Code accessing browser APIs must:

1. **Use useEffect for browser APIs:**

```tsx
useEffect(() => {
  // Safe: runs only on client
  const stored = localStorage.getItem('key');
}, []);
```

2. **Guard against SSR:**

```tsx
if (typeof window === 'undefined') {
  return null; // SSR fallback
}
// Safe: client-only code
```

### Theme Flash Prevention

For theme-related islands, use inline script in Astro layout to prevent flash:

```astro
<script is:inline>
  // Apply theme before React hydrates
  const theme = localStorage.getItem('courseBuilder_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

---

## Verification Checklist

- [x] `@astrojs/react` integration added to astro.config.mjs
- [x] React component created with TypeScript props interface
- [x] Component imports correctly in Astro page
- [x] Hydration directive applied (`client:load`, `client:visible`, etc.)
- [x] TypeScript compilation passes (`bun run typecheck`)
- [x] Build succeeds (`bun run build`)
- [x] Interactive features work in browser

---

## References

- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro + React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro Hydration Directives](https://docs.astro.build/en/reference/directives-reference/#client-directives)
- ADR-001: Framework Migration Approach
