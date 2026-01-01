
/**
 * @typedef {object} Course
 * @property {string | number} id - Unique identifier from '#' column
 * @property {string} offeringDept
 * @property {string} subject
 * @property {string} subjectTitle
 * @property {number} creditedUnits
 * @property {string} section
 * @property {string} schedule - Raw schedule string
 * @property {string} room
 * @property {number} totalSlots
 * @property {number} enrolled
 * @property {number} assessed
 * @property {boolean} isClosed
 * @property {boolean} isLocked - Added for Task 5.11
 */

/**
 * Parses raw tab-separated course data into an array of Course objects.
 * Handles data where course info might be on a single line (12 columns)
 * or split across two lines (7 columns followed by 5 or 6 columns).
 * Also handles space-separated single-line data (Variation 2).
 * @param {string} rawText - The raw string data pasted by the user.
 * @returns {Course[]} An array of parsed course objects.
 */
export const parseRawCourseData = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
        return [];
    }

    // Try standard tab-separated parsing first
    let courses = parseTabSeparated(rawText);

    // If no courses found, try space-separated parsing
    if (courses.length === 0) {
        courses = parseSpaceSeparated(rawText);
    }

    return courses;
};

const parseTabSeparated = (rawText) => {
    const lines = rawText.trim().split('\n');
    const courses = [];
    const expectedColumnsSingleLine = 12;
    const expectedColumnsPart1 = 7;

    let i = 0;
    while (i < lines.length) {
        const line1 = lines[i]?.trim();
        i++;

        if (!line1) {
            continue;
        }

        const columns1 = line1.split('\t');
        let courseDataColumns = [];

        try {
            if (columns1.length === expectedColumnsSingleLine) {
                courseDataColumns = columns1;
            }
            else if (columns1.length === expectedColumnsPart1) {
                if (i < lines.length) {
                    const line2 = lines[i]?.trim();
                    if (line2) {
                        const columns2 = line2.split('\t');
                        // Accept either 5 or 6 columns for the second line (some lab sections have 6 columns)
                        if (columns2.length >= 5 && columns2.length <= 6) {
                            // If it's 6 columns, we need to extract the room from the schedule part
                            if (columns2.length === 6) {
                                // Create a combined schedule line
                                const combinedSchedule = `${columns1[6]} + ${columns2[0]}`;

                                // First 6 columns from line 1 (excluding schedule)
                                const firstPart = columns1.slice(0, 6);

                                // Extract stats from second line columns
                                const secondPart = [
                                    combinedSchedule, // Combined schedule string
                                    columns2[1],     // Room
                                    columns2[2],     // Total slots
                                    columns2[3],     // Enrolled
                                    columns2[4]      // Assessed
                                ];

                                // If there's a 6th column (closed status), add it
                                if (columns2[5]) {
                                    secondPart.push(columns2[5]);
                                } else {
                                    secondPart.push('No'); // Default to 'No' if not provided
                                }

                                courseDataColumns = [...firstPart, ...secondPart];
                            } else {
                                courseDataColumns = [...columns1, ...columns2];
                            }
                            i++;
                        } else {
                            // Only warn if this logic was the primary intent, but since we have fallback, be quieter?
                            continue;
                        }
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            else {
                // Not matching expected columns
                continue;
            }

            if (courseDataColumns.length >= expectedColumnsSingleLine) {
                const course = createCourseObject(courseDataColumns);
                if (isValidCourse(course)) {
                    courses.push(course);
                }
            }

        } catch (error) {
            console.error(`Error processing entry starting around line ${i}: "${line1}"`, error);
        }
    }

    return courses;
};

const parseSpaceSeparated = (rawText) => {
    const courses = [];
    // Regex explanation:
    // 1. ID (digits)
    // 2. Dept (word)
    // 3. Subject (word)
    // 4. Title (anything until units)
    // 5. Units (digits)
    // 6. Section (word with chars/hyphens)
    // 7. Schedule (anything until room)
    // 8. Room (non-whitespace)
    // 9. Slots (digits)
    // 10. Enrolled (digits)
    // 11. Assessed (digits)
    // 12. Closed (Yes/No)
    
    // We replace newlines with spaces to handle multi-line paste that lost tabs but kept newlines or lost them
    const cleanText = rawText.replace(/\n/g, ' ');
    
    const regex = /(?<id>\d+)\s+(?<dept>\w+)\s+(?<subject>\S+)\s+(?<title>.+?)\s+(?<units>\d+)\s+(?<section>[A-Z0-9][\w/-]+)\s+(?<schedule>.+?)\s+(?<room>\S+)\s+(?<slots>\d+)\s+(?<enrolled>\d+)\s+(?<assessed>\d+)\s+(?<closed>Yes|No)/g;

    const matches = cleanText.matchAll(regex);

    for (const match of matches) {
        const groups = match.groups;
        
        const course = {
            id: groups.id,
            offeringDept: groups.dept,
            subject: groups.subject,
            subjectTitle: groups.title.trim(),
            creditedUnits: parseInt(groups.units, 10) || 0,
            section: groups.section,
            schedule: groups.schedule.trim(),
            room: groups.room,
            totalSlots: parseInt(groups.slots, 10) || 0,
            enrolled: parseInt(groups.enrolled, 10) || 0,
            assessed: parseInt(groups.assessed, 10) || 0,
            isClosed: groups.closed.toLowerCase() === 'yes',
            isLocked: false,
            availableSlots: 0 // Calculated below
        };

        course.availableSlots = course.totalSlots - (course.enrolled + course.assessed);
        
        if (isValidCourse(course)) {
            courses.push(course);
        }
    }

    return courses;
};

const createCourseObject = (columns) => {
    const course = {
        id: columns[0].trim(),
        offeringDept: columns[1].trim(),
        subject: columns[2].trim(),
        subjectTitle: columns[3].trim(),
        creditedUnits: parseInt(columns[4].trim(), 10) || 0,
        section: columns[5].trim(),
        schedule: columns[6].trim(),
        room: columns[7].trim(),
        totalSlots: parseInt(columns[8].trim(), 10) || 0,
        enrolled: parseInt(columns[9].trim(), 10) || 0,
        assessed: parseInt(columns[10].trim(), 10) || 0,
        isClosed: columns[11]?.trim().toLowerCase() === 'yes',
        isLocked: false,
        availableSlots: 0
    };
    course.availableSlots = course.totalSlots - (course.enrolled + course.assessed);
    return course;
};

const isValidCourse = (course) => {
    return course.subject && course.schedule;
};
