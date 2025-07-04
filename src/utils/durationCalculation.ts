
import { supabase } from "@/integrations/supabase/client";

export interface DurationRule {
  minGuests: number;
  maxGuests: number;
  duration: number;
}

const validateDurationRule = (rule: any): rule is DurationRule => {
  return (
    typeof rule === 'object' &&
    rule !== null &&
    typeof rule.minGuests === 'number' &&
    typeof rule.maxGuests === 'number' &&
    typeof rule.duration === 'number'
  );
};

const parseDurationRules = (data: any): DurationRule[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(validateDurationRule);
};

export const calculateBookingDuration = async (serviceId?: string, partySize: number = 1): Promise<number> => {
  // Default duration if no service or rules found
  const DEFAULT_DURATION = 120;

  if (!serviceId) {
    return DEFAULT_DURATION;
  }

  try {
    // Fetch service with duration rules
    const { data: service, error } = await supabase
      .from('services')
      .select('duration_rules')
      .eq('id', serviceId)
      .single();

    if (error || !service?.duration_rules) {
      console.log('No service duration rules found, using default:', DEFAULT_DURATION);
      return DEFAULT_DURATION;
    }

    const durationRules = parseDurationRules(service.duration_rules);
    
    // Find matching rule based on party size
    const matchingRule = durationRules.find(rule => 
      partySize >= rule.minGuests && partySize <= rule.maxGuests
    );

    if (matchingRule) {
      console.log(`Duration calculated: ${matchingRule.duration} minutes for ${partySize} guests`);
      return matchingRule.duration;
    }

    console.log('No matching duration rule found, using default:', DEFAULT_DURATION);
    return DEFAULT_DURATION;
  } catch (error) {
    console.error('Error calculating booking duration:', error);
    return DEFAULT_DURATION;
  }
};

export const getServiceIdFromServiceName = async (serviceName: string): Promise<string | null> => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('id')
      .eq('title', serviceName)
      .single();

    if (error || !service) {
      console.log(`Service not found: ${serviceName}`);
      return null;
    }

    return service.id;
  } catch (error) {
    console.error('Error finding service:', error);
    return null;
  }
};
