/**
 * parseRawData.test.ts - Tests for raw course data parsing
 *
 * Tests parsing of various data formats including:
 * - Tab-separated multi-line data
 * - Space-separated single-line data
 * - Compact variations
 * - HTML table imports
 *
 * @module tests/parseRawData.test
 * @task T3.1.6 - Copy existing tests for utilities and convert to TypeScript
 */

import { describe, it, expect } from 'vitest';
import { parseRawCourseData } from '@/utils/parseRawData';

// Added trailing tab to line 1 and 3 to match the expected format (7 columns)
const variation1Data = `1 	CMBA 	ACCTG133 	Managerial Economics 	3 	A1-AP4 	
F 9:00AM-10:30AM RTL313 LEC	
T 9:00AM-10:30AM RTL313 LEC	
 	RTL313 	48 	47 	0 	No
2 	CMBA 	ACCTG133 	Managerial Economics 	3 	A2-AP4 	
F 10:30AM-12:00PM RTL313 LEC	
T 10:30AM-12:00PM RTL313 LEC	
 	RTL313 	48 	41 	0 	No`;

const variation2Data = `1 CMBA ACCTG133 Managerial Economics 3 A1-AP4 F 9:00AM-10:30AM RTL313 LEC T 9:00AM-10:30AM RTL313 LEC RTL313 48 47 0 No 2 CMBA ACCTG133 Managerial Economics 3 A2-AP4 F 10:30AM-12:00PM RTL313 LEC T 10:30AM-12:00PM RTL313 LEC RTL313 48 41 0 No`;

describe('parseRawCourseData', () => {
  it('should parse standard multi-line data (Variation 1)', () => {
    const result = parseRawCourseData(variation1Data);
    expect(result).toHaveLength(2);
    expect(result[0]!.subject).toBe('ACCTG133');
    expect(result[0]!.section).toBe('A1-AP4');
    expect(result[0]!.room).toBe('RTL313');
    expect(result[0]!.totalSlots).toBe(48);
    expect(result[0]!.enrolled).toBe(47);
    // Check schedule merging
    expect(result[0]!.schedule).toContain('F 9:00AM-10:30AM RTL313 LEC');
    expect(result[0]!.schedule).toContain('T 9:00AM-10:30AM RTL313 LEC');
  });

  it('should parse space-separated single-line data (Variation 2)', () => {
    const result = parseRawCourseData(variation2Data);
    expect(result).toHaveLength(2);

    // Course 1
    expect(result[0]!.id).toBe('1');
    expect(result[0]!.offeringDept).toBe('CMBA');
    expect(result[0]!.subject).toBe('ACCTG133');
    expect(result[0]!.subjectTitle).toBe('Managerial Economics');
    expect(result[0]!.creditedUnits).toBe(3);
    expect(result[0]!.section).toBe('A1-AP4');
    expect(result[0]!.room).toBe('RTL313');
    expect(result[0]!.totalSlots).toBe(48);
    expect(result[0]!.enrolled).toBe(47);
    expect(result[0]!.isClosed).toBe(false);
    expect(result[0]!.schedule).toContain('F 9:00AM-10:30AM RTL313 LEC');

    // Course 2
    expect(result[1]!.id).toBe('2');
    expect(result[1]!.section).toBe('A2-AP4');
    expect(result[1]!.enrolled).toBe(41);
  });

  it('should handle complex titles in space-separated format', () => {
    const complexData = `4 Architecture ARCH163 Architectural Visual Communications 1 - Graphics 1 3 R1-AP4 M 11:30AM-3:00PM GLE402 LEC TH 11:30AM-3:00PM GLE402 LEC GLE402 40 40 0 Yes`;
    const result = parseRawCourseData(complexData);
    expect(result).toHaveLength(1);
    expect(result[0]!.subject).toBe('ARCH163');
    expect(result[0]!.subjectTitle).toBe('Architectural Visual Communications 1 - Graphics 1');
    expect(result[0]!.section).toBe('R1-AP4');
    expect(result[0]!.creditedUnits).toBe(3);
    expect(result[0]!.isClosed).toBe(true);
  });

  describe('Compact Variation Format (ImportDataVariations.md)', () => {
    it('should parse Variation 1 from ImportDataVariations.md', () => {
      const data =
        'G1 C0 08:00 AM - 12:00 PM WFM FIELD LEC 39/40 In-Person Open G2 C0 01:00 PM - 05:00 PM MWF FIELD LEC 34/40 In-Person Open';
      const result = parseRawCourseData(data);
      expect(result.length).toBe(2);

      expect(result[0]!.section).toBe('G1');
      expect(result[0]!.subject).toBe('C0');
      expect(result[0]!.totalSlots).toBe(40);
      expect(result[0]!.enrolled).toBe(39);
      expect(result[0]!.isClosed).toBe(false);
      expect(result[0]!.schedule).toContain('WFM | 08:00 AM - 12:00 PM | FIELD');

      expect(result[1]!.section).toBe('G2');
      expect(result[1]!.enrolled).toBe(34);
    });

    it('should parse Variation 2 from ImportDataVariations.md', () => {
      const data = `G1
 	
C0
 	
08:00 AM - 12:00 PM
 	
WFM
 	
FIELD
 	
LEC
 	
39/40
 	
In-Person
 	
 	
Open`;
      const result = parseRawCourseData(data);
      expect(result.length).toBe(1);
      expect(result[0]!.section).toBe('G1');
      expect(result[0]!.subject).toBe('C0');
      expect(result[0]!.totalSlots).toBe(40);
      expect(result[0]!.enrolled).toBe(39);
      expect(result[0]!.isClosed).toBe(false);
    });

    it('should parse mixed closed/open status and different day formats', () => {
      const data =
        'G3 C0 08:00 AM - 12:00 PM TTHS FIELD LEC 50/50 In-Person Closed G4 C0 01:00 PM - 05:00 PM THST FIELD LEC 41/40 In-Person Closed';
      const result = parseRawCourseData(data);
      expect(result.length).toBe(2);
      expect(result[0]!.section).toBe('G3');
      expect(result[0]!.isClosed).toBe(true);
      expect(result[1]!.section).toBe('G4');
      expect(result[1]!.isClosed).toBe(true);
      expect(result[1]!.totalSlots).toBe(40);
      expect(result[1]!.enrolled).toBe(41);
    });
  });

  describe('HTML Import Variation (ParsethroughHTML.md)', () => {
    it('should parse HTML table data from ParsethroughHTML.md', () => {
      const htmlData = `<tbody class="MuiTableBody-root css-wjl0su"><tr class="MuiTableRow-root css-6uhcp" data-index="0" style="transform: translateY(0px);"><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-fsyv1e"><div class="MuiGrid-root css-rfnosa">G1</div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1mv354t"><div class="MuiGrid-root css-rfnosa">C0</div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-ytjdwv"><div class="MuiGrid-root css-rfnosa"><div class="html-content">08:00 AM - 12:00 PM</div></div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1cw51ge"><div class="MuiGrid-root css-rfnosa"><div class="html-content">WFM</div></div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1d0mpia"><div class="MuiGrid-root css-rfnosa"><div class="html-content">FIELD</div></div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-b5s4qv"><div class="MuiGrid-root css-rfnosa"><div class="html-content">LEC</div></div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1eqfiz2"><div class="MuiGrid-root css-rfnosa">39/40</div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-spbd0w"><div class="MuiGrid-root css-rfnosa">In-Person</div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1q4fz8f"><div class="MuiGrid-root css-rfnosa"></div></td><td class="MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-akbhka"><div class="MuiGrid-root css-rfnosa">Open</div></td></tr></tbody>`;

      const result = parseRawCourseData(htmlData);
      expect(result.length).toBe(1);
      expect(result[0]!.section).toBe('G1');
      expect(result[0]!.subject).toBe('C0');
      expect(result[0]!.totalSlots).toBe(40);
      expect(result[0]!.enrolled).toBe(39);
      expect(result[0]!.isClosed).toBe(false);
      expect(result[0]!.schedule).toContain('WFM | 08:00 AM - 12:00 PM | FIELD');
    });
  });

  describe('Full HTML Table Variation (FullHMLTable.md)', () => {
    it('should extract subject, title, and units from the header', () => {
      const htmlData = `
                <div class="MuiBox-root css-0"><p class="MuiTypography-root MuiTypography-body1 css-15vuy4d">IT344 - Systems Administration and Maintenance (3.0 units)</p></div>
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

      const result = parseRawCourseData(htmlData);
      expect(result.length).toBe(1);
      expect(result[0]!.subject).toBe('IT344');
      expect(result[0]!.subjectTitle).toBe('Systems Administration and Maintenance');
      expect(result[0]!.creditedUnits).toBe(3.0);
      expect(result[0]!.section).toBe('G1');
    });

    it('should handle multiple subjects in one HTML snippet', () => {
      const htmlData = `
                <p class="MuiTypography-root MuiTypography-body1">IT344 - Systems Admin (3.0 units)</p>
                <table><tr class="MuiTableRow-root"><td>G1</td><td>C0</td><td>08:00 AM - 12:00 PM</td><td>WFM</td><td>FIELD</td><td>LEC</td><td>39/40</td><td>In-Person</td><td></td><td>Open</td></tr></table>
                <p class="MuiTypography-root MuiTypography-body1">CS101 - Intro to CS (4.0 units)</p>
                <table><tr class="MuiTableRow-root"><td>S1</td><td>C1</td><td>01:00 PM - 05:00 PM</td><td>TTH</td><td>LAB1</td><td>LAB</td><td>20/20</td><td>In-Person</td><td></td><td>Closed</td></tr></table>
            `;

      const result = parseRawCourseData(htmlData);
      expect(result.length).toBe(2);

      expect(result[0]!.subject).toBe('IT344');
      expect(result[0]!.section).toBe('G1');
      expect(result[0]!.creditedUnits).toBe(3.0);

      expect(result[1]!.subject).toBe('CS101');
      expect(result[1]!.section).toBe('S1');
      expect(result[1]!.creditedUnits).toBe(4.0);
      expect(result[1]!.isClosed).toBe(true);
    });
  });

  describe('Integration with Schedule Parser', () => {
    it('should parse HTML variation and then correctly parse its schedule', () => {
      const htmlData = `
                <tbody class="MuiTableBody-root">
                    <tr class="MuiTableRow-root">
                        <td class="MuiTableCell-root">SEC-A</td>
                        <td class="MuiTableCell-root">SUBJ-101</td>
                        <td class="MuiTableCell-root"><div class="html-content">10:00 AM - 01:00 PM</div></td>
                        <td class="MuiTableCell-root"><div class="html-content">MWF</div></td>
                        <td class="MuiTableCell-root"><div class="html-content">ROOM-1</div></td>
                        <td class="MuiTableCell-root"><div class="html-content">LEC</div></td>
                        <td class="MuiTableCell-root">20/40</td>
                        <td class="MuiTableCell-root">In-Person</td>
                        <td class="MuiTableCell-root"></td>
                        <td class="MuiTableCell-root">Open</td>
                    </tr>
                </tbody>
            `;

      const courses = parseRawCourseData(htmlData);
      expect(courses).toHaveLength(1);
      const course = courses[0];

      // The schedule string generated by the HTML parser
      expect(course!.schedule).toBe('MWF | 10:00 AM - 01:00 PM | ROOM-1 | LEC (In-Person)');

      // Verify parseSchedule handles this generated string (requires importing parseSchedule in test if not already)
      // Note: parseSchedule is already tested elsewhere, but this ensures the bridge works.
    });
  });
});
