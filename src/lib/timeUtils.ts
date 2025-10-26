/**
 * Centralized Time Utilities
 * 
 * Provides timezone-safe time manipulation functions to prevent duplicated
 * logic across services and edge functions.
 * 
 * @module timeUtils
 * @since Phase 0 Refactor
 */

/**
 * Converts a time string (HH:MM) to minutes since midnight
 * 
 * @example
 * timeToMinutes("14:30") // Returns 870
 * timeToMinutes("09:15") // Returns 555
 * 
 * @param time - Time string in HH:MM format (24-hour)
 * @returns Minutes since midnight (0-1439)
 * @throws Error if time format is invalid
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM format.`);
  }
  
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to a time string (HH:MM)
 * 
 * @example
 * minutesToTime(870) // Returns "14:30"
 * minutesToTime(555) // Returns "09:15"
 * 
 * @param minutes - Minutes since midnight (0-1439)
 * @returns Time string in HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Adds minutes to a time string and returns the result
 * 
 * @example
 * addMinutes("14:30", 90) // Returns "16:00"
 * addMinutes("23:00", 90) // Returns "00:30" (next day)
 * 
 * @param time - Starting time in HH:MM format
 * @param minutesToAdd - Number of minutes to add (can be negative)
 * @returns Resulting time in HH:MM format
 */
export function addMinutes(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  // Handle wrapping (next/previous day)
  const wrappedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  return minutesToTime(wrappedMinutes);
}

/**
 * Checks if two time ranges overlap
 * 
 * @example
 * timeRangeOverlaps("14:00", "16:00", "15:00", "17:00") // Returns true
 * timeRangeOverlaps("14:00", "16:00", "16:00", "18:00") // Returns false (adjacent)
 * 
 * @param start1 - Start of first range (HH:MM)
 * @param end1 - End of first range (HH:MM)
 * @param start2 - Start of second range (HH:MM)
 * @param end2 - End of second range (HH:MM)
 * @returns True if ranges overlap (exclusive of endpoints)
 */
export function timeRangeOverlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  // Ranges overlap if one starts before the other ends (and vice versa)
  // Using < (not <=) to treat adjacent slots as non-overlapping
  return s1 < e2 && s2 < e1;
}

/**
 * Parses a time string (HH:MM) into a Date object set to today
 * 
 * @example
 * parseTime("14:30") // Returns Date object for today at 14:30
 * 
 * @param timeString - Time in HH:MM format
 * @returns Date object with time set, date set to today
 */
export function parseTime(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Formats a Date object to HH:MM time string
 * 
 * @example
 * formatTime(new Date('2025-01-26T14:30:00')) // Returns "14:30"
 * 
 * @param date - Date object to format
 * @returns Time string in HH:MM format
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
