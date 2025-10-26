# Time Utils Extraction - Phase 0 Task 1

## Status: ✅ Module Created (Not Yet Migrated)

**Created:** October 26, 2025  
**Flag:** `VITE_USE_EXTRACTED_TIME_UTILS=false` (default)  
**Risk:** Zero (no functional changes)

## Summary

Created centralized `src/lib/timeUtils.ts` module with 6 core functions to eliminate duplication across services and edge functions:

1. `timeToMinutes(time: string): number`
2. `minutesToTime(minutes: number): string`
3. `addMinutes(time: string, minutes: number): string`
4. `timeRangeOverlaps(s1, e1, s2, e2): boolean`
5. `parseTime(timeString: string): Date`
6. `formatTime(date: Date): string`

## Blocker: Edge Function Import Resolution

**Problem:** Supabase Edge Functions (Deno runtime) cannot import from `src/*` paths due to module resolution differences.

**Current Duplication:**
- `supabase/functions/check-availability/index.ts` (lines 56-64): local `timeToMinutes`, `minutesToTime`
- Frontend services: 5+ files with similar implementations

**Migration Status:**
- ✅ Module created with comprehensive JSDoc
- ✅ Feature flag added (disabled)
- ⏸️ **No actual migration performed yet** (blocked by Deno import issue)

## Future Solutions (Phase 1)

### Option 1: Shared Utilities (Recommended)
```
supabase/functions/_shared/timeUtils.ts
```
- Copy implementation to shared edge function directory
- Frontend imports from `src/lib/timeUtils.ts`
- Edge functions import from `_shared/timeUtils.ts`
- **Effort:** Small (1-2 hours)
- **Risk:** Zero (tested separately)

### Option 2: Module URL Imports (Not Recommended)
```typescript
import { timeToMinutes } from 'https://deno.land/x/...'
```
- Requires publishing to Deno registry
- Adds external dependency
- **Effort:** Large (4+ hours)
- **Risk:** Medium (external dependency)

### Option 3: Runtime Copy (Hacky)
```typescript
const timeUtils = await import('../../src/lib/timeUtils.ts');
```
- Likely won't work due to TypeScript/path resolution
- Not recommended

## Recommendation

**Next Step (Phase 1):**
1. Create `supabase/functions/_shared/timeUtils.ts` (copy from `src/lib/timeUtils.ts`)
2. Migrate edge functions first (lower risk)
3. Migrate frontend services behind flag
4. Enable flag after smoke tests pass
5. Remove legacy implementations

**Estimated Total Effort:** 3-4 hours  
**Risk:** Low (gradual rollout with flag)

## Current Files with Time Logic

**Edge Functions:**
- `supabase/functions/check-availability/index.ts` (lines 56-64)

**Frontend Services:**
- `src/services/enhancedAvailabilityService.ts`
- `src/services/tableAllocation.ts`
- `src/services/tableAvailabilityService.ts`
- `src/services/walkInValidationService.ts`
- `src/services/timeSlotService.ts`

**Components/Hooks:**
- Various booking components with inline time logic

## Testing Requirements

**Before Migration:**
- All smoke tests pass ✅

**During Migration:**
- Unit tests for `timeUtils.ts` (add in Phase 1)
- Edge function integration tests
- Frontend service tests

**After Migration:**
- Smoke tests still pass
- Performance baseline (should be identical)

## Rollback Plan

If issues arise during Phase 1 migration:
1. Set `VITE_USE_EXTRACTED_TIME_UTILS=false`
2. Revert edge function changes (git revert)
3. Recovery time: < 5 minutes

## Success Criteria

- ✅ Module created with 6 functions
- ✅ JSDoc comments comprehensive
- ✅ Feature flag added (default: false)
- ⏸️ Edge function migration (Phase 1)
- ⏸️ Frontend service migration (Phase 1)
- ⏸️ Remove legacy implementations (Phase 1)
- ⏸️ Unit test coverage 90%+ (Phase 1)

## Notes

- This task completes the **preparation** step for time utils extraction
- No behavior changes in this commit
- Flag remains disabled until Phase 1 migration is complete
- Documentation created to guide future implementation
