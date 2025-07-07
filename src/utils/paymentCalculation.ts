
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
    // Get service payment settings
    let serviceSettings = null;
    if (serviceId) {
      const { data } = await supabase
        .from('services')
        .select('requires_payment, charge_type, minimum_guests_for_charge, charge_amount_per_guest')
        .eq('id', serviceId)
        .single();
      
      serviceSettings = data;
    }

    // Get venue default payment settings
    const { data: venueSettings } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, charge_type, minimum_guests_for_charge, charge_amount_per_guest')
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

    // Determine charge settings (service overrides venue defaults)
    const effectiveSettings = {
      requires_payment: serviceSettings?.requires_payment ?? true,
      charge_type: serviceSettings?.charge_type === 'venue_default' 
        ? venueSettings.charge_type 
        : serviceSettings?.charge_type || venueSettings.charge_type,
      minimum_guests_for_charge: serviceSettings?.minimum_guests_for_charge || venueSettings.minimum_guests_for_charge || 8,
      charge_amount_per_guest: serviceSettings?.charge_type === 'venue_default'
        ? venueSettings.charge_amount_per_guest
        : serviceSettings?.charge_amount_per_guest || venueSettings.charge_amount_per_guest || 0
    };

    // If service doesn't require payment, no charge
    if (!effectiveSettings.requires_payment) {
      return {
        shouldCharge: false,
        amount: 0,
        description: 'No payment required',
        chargeType: 'none'
      };
    }

    // Apply charge logic
    let shouldCharge = false;
    let amount = 0;
    let description = '';

    switch (effectiveSettings.charge_type) {
      case 'all_reservations':
        shouldCharge = true;
        amount = (effectiveSettings.charge_amount_per_guest * partySize) / 100; // Convert from pence
        description = `Booking fee for ${partySize} guests`;
        break;
        
      case 'large_groups':
        if (partySize >= effectiveSettings.minimum_guests_for_charge) {
          shouldCharge = true;
          amount = (effectiveSettings.charge_amount_per_guest * partySize) / 100; // Convert from pence
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
      chargeType: effectiveSettings.charge_type
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
