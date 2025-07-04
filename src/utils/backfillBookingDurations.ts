
import { supabase } from "@/integrations/supabase/client";
import { calculateBookingDuration, getServiceIdFromServiceName } from "./durationCalculation";

export const backfillBookingDurations = async () => {
  try {
    console.log('Starting backfill of booking durations...');
    
    // Get all bookings that don't have a duration_minutes set or have the default 120
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .or('duration_minutes.is.null,duration_minutes.eq.120')
      .neq('status', 'cancelled');

    if (fetchError) {
      console.error('Error fetching bookings for backfill:', fetchError);
      return;
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found that need duration backfill');
      return;
    }

    console.log(`Found ${bookings.length} bookings to backfill`);

    let updatedCount = 0;
    
    for (const booking of bookings) {
      try {
        // Get service ID from service name
        const serviceId = booking.service ? await getServiceIdFromServiceName(booking.service) : null;
        
        // Calculate duration based on service rules
        const calculatedDuration = await calculateBookingDuration(serviceId || undefined, booking.party_size);
        
        // Only update if the calculated duration is different from current
        if (calculatedDuration !== booking.duration_minutes) {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
              duration_minutes: calculatedDuration,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`Error updating booking ${booking.id}:`, updateError);
          } else {
            console.log(`Updated booking ${booking.id}: ${booking.guest_name} - ${calculatedDuration} minutes`);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
      }
    }

    console.log(`Backfill complete. Updated ${updatedCount} bookings.`);
    return updatedCount;
  } catch (error) {
    console.error('Error in backfillBookingDurations:', error);
  }
};
