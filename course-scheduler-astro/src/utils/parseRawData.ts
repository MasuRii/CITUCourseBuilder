/**
 * parseRawData.ts - Course data parsing utilities
 *
 * Parses raw course data from various formats (tab-separated, space-separated,
 * HTML tables, compact variations) into structured course objects.
 *
 * @module utils/parseRawData
 * @task T3.1.2 - Migrate parseRawData.js to TypeScript
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a parsed course from raw data import.
 * This interface matches the actual output of the parsing functions.
 */
export interface ParsedCourse {
  /** Unique identifier (often from '#' column or generated) */
  id: string;
  /** Department offering the course */
  offeringDept: string;
  /** Subject code (e.g., 'IT 111') */
  subject: string;
  /** Full title of the subject */
  subjectTitle: string;
  /** Number of credited units for this course */
  creditedUnits: number;
  /** Section identifier (e.g., 'BSIT-1A-AP3') */
  section: string;
  /** Raw schedule string (e.g., "TTH | 9:00AM-10:30AM | ROOM") */
  schedule: string;
  /** Room/location */
  room: string;
  /** Total available slots for this section */
  totalSlots: number;
  /** Number of enrolled students */
  enrolled: number;
  /** Number of assessed students */
  assessed: number;
  /** Whether this course section is closed (full) */
  isClosed: boolean;
  /** Whether this course is locked in the schedule */
  isLocked: boolean;
  /** Available (remaining) slots */
  availableSlots: number;
}

/**
 * Internal interface for HTML section parsing
 */
interface HTMLSection {
  header: string;
  content: string;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Parses raw tab-separated course data into an array of ParsedCourse objects.
 * Handles data where course info might be on a single line (12 columns)
 * or split across two lines (7 columns followed by 5 or 6 columns).
 * Also handles space-separated single-line data (Variation 2).
 *
 * @param rawText - The raw string data pasted by the user.
 * @returns An array of parsed course objects.
 */
export const parseRawCourseData = (rawText: string): ParsedCourse[] => {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  // Try HTML parsing if it looks like HTML
  if (rawText.trim().startsWith('<') || rawText.includes('</td>')) {
    const htmlCourses = parseHTMLVariation(rawText);
    if (htmlCourses.length > 0) return htmlCourses;
  }

  // Try standard tab-separated parsing first
  let courses = parseTabSeparated(rawText);

  // If no courses found, try space-separated parsing
  if (courses.length === 0) {
    courses = parseSpaceSeparated(rawText);
  }

  // If still no courses, try the compact variation format (Variation 1 & 2 from ImportDataVariations.md)
  if (courses.length === 0) {
    courses = parseCompactVariation(rawText);
  }

  return courses;
};

// ============================================================================
// HTML Parsing
// ============================================================================

/**
 * Parses course data from an HTML snippet (e.g. copied MUI Table).
 *
 * @param rawText - The raw HTML string to parse.
 * @returns An array of parsed course objects.
 */
const parseHTMLVariation = (rawText: string): ParsedCourse[] => {
  const courses: ParsedCourse[] = [];

  // Use a regex that finds all sections starting with a header.
  const sections: HTMLSection[] = [];
  const fullHeaderRegex =
    /(<p[^>]*MuiTypography-body1[^>]*>.*?<\/p>)(.*?)(?=<p[^>]*MuiTypography-body1[^>]*>|$)/gis;

  let match: RegExpExecArray | null;
  while ((match = fullHeaderRegex.exec(rawText)) !== null) {
    sections.push({
      header: match[1],
      content: match[2],
    });
  }

  // If no sections found with the header regex, try parsing the whole text as one section (old behavior)
  if (sections.length === 0) {
    sections.push({ header: '', content: rawText });
  }

  for (const section of sections) {
    const headerRegex = />([^<]+)\s*-\s*([^<]+)\s*\((\d+(?:\.\d+)?)\s*units\)<\/p>/i;
    const headerMatch = section.header.match(headerRegex);

    let headerSubject: string | null = null;
    let headerTitle: string | null = null;
    let headerUnits = 0;

    if (headerMatch) {
      headerSubject = headerMatch[1].trim();
      headerTitle = headerMatch[2].trim();
      headerUnits = parseFloat(headerMatch[3]);
    }

    // Find all <tr> elements in this section
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
    const cellRegex = /<td[^>]*>(.*?)<\/td>/gs;
    const stripTags = (html: string): string =>
      html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const rowMatches = section.content.matchAll(rowRegex);

    for (const rowMatch of rowMatches) {
      const rowContent = rowMatch[1];
      const cells = [...rowContent.matchAll(cellRegex)].map((m) => stripTags(m[1]));

      if (cells.length >= 8) {
        const stats = cells[6];
        const [enrolledStr, totalStr] = stats.split('/');
        const enrolled = parseInt(enrolledStr, 10) || 0;
        const total = parseInt(totalStr, 10) || 0;
        const status = cells[9] || (total > enrolled ? 'Open' : 'Closed');

        const subjectCode = headerSubject || cells[1];
        const subjectTitle = headerTitle || cells[1];
        const creditedUnits = headerUnits || 0;

        const course: ParsedCourse = {
          id: `${cells[0]}-${subjectCode}-${Math.random().toString(36).substring(2, 7)}`,
          offeringDept: 'N/A',
          subject: subjectCode,
          subjectTitle: subjectTitle,
          creditedUnits: creditedUnits,
          section: cells[0],
          schedule: `${cells[3]} | ${cells[2]} | ${cells[4]} | ${cells[5]} (${cells[7]})`,
          room: cells[4],
          totalSlots: total,
          enrolled: enrolled,
          assessed: 0,
          isClosed: status.toLowerCase().includes('closed'),
          isLocked: false,
          availableSlots: 0,
        };

        // Only add course if it has a valid-looking schedule (not just pipes and mode)
        if (cells[3] && cells[2] && cells[3].trim() !== '' && cells[2].trim() !== '') {
          course.availableSlots = course.totalSlots - course.enrolled;
          if (isValidCourse(course)) {
            courses.push(course);
          }
        }
      }
    }
  }

  return courses;
};

// ============================================================================
// Compact Variation Parsing
// ============================================================================

/**
 * Parses a more compact, space/tab separated format where some fields might be missing.
 * Handles Variation 1 and 2 from ImportDataVariations.md.
 *
 * @param rawText - The raw text to parse.
 * @returns An array of parsed course objects.
 */
const parseCompactVariation = (rawText: string): ParsedCourse[] => {
  const courses: ParsedCourse[] = [];
  // Normalize text: replace all whitespace sequences (including newlines and tabs) with a single space
  const cleanText = rawText.replace(/\s+/g, ' ').trim();

  // Regex for: Section Subject TimeRange Days Room Type Enrolled/Total Mode Status
  // Example: G1 C0 08:00 AM - 12:00 PM WFM FIELD LEC 39/40 In-Person Open
  // section: G1
  // subject: C0
  // time: 08:00 AM - 12:00 PM
  // days: WFM
  // room: FIELD
  // type: LEC
  // enrolled/total: 39/40
  // mode: In-Person
  // status: Open
  const regex =
    /(?<section>\S+)\s+(?<subject>\S+)\s+(?<time>\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M)\s+(?<days>[A-Z]+)\s+(?<room>\S+)\s+(?<type>\S+)\s+(?<stats>\d+\/\d+)\s+(?<mode>[\w-]+)\s+(?<status>Open|Closed)/gi;

  const matches = cleanText.matchAll(regex);

  for (const match of matches) {
    const groups = match.groups;
    if (!groups) continue;

    const [enrolledStr, totalStr] = groups.stats.split('/');
    const enrolled = parseInt(enrolledStr, 10) || 0;
    const total = parseInt(totalStr, 10) || 0;

    const course: ParsedCourse = {
      id: `${groups.section}-${groups.subject}-${Math.random().toString(36).substring(2, 7)}`, // Ensure uniqueness
      offeringDept: 'N/A',
      subject: groups.subject,
      subjectTitle: groups.subject, // Default to subject code as title is missing
      creditedUnits: 0, // Default to 0 as units are missing
      section: groups.section,
      schedule: `${groups.days} | ${groups.time} | ${groups.room} | ${groups.type} (${groups.mode})`,
      room: groups.room,
      totalSlots: total,
      enrolled: enrolled,
      assessed: 0,
      isClosed: groups.status.toLowerCase() === 'closed',
      isLocked: false,
      availableSlots: 0,
    };

    course.availableSlots = course.totalSlots - course.enrolled;

    if (isValidCourse(course)) {
      courses.push(course);
    }
  }

  return courses;
};

// ============================================================================
// Tab-Separated Parsing
// ============================================================================

/**
 * Parses standard tab-separated course data.
 * Handles single-line (12 columns) and two-line (7+5/6 columns) formats.
 *
 * @param rawText - The raw text to parse.
 * @returns An array of parsed course objects.
 */
const parseTabSeparated = (rawText: string): ParsedCourse[] => {
  const lines = rawText.trim().split('\n');
  const courses: ParsedCourse[] = [];
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
    let courseDataColumns: string[] = [];

    try {
      if (columns1.length === expectedColumnsSingleLine) {
        courseDataColumns = columns1;
      } else if (columns1.length === expectedColumnsPart1) {
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
                  columns2[1], // Room
                  columns2[2], // Total slots
                  columns2[3], // Enrolled
                  columns2[4], // Assessed
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
      } else {
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

// ============================================================================
// Space-Separated Parsing
// ============================================================================

/**
 * Parses space-separated course data.
 * Handles format: ID Dept Subject Title Units Section Schedule Room Slots Enrolled Assessed Closed
 *
 * @param rawText - The raw text to parse.
 * @returns An array of parsed course objects.
 */
const parseSpaceSeparated = (rawText: string): ParsedCourse[] => {
  const courses: ParsedCourse[] = [];

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

  const regex =
    /(?<id>\d+)\s+(?<dept>\w+)\s+(?<subject>\S+)\s+(?<title>.+?)\s+(?<units>\d+)\s+(?<section>[A-Z0-9][\w/-]+)\s+(?<schedule>.+?)\s+(?<room>\S+)\s+(?<slots>\d+)\s+(?<enrolled>\d+)\s+(?<assessed>\d+)\s+(?<closed>Yes|No)/g;

  const matches = cleanText.matchAll(regex);

  for (const match of matches) {
    const groups = match.groups;
    if (!groups) continue;

    const course: ParsedCourse = {
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
      availableSlots: 0, // Calculated below
    };

    course.availableSlots = course.totalSlots - (course.enrolled + course.assessed);

    if (isValidCourse(course)) {
      courses.push(course);
    }
  }

  return courses;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a course object from an array of column values.
 *
 * @param columns - Array of string values representing course columns.
 * @returns A parsed course object.
 */
const createCourseObject = (columns: string[]): ParsedCourse => {
  const course: ParsedCourse = {
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
    availableSlots: 0,
  };
  course.availableSlots = course.totalSlots - (course.enrolled + course.assessed);
  return course;
};

/**
 * Validates that a course has required fields.
 *
 * @param course - The course to validate.
 * @returns True if the course has valid subject and schedule.
 */
const isValidCourse = (course: ParsedCourse): boolean => {
  return course.subject.length > 0 && course.schedule.length > 0;
};
