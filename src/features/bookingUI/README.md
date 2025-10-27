# Booking Widget UI Clone

**UI-only clone of the booking widget.**

This module is a visual duplicate preserving all design elements:
- Typography (Playfair Display, Lato, Karla)
- Nuthatch color scheme
- Spacing, layout, animations
- Microcopy and user messaging

**All data/API calls are stubbed with static values.**

Logic will be wired via BookingAPI later.

## Usage

Add `?newui=1` to any booking URL to enable the new UI:
```
/booking/the-nuthatch?newui=1
```

Add `?debug=1` to see which version is active:
```
/booking/the-nuthatch?newui=1&debug=1
```

## Structure

- `BookingWidgetUI.tsx` - Main entry component
- `steps/` - Individual step components (all UI-only)
- `ui/` - Shared presentational components
- `theme/` - Theme tokens and constants
- `utils/` - Feature switch helper
