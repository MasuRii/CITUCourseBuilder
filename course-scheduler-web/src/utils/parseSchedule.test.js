
import { describe, it, expect } from 'vitest';
import { parseSchedule } from './parseSchedule';

describe('parseSchedule', () => {
    it('should parse standard pipe-separated format', () => {
        const input = "TTH | 9:00AM-10:30AM | ROOM";
        const result = parseSchedule(input);
        expect(result).not.toBeNull();
        expect(result.allTimeSlots).toHaveLength(1);
        expect(result.allTimeSlots[0].days).toEqual(['T', 'TH']);
    });

    it('should parse Variation 1 format (Space separated, no pipes)', () => {
        // "F 9:00AM-10:30AM RTL313 LEC"
        const input = "F 9:00AM-10:30AM RTL313 LEC";
        const result = parseSchedule(input);
        expect(result).not.toBeNull();
        expect(result.allTimeSlots).toHaveLength(1);
        expect(result.allTimeSlots[0].days).toEqual(['F']);
        expect(result.allTimeSlots[0].startTime).toBe('09:00');
        expect(result.allTimeSlots[0].endTime).toBe('10:30');
    });

    it('should parse Variation 2 format (Combined space separated)', () => {
        // "F 9:00AM-10:30AM RTL313 LEC T 9:00AM-10:30AM RTL313 LEC"
        const input = "F 9:00AM-10:30AM RTL313 LEC T 9:00AM-10:30AM RTL313 LEC";
        const result = parseSchedule(input);
        expect(result).not.toBeNull();
        expect(result.allTimeSlots).toHaveLength(2);
        
        // Slot 1
        const slot1 = result.allTimeSlots.find(s => s.days.includes('F'));
        expect(slot1).toBeDefined();
        expect(slot1.startTime).toBe('09:00');

        // Slot 2
        const slot2 = result.allTimeSlots.find(s => s.days.includes('T'));
        expect(slot2).toBeDefined();
        expect(slot2.startTime).toBe('09:00');
    });
});
