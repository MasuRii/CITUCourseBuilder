/**
 * Schedule Generation Algorithms
 *
 * This module provides all scheduling generation and conflict detection algorithms.
 * Functions are re-exported from @/utils/scheduleAlgorithms for backward compatibility
 * and to provide a centralized import path for schedule generation functionality.
 *
 * @module scheduleGeneration
 * @task T3.1.8 - Extract and Type Scheduling Algorithms
 */

// Re-export all scheduling algorithm functions from utils
export {
  checkTimeOverlap,
  countCampusDays,
  exceedsMaxGap,
  exceedsMaxUnits,
  generateBestPartialSchedule,
  generateBestPartialSchedule_Heuristic,
  generateExhaustiveBestSchedule,
  getAllSubsets,
  getTimeOfDayBucket,
  isScheduleConflictFree,
  scoreScheduleByTimePreference,
  type ScheduleGenerationResult,
} from '@/utils/scheduleAlgorithms';

// Re-export the ScheduleAlgorithmOptions interface from types
export type { ScheduleAlgorithmOptions } from '@/types/index';
