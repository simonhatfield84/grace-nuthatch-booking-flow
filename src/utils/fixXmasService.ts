import { supabase } from "@/integrations/supabase/client";

export async function fixXmasService(venueId: string) {
  // Check if the service already exists
  const { data: existingService, error: selectError } = await supabase
    .from('services')
    .select('id')
    .eq('venue_id', venueId)
    .eq('title', 'Christmas Special Menu')
    .single();

  if (selectError && selectError.code !== '404') {
    console.error('Error checking for existing Christmas service:', selectError);
    return;
  }

  let serviceId: string | null = null;

  if (existingService) {
    // Service exists, update it
    serviceId = existingService.id;
    console.log('Christmas service already exists, updating:', serviceId);
  } else {
    // Service does not exist, create it
    console.log('Christmas service does not exist, creating...');
    const { data: newService, error: insertError } = await supabase
      .from('services')
      .insert([
        {
          venue_id: venueId,
          title: 'Christmas Special Menu',
          description: 'Festive holiday dining experience with special Christmas menu',
          min_guests: 2,
          max_guests: 12,
          lead_time_hours: 24,
          cancellation_window_hours: 48,
          online_bookable: true,
          active: true,
          is_secret: false,
          terms_and_conditions: 'Special Christmas menu available. Please mention any dietary requirements when booking.',
        }
      ])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating Christmas service:', insertError);
      return;
    }

    serviceId = newService.id;
    console.log('Christmas service created:', serviceId);
  }

  if (serviceId) {
    // Update the service if it exists
    const { error: updateError } = await supabase
      .from('services')
      .update({
        title: 'Christmas Special Menu',
        description: 'Festive holiday dining experience with special Christmas menu',
        min_guests: 2,
        max_guests: 12,
        lead_time_hours: 24,
        cancellation_window_hours: 48,
        online_bookable: true,
        active: true,
        is_secret: false,
        terms_and_conditions: 'Special Christmas menu available. Please mention any dietary requirements when booking.',
      })
      .eq('id', serviceId);

    if (updateError) {
      console.error('Error updating Christmas service:', updateError);
    } else {
      console.log('Christmas service updated successfully.');
    }
  }
}
