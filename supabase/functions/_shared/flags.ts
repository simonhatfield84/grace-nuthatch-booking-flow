/**
 * Edge Function Feature Flags
 * 
 * These flags mirror the client-side flags but are read from the Deno environment.
 */

export const EDGE_FLAGS = {
  REFRACTOR_MODE: Deno.env.get('REFRACTOR_MODE') === 'true',
  NEW_AVAILABILITY_ENGINE: Deno.env.get('NEW_AVAILABILITY_ENGINE') === 'true',
  ENABLE_CONTRACT_VALIDATION: Deno.env.get('CONTRACT_VALIDATION') !== 'false', // Default true
  NEW_JOIN_GROUP_CHECK: Deno.env.get('NEW_JOIN_GROUP_CHECK') === 'true', // ✅ GUARDRAIL 4: Feature flag for join group logic
} as const;

export function isEdgeFlagEnabled(flag: keyof typeof EDGE_FLAGS): boolean {
  return EDGE_FLAGS[flag];
}
