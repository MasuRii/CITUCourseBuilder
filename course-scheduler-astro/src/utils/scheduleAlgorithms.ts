/**
 * Scheduling Algorithms for CITU Course Builder
 *
 * This module contains all scheduling generation and conflict detection algorithms.
 * These functions are extracted from App.jsx and preserved exactly with TypeScript types.
 *
 * @module scheduleAlgorithms
 * @task T3.1.5 - Extract scheduling algorithms from App.jsx to TypeScript
 */

import type {
  CheckTimeOverlapFunction,
  Course,
  DayCode,
  ExceedsMaxGapFunction,
  ExceedsMaxUnitsFunction,
  GetAllSubsetsFunction,
  GetTimeOfDayBucketFunction,
  IsScheduleConflictFreeFunction,
  ParseScheduleFunction,
  ScoreScheduleByTimePreferenceFunction,
  TimeOfDayBucket,
} from '@/types/index';
import { parseSchedule } from './parseSchedule';

/**
 * Threshold for switching from exhaustive to heuristic search
 */
const SMALL_N_THRESHOLD_PARTIAL = 12;

/**
 * Check if two time ranges overlap
 *
 * @param start1 - Start time of first range (HH:mm)
 * @param end1 - End time of first range (HH:mm)
 * @param start2 - Start time of second range (HH:mm)
 * @param end2 - End time of second range (HH:mm)
 * @returns true if the time ranges overlap
 */
export const checkTimeOverlap: CheckTimeOverlapFunction = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const timeRegex = /^\d{2}:\d{2}$/;
  if (
    !timeRegex.test(start1) ||
    !timeRegex.test(end1) ||
    !timeRegex.test(start2) ||
    !timeRegex.test(end2)
  ) {
    return false;
  }
  return start1 < end2 && end1 > start2;
};

/**
 * Check if a schedule has no time conflicts between courses
 *
 * @param scheduleToTest - Array of courses to check for conflicts
 * @param parseFn - Function to parse schedule strings
 * @param overlapFn - Function to check time overlaps
 * @returns true if schedule has no time conflicts
 */
export const isScheduleConflictFree: IsScheduleConflictFreeFunction = (
  scheduleToTest: readonly Course[],
  parseFn: ParseScheduleFunction,
  overlapFn: CheckTimeOverlapFunction
): boolean => {
  if (!scheduleToTest || scheduleToTest.length <= 1) {
    return true;
  }
  for (let i = 0; i < scheduleToTest.length; i++) {
    for (let j = i + 1; j < scheduleToTest.length; j++) {
      const course1 = scheduleToTest[i];
      const course2 = scheduleToTest[j];
      const schedule1Result = parseFn(course1.schedule);
      const schedule2Result = parseFn(course2.schedule);

      if (
        !schedule1Result ||
        schedule1Result.isTBA ||
        !schedule1Result.allTimeSlots ||
        schedule1Result.allTimeSlots.length === 0 ||
        !schedule2Result ||
        schedule2Result.isTBA ||
        !schedule2Result.allTimeSlots ||
        schedule2Result.allTimeSlots.length === 0
      ) {
        continue;
      }

      for (const slot1 of schedule1Result.allTimeSlots) {
        for (const slot2 of schedule2Result.allTimeSlots) {
          const commonDays = slot1.days.filter((day: DayCode) => slot2.days.includes(day));
          if (commonDays.length > 0) {
            if (slot1.startTime && slot1.endTime && slot2.startTime && slot2.endTime) {
              if (overlapFn(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)) {
                return false;
              }
            }
          }
        }
      }
    }
  }
  return true;
};

/**
 * Determine the time of day bucket for a given time
 *
 * @param time - Time string in HH:mm format (can be null/undefined)
 * @returns The time bucket category
 */
export const getTimeOfDayBucket: GetTimeOfDayBucketFunction = (
  time: string | null | undefined
): TimeOfDayBucket => {
  if (!time) return 'any';
  const [h] = time.split(':').map(Number);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h >= 17) return 'evening';
  return 'any';
};

/**
 * Score a schedule based on time preferences
 * Lower score is better (based on preference order index)
 *
 * @param schedule - Array of courses to score
 * @param prefOrder - Preferred time order for scoring
 * @returns Score value (lower is better)
 */
export const scoreScheduleByTimePreference: ScoreScheduleByTimePreferenceFunction = (
  schedule: readonly Course[],
  prefOrder: readonly TimeOfDayBucket[]
): number => {
  if (!Array.isArray(prefOrder) || prefOrder.length === 0) return 0;
  let score = 0;
  for (const course of schedule) {
    const parsed = parseSchedule(course.schedule);
    if (!parsed || parsed.isTBA || !parsed.allTimeSlots || parsed.allTimeSlots.length === 0)
      continue;
    let bestIdx = prefOrder.length;
    for (const slot of parsed.allTimeSlots) {
      const bucket = getTimeOfDayBucket(slot.startTime);
      const idx = prefOrder.indexOf(bucket);
      if (idx !== -1 && idx < bestIdx) bestIdx = idx;
    }
    score += bestIdx;
  }
  return score;
};

/**
 * Check if a schedule exceeds the maximum units limit
 *
 * @param schedule - Array of courses to check
 * @param maxUnits - Maximum allowed units (empty string = no limit)
 * @returns true if schedule exceeds the max units limit
 */
export const exceedsMaxUnits: ExceedsMaxUnitsFunction = (
  schedule: readonly Course[],
  maxUnits: string
): boolean => {
  if (!maxUnits) return false;
  const totalUnits = schedule.reduce((sum: number, course: Course) => {
    const units = parseFloat(course.creditedUnits ?? course.units);
    return isNaN(units) ? sum : sum + units;
  }, 0);
  return totalUnits > parseFloat(maxUnits);
};

/**
 * Check if a schedule has gaps between classes exceeding the limit
 *
 * @param schedule - Array of courses to check
 * @param maxGapHours - Maximum allowed gap in hours (empty string = no limit)
 * @returns true if schedule has gaps exceeding the limit
 */
export const exceedsMaxGap: ExceedsMaxGapFunction = (
  schedule: readonly Course[],
  maxGapHours: string
): boolean => {
  if (!maxGapHours) return false;
  const daySlots: Record<string, Array<{ start: string; end: string }>> = {};
  for (const course of schedule) {
    const parsed = parseSchedule(course.schedule);
    if (!parsed || parsed.isTBA || !parsed.allTimeSlots) continue;
    for (const slot of parsed.allTimeSlots) {
      for (const day of slot.days) {
        if (!daySlots[day]) daySlots[day] = [];
        daySlots[day].push({ start: slot.startTime ?? '', end: slot.endTime ?? '' });
      }
    }
  }

  for (const slots of Object.values(daySlots)) {
    slots.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < slots.length; i++) {
      const prevEnd = slots[i - 1].end;
      const currStart = slots[i].start;
      if (prevEnd && currStart) {
        const [ph, pm] = prevEnd.split(':').map(Number);
        const [ch, cm] = currStart.split(':').map(Number);
        const gap = ch + cm / 60 - (ph + pm / 60);
        if (gap > parseFloat(maxGapHours)) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * Count the number of unique on-campus days in a schedule
 *
 * @param schedule - Array of courses to count days for
 * @returns Number of unique on-campus days
 */
export const countCampusDays = (schedule: readonly Course[]): number => {
  const campusDays = new Set<DayCode>();
  for (const course of schedule) {
    const parsed = parseSchedule(course.schedule);
    if (!parsed || parsed.isTBA || !parsed.allTimeSlots) continue;

    for (const slot of parsed.allTimeSlots) {
      const isOnlineClass = slot.room && slot.room.toLowerCase().includes('online');
      if (!isOnlineClass) {
        for (const day of slot.days) {
          campusDays.add(day);
        }
      }
    }
  }
  return campusDays.size;
};

/**
 * Result of schedule generation algorithms
 */
export interface ScheduleGenerationResult {
  bestSchedule: Course[];
  bestScore: number;
  bestTimePrefScore: number;
  bestCampusDays: number;
}

/**
 * Generate the best schedule using exhaustive search
 * Tries all combinations to find the optimal schedule
 *
 * @param coursesBySubject - Courses grouped by subject code
 * @param preferredTimeOfDayOrder - Preferred time ordering for scoring
 * @param maxUnits - Maximum units constraint (empty string = no limit)
 * @param maxGapHours - Maximum gap hours constraint (empty string = no limit)
 * @param minimizeDaysOnCampus - Whether to minimize campus days
 * @returns Schedule generation result with best schedule found
 */
export function generateExhaustiveBestSchedule(
  coursesBySubject: Record<string, readonly Course[]>,
  preferredTimeOfDayOrder: readonly TimeOfDayBucket[],
  maxUnits: string,
  maxGapHours: string,
  minimizeDaysOnCampus: boolean
): ScheduleGenerationResult {
  const subjects = Object.keys(coursesBySubject);
  let bestSchedule: Course[] = [];
  let bestScore = -1;
  let bestTimePrefScore = Infinity;
  let bestCampusDays = Infinity;

  function backtrack(idx: number, currentSchedule: Course[]): void {
    if (idx === subjects.length) {
      if (!isScheduleConflictFree(currentSchedule, parseSchedule, checkTimeOverlap)) return;
      if (exceedsMaxUnits(currentSchedule, maxUnits)) return;
      if (exceedsMaxGap(currentSchedule, maxGapHours)) return;

      const totalCourses = currentSchedule.length;
      const totalUnits = currentSchedule.reduce((sum: number, course: Course) => {
        const units = parseFloat(course.creditedUnits ?? course.units);
        return isNaN(units) ? sum : sum + units;
      }, 0);
      const score = totalCourses * 100 + totalUnits;
      const timePrefScore = scoreScheduleByTimePreference(currentSchedule, preferredTimeOfDayOrder);
      const campusDays = minimizeDaysOnCampus ? countCampusDays(currentSchedule) : 0;

      if (minimizeDaysOnCampus) {
        if (
          campusDays < bestCampusDays ||
          (campusDays === bestCampusDays && score > bestScore) ||
          (campusDays === bestCampusDays &&
            score === bestScore &&
            timePrefScore < bestTimePrefScore)
        ) {
          bestCampusDays = campusDays;
          bestScore = score;
          bestTimePrefScore = timePrefScore;
          bestSchedule = [...currentSchedule];
        }
      } else {
        if (score > bestScore || (score === bestScore && timePrefScore < bestTimePrefScore)) {
          bestScore = score;
          bestTimePrefScore = timePrefScore;
          bestCampusDays = campusDays;
          bestSchedule = [...currentSchedule];
        }
      }
      return;
    }

    const subject = subjects[idx];
    if (!subject) return;
    const subjectCourses = coursesBySubject[subject];
    if (!subjectCourses) return;

    for (const course of subjectCourses) {
      let hasConflict = false;
      const courseScheduleResult = parseSchedule(course.schedule);
      if (
        courseScheduleResult &&
        !courseScheduleResult.isTBA &&
        courseScheduleResult.allTimeSlots &&
        courseScheduleResult.allTimeSlots.length > 0
      ) {
        for (const existingCourse of currentSchedule) {
          const existingScheduleResult = parseSchedule(existingCourse.schedule);
          if (
            !existingScheduleResult ||
            existingScheduleResult.isTBA ||
            !existingScheduleResult.allTimeSlots ||
            existingScheduleResult.allTimeSlots.length === 0
          )
            continue;

          for (const newSlot of courseScheduleResult.allTimeSlots) {
            for (const existingSlot of existingScheduleResult.allTimeSlots) {
              const commonDays = newSlot.days.filter((day: DayCode) =>
                existingSlot.days.includes(day)
              );
              if (commonDays.length > 0) {
                if (
                  newSlot.startTime &&
                  newSlot.endTime &&
                  existingSlot.startTime &&
                  existingSlot.endTime
                ) {
                  if (
                    checkTimeOverlap(
                      newSlot.startTime,
                      newSlot.endTime,
                      existingSlot.startTime,
                      existingSlot.endTime
                    )
                  ) {
                    hasConflict = true;
                    break;
                  }
                }
              }
            }
            if (hasConflict) break;
          }
          if (hasConflict) break;
        }
      }

      if (!hasConflict) {
        currentSchedule.push(course);
        backtrack(idx + 1, currentSchedule);
        currentSchedule.pop();
      }
    }
  }
  backtrack(0, []);
  return { bestSchedule, bestScore, bestTimePrefScore, bestCampusDays };
}

/**
 * Generate all possible subsets of an array
 *
 * @param arr - Array to generate subsets from
 * @returns Array of all possible subsets
 */
export const getAllSubsets: GetAllSubsetsFunction = <T>(
  arr: readonly T[]
): readonly (readonly T[])[] => {
  const result: T[][] = [[]];
  for (const item of arr) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i]!, item]);
    }
  }
  return result;
};

/**
 * Generate the best partial schedule using heuristic approach
 * Uses random sampling with greedy selection for large course sets
 *
 * @param courses - Array of courses to schedule
 * @param maxUnits - Maximum units constraint (empty string = no limit)
 * @param maxGapHours - Maximum gap hours constraint (empty string = no limit)
 * @param preferredTimeOfDayOrder - Preferred time ordering for scoring
 * @param minimizeDaysOnCampus - Whether to minimize campus days
 * @returns Best schedule found
 */
export function generateBestPartialSchedule_Heuristic(
  courses: readonly Course[],
  maxUnits: string,
  maxGapHours: string,
  preferredTimeOfDayOrder: readonly TimeOfDayBucket[],
  minimizeDaysOnCampus: boolean
): Course[] {
  let bestOverallSchedule: Course[] = [];
  let bestOverallSubjectsCount = 0;
  let bestOverallUnits = 0;
  let bestOverallTimePref = Infinity;
  let bestOverallCampusDays = Infinity;

  const numCourses = courses.length;
  const NUM_ATTEMPTS = Math.min(500, Math.max(50, numCourses * 2));

  for (let attempt = 0; attempt < NUM_ATTEMPTS; attempt++) {
    const currentSchedule: Course[] = [];
    const currentSubjectsSet = new Set<string>();
    const poolOfCandidatesForAttempt = [...courses];
    poolOfCandidatesForAttempt.sort(() => Math.random() - 0.5);

    while (true) {
      let bestCandidateToAddThisPass: Course | null = null;
      let bestPriorityForThisPass = -1;
      let indexOfBestCandidateInPool = -1;

      for (let i = 0; i < poolOfCandidatesForAttempt.length; i++) {
        const candidate = poolOfCandidatesForAttempt[i];
        if (!candidate) continue;
        if (currentSubjectsSet.has(candidate.subject)) continue;

        const tempScheduleWithCandidateForConstraints = [...currentSchedule, candidate];
        if (exceedsMaxUnits(tempScheduleWithCandidateForConstraints, maxUnits)) continue;
        if (exceedsMaxGap(tempScheduleWithCandidateForConstraints, maxGapHours)) continue;

        let conflictsWithCurrent = false;
        const candidateScheduleResult = parseSchedule(candidate.schedule);
        if (
          candidateScheduleResult &&
          !candidateScheduleResult.isTBA &&
          candidateScheduleResult.allTimeSlots &&
          candidateScheduleResult.allTimeSlots.length > 0
        ) {
          for (const existingCourse of currentSchedule) {
            const existingScheduleResult = parseSchedule(existingCourse.schedule);
            if (
              !existingScheduleResult ||
              existingScheduleResult.isTBA ||
              !existingScheduleResult.allTimeSlots ||
              existingScheduleResult.allTimeSlots.length === 0
            )
              continue;
            let pairConflict = false;
            for (const slot1 of candidateScheduleResult.allTimeSlots) {
              for (const slot2 of existingScheduleResult.allTimeSlots) {
                const commonDays = slot1.days.filter((day: DayCode) => slot2.days.includes(day));
                if (commonDays.length > 0) {
                  if (slot1.startTime && slot1.endTime && slot2.startTime && slot2.endTime) {
                    if (
                      checkTimeOverlap(
                        slot1.startTime,
                        slot1.endTime,
                        slot2.startTime,
                        slot2.endTime
                      )
                    ) {
                      pairConflict = true;
                      break;
                    }
                  }
                }
              }
              if (pairConflict) break;
            }
            if (pairConflict) {
              conflictsWithCurrent = true;
              break;
            }
          }
        }
        if (conflictsWithCurrent) continue;

        const units = parseFloat(candidate.creditedUnits ?? candidate.units) || 0;
        let priority: number;
        if (!currentSubjectsSet.has(candidate.subject)) {
          priority = 20000 + units;
        } else {
          priority = 10000 + units;
        }
        priority += Math.random() * 0.1;

        if (priority > bestPriorityForThisPass) {
          bestCandidateToAddThisPass = candidate;
          bestPriorityForThisPass = priority;
          indexOfBestCandidateInPool = i;
        }
      }

      if (bestCandidateToAddThisPass) {
        currentSchedule.push(bestCandidateToAddThisPass);
        currentSubjectsSet.add(bestCandidateToAddThisPass.subject);
        poolOfCandidatesForAttempt.splice(indexOfBestCandidateInPool, 1);
      } else {
        break;
      }
    }

    if (currentSchedule.length > 0) {
      const numSubjects = currentSubjectsSet.size;
      const totalUnits = currentSchedule.reduce(
        (sum: number, c: Course) => sum + (parseFloat(c.creditedUnits ?? c.units) || 0),
        0
      );
      const timePrefScore = scoreScheduleByTimePreference(currentSchedule, preferredTimeOfDayOrder);
      const campusDays = minimizeDaysOnCampus ? countCampusDays(currentSchedule) : 0;

      if (minimizeDaysOnCampus) {
        if (
          campusDays < bestOverallCampusDays ||
          (campusDays === bestOverallCampusDays && numSubjects > bestOverallSubjectsCount) ||
          (campusDays === bestOverallCampusDays &&
            numSubjects === bestOverallSubjectsCount &&
            totalUnits > bestOverallUnits) ||
          (campusDays === bestOverallCampusDays &&
            numSubjects === bestOverallSubjectsCount &&
            totalUnits === bestOverallUnits &&
            timePrefScore < bestOverallTimePref)
        ) {
          bestOverallCampusDays = campusDays;
          bestOverallSubjectsCount = numSubjects;
          bestOverallUnits = totalUnits;
          bestOverallTimePref = timePrefScore;
          bestOverallSchedule = [...currentSchedule];
        }
      } else {
        if (
          numSubjects > bestOverallSubjectsCount ||
          (numSubjects === bestOverallSubjectsCount && totalUnits > bestOverallUnits) ||
          (numSubjects === bestOverallSubjectsCount &&
            totalUnits === bestOverallUnits &&
            timePrefScore < bestOverallTimePref)
        ) {
          bestOverallSubjectsCount = numSubjects;
          bestOverallUnits = totalUnits;
          bestOverallTimePref = timePrefScore;
          bestOverallCampusDays = campusDays;
          bestOverallSchedule = [...currentSchedule];
        }
      }
    }
  }
  return bestOverallSchedule;
}

/**
 * Generate the best partial schedule
 * Uses exhaustive search for small course sets, heuristic for larger sets
 *
 * @param courses - Array of courses to schedule
 * @param maxUnits - Maximum units constraint (empty string = no limit)
 * @param maxGapHours - Maximum gap hours constraint (empty string = no limit)
 * @param preferredTimeOfDayOrder - Preferred time ordering for scoring
 * @param minimizeDaysOnCampus - Whether to minimize campus days
 * @returns Best schedule found
 */
export function generateBestPartialSchedule(
  courses: readonly Course[],
  maxUnits: string,
  maxGapHours: string,
  preferredTimeOfDayOrder: readonly TimeOfDayBucket[],
  minimizeDaysOnCampus: boolean
): Course[] {
  if (!courses || courses.length === 0) return [];

  if (courses.length <= SMALL_N_THRESHOLD_PARTIAL) {
    let best: Course[] = [];
    let bestSubjects = 0;
    let bestUnits = 0;
    let bestTimePref = Infinity;
    let bestCampusDays = Infinity;

    const allSubsets = getAllSubsets(courses);

    for (const subset of allSubsets) {
      if (subset.length === 0) continue;

      const subjects = subset.map((c: Course) => c.subject);
      if (new Set(subjects).size !== subjects.length) continue;

      if (!isScheduleConflictFree(subset, parseSchedule, checkTimeOverlap)) continue;
      if (exceedsMaxUnits(subset, maxUnits)) continue;
      if (exceedsMaxGap(subset, maxGapHours)) continue;

      const uniqueSubjects = new Set(subset.map((c: Course) => c.subject)).size;
      const totalUnits = subset.reduce(
        (sum: number, c: Course) => sum + (parseFloat(c.creditedUnits ?? c.units) || 0),
        0
      );
      const timePrefScore = scoreScheduleByTimePreference(subset, preferredTimeOfDayOrder);
      const campusDays = minimizeDaysOnCampus ? countCampusDays(subset) : 0;

      if (minimizeDaysOnCampus) {
        if (
          campusDays < bestCampusDays ||
          (campusDays === bestCampusDays && uniqueSubjects > bestSubjects) ||
          (campusDays === bestCampusDays &&
            uniqueSubjects === bestSubjects &&
            totalUnits > bestUnits) ||
          (campusDays === bestCampusDays &&
            uniqueSubjects === bestSubjects &&
            totalUnits === bestUnits &&
            timePrefScore < bestTimePref)
        ) {
          bestCampusDays = campusDays;
          bestSubjects = uniqueSubjects;
          bestUnits = totalUnits;
          bestTimePref = timePrefScore;
          best = [...subset];
        }
      } else {
        if (
          uniqueSubjects > bestSubjects ||
          (uniqueSubjects === bestSubjects && totalUnits > bestUnits) ||
          (uniqueSubjects === bestSubjects &&
            totalUnits === bestUnits &&
            timePrefScore < bestTimePref)
        ) {
          bestSubjects = uniqueSubjects;
          bestUnits = totalUnits;
          bestTimePref = timePrefScore;
          bestCampusDays = campusDays;
          best = [...subset];
        }
      }
    }
    return best;
  } else {
    return generateBestPartialSchedule_Heuristic(
      courses,
      maxUnits,
      maxGapHours,
      preferredTimeOfDayOrder,
      minimizeDaysOnCampus
    );
  }
}
