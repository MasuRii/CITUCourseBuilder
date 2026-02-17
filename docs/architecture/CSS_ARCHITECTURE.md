# CSS Architecture Analysis

## Overview

This document analyzes the CSS architecture of the CITUCourseBuilder application, including custom properties inventory, theme system mapping, component-specific styles, and Tailwind CSS migration strategy.

**Source File**: `course-scheduler-web/src/App.css` (2,599 lines)

## Table of Contents

1. [CSS Custom Properties Inventory](#css-custom-properties-inventory)
2. [Theme System Architecture](#theme-system-architecture)
3. [Component-Specific Styles](#component-specific-styles)
4. [CSS Specificity Patterns](#css-specificity-patterns)
5. [Tailwind Migration Mapping](#tailwind-migration-mapping)
6. [Recommendations](#recommendations)

---

## CSS Custom Properties Inventory

### Total Count: 107 Custom Properties

### Spacing Variables (8 properties)

| Variable    | Value | Tailwind Equivalent   |
| ----------- | ----- | --------------------- |
| `--space-1` | 4px   | `spacing-1` (0.25rem) |
| `--space-2` | 8px   | `spacing-2` (0.5rem)  |
| `--space-3` | 12px  | `spacing-3` (0.75rem) |
| `--space-4` | 16px  | `spacing-4` (1rem)    |
| `--space-5` | 20px  | `spacing-5` (1.25rem) |
| `--space-6` | 24px  | `spacing-6` (1.5rem)  |
| `--space-7` | 32px  | `spacing-8` (2rem)    |
| `--space-8` | 48px  | `spacing-12` (3rem)   |

### Typography Variables (16 properties)

| Variable                  | Value                         | Tailwind Equivalent                            |
| ------------------------- | ----------------------------- | ---------------------------------------------- |
| `--font-family-base`      | 'Inter', system-ui, ...       | `font-family: ['Inter', 'system-ui', ...]`     |
| `--font-family-monospace` | 'JetBrains Mono', 'Fira Code' | `font-family: ['JetBrains Mono', 'Fira Code']` |
| `--font-size-base`        | 16px                          | `text-base`                                    |
| `--font-size-sm`          | 0.875rem                      | `text-sm`                                      |
| `--font-size-xs`          | 0.75rem                       | `text-xs`                                      |
| `--font-size-lg`          | 1.125rem                      | `text-lg`                                      |
| `--font-size-xl`          | 1.25rem                       | `text-xl`                                      |
| `--line-height-base`      | 1.5                           | `leading-normal`                               |
| `--font-weight-light`     | 300                           | `font-light`                                   |
| `--font-weight-normal`    | 400                           | `font-normal`                                  |
| `--font-weight-medium`    | 500                           | `font-medium`                                  |
| `--font-weight-semibold`  | 600                           | `font-semibold`                                |
| `--font-weight-bold`      | 700                           | `font-bold`                                    |

### Layout Variables (8 properties)

| Variable                 | Value             | Tailwind Equivalent                  |
| ------------------------ | ----------------- | ------------------------------------ |
| `--container-width`      | min(1200px, 95vw) | `max-w-screen-xl mx-auto px-[2.5vw]` |
| `--focus-outline`        | 2px solid #4d90fe | `focus:ring-2 focus:ring-blue-500`   |
| `--focus-outline-offset` | 2px               | `focus:ring-offset-2`                |
| `--border-radius-sm`     | 6px               | `rounded`                            |
| `--border-radius-md`     | 8px               | `rounded-md`                         |
| `--border-radius-lg`     | 12px              | `rounded-lg`                         |
| `--border-radius-xl`     | 16px              | `rounded-xl`                         |
| `--border-radius-pill`   | 9999px            | `rounded-full`                       |

### Transition Variables (3 properties)

| Variable              | Value      | Tailwind Equivalent        |
| --------------------- | ---------- | -------------------------- |
| `--transition-fast`   | 0.15s ease | `duration-150 ease-in-out` |
| `--transition-normal` | 0.25s ease | `duration-250 ease-in-out` |
| `--transition-slow`   | 0.4s ease  | `duration-400 ease-in-out` |

### Color Variables (Theme-Dependent)

These variables change based on theme (`data-theme`) and palette (`data-palette`) attributes.

#### Core Colors (30+ properties)

| Variable                        | Purpose                    | Semantic Meaning          |
| ------------------------------- | -------------------------- | ------------------------- |
| `--bg-color`                    | Main background            | Surface primary           |
| `--text-color`                  | Primary text               | Content primary           |
| `--text-muted-color`            | Secondary text             | Content secondary         |
| `--border-color`                | Border color               | Border default            |
| `--header-bg`                   | Header background          | Surface header            |
| `--header-text`                 | Header text                | Content on-primary        |
| `--group-header-bg`             | Group header background    | Surface elevated          |
| `--row-even-bg`                 | Even row background        | Surface alternate         |
| `--row-odd-bg`                  | Odd row background         | Surface primary           |
| `--row-hover-bg`                | Row hover state            | Surface hover             |
| `--locked-row-bg`               | Locked row highlight       | Surface warning           |
| `--locked-row-text`             | Locked row text            | Content warning           |
| `--button-bg`                   | Button background          | Surface interactive       |
| `--button-text`                 | Button text                | Content on-interactive    |
| `--button-hover-bg`             | Button hover state         | Surface interactive-hover |
| `--button-border`               | Button border              | Border interactive        |
| `--danger-button-bg`            | Danger button background   | Surface danger            |
| `--danger-button-text`          | Danger button text         | Content on-danger         |
| `--danger-button-hover-bg`      | Danger button hover        | Surface danger-hover      |
| `--danger-button-border`        | Danger button border       | Border danger             |
| `--lock-button-locked-bg`       | Locked button background   | Surface warning           |
| `--lock-button-locked-text`     | Locked button text         | Content on-warning        |
| `--lock-button-locked-border`   | Locked button border       | Border warning            |
| `--lock-button-unlocked-bg`     | Unlocked button background | Surface success           |
| `--lock-button-unlocked-text`   | Unlocked button text       | Content on-success        |
| `--lock-button-unlocked-border` | Unlocked button border     | Border success            |
| `--filter-bg`                   | Filter section background  | Surface elevated          |
| `--filter-border`               | Filter section border      | Border default            |
| `--input-bg`                    | Input background           | Surface input             |
| `--input-text`                  | Input text                 | Content input             |
| `--input-border`                | Input border               | Border input              |
| `--hr-color`                    | Horizontal rule color      | Border subtle             |
| `--link-color`                  | Link color                 | Content link              |
| `--box-shadow`                  | Default box shadow         | Shadow default            |
| `--section-bg`                  | Section background         | Surface section           |
| `--card-bg`                     | Card background            | Surface card              |
| `--accent`                      | Accent color               | Primary brand             |
| `--accent-hover`                | Accent hover state         | Primary brand-hover       |
| `--accent-light`                | Accent light variant       | Primary light             |
| `--accent-very-light`           | Accent very light variant  | Primary lighter           |
| `--danger`                      | Danger semantic color      | Semantic danger           |
| `--success`                     | Success semantic color     | Semantic success          |
| `--warning`                     | Warning semantic color     | Semantic warning          |

### Toastify Variables (16 properties)

| Variable                      | Purpose              |
| ----------------------------- | -------------------- |
| `--toastify-color-light`      | Light theme color    |
| `--toastify-color-dark`       | Dark theme color     |
| `--toastify-color-info`       | Info toast color     |
| `--toastify-color-success`    | Success toast color  |
| `--toastify-color-warning`    | Warning toast color  |
| `--toastify-color-error`      | Error toast color    |
| `--toastify-icon-color-*`     | Icon colors per type |
| `--toastify-text-color-*`     | Text colors per type |
| `--toastify-toast-background` | Toast background     |
| `--toastify-z-index`          | Z-index for toasts   |
| `--toastify-text-color`       | Default text color   |

---

## Theme System Architecture

### Theme Switching Mechanism

The application uses CSS custom properties with data attributes for theme switching:

```javascript
// Theme toggle logic (from App.jsx)
const [theme, setTheme] = useState('dark');
const [themePalette, setThemePalette] = useState({ light: 'original', dark: 'original' });

// Applied via data attributes
document.documentElement.setAttribute('data-theme', theme);
document.documentElement.setAttribute('data-palette', currentPalette);
```

### Theme Variants

#### 1. Light Theme (`[data-theme="light"]`)

| Property   | Value                  |
| ---------- | ---------------------- |
| Background | `#f8fafc` (slate-50)   |
| Text       | `#1e293b` (slate-800)  |
| Header     | `#4f46e5` (indigo-600) |
| Accent     | `#4f46e5` (indigo-600) |

#### 2. Dark Theme (`[data-theme="dark"]`)

| Property   | Value                  |
| ---------- | ---------------------- |
| Background | `#0f172a` (slate-900)  |
| Text       | `#f1f5f9` (slate-100)  |
| Header     | `#6366f1` (indigo-500) |
| Accent     | `#6366f1` (indigo-500) |

### Palette Variants

Each theme has 3 palette options: **Original**, **Comfort**, **Space**

#### Original Palette

- Uses default theme colors
- Light theme: Indigo-based accent
- Dark theme: Indigo-based accent

#### Comfort Palette (`[data-palette="comfort"]`)

**Light Comfort:**
| Property | Value |
|----------|-------|
| Background | `#C5D5EA` |
| Text | `#0A1128` |
| Header | `#010e54` |
| Accent | `#0855b1` |

**Dark Comfort:**
| Property | Value |
|----------|-------|
| Background | `#121212` |
| Text | `#E0E0E0` |
| Accent | `#888888` |

#### Space Palette (`[data-palette="space"]`)

**Light Space:**
| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Text | `#264653` |
| Accent | `#2a9d8f` (teal) |
| Warning | `#e9c46a` (gold) |
| Danger | `#e76f51` (coral) |

**Dark Space:**
| Property | Value |
|----------|-------|
| Background | `#1a1a1a` |
| Text | `#e9c46a` (gold) |
| Accent | `#2a9d8f` (teal) |
| Border | `#f4a261` (orange) |

### Theme Combination Matrix

| Theme | Palette  | Background | Accent    | Unique Properties         |
| ----- | -------- | ---------- | --------- | ------------------------- |
| Light | Original | `#f8fafc`  | `#4f46e5` | Standard light theme      |
| Light | Comfort  | `#C5D5EA`  | `#0855b1` | Blue-tinted background    |
| Light | Space    | `#ffffff`  | `#2a9d8f` | Teal accent, warm palette |
| Dark  | Original | `#0f172a`  | `#6366f1` | Standard dark theme       |
| Dark  | Comfort  | `#121212`  | `#888888` | Muted, grayscale          |
| Dark  | Space    | `#1a1a1a`  | `#2a9d8f` | Teal accent, gold text    |

---

## Component-Specific Styles

### Global Styles (Lines 420-534)

| Selector             | Purpose          | Properties                                |
| -------------------- | ---------------- | ----------------------------------------- |
| `body`               | Root element     | Font, background, color transitions       |
| `.App`               | Main container   | Max-width, padding, centering             |
| `h1, h2, h3`         | Typography       | Font sizes, weights, margins              |
| `hr`                 | Horizontal rules | Border, margins                           |
| `.section-container` | Content sections | Background, border, shadow, hover effects |
| `.header-controls`   | Sticky header    | Flexbox, sticky positioning               |

### Button Styles (Lines 635-809)

| Class                       | Purpose                     |
| --------------------------- | --------------------------- |
| `button`                    | Base button styles          |
| `.generate-schedule-button` | Primary action button       |
| `.danger-button`            | Destructive action button   |
| `.lock-button`              | Toggle button with states   |
| `.lock-button.locked`       | Locked state (yellow)       |
| `.lock-button.unlocked`     | Unlocked state (green)      |
| `.delete-button`            | Icon-only delete button     |
| `.add-range-button`         | Dashed border add button    |
| `.remove-range-button`      | Circular remove button      |
| `.theme-toggle-button`      | Theme switcher button       |
| `.toggle-timetable-button`  | Timetable visibility toggle |

### Form Input Styles (Lines 811-855)

| Selector                                         | Purpose               |
| ------------------------------------------------ | --------------------- |
| `input[type="text"], input[type="number"], etc.` | Text inputs           |
| `textarea`                                       | Multi-line text input |
| `select`                                         | Dropdown select       |
| `input[type="checkbox"], input[type="radio"]`    | Checkboxes and radios |
| `.time-input`                                    | Time picker input     |

### Course Table Styles (Lines 861-1060)

| Class                   | Purpose                 |
| ----------------------- | ----------------------- |
| `.course-table`         | Main table container    |
| `.course-table-header`  | Table header row        |
| `.header-cell`          | Header cell styles      |
| `.data-cell`            | Data cell styles        |
| `.course-table-body`    | Table body              |
| `.even-row`, `.odd-row` | Row striping            |
| `.locked-row`           | Locked course highlight |
| `.conflict-highlight`   | Conflict warning style  |
| `.group-header-row`     | Subject group header    |
| `.no-data-row`          | Empty state row         |

### Filter Section Styles (Lines 1068-1380)

| Class                             | Purpose                  |
| --------------------------------- | ------------------------ |
| `.time-filter`                    | Filter container         |
| `.filter-section`                 | Individual filter group  |
| `.filter-label`                   | Section label            |
| `.day-checkboxes`                 | Day exclusion checkboxes |
| `.day-label`                      | Day checkbox label       |
| `.time-ranges-container`          | Time range inputs        |
| `.time-range-row`                 | Individual time range    |
| `.preferred-time-order-container` | Drag-to-reorder list     |
| `.preferred-time-order-item`      | Draggable item           |
| `.section-type-filters`           | Section type checkboxes  |

### Timetable Styles (Lines 2003-2551)

| Class                  | Purpose                  |
| ---------------------- | ------------------------ |
| `.timetable-container` | Timetable wrapper        |
| `.timetable`           | Main timetable grid      |
| `.day-header`          | Day column headers       |
| `.time-header`         | Time row headers         |
| `.day-cell`            | Course slot cell         |
| `.timetable-course`    | Course card in timetable |
| `.timetable-empty`     | Empty timetable state    |

### Status Badge Styles (Lines 1898-1937)

| Class                   | Purpose                 |
| ----------------------- | ----------------------- |
| `.status-badge`         | Base badge styles       |
| `.status-badge.open`    | Open section (green)    |
| `.status-badge.closed`  | Closed section (red)    |
| `.status-badge.warning` | Warning status (orange) |

### Responsive Breakpoints

| Breakpoint | Target           | Key Changes                                |
| ---------- | ---------------- | ------------------------------------------ |
| `992px`    | Tablet landscape | Stack controls, full-width elements        |
| `768px`    | Tablet portrait  | Card-based table rows, smaller typography  |
| `480px`    | Mobile           | Condensed timetable, smaller touch targets |

---

## CSS Specificity Patterns

### Specificity Hierarchy

1. **Base selectors** (0,0,1): `body`, `h1`, `button`, `input`
2. **Class selectors** (0,1,0): `.section-container`, `.course-table`
3. **Compound classes** (0,2,0): `.course-table-header`, `.locked-row`
4. **Attribute selectors** (0,1,0): `[data-theme="dark"]`
5. **Combined attribute + class** (0,2,0): `[data-theme="dark"] .status-badge`
6. **Important overrides** (1,0,0,0): Used sparingly for conflict highlights

### Specificity Gotchas

1. **Conflict highlight overrides** use `!important` for visibility:

   ```css
   .course-table-row.locked-row.conflict-highlight {
     background-color: #ffe0e0 !important;
     border-left: 5px solid #e53935 !important;
   }
   ```

2. **Theme-specific overrides** require attribute selector:

   ```css
   [data-theme='dark'] .course-table-row.locked-row.conflict-highlight {
     background-color: #a5283a55 !important;
   }
   ```

3. **Group header rows** use `!important` for background:
   ```css
   .group-header-row {
     background-color: var(--group-header-bg) !important;
   }
   ```

---

## Tailwind Migration Mapping

### Tailwind Config Structure

```javascript
// tailwind.config.mjs
export default {
  darkMode: 'class', // Use class strategy for manual control
  theme: {
    extend: {
      colors: {
        // Semantic colors mapping
        surface: {
          primary: 'var(--bg-color)',
          secondary: 'var(--section-bg)',
          elevated: 'var(--card-bg)',
          header: 'var(--header-bg)',
        },
        content: {
          primary: 'var(--text-color)',
          secondary: 'var(--text-muted-color)',
          link: 'var(--link-color)',
        },
        border: {
          default: 'var(--border-color)',
          input: 'var(--input-border)',
        },
        interactive: {
          primary: 'var(--accent)',
          'primary-hover': 'var(--accent-hover)',
          danger: 'var(--danger)',
          success: 'var(--success)',
          warning: 'var(--warning)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
      },
    },
  },
};
```

### Component Migration Examples

#### Button Component

**Current CSS:**

```css
button {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--border-radius-md);
  background-color: var(--button-bg);
  color: var(--button-text);
  border: 1px solid var(--button-border);
  transition: all var(--transition-fast);
}
```

**Tailwind Equivalent:**

```jsx
<button className="px-4 py-2 rounded-md bg-surface-interactive text-content-on-interactive
  border border-border-interactive transition-all duration-150
  hover:bg-surface-interactive-hover hover:-translate-y-0.5 hover:shadow-md">
```

#### Course Table Row

**Current CSS:**

```css
.course-table-body tr.locked-row {
  background-color: var(--locked-row-bg);
  color: var(--locked-row-text);
  border-left: 4px solid var(--lock-button-locked-bg);
}
```

**Tailwind Equivalent:**

```jsx
<tr className="bg-surface-warning text-content-warning border-l-4 border-warning">
```

### CSS Variables to Tailwind Theme

| CSS Variable              | Tailwind Config Path               |
| ------------------------- | ---------------------------------- |
| `--bg-color`              | `colors.surface.primary`           |
| `--text-color`            | `colors.content.primary`           |
| `--accent`                | `colors.interactive.primary`       |
| `--accent-hover`          | `colors.interactive.primary-hover` |
| `--danger`                | `colors.interactive.danger`        |
| `--success`               | `colors.interactive.success`       |
| `--warning`               | `colors.interactive.warning`       |
| `--font-family-base`      | `fontFamily.sans`                  |
| `--font-family-monospace` | `fontFamily.mono`                  |
| `--space-*`               | `spacing.*` (adjusted)             |
| `--border-radius-*`       | `borderRadius.*`                   |
| `--transition-fast`       | `transitionDuration.150`           |

### Theme Toggle Implementation

```jsx
// ThemeContext.tsx
const ThemeContext = createContext({
  theme: 'dark',
  palette: 'original',
  toggleTheme: () => {},
  cyclePalette: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [palette, setPalette] = useState(() => localStorage.getItem('palette') || 'original');

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('theme', theme);
    localStorage.setItem('palette', palette);
  }, [theme, palette]);

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, cyclePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## Recommendations

### Migration Strategy

1. **Phase 1: Foundation**
   - Create Tailwind config with all design tokens
   - Set up CSS custom properties fallbacks for themes
   - Implement theme toggle with class strategy

2. **Phase 2: Component Migration**
   - Start with atomic components (buttons, inputs, badges)
   - Migrate composite components (filters, table, timetable)
   - Preserve all hover/focus states

3. **Phase 3: Theme System**
   - Implement palette variants as CSS custom properties
   - Use Tailwind's `dark:` variant for theme switching
   - Create palette-specific overrides in CSS

### Critical Considerations

1. **Avoid `!important`**: The current CSS uses `!important` in 8 places for conflict highlighting. Use proper specificity in Tailwind instead.

2. **Responsive Patterns**: The mobile table transformation (card-based) requires special handling. Consider a separate component for mobile views.

3. **Animation Preservation**: All transitions (`--transition-*`) must be preserved for smooth theme switching.

4. **Toastify Variables**: May need custom toast component or retain react-toastify with CSS variable overrides.

5. **Accessibility**: Ensure focus states (`:focus-visible`) are preserved in Tailwind migration.

### Files to Create

1. `tailwind.config.mjs` - Design tokens and theme configuration
2. `src/styles/themes.css` - CSS custom properties for each theme/palette
3. `src/contexts/ThemeContext.tsx` - Theme state management

---

_Generated for T1.1.3 - Analyze CSS architecture and theming system_
