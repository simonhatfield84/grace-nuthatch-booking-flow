
import { supabase } from "@/integrations/supabase/client";

export const fixXmasInJulyService = async () => {
  try {
    // Find the "Xmas in July" service
    const { data: service, error: findError } = await supabase
      .from('services')
      .select('*')
      .ilike('title', '%xmas%july%')
      .single();

    if (findError || !service) {
      console.log('Xmas in July service not found');
      return;
    }

    // Update the service with correct payment settings
    const { error: updateError } = await supabase
      .from('services')
      .update({
        requires_payment: true,
        charge_type: 'all_reservations',
        charge_amount_per_guest: 4500, // £45 in pence
      })
      .eq('id', service.id);

    if (updateError) {
      console.error('Failed to update Xmas in July service:', updateError);
    } else {
      console.log('Successfully updated Xmas in July service payment settings');
    }
  } catch (error) {
    console.error('Error fixing Xmas service:', error);
  }
};
