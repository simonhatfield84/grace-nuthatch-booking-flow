
# Booking Components Audit & Cleanup Plan

## Current State Analysis (After Revert)

### ✅ ACTIVE - Keep These Components
**Primary Widget:**
- `src/features/booking/components/NuthatchBookingWidget.tsx` - Main booking widget (CANONICAL)
- `src/pages/BookingWidget.tsx` - Page wrapper for NuthatchBookingWidget

**Active Steps (Used by NuthatchBookingWidget):**
- `src/features/booking/components/steps/PartyDateStep.tsx`
- `src/features/booking/components/steps/ServiceStep.tsx` 
- `src/features/booking/components/steps/TimeStep.tsx`
- `src/features/booking/components/steps/GuestDetailsStep.tsx`
- `src/features/booking/components/steps/ConfirmationStep.tsx`

**Active Shared Components:**
- `src/features/booking/components/shared/NuthatchHeader.tsx`
- `src/features/booking/components/shared/ProgressIndicator.tsx`

**Active Types & Services:**
- `src/features/booking/types/booking.ts`
- `src/features/booking/services/BookingService.ts` (used by NuthatchBookingWidget)

### ❌ DEPRECATED - Marked for Future Removal
**Duplicate Booking Widgets:**
- `src/components/bookings/BookingFlowManager.tsx` - ✅ DEPRECATED

**Unused Contexts & Hooks:**
- `src/features/booking/contexts/BookingContext.tsx` - ✅ DEPRECATED
- `src/features/booking/hooks/useBookingFlow.ts` - ✅ DEPRECATED

**Generic Booking Components (Under /components/bookings/):**
- `src/components/bookings/DateSelectorWithAvailability.tsx` - ✅ DEPRECATED
- `src/components/bookings/SimplifiedTimeSelector.tsx` - ✅ DEPRECATED
- `src/components/bookings/ServiceSelector.tsx` - ✅ DEPRECATED
- `src/components/bookings/PartyNumberSelector.tsx` - ✅ DEPRECATED
- `src/components/bookings/GuestDetailsForm.tsx` - ✅ DEPRECATED
- `src/components/bookings/PaymentStep.tsx` - ✅ DEPRECATED
- `src/components/bookings/BookingConfirmation.tsx` - ✅ DEPRECATED

### 🔍 CURRENT ROUTING VERIFICATION
- Route `/booking` → `BookingWidgetPage` → `NuthatchBookingWidget` ✅ CORRECT

## Cleanup Actions Completed
1. ✅ Created audit documentation
2. ✅ Added deprecation warnings to all unused components
3. ✅ Added console warnings to prevent accidental usage
4. ⏳ Ready for testing canonical booking flow
5. ⏳ Ready for final cleanup of deprecated components when approved

## Next Steps
1. **Test the booking flow** end-to-end to ensure NuthatchBookingWidget works perfectly
2. **Monitor for any console warnings** in development
3. **When ready**: Remove all deprecated components marked with 🚨 DEPRECATED
4. **Clean up imports** that might reference deprecated components

## Architecture Summary
The canonical booking architecture is:
```
/booking route
  └─ BookingWidgetPage
      └─ NuthatchBookingWidget (main component)
          ├─ PartyDateStep
          ├─ ServiceStep  
          ├─ TimeStep
          ├─ GuestDetailsStep (with integrated payments)
          └─ ConfirmationStep
```

All other booking components are now marked as deprecated and safe to remove.
