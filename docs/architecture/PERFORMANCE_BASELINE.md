# Performance Baseline Report

**Generated:** 2026-02-17  
**Project:** course-scheduler-web (React 19 + Vite)  
**Purpose:** Establish performance baseline before Astro migration

---

## Executive Summary

| Metric                    | Value   | Target   | Status            |
| ------------------------- | ------- | -------- | ----------------- |
| Bundle Size (gzipped)     | ~457 KB | ≤ 500 KB | ✅ Within target  |
| Build Time                | 4.13s   | ≤ 30s    | ✅ Within target  |
| Lighthouse Performance    | 75      | ≥ 90     | ⚠️ Below target   |
| Lighthouse Accessibility  | 90      | ≥ 90     | ✅ Meets target   |
| Lighthouse Best Practices | 100     | ≥ 90     | ✅ Exceeds target |
| Lighthouse SEO            | 91      | ≥ 90     | ✅ Meets target   |

---

## Bundle Size Analysis

### Uncompressed Sizes

| Asset                  | Size                     |
| ---------------------- | ------------------------ |
| index.js (main bundle) | 1,070.36 KB              |
| html2canvas.esm.js     | 202.38 KB                |
| index.es.js (jspdf)    | 159.35 KB                |
| purify.es.js           | 22.64 KB                 |
| **Total JS**           | **1,454.72 KB**          |
| index.css              | 85.83 KB                 |
| favicon.ico            | 15.09 KB                 |
| **Total dist/**        | **1,556.36 KB (1.5 MB)** |

### Gzipped Sizes

| Asset                  | Size (gzip) |
| ---------------------- | ----------- |
| index.js (main bundle) | 333.78 KB   |
| html2canvas.esm.js     | 48.04 KB    |
| index.es.js (jspdf)    | 53.40 KB    |
| purify.es.js           | 8.75 KB     |
| **Total JS (gzip)**    | **~444 KB** |
| index.css (gzip)       | 13.10 KB    |
| **Total (gzip)**       | **~457 KB** |

### Build Warnings

```
(!) Some chunks are larger than 500 kB after minification.
Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
```

**Impact:** Main bundle (index.js) is 1,070 KB uncompressed, indicating need for code-splitting.

---

## Build Performance

| Metric                         | Value |
| ------------------------------ | ----- |
| Build Time                     | 4.13s |
| Real Time (including overhead) | 4.51s |
| Modules Transformed            | 1,092 |

**Analysis:** Build performance is excellent. Vite's esbuild-based bundling is highly efficient.

---

## Lighthouse Scores

### Category Scores

| Category       | Score   | Rating               |
| -------------- | ------- | -------------------- |
| Performance    | 75/100  | ⚠️ Needs improvement |
| Accessibility  | 90/100  | ✅ Good              |
| Best Practices | 100/100 | ✅ Excellent         |
| SEO            | 91/100  | ✅ Good              |

### Core Web Vitals

| Metric                         | Value | Rating               | Threshold      |
| ------------------------------ | ----- | -------------------- | -------------- |
| First Contentful Paint (FCP)   | 4.0s  | ⚠️ Needs improvement | < 1.8s (good)  |
| Largest Contentful Paint (LCP) | 4.4s  | ⚠️ Needs improvement | < 2.5s (good)  |
| Total Blocking Time (TBT)      | 70ms  | ✅ Good              | < 200ms (good) |
| Cumulative Layout Shift (CLS)  | 0     | ✅ Excellent         | < 0.1 (good)   |
| Speed Index                    | 4.1s  | ⚠️ Needs improvement | < 3.4s (good)  |

### Performance Issues Identified

1. **Large JavaScript Bundle** (1,070 KB main bundle)
   - React, MUI, and application code bundled together
   - No code-splitting implemented
   - Recommendation: Implement route-based code splitting

2. **Slow FCP/LCP** (4.0s/4.4s)
   - Large JS bundle delays initial render
   - Recommendation: Critical CSS inlining, lazy loading

3. **No Critical Path Optimization**
   - All assets loaded upfront
   - Recommendation: Preload critical assets, defer non-critical

---

## Memory Usage Patterns

### Observed Patterns

Based on code analysis:

1. **localStorage Persistence**
   - 13 localStorage keys with `courseBuilder_` prefix
   - Stores: courses, preferences, theme, filters
   - Pattern: Load on mount, save on change
   - Potential memory issue: Large course datasets stored in localStorage

2. **React State Management**
   - 22 useState hooks in App.jsx
   - No state management library (Zustand, Jotai, etc.)
   - Potential issue: Deep re-renders on state changes

3. **Schedule Generation**
   - Exhaustive algorithm: O(n!) complexity in worst case
   - Heuristic fallback at n=12 courses
   - Memory usage: Power set generation for small n
   - Recommendation: Consider streaming/lazy evaluation

4. **Export Functions**
   - html-to-image for PNG export
   - jspdf for PDF export
   - Both require full DOM snapshot in memory
   - Recommendation: Warn users for large timetables

### Browser Memory Estimate

| Component             | Estimated Memory |
| --------------------- | ---------------- |
| React Virtual DOM     | ~5-20 MB         |
| MUI Component Tree    | ~10-30 MB        |
| Course Data (typical) | ~1-5 MB          |
| Generated Schedules   | ~0.5-2 MB        |
| Export Buffers        | ~5-15 MB         |
| **Estimated Total**   | **~20-70 MB**    |

---

## Dependencies Analysis

### Production Dependencies

| Package             | Version | Bundle Impact         |
| ------------------- | ------- | --------------------- |
| react               | 19.2.3  | Core framework        |
| react-dom           | 19.2.3  | DOM rendering         |
| @mui/material       | 7.3.7   | ~200 KB (tree-shaken) |
| @mui/icons-material | 7.3.7   | ~100 KB (partial)     |
| react-toastify      | 11.0.5  | ~15 KB                |
| react-datepicker    | 8.10.0  | ~25 KB                |
| html-to-image       | 1.11.13 | ~50 KB                |
| jspdf               | 4.1.0   | ~150 KB               |

### Potential Bundle Optimizations

1. **Replace MUI with Tailwind components** (Planned)
   - Estimated savings: ~250-300 KB
   - Impact: Faster initial load, smaller bundle

2. **Lazy load export libraries**
   - html-to-image and jspdf only needed on export
   - Estimated savings: ~200 KB initial load

3. **Use Lucide instead of MUI Icons**
   - Smaller icon library, tree-shakeable
   - Estimated savings: ~80-100 KB

---

## Migration Recommendations

### Pre-Migration Actions

1. ✅ Document current baseline (this document)
2. ✅ Identify bundle optimization opportunities
3. ⏳ Consider adding performance monitoring

### Post-Migration Targets

| Metric                 | Current | Target   | Improvement |
| ---------------------- | ------- | -------- | ----------- |
| Bundle Size (gzip)     | ~457 KB | < 300 KB | -34%        |
| Lighthouse Performance | 75      | ≥ 90     | +20%        |
| FCP                    | 4.0s    | < 2.0s   | -50%        |
| LCP                    | 4.4s    | < 2.5s   | -43%        |

### Expected Improvements from Astro Migration

1. **Islands Architecture**
   - React components load only when interactive
   - Static content rendered as HTML
   - Expected FCP improvement: 40-60%

2. **Tailwind CSS**
   - Smaller CSS bundle (only used classes)
   - No MUI runtime overhead
   - Expected CSS savings: 70-80%

3. **Code Splitting**
   - Export libraries loaded on-demand
   - Route-based splitting for future expansion
   - Expected JS savings: 30-40%

---

## Monitoring Setup

### Recommended Metrics to Track

1. **Build Metrics**
   - Build time
   - Bundle size per chunk
   - Tree-shaking effectiveness

2. **Runtime Metrics**
   - FCP, LCP, TBT, CLS (Core Web Vitals)
   - Time to Interactive
   - Memory usage during schedule generation

3. **User Experience Metrics**
   - Schedule generation time (per mode)
   - Export generation time
   - Course import time

### CI Integration

Add to GitHub Actions workflow:

```yaml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli@0.13.x
    lhci autorun
```

---

## Appendix: Raw Build Output

```
vite v6.4.1 building for production...
transforming...
✓ 1092 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          0.72 kB │ gzip:   0.44 kB
dist/assets/favicon-BiYjt9HQ.ico        15.09 kB
dist/assets/index-DBsjNNLT.css          85.83 kB │ gzip:  13.10 kB
dist/assets/purify.es-B9ZVCkUG.js       22.64 kB │ gzip:   8.75 kB
dist/assets/index.es-BFqSw5ME.js       159.35 kB │ gzip:  53.40 kB
dist/assets/html2canvas.esm-QH1iLAAe.js 202.38 kB │ gzip:  48.04 kB
dist/assets/index-DwiAtaJF.js        1,070.36 kB │ gzip: 333.78 kB
✓ built in 4.13s
```

---

_Report generated for Task T1.1.5 - Document current performance metrics_
