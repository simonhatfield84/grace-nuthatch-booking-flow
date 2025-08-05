
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedPaymentCalculation {
  shouldCharge: boolean;
  amount: number;
  description: string;
  chargeType: string;
  refundWindowHours: number;
  autoRefundEnabled: boolean;
}

export const calculateEnhancedPaymentAmount = async (
  serviceId: string | null,
  partySize: number,
  venueId: string
): Promise<EnhancedPaymentCalculation> => {
  try {
    console.log('🔍 Enhanced payment calculation starting:', {
      serviceId,
      partySize,
      venueId
    });

    // Check venue Stripe settings
    const { data: venueSettings, error: venueError } = await supabase
      .from('venue_stripe_settings')
      .select('is_active, charge_type, charge_amount_per_guest, minimum_guests_for_charge')
      .eq('venue_id', venueId)
      .maybeSingle();

    console.log('🏢 Venue Stripe settings:', venueSettings);

    const venuePaymentsActive = venueSettings?.is_active === true;

    // If no service specified, use venue-level settings
    if (!serviceId) {
      console.log('📍 Using venue-level settings only');
      
      if (!venuePaymentsActive) {
        return {
          shouldCharge: false,
          amount: 0,
          description: 'No payment required',
          chargeType: 'none',
          refundWindowHours: 24,
          autoRefundEnabled: false
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
      }

      return {
        shouldCharge,
        amount,
        description: description || 'No payment required',
        chargeType: venueSettings.charge_type || 'none',
        refundWindowHours: 24,
        autoRefundEnabled: false
      };
    }

    // Get service payment settings - only select existing columns
    const { data: serviceSettings, error: serviceError } = await supabase
      .from('services')
      .select(`
        requires_payment, 
        charge_type, 
        minimum_guests_for_charge, 
        charge_amount_per_guest, 
        title
      `)
      .eq('id', serviceId)
      .single();

    if (serviceError) {
      console.error('Error fetching service settings:', serviceError);
      return {
        shouldCharge: false,
        amount: 0,
        description: 'Service not found',
        chargeType: 'none',
        refundWindowHours: 24,
        autoRefundEnabled: false
      };
    }

    console.log('🍽️ Service settings:', serviceSettings);

    let shouldCharge = false;
    let amount = 0;
    let description = '';
    let chargeType = 'none';

    if (serviceSettings?.requires_payment) {
      console.log('💰 Service requires payment - calculating...');
      
      const serviceChargeType = serviceSettings.charge_type || 'all_reservations';
      const serviceChargeAmount = serviceSettings.charge_amount_per_guest || 0;
      const serviceMinGuests = serviceSettings.minimum_guests_for_charge || 1;

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
          shouldCharge = true;
          amount = serviceChargeAmount * partySize;
          description = `${serviceSettings.title} booking fee for ${partySize} guests`;
          chargeType = serviceChargeType;
          break;
      }
    } else if (venuePaymentsActive) {
      console.log('🔄 Service doesn\'t require payment, checking venue settings...');
      
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
      }
    }

    const result = {
      shouldCharge,
      amount,
      description: description || 'No payment required',
      chargeType,
      refundWindowHours: 24, // Default fallback
      autoRefundEnabled: false // Default fallback
    };

    console.log('✅ Enhanced payment calculation result:', result);
    return result;

  } catch (error) {
    console.error('💥 Error in enhanced payment calculation:', error);
    return {
      shouldCharge: false,
      amount: 0,
      description: 'Payment calculation error',
      chargeType: 'error',
      refundWindowHours: 24,
      autoRefundEnabled: false
    };
  }
};
