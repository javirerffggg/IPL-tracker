
import { Phase } from '../types';
import { BRIEFING_DATABASE } from '../constants';

/**
 * Selects a tactical briefing based on the current context.
 * Logic priorities:
 * 1. UV/Safety Risks (if UV is high)
 * 2. Active Session Day (Sunday/Monday specific advice)
 * 3. Phase Specific Advice (Attack vs Maintenance)
 * 4. General Motivation (Fallback)
 */
export const getContextAwareBriefing = (
  phase: Phase,
  dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
  uvIndex: number = 0
): string => {
  let pool: string[] = [];

  // 1. SAFETY OVERRIDE (High UV)
  if (uvIndex >= 6) {
    // 80% chance of showing safety warning, 20% motivation
    if (Math.random() > 0.2) {
      return getRandomFrom(BRIEFING_DATABASE.SAFETY);
    }
  }

  // 2. ACTIVE OPERATIONS (Sunday/Monday)
  if (dayOfWeek === 0) { // Sunday
    pool = [...BRIEFING_DATABASE.SUNDAY_OPS, ...BRIEFING_DATABASE.FLAVOR];
    // Bias towards specific advice
    if (Math.random() > 0.3) return getRandomFrom(BRIEFING_DATABASE.SUNDAY_OPS);
  } 
  else if (dayOfWeek === 1) { // Monday
    pool = [...BRIEFING_DATABASE.MONDAY_OPS, ...BRIEFING_DATABASE.FLAVOR];
    if (Math.random() > 0.3) return getRandomFrom(BRIEFING_DATABASE.MONDAY_OPS);
  }
  
  // 3. PHASE SPECIFIC (Rest days)
  else {
    if (phase === Phase.ATTACK) {
      pool = [...BRIEFING_DATABASE.PHASE_1, ...BRIEFING_DATABASE.FLAVOR];
      if (Math.random() > 0.4) return getRandomFrom(BRIEFING_DATABASE.PHASE_1);
    } else {
      pool = [...BRIEFING_DATABASE.PHASE_2_3, ...BRIEFING_DATABASE.FLAVOR];
      if (Math.random() > 0.4) return getRandomFrom(BRIEFING_DATABASE.PHASE_2_3);
    }
  }

  // Fallback to pool or pure flavor
  if (pool.length > 0) {
    return getRandomFrom(pool);
  }
  
  return getRandomFrom(BRIEFING_DATABASE.FLAVOR);
};

const getRandomFrom = (array: string[]): string => {
  return array[Math.floor(Math.random() * array.length)];
};
