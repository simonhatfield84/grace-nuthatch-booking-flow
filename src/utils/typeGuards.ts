
// Type guard utilities
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function isValidPartySize(size: number): boolean {
  return Number.isInteger(size) && size >= 1 && size <= 20;
}

export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Type guard for webhook event data with error
export function isErrorEventData(data: any): data is { error: string } {
  return data && typeof data === 'object' && typeof data.error === 'string';
}

// Type guard for webhook event data with booking info
export function hasBookingMetadata(data: any): data is { data: { object: { metadata: { booking_id: string } } } } {
  return data && 
         typeof data === 'object' && 
         data.data && 
         typeof data.data === 'object' &&
         data.data.object && 
         typeof data.data.object === 'object' &&
         data.data.object.metadata && 
         typeof data.data.object.metadata === 'object' &&
         typeof data.data.object.metadata.booking_id === 'string';
}

// Type guard for webhook event data with amount
export function hasAmountData(data: any): data is { data: { object: { amount: number } } } {
  return data && 
         typeof data === 'object' && 
         data.data && 
         typeof data.data === 'object' &&
         data.data.object && 
         typeof data.data.object === 'object' &&
         typeof data.data.object.amount === 'number';
}
