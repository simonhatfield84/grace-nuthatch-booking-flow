
# Booking Components Cleanup Checklist

## Phase 1: ✅ COMPLETED
- [x] Audit existing components
- [x] Mark deprecated components with warnings
- [x] Document canonical architecture
- [x] Verify current routing works

## Phase 2: Testing & Verification
- [ ] Test complete booking flow on `/booking` route
- [ ] Verify no console warnings from NuthatchBookingWidget
- [ ] Check all steps work: Party/Date → Service → Time → Details/Payment → Confirmation
- [ ] Test mobile responsiveness
- [ ] Test Stripe payment integration

## Phase 3: Final Cleanup (When Ready)
Run these commands to remove deprecated components:

### Files to Delete:
```bash
# Deprecated booking components
rm src/components/bookings/BookingFlowManager.tsx
rm src/components/bookings/DateSelectorWithAvailability.tsx
rm src/components/bookings/SimplifiedTimeSelector.tsx
rm src/components/bookings/ServiceSelector.tsx
rm src/components/bookings/PartyNumberSelector.tsx
rm src/components/bookings/GuestDetailsForm.tsx
rm src/components/bookings/PaymentStep.tsx
rm src/components/bookings/BookingConfirmation.tsx

# Unused contexts & hooks
rm src/features/booking/contexts/BookingContext.tsx  
rm src/features/booking/hooks/useBookingFlow.ts
```

### Check for Remaining References:
After deletion, search codebase for any imports of deleted components and remove them.

## Benefits After Cleanup
- ✅ Single source of truth for booking flow
- ✅ No confusion about which components to use
- ✅ Cleaner codebase with less maintenance overhead
- ✅ Faster build times
- ✅ Easier onboarding for new developers
