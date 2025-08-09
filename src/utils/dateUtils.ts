
/**
 * Timezone-safe date utilities to prevent date shifting issues
 */

/**
 * Formats a Date object to YYYY-MM-DD string without timezone conversion
 * This prevents the common issue where toISOString() shifts dates due to UTC conversion
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Safely parses a YYYY-MM-DD date string without timezone issues
 * Creates date at local midnight instead of UTC midnight
 */
export const parseYYYYMMDDDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Gets the short day name (sun, mon, tue, etc.) from a date
 * Uses local timezone to prevent day shifting
 */
export const getShortDayName = (date: Date): string => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
};

/**
 * Gets the full day name from a date
 * Uses local timezone to prevent day shifting
 */
export const getFullDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};
