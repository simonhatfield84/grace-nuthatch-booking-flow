
import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  canProceed: boolean;
}

export class WalkInValidationService {
  /**
   * Comprehensive validation for walk-in booking
   */
  static async validateWalkIn(walkInData: {
    tableId: number;
    time: string;
    date: string;
    partySize: number;
    duration: number;
    guestName?: string;
    phone?: string;
    email?: string;
    venueId: string;
  }): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Basic field validation
      this.validateBasicFields(walkInData, errors);

      // Table validation
      await this.validateTable(walkInData, errors);

      // Time and date validation
      this.validateTimeAndDate(walkInData, errors, warnings);

      // Guest validation
      await this.validateGuest(walkInData, errors, warnings);

      // Capacity and fire safety validation
      await this.validateCapacity(walkInData, errors, warnings);

      // Business rules validation
      await this.validateBusinessRules(walkInData, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Validation error:', error);
      errors.push({
        field: 'system',
        message: 'System error during validation',
        code: 'SYSTEM_ERROR'
      });

      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  private static validateBasicFields(walkInData: any, errors: ValidationError[]) {
    if (!walkInData.tableId) {
      errors.push({
        field: 'tableId',
        message: 'Table selection is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!walkInData.time || !/^\d{2}:\d{2}$/.test(walkInData.time)) {
      errors.push({
        field: 'time',
        message: 'Valid time is required (HH:MM format)',
        code: 'INVALID_FORMAT'
      });
    }

    if (!walkInData.date) {
      errors.push({
        field: 'date',
        message: 'Date is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!walkInData.partySize || walkInData.partySize < 1) {
      errors.push({
        field: 'partySize',
        message: 'Party size must be at least 1',
        code: 'INVALID_VALUE'
      });
    }

    if (!walkInData.duration || walkInData.duration < 30) {
      errors.push({
        field: 'duration',
        message: 'Duration must be at least 30 minutes',
        code: 'INVALID_VALUE'
      });
    }
  }

  private static async validateTable(walkInData: any, errors: ValidationError[]) {
    const { data: table, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', walkInData.tableId)
      .eq('venue_id', walkInData.venueId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !table) {
      errors.push({
        field: 'tableId',
        message: 'Selected table is not available',
        code: 'TABLE_NOT_FOUND'
      });
      return;
    }

    if (table.seats < walkInData.partySize) {
      errors.push({
        field: 'partySize',
        message: `Table ${table.label} can only seat ${table.seats} guests`,
        code: 'INSUFFICIENT_SEATS'
      });
    }
  }

  private static validateTimeAndDate(walkInData: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    const now = new Date();
    const bookingDate = new Date(walkInData.date);
    const [hours, minutes] = walkInData.time.split(':').map(Number);
    
    bookingDate.setHours(hours, minutes, 0, 0);

    // Check if booking is in the past
    if (bookingDate < now) {
      errors.push({
        field: 'time',
        message: 'Cannot create walk-in for past time',
        code: 'PAST_TIME'
      });
    }

    // Check if booking is too far in the future for a walk-in
    const maxFutureHours = 2; // Walk-ins should be within 2 hours
    const maxFutureTime = new Date(now.getTime() + (maxFutureHours * 60 * 60 * 1000));
    
    if (bookingDate > maxFutureTime) {
      warnings.push({
        field: 'time',
        message: 'Walk-ins are typically for immediate seating. Consider creating a regular booking instead.',
        code: 'FUTURE_WALKIN',
        canProceed: true
      });
    }

    // Check business hours
    if (hours < 10 || hours > 22) {
      errors.push({
        field: 'time',
        message: 'Time is outside operating hours',
        code: 'OUTSIDE_HOURS'
      });
    }
  }

  private static async validateGuest(walkInData: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Email format validation
    if (walkInData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walkInData.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Phone format validation (basic)
    if (walkInData.phone && !/^[\d\s\-\+\(\)]+$/.test(walkInData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE'
      });
    }

    // Check for duplicate bookings if guest info provided
    if (walkInData.email || walkInData.phone) {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', walkInData.date)
        .eq('venue_id', walkInData.venueId)
        .neq('status', 'cancelled')
        .neq('status', 'finished')
        .or(`email.eq.${walkInData.email || ''},phone.eq.${walkInData.phone || ''}`);

      if (existingBookings && existingBookings.length > 0) {
        const conflictingBooking = existingBookings.find(booking => {
          const bookingTime = booking.booking_time;
          const timeDiff = Math.abs(
            this.timeToMinutes(walkInData.time) - this.timeToMinutes(bookingTime)
          );
          return timeDiff < 120; // Within 2 hours
        });

        if (conflictingBooking) {
          warnings.push({
            field: 'guest',
            message: `Guest has another booking at ${conflictingBooking.booking_time}`,
            code: 'DUPLICATE_GUEST',
            canProceed: true
          });
        }
      }
    }
  }

  private static async validateCapacity(walkInData: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Get venue capacity settings
    const { data: venueSettings } = await supabase
      .from('venue_settings')
      .select('setting_value')
      .eq('venue_id', walkInData.venueId)
      .eq('setting_key', 'max_capacity')
      .maybeSingle();

    const maxCapacity = venueSettings?.setting_value as number || 999;

    // Check current occupancy for the time slot
    const { data: currentBookings } = await supabase
      .from('bookings')
      .select('party_size, booking_time, duration_minutes')
      .eq('booking_date', walkInData.date)
      .eq('venue_id', walkInData.venueId)
      .neq('status', 'cancelled')
      .neq('status', 'finished');

    if (currentBookings) {
      const currentOccupancy = this.calculateOccupancy(
        currentBookings,
        walkInData.time,
        walkInData.duration
      );

      if (currentOccupancy + walkInData.partySize > maxCapacity) {
        errors.push({
          field: 'partySize',
          message: `Would exceed venue capacity (${maxCapacity} guests)`,
          code: 'CAPACITY_EXCEEDED'
        });
      } else if (currentOccupancy + walkInData.partySize > maxCapacity * 0.9) {
        warnings.push({
          field: 'capacity',
          message: 'Venue will be near capacity',
          code: 'NEAR_CAPACITY',
          canProceed: true
        });
      }
    }
  }

  private static async validateBusinessRules(walkInData: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Check if it's a peak period
    const [hours] = walkInData.time.split(':').map(Number);
    const isPeakTime = (hours >= 18 && hours <= 21); // 6-9 PM

    if (isPeakTime && walkInData.partySize >= 8) {
      warnings.push({
        field: 'timing',
        message: 'Large parties during peak hours may experience longer wait times',
        code: 'PEAK_LARGE_PARTY',
        canProceed: true
      });
    }

    // Check for unusual duration
    if (walkInData.duration > 180) {
      warnings.push({
        field: 'duration',
        message: 'Duration longer than typical (3 hours)',
        code: 'LONG_DURATION',
        canProceed: true
      });
    }

    // Check party size limits for walk-ins
    if (walkInData.partySize > 12) {
      warnings.push({
        field: 'partySize',
        message: 'Large parties may require advance booking',
        code: 'LARGE_PARTY',
        canProceed: true
      });
    }
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static calculateOccupancy(bookings: any[], targetTime: string, duration: number): number {
    const targetStart = this.timeToMinutes(targetTime);
    const targetEnd = targetStart + duration;
    
    return bookings.reduce((total, booking) => {
      const bookingStart = this.timeToMinutes(booking.booking_time);
      const bookingEnd = bookingStart + (booking.duration_minutes || 120);
      
      // Check if time slots overlap
      if (targetStart < bookingEnd && targetEnd > bookingStart) {
        return total + booking.party_size;
      }
      return total;
    }, 0);
  }
}
