
export const PREDEFINED_TEMPLATES = [
  {
    key: 'booking_confirmation',
    name: 'Booking Confirmation',
    description: 'Sent immediately after a booking is confirmed'
  },
  {
    key: 'booking_reminder_24h',
    name: '24 Hour Booking Reminder',
    description: 'Sent 24 hours before the booking'
  },
  {
    key: 'booking_reminder_2h',
    name: '2 Hour Booking Reminder',
    description: 'Sent 2 hours before the booking'
  },
  {
    key: 'booking_cancelled',
    name: 'Booking Cancelled',
    description: 'Sent when a booking is cancelled'
  },
  {
    key: 'booking_modified',
    name: 'Booking Modified',
    description: 'Sent when a booking is modified'
  },
  {
    key: 'booking_no_show',
    name: 'No Show Follow-up',
    description: 'Sent when a booking is marked as no-show'
  },
  {
    key: 'walk_in_confirmation',
    name: 'Walk-in Confirmation',
    description: 'Sent when a walk-in visit is recorded'
  },
  {
    key: 'payment_request',
    name: 'Payment Request',
    description: 'Sent when payment is required for a booking made by staff'
  },
  {
    key: 'payment_reminder_22h',
    name: 'Payment Reminder (22 hours)',
    description: 'Sent 22 hours after payment request as final reminder'
  },
  {
    key: 'payment_expired_24h',
    name: 'Payment Expired',
    description: 'Sent when payment expires after 24 hours'
  }
] as const;
