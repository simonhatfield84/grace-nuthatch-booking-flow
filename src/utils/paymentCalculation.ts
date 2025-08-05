
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
    console.log('🔍 Payment calculation starting:', {
      serviceId,
      partySize,
      venueId
    });

    // Check if venue has Stripe enabled
    const { data: venueSettings, error: venueError } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, charge_type, charge_amount_per_guest, minimum_guests_for_charge')
      .eq('venue_id', venueId)
      .maybeSingle();

    console.log('🏢 Venue Stripe settings:', venueSettings);
    console.log('🏢 Venue settings error (if any):', venueError);

    // If venue settings are not accessible or payments not active, 
    // we'll fall back to service-level requirements
    const venuePaymentsActive = venueSettings?.is_active === true;

    // If no service specified, use venue-level settings (if accessible)
    if (!serviceId) {
      console.log('📍 Using venue-level settings only');
      
      if (!venuePaymentsActive) {
        console.log('❌ Venue payments not active or not accessible');
        return {
          shouldCharge: false,
          amount: 0,
          description: 'No payment required',
          chargeType: 'none'
        };
      }

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

      console.log('🏢 Venue-level result:', { shouldCharge, amount, description });

      return {
        shouldCharge,
        amount,
        description: description || 'No payment required',
        chargeType: venueSettings.charge_type || 'none'
      };
    }

    // Get service payment settings
    const { data: serviceSettings } = await supabase
      .from('services')
      .select('requires_payment, charge_type, minimum_guests_for_charge, charge_amount_per_guest, title')
      .eq('id', serviceId)
      .single();

    console.log('🍽️ Service settings:', serviceSettings);

    let shouldCharge = false;
    let amount = 0;
    let description = '';
    let chargeType = 'none';

    // Check if service requires payment
    if (serviceSettings?.requires_payment) {
      console.log('💰 Service requires payment - calculating...');
      
      // Use service-level settings when service requires payment
      const serviceChargeType = serviceSettings.charge_type || 'all_reservations';
      const serviceChargeAmount = serviceSettings.charge_amount_per_guest || 0;
      const serviceMinGuests = serviceSettings.minimum_guests_for_charge || 1;

      console.log('💰 Service payment details:', {
        serviceChargeType,
        serviceChargeAmount,
        serviceMinGuests,
        partySize
      });

      switch (serviceChargeType) {
        case 'all_reservations':
          shouldCharge = true;
          amount = serviceChargeAmount * partySize;
          description = `${serviceSettings.title} booking fee for ${partySize} guests`;
          chargeType = serviceChargeType;
          break;
          
        case 'large_groups':
          if (partySize >= serviceMinGuests) {
            shouldCharge = true;
            amount = serviceChargeAmount * partySize;
            description = `${serviceSettings.title} large group fee for ${partySize} guests`;
            chargeType = serviceChargeType;
          }
          break;
          
        default:
          // For any other charge type, still charge if requires_payment is true
          shouldCharge = true;
          amount = serviceChargeAmount * partySize;
          description = `${serviceSettings.title} booking fee for ${partySize} guests`;
          chargeType = serviceChargeType;
          break;
      }
    } else if (venuePaymentsActive) {
      console.log('🔄 Service doesn\'t require payment, checking venue settings...');
      
      // Fall back to venue-level settings if service doesn't require payment and venue settings are accessible
      switch (venueSettings.charge_type) {
        case 'all_reservations':
          shouldCharge = true;
          amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
          description = `Booking fee for ${partySize} guests`;
          chargeType = venueSettings.charge_type;
          break;
          
        case 'large_groups':
          const minGuests = venueSettings.minimum_guests_for_charge || 8;
          if (partySize >= minGuests) {
            shouldCharge = true;
            amount = (venueSettings.charge_amount_per_guest || 0) * partySize;
            description = `Large group fee for ${partySize} guests`;
            chargeType = venueSettings.charge_type;
          }
          break;
          
        default:
          shouldCharge = false;
          chargeType = 'none';
          break;
      }
    } else {
      console.log('❌ Venue settings not accessible and service doesn\'t require payment - no charge');
      shouldCharge = false;
      chargeType = 'none';
    }

    const result = {
      shouldCharge,
      amount,
      description: description || 'No payment required',
      chargeType
    };

    console.log('✅ Final payment calculation result:', result);

    return result;

  } catch (error) {
    console.error('💥 Error calculating payment amount:', error);
    return {
      shouldCharge: false,
      amount: 0,
      description: 'Payment calculation error',
      chargeType: 'error'
    };
  }
};
