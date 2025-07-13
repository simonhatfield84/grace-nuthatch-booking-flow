
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
      .select('is_active')
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

    // Get service payment settings
    if (!serviceId) {
      return {
        shouldCharge: false,
        amount: 0,
        description: 'No payment required',
        chargeType: 'none'
      };
    }

    const { data: serviceSettings } = await supabase
      .from('services')
      .select('requires_payment, charge_type, minimum_guests_for_charge, charge_amount_per_guest')
      .eq('id', serviceId)
      .single();

    if (!serviceSettings?.requires_payment) {
      return {
        shouldCharge: false,
        amount: 0,
        description: 'No payment required',
        chargeType: 'none'
      };
    }

    // Apply charge logic based on service settings
    let shouldCharge = false;
    let amount = 0;
    let description = '';

    switch (serviceSettings.charge_type) {
      case 'all_reservations':
        shouldCharge = true;
        amount = serviceSettings.charge_amount_per_guest * partySize; // Keep in pence
        description = `Booking fee for ${partySize} guests`;
        break;
        
      case 'large_groups':
        const minGuests = serviceSettings.minimum_guests_for_charge || 8;
        if (partySize >= minGuests) {
          shouldCharge = true;
          amount = serviceSettings.charge_amount_per_guest * partySize; // Keep in pence
          description = `Large group fee for ${partySize} guests`;
        }
        break;
        
      default:
        // 'none' or any other value
        shouldCharge = false;
        break;
    }

    return {
      shouldCharge,
      amount,
      description: description || 'No payment required',
      chargeType: serviceSettings.charge_type
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
