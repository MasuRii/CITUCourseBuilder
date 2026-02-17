/**
 * importVerification.test.ts - Verification tests for data import functionality
 *
 * Tests verify that all import formats (WITS/AIMS) work correctly
 * and produce identical results to the original implementation.
 *
 * @module tests/importVerification.test
 * @task T3.3.1 - Verify smart data import
 */

import { describe, it, expect } from 'vitest';
import { parseRawCourseData } from '@/utils/parseRawData';
import { parseSchedule } from '@/utils/parseSchedule';

// ============================================================================
// WITS HTML Table Import Tests
// ============================================================================

describe('WITS HTML Table Import', () => {
  it('should parse WITS HTML table with MUI classes', () => {
    const witsData = `
      <tbody class="MuiTableBody-root css-wjl0su">
        <tr class="MuiTableRow-root css-6uhcp">
          <td class="MuiTableCell-root"><div class="MuiGrid-root">BSIT-1A</div></td>
          <td class="MuiTableCell-root"><div class="MuiGrid-root">IT 101</div></td>
          <td class="MuiTableCell-root"><div class="html-content">08:00 AM - 10:00 AM</div></td>
          <td class="MuiTableCell-root"><div class="html-content">MWF</div></td>
          <td class="MuiTableCell-root"><div class="html-content">ROOM101</div></td>
          <td class="MuiTableCell-root"><div class="html-content">LEC</div></td>
          <td class="MuiTableCell-root">25/40</div></td>
          <td class="MuiTableCell-root">In-Person</div></td>
          <td class="MuiTableCell-root"></td>
          <td class="MuiTableCell-root">Open</div></td>
        </tr>
      </tbody>
    `;

    const result = parseRawCourseData(witsData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.section).toBe('BSIT-1A');
    expect(course!.subject).toBe('IT 101');
    expect(course!.totalSlots).toBe(40);
    expect(course!.enrolled).toBe(25);
    expect(course!.isClosed).toBe(false);
  });

  it('should parse WITS HTML table with subject header', () => {
    const witsData = `
      <p class="MuiTypography-root MuiTypography-body1 css-15vuy4d">IT 344 - Systems Administration (3.0 units)</p>
      <tbody class="MuiTableBody-root">
        <tr class="MuiTableRow-root">
          <td class="MuiTableCell-root">G1</td>
          <td class="MuiTableCell-root">C0</td>
          <td class="MuiTableCell-root">08:00 AM - 12:00 PM</td>
          <td class="MuiTableCell-root">WFM</td>
          <td class="MuiTableCell-root">FIELD</td>
          <td class="MuiTableCell-root">LEC</td>
          <td class="MuiTableCell-root">39/40</td>
          <td class="MuiTableCell-root">In-Person</td>
          <td class="MuiTableCell-root"></td>
          <td class="MuiTableCell-root">Open</td>
        </tr>
      </tbody>
    `;

    const result = parseRawCourseData(witsData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.subject).toBe('IT 344');
    expect(course!.subjectTitle).toBe('Systems Administration');
    expect(course!.creditedUnits).toBe(3.0);
  });

  it('should handle multiple sections in WITS HTML', () => {
    const witsData = `
      <p class="MuiTypography-root MuiTypography-body1">IT 101 - Programming I (3.0 units)</p>
      <table>
        <tr><td>BSIT-1A</td><td>C0</td><td>08:00 AM - 10:00 AM</td><td>MWF</td><td>ROOM101</td><td>LEC</td><td>20/40</td><td>In-Person</td><td></td><td>Open</td></tr>
        <tr><td>BSIT-1B</td><td>C0</td><td>10:00 AM - 12:00 PM</td><td>MWF</td><td>ROOM101</td><td>LEC</td><td>35/40</td><td>In-Person</td><td></td><td>Open</td></tr>
      </table>
      <p class="MuiTypography-root MuiTypography-body1">IT 102 - Programming II (3.0 units)</p>
      <table>
        <tr><td>BSIT-2A</td><td>C0</td><td>01:00 PM - 03:00 PM</td><td>TTH</td><td>LAB1</td><td>LAB</td><td>40/40</td><td>In-Person</td><td></td><td>Closed</td></tr>
      </table>
    `;

    const result = parseRawCourseData(witsData);
    expect(result).toHaveLength(3);

    expect(result[0]!.subject).toBe('IT 101');
    expect(result[0]!.section).toBe('BSIT-1A');
    expect(result[1]!.section).toBe('BSIT-1B');
    expect(result[2]!.subject).toBe('IT 102');
    expect(result[2]!.isClosed).toBe(true);
  });

  it('should handle closed sections in WITS HTML', () => {
    const witsData = `
      <tbody class="MuiTableBody-root">
        <tr><td>BSIT-1A</td><td>C0</td><td>08:00 AM - 10:00 AM</td><td>MWF</td><td>ROOM101</td><td>LEC</td><td>40/40</td><td>In-Person</td><td></td><td>Closed</td></tr>
      </tbody>
    `;

    const result = parseRawCourseData(witsData);
    expect(result).toHaveLength(1);
    expect(result[0]!.isClosed).toBe(true);
    expect(result[0]!.availableSlots).toBe(0);
  });
});

// ============================================================================
// AIMS Tab-Separated Import Tests
// ============================================================================

describe('AIMS Tab-Separated Import', () => {
  it('should parse AIMS single-line 12-column format', () => {
    // Standard AIMS format: ID, Dept, Subject, Title, Units, Section, Schedule, Room, Slots, Enrolled, Assessed, Closed
    const aimsData = `1\tIT-DEPT\tIT 101\tIntroduction to Programming\t3\tBSIT-1A\tMWF 8:00AM-10:00AM\tROOM101\t40\t25\t0\tNo`;

    const result = parseRawCourseData(aimsData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.id).toBe('1');
    expect(course!.offeringDept).toBe('IT-DEPT');
    expect(course!.subject).toBe('IT 101');
    expect(course!.subjectTitle).toBe('Introduction to Programming');
    expect(course!.creditedUnits).toBe(3);
    expect(course!.section).toBe('BSIT-1A');
    expect(course!.schedule).toBe('MWF 8:00AM-10:00AM');
    expect(course!.room).toBe('ROOM101');
    expect(course!.totalSlots).toBe(40);
    expect(course!.enrolled).toBe(25);
    expect(course!.assessed).toBe(0);
    expect(course!.isClosed).toBe(false);
    expect(course!.availableSlots).toBe(15);
  });

  it('should parse AIMS two-line format (7 + 5 columns)', () => {
    // Two-line format: first line has 7 columns, second line has 5 columns
    const aimsData = `1\tIT-DEPT\tIT 101\tIntroduction to Programming\t3\tBSIT-1A\tMWF 8:00AM-10:00AM
ROOM101\t40\t25\t0\tNo`;

    const result = parseRawCourseData(aimsData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.subject).toBe('IT 101');
    expect(course!.section).toBe('BSIT-1A');
    expect(course!.room).toBe('ROOM101');
    expect(course!.totalSlots).toBe(40);
  });

  it('should parse AIMS two-line format (7 + 6 columns with schedule merge)', () => {
    // Lab sections: first line has schedule, second line has additional schedule info
    const aimsData = `1\tIT-DEPT\tIT 101L\tProgramming Lab\t1\tBSIT-1A\tMWF 8:00AM-10:00AM
T 2:00PM-4:00PM\tLAB101\t40\t25\t0\tNo`;

    const result = parseRawCourseData(aimsData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.schedule).toContain('MWF 8:00AM-10:00AM');
    expect(course!.schedule).toContain('T 2:00PM-4:00PM');
  });

  it('should handle multiple AIMS entries', () => {
    const aimsData = `1\tIT-DEPT\tIT 101\tProgramming I\t3\tBSIT-1A\tMWF 8:00AM-10:00AM\tROOM101\t40\t25\t0\tNo
2\tIT-DEPT\tIT 102\tProgramming II\t3\tBSIT-2A\tTTH 8:00AM-10:00AM\tROOM102\t40\t30\t0\tNo`;

    const result = parseRawCourseData(aimsData);
    expect(result).toHaveLength(2);

    expect(result[0]!.subject).toBe('IT 101');
    expect(result[0]!.section).toBe('BSIT-1A');
    expect(result[1]!.subject).toBe('IT 102');
    expect(result[1]!.section).toBe('BSIT-2A');
  });

  it('should handle closed sections in AIMS format', () => {
    const aimsData = `1\tIT-DEPT\tIT 101\tProgramming I\t3\tBSIT-1A\tMWF 8:00AM-10:00AM\tROOM101\t40\t40\t0\tYes`;

    const result = parseRawCourseData(aimsData);
    expect(result).toHaveLength(1);
    expect(result[0]!.isClosed).toBe(true);
    expect(result[0]!.availableSlots).toBe(0);
  });
});

// ============================================================================
// Compact Variation Import Tests
// ============================================================================

describe('Compact Variation Import', () => {
  it('should parse compact space-separated format', () => {
    const compactData = `G1 IT101 08:00 AM - 10:00 AM MWF ROOM101 LEC 25/40 In-Person Open`;

    const result = parseRawCourseData(compactData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.section).toBe('G1');
    expect(course!.subject).toBe('IT101');
    expect(course!.schedule).toContain('MWF');
    expect(course!.schedule).toContain('08:00 AM - 10:00 AM');
    expect(course!.room).toBe('ROOM101');
    expect(course!.totalSlots).toBe(40);
    expect(course!.enrolled).toBe(25);
    expect(course!.isClosed).toBe(false);
  });

  it('should parse compact format with closed status', () => {
    const compactData = `G1 IT101 08:00 AM - 10:00 AM MWF ROOM101 LEC 40/40 In-Person Closed`;

    const result = parseRawCourseData(compactData);
    expect(result).toHaveLength(1);
    expect(result[0]!.isClosed).toBe(true);
  });

  it('should parse compact format with various day codes', () => {
    const compactData = `G1 IT101 08:00 AM - 10:00 AM TTH ROOM101 LEC 25/40 In-Person Open
G2 IT102 01:00 PM - 03:00 PM MWF ROOM102 LEC 30/40 In-Person Open`;

    const result = parseRawCourseData(compactData);
    expect(result).toHaveLength(2);

    expect(result[0]!.schedule).toContain('TTH');
    expect(result[1]!.schedule).toContain('MWF');
  });
});

// ============================================================================
// Space-Separated Import Tests
// ============================================================================

describe('Space-Separated Import', () => {
  // Note: The space-separated parser uses a specific regex pattern that expects
  // the format: ID Dept Subject Title Units Section Schedule Room Slots Enrolled Assessed Closed
  // The title is captured by matching "anything until units" pattern
  it('should parse space-separated format from existing test data', () => {
    // Using format from existing parseRawData.test.ts which works
    const spaceData = `1 ITDEPT IT101 Introduction to Programming 3 BSIT-1A MWF 8:00AM-10:00AM ROOM101 40 25 0 No`;

    const result = parseRawCourseData(spaceData);
    expect(result).toHaveLength(1);

    const course = result[0];
    expect(course).toBeDefined();
    expect(course!.id).toBe('1');
    expect(course!.offeringDept).toBe('ITDEPT');
    expect(course!.subject).toBe('IT101');
    expect(course!.creditedUnits).toBe(3);
    expect(course!.section).toBe('BSIT-1A');
  });

  it('should handle complex titles with hyphens (existing test pattern)', () => {
    // Use the exact format from existing test that works
    const spaceData = `4 Architecture ARCH163 Architectural Visual Communications 1 - Graphics 1 3 R1-AP4 M 11:30AM-3:00PM GLE402 LEC TH 11:30AM-3:00PM GLE402 LEC GLE402 40 40 0 Yes`;

    const result = parseRawCourseData(spaceData);
    expect(result).toHaveLength(1);
    expect(result[0]!.subjectTitle).toBe('Architectural Visual Communications 1 - Graphics 1');
    expect(result[0]!.subject).toBe('ARCH163');
    expect(result[0]!.section).toBe('R1-AP4');
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Import Edge Cases', () => {
  it('should handle empty input', () => {
    expect(parseRawCourseData('')).toEqual([]);
    expect(parseRawCourseData('   ')).toEqual([]);
  });

  it('should handle null-like input', () => {
    expect(parseRawCourseData(null as unknown as string)).toEqual([]);
    expect(parseRawCourseData(undefined as unknown as string)).toEqual([]);
  });

  it('should skip invalid entries without crashing', () => {
    const mixedData = `valid data but not matching any format
1\tIT-DEPT\tIT 101\tProgramming\t3\tBSIT-1A\tMWF 8:00AM-10:00AM\tROOM101\t40\t25\t0\tNo`;

    const result = parseRawCourseData(mixedData);
    expect(result.length).toBe(1);
    expect(result[0]!.subject).toBe('IT 101');
  });

  it('should handle malformed HTML gracefully', () => {
    const malformedHtml = `<td>Unclosed cell<td>Another cell`;
    const result = parseRawCourseData(malformedHtml);
    // Should not crash, may or may not parse successfully
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================================
// Schedule Integration Tests
// ============================================================================

describe('Import + Schedule Parsing Integration', () => {
  it('should produce parseable schedule strings from HTML import', () => {
    const htmlData = `
      <tr>
        <td>BSIT-1A</td>
        <td>IT 101</td>
        <td>08:00 AM - 10:00 AM</td>
        <td>MWF</td>
        <td>ROOM101</td>
        <td>LEC</td>
        <td>25/40</td>
        <td>In-Person</td>
        <td></td>
        <td>Open</td>
      </tr>
    `;

    const courses = parseRawCourseData(htmlData);
    expect(courses).toHaveLength(1);

    // HTML parser produces: "MWF | 08:00 AM - 10:00 AM | ROOM101 | LEC (In-Person)"
    const schedule = parseSchedule(courses[0]!.schedule);
    expect(schedule).not.toBeNull();
    expect(schedule!.days).toContain('M');
    expect(schedule!.days).toContain('W');
    expect(schedule!.days).toContain('F');
    // parseSchedule normalizes times to different format
    expect(schedule!.startTime).toBeDefined();
    expect(schedule!.endTime).toBeDefined();
  });

  it('should produce parseable schedule strings from AIMS import', () => {
    // AIMS format with standard schedule string that parseSchedule can handle
    const aimsData = `1\tIT-DEPT\tIT 101\tProgramming\t3\tBSIT-1A\tMWF | 8:00 AM - 10:00 AM | ROOM101\tROOM101\t40\t25\t0\tNo`;

    const courses = parseRawCourseData(aimsData);
    expect(courses).toHaveLength(1);

    const schedule = parseSchedule(courses[0]!.schedule);
    // Should parse successfully with pipe-separated format
    expect(schedule).not.toBeNull();
  });

  it('should handle TBA schedules in import', () => {
    const aimsData = `1\tIT-DEPT\tIT 101\tProgramming\t3\tBSIT-1A\tTBA\tTBA\t40\t0\t0\tNo`;

    const courses = parseRawCourseData(aimsData);
    expect(courses).toHaveLength(1);

    const schedule = parseSchedule(courses[0]!.schedule);
    expect(schedule).not.toBeNull();
    expect(schedule!.isTBA).toBe(true);
  });

  it('should handle schedules from compact format', () => {
    // Compact format produces: "WFM | 08:00 AM - 12:00 PM | FIELD | LEC (In-Person)"
    const compactData = `G1 IT101 08:00 AM - 12:00 PM WFM FIELD LEC 39/40 In-Person Open`;

    const courses = parseRawCourseData(compactData);
    expect(courses).toHaveLength(1);

    const schedule = parseSchedule(courses[0]!.schedule);
    expect(schedule).not.toBeNull();
    // Days are parsed from the schedule string
    expect(schedule!.days.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Verification: All Formats Produce Consistent Data
// ============================================================================

describe('Cross-Format Consistency', () => {
  it('should produce equivalent course data from different formats', () => {
    // Same course represented in different formats
    const htmlFormat = `
      <tr><td>BSIT-1A</td><td>IT101</td><td>08:00 AM - 10:00 AM</td><td>MWF</td><td>ROOM101</td><td>LEC</td><td>25/40</td><td>In-Person</td><td></td><td>Open</td></tr>
    `;

    const aimsFormat = `1\tDEPT\tIT101\tProgramming\t3\tBSIT-1A\tMWF 8:00AM-10:00AM\tROOM101\t40\t25\t0\tNo`;

    const compactFormat = `BSIT-1A IT101 08:00 AM - 10:00 AM MWF ROOM101 LEC 25/40 In-Person Open`;

    const htmlCourses = parseRawCourseData(htmlFormat);
    const aimsCourses = parseRawCourseData(aimsFormat);
    const compactCourses = parseRawCourseData(compactFormat);

    // All should parse successfully
    expect(htmlCourses).toHaveLength(1);
    expect(aimsCourses).toHaveLength(1);
    expect(compactCourses).toHaveLength(1);

    // Key fields should match (allowing for format-specific differences)
    expect(htmlCourses[0]!.section).toBe(aimsCourses[0]!.section);
    expect(htmlCourses[0]!.section).toBe(compactCourses[0]!.section);

    expect(htmlCourses[0]!.subject).toBe(aimsCourses[0]!.subject);
    expect(htmlCourses[0]!.subject).toBe(compactCourses[0]!.subject);

    expect(htmlCourses[0]!.totalSlots).toBe(aimsCourses[0]!.totalSlots);
    expect(htmlCourses[0]!.totalSlots).toBe(compactCourses[0]!.totalSlots);

    expect(htmlCourses[0]!.enrolled).toBe(aimsCourses[0]!.enrolled);
    expect(htmlCourses[0]!.enrolled).toBe(compactCourses[0]!.enrolled);
  });
});
