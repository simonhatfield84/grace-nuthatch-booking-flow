# Refactor Task Template

Use this template for all refactoring work to ensure safety and consistency.

---

## Task: [SPECIFIC TASK NAME]

**Description:** [Brief description of what needs to be refactored and why]

**Related Files:**
- [List files that will be modified]

---

## Rules

- ❌ **Do not edit @locked files** without updating contracts and tests
- ✅ **Keep existing API contracts** (see `src/lib/contracts.ts`)
- ✅ **Add feature flag** (default off) for new code paths
- ✅ **Run smoke tests** after changes: `npm run smoke`
- ✅ **Update tests** if behavior changes

---

## Acceptance Criteria

- [ ] All smoke tests pass locally
- [ ] No changes to public endpoints unless behind a feature flag
- [ ] No database schema changes in this step (unless planned)
- [ ] Code review approved
- [ ] @locked files not modified, or contracts/tests updated accordingly
- [ ] Feature flag added for new behavior (if applicable)
- [ ] Documentation updated (if API changes)

---

## Related Files & Contracts

### Locked Files
- `supabase/functions/booking-create-secure/index.ts`
- `supabase/functions/locks/index.ts`
- `src/pages/NewHostInterface.tsx`
- `supabase/functions/public-stripe-settings/index.ts`

### Contracts
- `src/lib/contracts.ts` - Runtime API schemas

### Feature Flags
- `src/lib/flags.ts` - Client-side flags
- `supabase/functions/_shared/flags.ts` - Edge function flags

### Tests
- `tests/smoke/01-booking-widget-no-deposit.spec.ts`
- `tests/smoke/02-locks-flow.spec.ts`
- `tests/smoke/03-booking-exclusion.spec.ts`
- `tests/smoke/04-public-stripe-settings.spec.ts`

---

## Refactor Process

### 1. Planning Phase
- [ ] Identify files to change
- [ ] Review @locked file list
- [ ] Check if contracts need updating
- [ ] Design feature flag if needed

### 2. Implementation Phase
- [ ] Create feature flag (if needed)
- [ ] Implement changes behind flag
- [ ] Update contracts if APIs change
- [ ] Write/update tests

### 3. Validation Phase
- [ ] Run `npm run smoke` locally
- [ ] Test with flag ON
- [ ] Test with flag OFF
- [ ] Verify no breaking changes

### 4. Deployment Phase
- [ ] Merge with flag OFF
- [ ] Monitor in production
- [ ] Gradually enable flag
- [ ] Remove old code after validation

---

## Example

```typescript
// Bad: Direct change to critical code
function calculateAvailability() {
  // New implementation
}

// Good: Feature-flagged change
function calculateAvailability() {
  if (isEnabled('NEW_AVAILABILITY_ENGINE')) {
    return calculateAvailabilityV2();
  }
  return calculateAvailabilityV1(); // Keep old code
}
```

---

## Rollback Plan

If issues arise after deploying:

1. **Immediate**: Toggle feature flag OFF in `.env`
2. **Short-term**: Revert deployment if flag toggle insufficient
3. **Long-term**: Fix issues and re-enable flag

---

## Notes

[Add any additional context, dependencies, or concerns here]
