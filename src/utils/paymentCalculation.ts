
import { supabase } from "@/integrations/supabase/client";

export interface PaymentCalculation {
  shouldCharge: boolean;
  amount: number;
  description: string;
  chargeType: string;
}

export const calculatePaymentAmount = async (
  serviceId: string | null,
  partySize: number,
  venueId: string
): Promise<PaymentCalculation> => {
  try {
    // Check if venue has Stripe enabled
    const { data: venueSettings } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, charge_type, charge_amount_per_guest, minimum_guests_for_charge')
      .eq('venue_id', venueId)
      .single();

    // If venue payments are not active, no charge
    if (!venueSettings?.is_active) {
      return {
        shouldCharge: false,
        amount: 0,
        description: 'No payment required',
        chargeType: 'none'
      };
    }

    // Get service payment settings if service is specified
    if (!serviceId) {
      // Use venue-level settings as fallback
      let shouldCharge = false;
      let amount = 0;
      let description = '';

      switch (venueSettings.charge_type) {
        case 'all_reservations':
          shouldCharge = true;
          amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
          description = `Booking fee for ${partySize} guests`;
          break;
          
        case 'large_groups':
          const minGuests = venueSettings.minimum_guests_for_charge || 8;
          if (partySize >= minGuests) {
            shouldCharge = true;
            amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
            description = `Large group fee for ${partySize} guests`;
          }
          break;
          
        default:
          shouldCharge = false;
          break;
      }

      return {
        shouldCharge,
        amount,
        description: description || 'No payment required',
        chargeType: venueSettings.charge_type || 'none'
      };
    }

    const { data: serviceSettings } = await supabase
      .from('services')
      .select('requires_payment, charge_type, minimum_guests_for_charge, charge_amount_per_guest')
      .eq('id', serviceId)
      .single();

    // If service doesn't require payment, check if venue has default settings
    if (!serviceSettings?.requires_payment) {
      return {
        shouldCharge: false,
        amount: 0,
        description: 'No payment required',
        chargeType: 'none'
      };
    }

    // Prioritize service-level payment settings
    let shouldCharge = false;
    let amount = 0;
    let description = '';
    let chargeType = serviceSettings.charge_type || 'none';

    // Use service settings if available, otherwise fall back to venue settings
    const effectiveChargeType = serviceSettings.charge_type || venueSettings.charge_type || 'none';
    const effectiveChargeAmount = serviceSettings.charge_amount_per_guest || venueSettings.charge_amount_per_guest || 0;
    const effectiveMinGuests = serviceSettings.minimum_guests_for_charge || venueSettings.minimum_guests_for_charge || 8;

    switch (effectiveChargeType) {
      case 'all_reservations':
        shouldCharge = true;
        amount = effectiveChargeAmount * partySize;
        description = `Booking fee for ${partySize} guests`;
        break;
        
      case 'large_groups':
        if (partySize >= effectiveMinGuests) {
          shouldCharge = true;
          amount = effectiveChargeAmount * partySize;
          description = `Large group fee for ${partySize} guests`;
        }
        break;
        
      default:
        shouldCharge = false;
        break;
    }

    return {
      shouldCharge,
      amount,
      description: description || 'No payment required',
      chargeType: effectiveChargeType
    };

  } catch (error) {
    console.error('Error calculating payment amount:', error);
    return {
      shouldCharge: false,
      amount: 0,
      description: 'Payment calculation error',
      chargeType: 'error'
    };
  }
};
