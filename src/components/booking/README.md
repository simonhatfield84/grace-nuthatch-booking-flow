
# Booking Widget System

## Overview
This directory contains the canonical booking widget system restored from Friday, August 8th, 2025.

## Canonical Entry Points

### Primary Widget
- **File**: `src/features/booking/components/NuthatchBookingWidget.tsx`
- **Route**: `/booking`
- **Description**: The main booking widget with The Nuthatch branding, grey/black theme, and Playfair Display font

### Canonical Copy
- **File**: `src/components/booking/BookingWidget.CANONICAL.tsx` 
- **Description**: Exact copy of the working Friday 8th version for reference

## Provider Stack Required

The booking widget requires these providers in order:

```tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <AuthProvider>
      <StripeProvider usePublicMode={true} venueSlug="the-nuthatch">
        <NuthatchBookingWidget />
      </StripeProvider>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
```

## Booking Flow Steps

1. **Party Size** - Select number of guests
2. **Date Selection** - Choose booking date with availability
3. **Time Selection** - Pick available time slot
4. **Service Selection** - Choose dining service
5. **Guest Details** - Enter customer information
6. **Payment** - Process payment if required
7. **Confirmation** - Show booking confirmation

## Deprecated Components

The following components are deprecated and should not be used:

- `src/components/bookings/BookingFlowManager.tsx` ❌
- `src/features/booking/components/BookingWidget.tsx` (generic version) ❌
- `src/pages/BookingWidget.tsx` ❌

## Feature Flags

- `BOOKING_WIDGET_VERSION="canonical"` - Controls which widget version to use
- Development banner shows active widget version in dev mode

## E2E Testing

### Manual Test Checklist

1. Navigate to `/booking`
2. Verify The Nuthatch branding and styling appears
3. Complete booking flow: Party → Date → Time → Service → Details
4. Use Stripe test card: `4242 4242 4242 4242`
5. Verify confirmation page shows booking details
6. Check database for booking record with `status='paid'`

### Test Data
- **Venue**: `the-nuthatch`
- **Test Card**: `4242 4242 4242 4242`
- **Test Email**: Any valid email format

## Architecture Notes

- Uses `BookingContext` for state management
- Integrates with Supabase for data persistence
- Stripe integration with public mode for guest bookings
- Real-time availability checking
- Responsive mobile-first design

## Troubleshooting

If the booking widget isn't working:

1. Check the development banner shows "NuthatchBookingWidget"
2. Verify Stripe keys are configured
3. Ensure Supabase connection is working
4. Check browser console for errors
5. Confirm venue slug `the-nuthatch` exists in database

## Do Not Touch

- Host theme and interface components
- WiFi portal pages  
- Platform admin components
- Any non-booking UI elements

## Support

For issues with the booking widget, check:
- Console logs in browser developer tools
- Network tab for failed API requests
- Supabase dashboard for database errors
- Stripe dashboard for payment issues
