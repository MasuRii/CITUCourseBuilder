# ADR-002: UI Component Strategy

## Status

**Accepted**

## Context

The CITUCourseBuilder application currently uses Material-UI (MUI) for interactive components. As part of the Astro migration, we need to decide on a UI component strategy that:

1. **Reduces bundle size** - MUI contributes approximately 300 KB to the bundle
2. **Maintains accessibility** - All components must be WCAG 2.1 AA compliant
3. **Preserves functionality** - All existing interactions (menus, dialogs, tooltips) must work identically
4. **Supports Tailwind CSS** - Must integrate well with our chosen CSS approach
5. **Enables "hobby student" aesthetic** - Approachable, playful, modern design
6. **Minimizes migration complexity** - Limited learning curve, straightforward implementation

### Current MUI Usage

| Component           | Usage Location                              | Purpose                    |
| ------------------- | ------------------------------------------- | -------------------------- |
| `Tooltip`           | App.jsx, CourseTable.jsx, TimetableView.jsx | Hover information          |
| `IconButton`        | CourseTable.jsx, TimetableView.jsx          | Compact action buttons     |
| `Menu`              | CourseTable.jsx, TimetableView.jsx          | Dropdown menus for actions |
| `MenuItem`          | CourseTable.jsx, TimetableView.jsx          | Menu items                 |
| `Button`            | ConfirmDialog.jsx                           | Dialog actions             |
| `Dialog`            | ConfirmDialog.jsx                           | Confirmation modal         |
| `DialogActions`     | ConfirmDialog.jsx                           | Dialog footer              |
| `DialogContent`     | ConfirmDialog.jsx                           | Dialog body                |
| `DialogContentText` | ConfirmDialog.jsx                           | Dialog text                |
| `DialogTitle`       | ConfirmDialog.jsx                           | Dialog header              |

### Current MUI Icons Usage

| Icon                  | Usage Location                              | Purpose                |
| --------------------- | ------------------------------------------- | ---------------------- |
| `InfoOutlinedIcon`    | App.jsx, CourseTable.jsx, ConfirmDialog.jsx | Information indicator  |
| `PaletteOutlinedIcon` | App.jsx                                     | Theme palette selector |
| `WarningAmberIcon`    | ConfirmDialog.jsx                           | Warning indicator      |
| `MenuIcon`            | CourseTable.jsx, TimetableView.jsx          | Dropdown menu trigger  |

## Decision

**Build custom Tailwind-styled components with Lucide icons.**

We will create lightweight, accessible custom components styled with Tailwind CSS and use Lucide for icons. This approach provides:

- **Minimal bundle impact** - Only include what we need, no component library overhead
- **Full design control** - Match the "hobby student" aesthetic precisely
- **Tailwind integration** - Native integration with our CSS approach
- **Accessibility built-in** - Implement ARIA patterns from scratch with full control
- **TypeScript support** - Full type safety for all components

## Alternatives Considered

### shadcn/ui

| Aspect              | Pros                                  | Cons                                 |
| ------------------- | ------------------------------------- | ------------------------------------ |
| **Tailwind native** | Built specifically for Tailwind CSS   | Requires React context providers     |
| **Accessibility**   | Radix UI primitives, WCAG compliant   | Additional dependency chain          |
| **Bundle size**     | Copy-paste components, tree-shakeable | Still adds Radix as dependency       |
| **Customization**   | Highly customizable                   | May be over-engineered for our needs |
| **TypeScript**      | Full TypeScript support               | Complexity for simple components     |

**Verdict**: Not chosen because it introduces Radix UI as a dependency chain. Our component needs are relatively simple (menus, tooltips, dialogs) and don't require the full accessibility primitives that Radix provides. The copy-paste nature also adds maintenance overhead.

### Headless UI

| Aspect            | Pros                    | Cons                                       |
| ----------------- | ----------------------- | ------------------------------------------ |
| **Unstyled**      | Full styling control    | Requires building all styling from scratch |
| **Accessibility** | Excellent ARIA patterns | Tailwind UI integration adds complexity    |
| **React support** | Good React integration  | Additional dependency (~15 KB)             |
| **Bundle size**   | Smaller than MUI        | Still adds to bundle                       |

**Verdict**: Not chosen because it adds another dependency without providing significant value over custom components. Our accessibility requirements can be met with proper ARIA implementation in custom components.

### Radix UI (Standalone)

| Aspect            | Pros                                   | Cons                         |
| ----------------- | -------------------------------------- | ---------------------------- |
| **Accessibility** | Best-in-class accessibility primitives | Complex API for simple needs |
| **Unstyled**      | Full styling control                   | Steep learning curve         |
| **Bundle size**   | Tree-shakeable                         | Multiple packages needed     |

**Verdict**: Not chosen because the API complexity is unnecessary for our use case. We only need basic interactive patterns (tooltip, menu, dialog) that can be implemented with simpler approaches.

### Custom Tailwind Components

| Aspect                   | Pros                    | Cons                                  |
| ------------------------ | ----------------------- | ------------------------------------- |
| **Bundle size**          | Zero library overhead   | Development time for implementation   |
| **Tailwind integration** | Native, no conflicts    | None                                  |
| **Customization**        | Complete control        | Must implement accessibility manually |
| **Learning curve**       | Minimal, just Tailwind  | Must know ARIA patterns               |
| **TypeScript**           | Full control over types | Must write all types                  |

**Verdict**: **Chosen** because:

- We only need ~10 simple components
- Full control over the "hobby student" aesthetic
- Zero library overhead in bundle
- Simpler mental model - just Tailwind + ARIA
- Team already knows Tailwind and basic accessibility patterns

## Component Mapping

### MUI to Custom Components

| MUI Component   | Custom Component       | Tailwind Classes                                          | Notes                                |
| --------------- | ---------------------- | --------------------------------------------------------- | ------------------------------------ |
| `Tooltip`       | `Tooltip.tsx`          | `relative`, `absolute`, `bg-gray-900`, `text-white`       | Use `aria-describedby` pattern       |
| `IconButton`    | `IconButton.tsx`       | `p-2`, `rounded-full`, `hover:bg-gray-100`                | Standard button with icon            |
| `Menu`          | `DropdownMenu.tsx`     | `absolute`, `bg-white`, `shadow-lg`, `rounded-md`         | Use `role="menu"` pattern            |
| `MenuItem`      | (part of DropdownMenu) | `px-4`, `py-2`, `hover:bg-gray-100`                       | Use `role="menuitem"`                |
| `Button`        | `Button.tsx`           | `px-4`, `py-2`, `rounded-md`, `font-medium`               | Variants: primary, secondary, danger |
| `Dialog`        | `Dialog.tsx`           | `fixed`, `inset-0`, `bg-black/50`, `flex`, `items-center` | Use `role="dialog"`, `aria-modal`    |
| `DialogActions` | (part of Dialog)       | `flex`, `gap-2`, `justify-end`                            | Footer section                       |
| `DialogContent` | (part of Dialog)       | `p-6`, `text-gray-700`                                    | Body section                         |
| `DialogTitle`   | (part of Dialog)       | `text-lg`, `font-semibold`                                | Header section                       |

### Icon Mapping: MUI to Lucide

| MUI Icon              | Lucide Icon              | Notes                                                 |
| --------------------- | ------------------------ | ----------------------------------------------------- |
| `InfoOutlinedIcon`    | `Info`                   | Information indicator                                 |
| `PaletteOutlinedIcon` | `Palette`                | Theme palette selector                                |
| `WarningAmberIcon`    | `AlertTriangle`          | Warning indicator                                     |
| `MenuIcon`            | `MoreVertical` or `Menu` | Dropdown trigger (use MoreVertical for context menus) |

### Additional Icons Needed

Based on component functionality, we'll also need:

| Icon Purpose | Lucide Icon   | Usage                     |
| ------------ | ------------- | ------------------------- |
| Lock         | `Lock`        | Locked course indicator   |
| Unlock       | `Unlock`      | Unlocked course indicator |
| Delete       | `Trash2`      | Delete actions            |
| Export       | `Download`    | Export menu               |
| Copy         | `Copy`        | Copy to clipboard         |
| Close        | `X`           | Close buttons, dialogs    |
| Check        | `Check`       | Success indicators        |
| Calendar     | `Calendar`    | ICS export                |
| Image        | `Image`       | PNG export                |
| File         | `FileText`    | PDF export                |
| Sun          | `Sun`         | Light theme               |
| Moon         | `Moon`        | Dark theme                |
| ChevronDown  | `ChevronDown` | Dropdown indicators       |
| ChevronUp    | `ChevronUp`   | Sort indicators           |
| Filter       | `Filter`      | Filter section            |

## Implementation Strategy

### Phase 1: Core Components (Phase 4)

1. **Button Component**
   - Variants: primary, secondary, danger, ghost
   - Sizes: sm, md, lg
   - States: hover, focus, disabled, loading

2. **IconButton Component**
   - Extends Button with icon-only styling
   - Proper ARIA label required

3. **Tooltip Component**
   - Delay on show/hide (300ms)
   - Position: top, bottom, left, right
   - Accessible via keyboard

### Phase 2: Overlay Components (Phase 4)

4. **DropdownMenu Component**
   - Trigger + portal-rendered menu
   - Keyboard navigation (arrow keys, enter, escape)
   - Focus trap and return focus on close

5. **Dialog Component**
   - Modal overlay with backdrop
   - Focus trap
   - Escape to close
   - Click outside to close
   - Scroll lock on body

### Phase 3: Icon Integration (Phase 4)

6. **Install Lucide React**

   ```bash
   bun add lucide-react
   ```

7. **Create Icon Wrappers** (optional)
   - Standardize icon sizes
   - Apply consistent styling

## Accessibility Implementation

### Tooltip Pattern

```tsx
// Using aria-describedby for accessibility
<div className="relative group">
  <button aria-describedby="tooltip-id">
    <Info className="w-4 h-4" />
  </button>
  <div
    id="tooltip-id"
    role="tooltip"
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity"
  >
    Tooltip text
  </div>
</div>
```

### Menu Pattern

```tsx
// Using role="menu" pattern
<div className="relative">
  <button aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
    <MoreVertical className="w-4 h-4" />
  </button>
  {isOpen && (
    <div role="menu" className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
      <button role="menuitem" className="block w-full text-left px-4 py-2 hover:bg-gray-100">
        Action 1
      </button>
    </div>
  )}
</div>
```

### Dialog Pattern

```tsx
// Using role="dialog" pattern
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    className="bg-white rounded-lg p-6 max-w-md"
  >
    <h2 id="dialog-title" className="text-lg font-semibold">
      Dialog Title
    </h2>
    <p>Dialog content</p>
    <div className="flex gap-2 justify-end mt-4">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  </div>
</div>
```

## Bundle Size Impact

| Component  | MUI Size | Custom Size | Savings    |
| ---------- | -------- | ----------- | ---------- |
| Tooltip    | ~15 KB   | ~1 KB       | 14 KB      |
| Menu       | ~20 KB   | ~2 KB       | 18 KB      |
| Dialog     | ~25 KB   | ~2 KB       | 23 KB      |
| Button     | ~10 KB   | ~1 KB       | 9 KB       |
| Icons (10) | ~30 KB   | ~5 KB       | 25 KB      |
| **Total**  | ~100 KB  | ~11 KB      | **~89 KB** |

_Note: Sizes are estimated gzipped. Actual savings will be higher due to MUI's internal dependencies and emotion CSS-in-JS runtime._

## Consequences

### Positive

- **Significant bundle reduction** - Estimated 89 KB savings from MUI removal
- **Full design control** - Match the playful "hobby student" aesthetic exactly
- **No library lock-in** - Components are owned by the project
- **Simpler mental model** - Just Tailwind + basic ARIA patterns
- **Better performance** - No runtime CSS-in-JS, smaller JS bundle

### Negative

- **Development time** - Must build 5-6 custom components (~2-3 days)
- **Accessibility responsibility** - Must implement ARIA patterns correctly
- **Testing overhead** - Need to test accessibility manually

### Neutral

- **Learning curve** - Team must know basic ARIA patterns (already documented)
- **Maintenance** - Components require ongoing maintenance (but simpler than MUI upgrades)

## References

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- Project CSS Architecture: `docs/architecture/CSS_ARCHITECTURE.md`
- Component Dependencies: `docs/architecture/COMPONENT_DEPENDENCY_GRAPH.md`
