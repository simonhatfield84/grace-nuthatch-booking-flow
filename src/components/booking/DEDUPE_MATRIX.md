
# Booking Components Deduplication Matrix

## Status Legend
- ✅ **CANONICAL** - Active, correct version from Friday 8 Aug 2025
- ❌ **DEPRECATED** - Marked for removal, do not use
- ⚠️ **REVIEW** - Needs evaluation

## Component Matrix

### Main Booking Widgets

| File Path | Status | Notes |
|-----------|---------|-------|
| `src/features/booking/components/NuthatchBookingWidget.tsx` | ✅ CANONICAL | Friday 8 Aug working version |
| `src/components/booking/BookingWidget.CANONICAL.tsx` | ✅ CANONICAL | Exact copy for reference |
| `src/features/booking/components/BookingWidget.tsx` | ❌ DEPRECATED | Generic widget, replaced by Nuthatch version |
| `src/components/bookings/BookingFlowManager.tsx` | ❌ DEPRECATED | Old multi-step manager, marked deprecated |

### Page Routes

| File Path | Status | Notes |
|-----------|---------|-------|
| `/booking` route in `App.tsx` | ✅ CANONICAL | Routes to NuthatchBookingWidget |
| `src/pages/BookingWidget.tsx` | ❌ DEPRECATED | Old page component, shows deprecation notice |

### Supporting Components

| File Path | Status | Notes |
|-----------|---------|-------|
| `src/features/booking/components/shared/NuthatchHeader.tsx` | ✅ CANONICAL | Nuthatch branding header |
| `src/features/booking/components/steps/PartyDateStep.tsx` | ⚠️ REVIEW | May be unused, check references |
| `src/features/booking/components/steps/PartyStep.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/features/booking/components/steps/DateStep.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/features/booking/components/steps/TimeStep.tsx` | ✅ CANONICAL | Used by working widget |
| `src/features/booking/components/steps/ServiceStep.tsx` | ✅ CANONICAL | Used by working widget |
| `src/features/booking/components/steps/GuestDetailsStep.tsx` | ✅ CANONICAL | Used by working widget |

### Context & Hooks

| File Path | Status | Notes |
|-----------|---------|-------|
| `src/features/booking/contexts/BookingContext.tsx` | ✅ CANONICAL | Core context for booking state |
| `src/features/booking/hooks/useBookingFlow.ts` | ✅ CANONICAL | Main booking flow hook |
| `src/features/booking/services/BookingService.ts` | ✅ CANONICAL | Booking API service |

### Generic Booking Components (potentially duplicate)

| File Path | Status | Notes |
|-----------|---------|-------|
| `src/components/bookings/BookingConfirmation.tsx` | ⚠️ REVIEW | Check if duplicate with features/booking version |
| `src/components/bookings/DateSelectorWithAvailability.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/components/bookings/GuestDetailsForm.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/components/bookings/PartyNumberSelector.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/components/bookings/PaymentStep.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/components/bookings/ServiceSelector.tsx` | ⚠️ REVIEW | Check if used by canonical widget |
| `src/components/bookings/SimplifiedTimeSelector.tsx` | ⚠️ REVIEW | Check if used by canonical widget |

## Action Items

1. ✅ Mark BookingFlowManager as deprecated
2. ✅ Mark old BookingWidget page as deprecated  
3. ✅ Update /booking route to use NuthatchBookingWidget
4. ✅ Create canonical copy for reference
5. ⚠️ Audit components marked as REVIEW to determine if they can be safely deprecated
6. ⚠️ Remove unused imports across the codebase
7. ⚠️ Clean up duplicate component implementations

## Import Replacement Guide

### Before (Deprecated)
```tsx
import { BookingFlowManager } from "@/components/bookings/BookingFlowManager";
import { BookingWidget } from "@/features/booking/components/BookingWidget";
```

### After (Canonical)
```tsx
import { NuthatchBookingWidget } from "@/features/booking/components/NuthatchBookingWidget";
```

## Bundle Analysis

Run `npm run build` and check for multiple "BookingWidget" chunks in the output. There should only be references to the canonical NuthatchBookingWidget.

## Last Updated
August 2025 - Canonical widget restoration
