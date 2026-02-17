# ADR-001: Framework Migration Approach

## Status

**Accepted**

## Context

The CITUCourseBuilder application is currently built with React 19 + Vite. We need to migrate to a modern framework that:

1. **Preserves all existing functionality** - Smart import, course management, locking, filtering, schedule generation, timetable visualization, and export options must work identically
2. **Reduces bundle size** - Current bundle is 1,070 KB (457 KB gzipped), with MUI contributing ~300 KB
3. **Improves performance** - Current FCP is 4.0s, LCP is 4.4s, Lighthouse Performance is 75
4. **Maintains React ecosystem compatibility** - Existing scheduling logic (~461 lines) and utility functions must be preserved
5. **Supports deployment to GitHub Pages** - Static hosting with `/CITUCourseBuilder/` base path
6. **Enables modern tooling** - TypeScript strict mode, Tailwind CSS, modern build tooling

## Decision

**Migrate to Astro 5.x with React islands.**

We will use Astro as the primary framework with React components loaded as "islands" for interactive features. This approach provides:

- **Zero JS by default** - Astro renders static HTML, loading JavaScript only for interactive components
- **Partial hydration** - React components load only where interactivity is needed (schedule generation, filters, timetable)
- **Framework agnostic** - Can use React, Vue, Svelte, or other frameworks together
- **Built-in optimizations** - Automatic CSS minification, image optimization, asset fingerprinting
- **Content-focused** - Ideal for applications with mostly static content and isolated interactive areas

## Alternatives Considered

### Next.js

| Aspect | Pros | Cons |
|--------|------|------|
| **React ecosystem** | First-class React support, large community | Full React bundle shipped to client |
| **SSR/SSG** | Excellent SSR and SSG capabilities | Overkill for mostly client-side interactivity |
| **Bundle size** | Good code-splitting | Still ships full React runtime |
| **Learning curve** | Well-documented | Requires understanding of server/client boundaries |
| **Deployment** | Vercel optimized, GitHub Pages possible | Config complexity for static export |

**Verdict**: Not chosen because the application doesn't benefit significantly from SSR. The schedule generation and filtering logic is entirely client-side, making Next.js's primary advantage (SSR) less valuable.

### Pure Vite (Stay Current)

| Aspect | Pros | Cons |
|--------|------|------|
| **Zero migration** | No changes needed, already using Vite | No bundle size improvement without major refactoring |
| **Familiarity** | Team knows the setup | Doesn't solve performance issues |
| **Flexibility** | Full control over architecture | Requires manual optimization |

**Verdict**: Not chosen because it doesn't address the core problems (bundle size, MUI dependency, performance). Staying with the current setup would require significant manual optimization work that Astro provides out of the box.

### Remix

| Aspect | Pros | Cons |
|--------|------|------|
| **Modern React** | Uses React Router, progressive enhancement | Full React bundle required |
| **Data loading** | Excellent data loading patterns | Overkill for client-side-only data |
| **Performance** | Good Core Web Vitals focus | Not optimized for static + islands pattern |

**Verdict**: Not chosen because Remix is optimized for applications with server-side data needs. Our application processes all data client-side (localStorage, user input), making Remix's strengths less applicable.

### Astro with React Islands

| Aspect | Pros | Cons |
|--------|------|------|
| **Bundle size** | Zero JS by default, React only for interactive parts | Requires thinking in "islands" pattern |
| **Performance** | Best possible initial load, partial hydration | Slightly more complex component architecture |
| **React compatibility** | Full React support via @astrojs/react | Need to identify hydration boundaries |
| **Tailwind support** | First-class Tailwind integration | Requires CSS migration from App.css |
| **Static deployment** | Perfect fit for GitHub Pages | None significant |
| **TypeScript** | Excellent TypeScript support | None significant |

**Verdict**: **Chosen** because it directly addresses all our requirements:
- Reduces bundle size by shipping zero JS for static content
- Preserves React components as islands for interactive features
- Supports Tailwind CSS out of the box
- Perfect for static deployment to GitHub Pages
- Maintains full React ecosystem compatibility

## Implementation Strategy

1. **Phase 2**: Initialize Astro project with React and Tailwind integrations
2. **Phase 3**: Migrate utility functions and scheduling algorithms as TypeScript modules
3. **Phase 3**: Convert React components to Astro islands with explicit hydration directives
4. **Phase 4**: Replace MUI components with Tailwind-styled custom components
5. **Phase 5**: Optimize bundle size and performance

### Hydration Strategy

| Component | Hydration Directive | Rationale |
|-----------|---------------------|-----------|
| RawDataInput | `client:load` | Critical for user input, must be interactive immediately |
| CourseTable | `client:load` | Central feature, user interacts immediately |
| TimeFilter | `client:visible` | Can wait until user scrolls to filter section |
| TimetableView | `client:visible` | Heavy component with export libraries, lazy load |
| ConfirmDialog | `client:load` | May appear on initial interaction |

## Consequences

### Positive

- **~30-40% bundle size reduction** expected (removing MUI, zero JS for static content)
- **Improved FCP/LCP** - Static content renders without JavaScript
- **Better SEO** - Server-rendered HTML for all content
- **Modern tooling** - Built-in TypeScript, Tailwind, image optimization
- **Future flexibility** - Can add other frameworks if needed

### Negative

- **Learning curve** - Team needs to understand islands architecture
- **Migration effort** - ~7-10 days estimated for full migration
- **Hydration boundaries** - Need to carefully identify which components need client-side JS

### Neutral

- **React dependency remains** - Still shipping React for interactive islands
- **localStorage unchanged** - Client-side state management pattern preserved

## References

- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro + React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- Project Performance Baseline: `docs/architecture/PERFORMANCE_BASELINE.md`
- Component Architecture: `docs/architecture/COMPONENT_DEPENDENCY_GRAPH.md`
