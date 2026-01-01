
import { describe, it, expect } from 'vitest';
import { parseRawCourseData } from './parseRawData';

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
        expect(result[0].subject).toBe('ACCTG133');
        expect(result[0].section).toBe('A1-AP4');
        expect(result[0].room).toBe('RTL313');
        expect(result[0].totalSlots).toBe(48);
        expect(result[0].enrolled).toBe(47);
        // Check schedule merging
        expect(result[0].schedule).toContain('F 9:00AM-10:30AM RTL313 LEC');
        expect(result[0].schedule).toContain('T 9:00AM-10:30AM RTL313 LEC');
    });

    it('should parse space-separated single-line data (Variation 2)', () => {
        const result = parseRawCourseData(variation2Data);
        expect(result).toHaveLength(2);
        
        // Course 1
        expect(result[0].id).toBe('1');
        expect(result[0].offeringDept).toBe('CMBA');
        expect(result[0].subject).toBe('ACCTG133');
        expect(result[0].subjectTitle).toBe('Managerial Economics');
        expect(result[0].creditedUnits).toBe(3);
        expect(result[0].section).toBe('A1-AP4');
        expect(result[0].room).toBe('RTL313');
        expect(result[0].totalSlots).toBe(48);
        expect(result[0].enrolled).toBe(47);
        expect(result[0].isClosed).toBe(false);
        expect(result[0].schedule).toContain('F 9:00AM-10:30AM RTL313 LEC');

        // Course 2
        expect(result[1].id).toBe('2');
        expect(result[1].section).toBe('A2-AP4');
        expect(result[1].enrolled).toBe(41);
    });

    it('should handle complex titles in space-separated format', () => {
        const complexData = `4 Architecture ARCH163 Architectural Visual Communications 1 - Graphics 1 3 R1-AP4 M 11:30AM-3:00PM GLE402 LEC TH 11:30AM-3:00PM GLE402 LEC GLE402 40 40 0 Yes`;
        const result = parseRawCourseData(complexData);
        expect(result).toHaveLength(1);
        expect(result[0].subject).toBe('ARCH163');
        expect(result[0].subjectTitle).toBe('Architectural Visual Communications 1 - Graphics 1');
        expect(result[0].section).toBe('R1-AP4');
        expect(result[0].creditedUnits).toBe(3);
        expect(result[0].isClosed).toBe(true);
    });
});
