/**
 * Feature Flags for Safe Refactoring
 * 
 * These flags allow us to deploy new code without immediately activating it,
 * enabling gradual rollouts and instant rollback if issues arise.
 * 
 * REFRACTOR_MODE: Master toggle - when true, enables all new refactored code paths
 * NEW_AVAILABILITY_ENGINE: Uses optimized availability calculation
 * ENABLE_CONTRACT_VALIDATION: Enforces strict input/output validation
 * ENABLE_SMOKE_TEST_MODE: Exposes internal state for testing
 */

export const FLAGS = {
  REFRACTOR_MODE: import.meta.env.VITE_REFRACTOR_MODE === 'true' || false,
  NEW_AVAILABILITY_ENGINE: import.meta.env.VITE_NEW_AVAILABILITY_ENGINE === 'true' || false,
  ENABLE_CONTRACT_VALIDATION: import.meta.env.VITE_CONTRACT_VALIDATION !== 'false', // Default true
  ENABLE_SMOKE_TEST_MODE: import.meta.env.VITE_SMOKE_TEST_MODE === 'true' || false,
  USE_EXTRACTED_TIME_UTILS: import.meta.env.VITE_USE_EXTRACTED_TIME_UTILS === 'true' || false,
  
  // Widget routing flags (ON by default in all environments)
  USE_LEGACY_WIDGET_SLUGS: true,  // Enable slug-based legacy widget
  ENABLE_V5_WIDGET: false,        // Disable V5 widget routes
} as const;

export type FlagName = keyof typeof FLAGS;

/**
 * Check if a feature flag is enabled
 */
export function isEnabled(flag: FlagName): boolean {
  return FLAGS[flag];
}

/**
 * Get all flag states (for debugging/admin dashboard)
 */
export function getAllFlags(): Record<FlagName, boolean> {
  return { ...FLAGS };
}

/**
 * Log flag state (development only)
 */
if (import.meta.env.DEV) {
  console.log('🚩 Feature Flags:', FLAGS);
}
