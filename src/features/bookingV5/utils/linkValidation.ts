import { supabase } from '@/integrations/supabase/client';
import { WidgetLinkParams } from '@/hooks/useWidgetLinkBuilder';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateLinkParams(
  venueId: string,
  params: WidgetLinkParams
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate party size
  if (params.party !== undefined) {
    if (params.party < 1 || params.party > 50) {
      errors.push('Party size must be between 1 and 50');
    }
  }

  // Validate date format (YYYY-MM-DD)
  if (params.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    } else {
      const parsedDate = new Date(params.date + 'T00:00:00');
      if (isNaN(parsedDate.getTime())) {
        errors.push('Invalid date');
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate < today) {
          errors.push('Date cannot be in the past');
        }
      }
    }
  }

  // Validate service belongs to venue and party within bounds
  if (params.service) {
    const { data: service, error } = await supabase
      .from('services')
      .select('id, venue_id, min_guests, max_guests, title')
      .eq('id', params.service)
      .eq('venue_id', venueId)
      .maybeSingle();
    
    if (error) {
      errors.push('Error validating service');
    } else if (!service) {
      errors.push('Service not found or does not belong to this venue');
    } else if (params.party) {
      // Validate party within service bounds
      if (params.party < service.min_guests) {
        errors.push(`Party size ${params.party} is below service minimum (${service.min_guests})`);
      }
      if (params.party > service.max_guests) {
        errors.push(`Party size ${params.party} exceeds service maximum (${service.max_guests})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
