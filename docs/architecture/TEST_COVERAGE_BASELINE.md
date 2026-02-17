# Test Coverage Baseline Report

**Generated:** 2026-02-17
**Task:** T1.1.4 - Audit existing test coverage
**Test Framework:** Vitest

## Executive Summary

| Metric                    | Value  |
| ------------------------- | ------ |
| Total Tests               | 19     |
| Passing                   | 19     |
| Failing                   | 0      |
| Overall Function Coverage | 94.32% |
| Overall Line Coverage     | 81.25% |
| Test Files                | 2      |

## Coverage by File

### parseSchedule.js

| Metric            | Coverage | Target |
| ----------------- | -------- | ------ |
| Function Coverage | 86.36%   | 80%+   |
| Line Coverage     | 58.95%   | 80%+   |

**Uncovered Lines:** 14-17, 67-72, 79-82, 144, 150, 164, 166-169, 176, 180, 206, 240, 243-246, 260-261, 300-301, 304, 328, 330-343, 345-358, 360-375, 377-379, 381-396, 398-400, 403-418

**Functions Not Fully Covered:**

- `convertAmPmTo24Hour()` - Lines 14-17: console.warn for invalid time strings
- `normalizeDayCode()` - Lines 67-72, 79-82: Edge cases for unusual day codes
- Various parsing edge cases for TBA schedules, multi-slot schedules, and hybrid schedules

### parseRawData.js

| Metric            | Coverage | Target |
| ----------------- | -------- | ------ |
| Function Coverage | 90.91%   | 80%+   |
| Line Coverage     | 66.07%   | 80%+   |

**Uncovered Lines:** 29, 115-117, 119-134, 229, 232-235, 237, 239, 241, 244, 247-253, 256-259, 262-264, 266-267, 269, 271-272, 274-275, 283-288, 290-291, 351-368

**Functions Not Fully Covered:**

- `parseHTMLVariation()` - Lines 115-134: HTML parsing variations
- `parseCompactVariation()` - Lines 229-288: Compact format parsing edge cases
- `parseSpaceSeparated()` - Lines 351-368: Space-separated parsing edge cases

## Untested Files (0% Coverage)

### Critical Utility Files

| File                  | Lines | Purpose                        | Risk Level |
| --------------------- | ----- | ------------------------------ | ---------- |
| `generateIcs.js`      | 111   | iCalendar export generation    | HIGH       |
| `convertToRawData.js` | 29    | Raw data conversion for export | MEDIUM     |

### Scheduling Algorithms (App.jsx)

| Algorithm                               | Lines | Purpose                                         | Risk Level |
| --------------------------------------- | ----- | ----------------------------------------------- | ---------- |
| `checkTimeOverlap`                      | ~6    | Time range conflict detection                   | HIGH       |
| `isScheduleConflictFree`                | ~31   | Schedule conflict verification                  | HIGH       |
| `getTimeOfDayBucket`                    | ~7    | Time categorization (morning/afternoon/evening) | LOW        |
| `scoreScheduleByTimePreference`         | ~15   | Preference-based scoring                        | MEDIUM     |
| `exceedsMaxUnits`                       | ~7    | Unit limit validation                           | MEDIUM     |
| `exceedsMaxGap`                         | ~30   | Gap threshold validation                        | MEDIUM     |
| `countCampusDays`                       | ~16   | Campus day counting                             | LOW        |
| `getAllSubsets`                         | ~9    | Power set generation                            | MEDIUM     |
| `generateExhaustiveBestSchedule`        | ~83   | Exhaustive schedule search                      | HIGH       |
| `generateBestPartialSchedule_Heuristic` | ~121  | Heuristic schedule generation                   | HIGH       |
| `generateBestPartialSchedule`           | ~64   | Main partial schedule entry point               | HIGH       |
| `loadFromLocalStorage`                  | ~72   | State persistence with validation               | MEDIUM     |

**Total Untested Algorithm Lines:** ~461 lines

## Test Gaps Analysis

### parseSchedule.js - Missing Test Cases

1. **Invalid Time Strings** (Lines 14-17)
   - Non-matching regex patterns
   - Malformed AM/PM times
   - Empty/null inputs

2. **Day Code Edge Cases** (Lines 67-72, 79-82)
   - Unusual day code combinations
   - Invalid day codes
   - NULL/undefined day codes

3. **TBA Schedules** (Lines 330+)
   - "TBA" time slots
   - TBA with room assignments
   - Mixed TBA and scheduled slots

4. **Multi-Slot Parsing** (Lines 345+)
   - More than 2 time slots
   - Complex hybrid schedules
   - Invalid multi-slot formats

### parseRawData.js - Missing Test Cases

1. **HTML Parsing Variations** (Lines 115-134)
   - Malformed HTML tables
   - Missing table cells
   - Invalid HTML structure

2. **Compact Variation Parsing** (Lines 229-288)
   - Invalid compact formats
   - Missing fields
   - Edge case combinations

3. **Space-Separated Parsing** (Lines 351-368)
   - Inconsistent spacing
   - Missing columns
   - Invalid data types

### generateIcs.js - Missing Tests

1. **Core Functions**
   - `formatToICalDateTime()` - Date/time formatting
   - `getMondayOfCurrentWeek()` - Week calculation
   - `mapDaysToICalByDay()` - Day code mapping
   - `generateIcsContent()` - Full ICS generation

2. **Edge Cases**
   - Empty course list
   - TBA schedules (should be skipped)
   - Multi-slot courses
   - Missing room information

### convertToRawData.js - Missing Tests

1. **Core Function**
   - `convertCoursesToRawData()` - Roundtrip conversion

2. **Edge Cases**
   - Empty array input
   - Null/undefined input
   - Missing optional fields
   - Field type conversions

## Recommendations

### Priority 1: Critical Path Testing

1. **generateIcs.test.ts** - Add tests for calendar export
   - Test ICS format compliance
   - Test with various course configurations
   - Test edge cases (TBA, multi-slot)

2. **scheduleAlgorithms.test.ts** - Add comprehensive algorithm tests
   - Unit tests for each algorithm function
   - Integration tests for schedule generation
   - Edge case coverage for conflict detection

### Priority 2: Improve Existing Coverage

1. **parseSchedule.test.js** - Add missing edge cases
   - Invalid time string handling
   - TBA schedule parsing
   - Complex multi-slot scenarios

2. **parseRawData.test.js** - Add missing edge cases
   - Malformed HTML handling
   - Invalid compact format handling
   - Error conditions

### Priority 3: Roundtrip Testing

1. **convertToRawData.test.ts** - Add export conversion tests
   - Test roundtrip: parseRawCourseData → convertCoursesToRawData → parseRawCourseData
   - Verify data integrity preservation

## Coverage Target

| Category              | Current    | Target  | Gap       |
| --------------------- | ---------- | ------- | --------- |
| Utility Functions     | 81.25%     | 80%     | ✓ Met     |
| Scheduling Algorithms | 0%         | 80%     | -80%      |
| Export Functions      | 0%         | 80%     | -80%      |
| **Overall**           | **81.25%** | **80%** | **✓ Met** |

**Note:** Overall target is met, but critical gaps exist in:

- Scheduling algorithms (0% coverage)
- ICS generation (0% coverage)
- Data export (0% coverage)

## Files to Create

| File                         | Purpose                 | Priority |
| ---------------------------- | ----------------------- | -------- |
| `generateIcs.test.ts`        | ICS export tests        | HIGH     |
| `convertToRawData.test.ts`   | Export conversion tests | MEDIUM   |
| `scheduleAlgorithms.test.ts` | Algorithm unit tests    | HIGH     |

## Conclusion

The existing test suite provides good coverage for the core parsing utilities (parseSchedule.js, parseRawData.js) at 81.25% line coverage. However, critical functionality remains untested:

- **Scheduling algorithms** (~461 lines) are completely untested
- **Export functions** (ICS generation, data conversion) have no tests
- **Edge cases** in existing parsers need additional coverage

**Next Steps:**

1. Create comprehensive tests for scheduling algorithms before migration
2. Add tests for export functionality
3. Improve edge case coverage in existing tests
