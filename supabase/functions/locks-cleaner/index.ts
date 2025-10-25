import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

serve(async (req: Request) => {
  try {
    console.log('🧹 Starting lock cleanup...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date().toISOString();

    // Mark expired locks as released
    const { data: expiredLocks, error } = await supabase
      .from('booking_locks')
      .update({
        released_at: now,
        reason: 'expired',
        updated_at: now
      })
      .is('released_at', null)
      .lt('expires_at', now)
      .select('id, venue_id, service_id, booking_date');

    if (error) {
      console.error('❌ Cleanup failed:', error);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanedCount = expiredLocks?.length || 0;
    console.log(`✅ Cleaned ${cleanedCount} expired locks`);

    // Invalidate availability cache for affected slots
    if (expiredLocks && expiredLocks.length > 0) {
      const uniqueSlots = new Map();
      expiredLocks.forEach(lock => {
        const key = `${lock.venue_id}-${lock.service_id}-${lock.booking_date}`;
        if (!uniqueSlots.has(key)) {
          uniqueSlots.set(key, {
            venue_id: lock.venue_id,
            service_id: lock.service_id,
            date: lock.booking_date
          });
        }
      });

      for (const slot of uniqueSlots.values()) {
        await supabase
          .from('availability_cache')
          .delete()
          .eq('venue_id', slot.venue_id)
          .eq('service_id', slot.service_id)
          .eq('date', slot.date);
      }

      console.log(`🔄 Invalidated cache for ${uniqueSlots.size} date/service combinations`);
    }

    // Log expired locks individually to availability_logs
    if (expiredLocks && expiredLocks.length > 0) {
      const logEntries = expiredLocks.map(lock => ({
        venue_id: lock.venue_id,
        service_id: lock.service_id,
        date: lock.booking_date,
        action: 'expired',
        status: 'ok',
        result_slots: 1
      }));
      
      await supabase.from('availability_logs').insert(logEntries);
      console.log(`📊 Logged ${logEntries.length} expired locks to availability_logs`);
    }

    return new Response(JSON.stringify({
      ok: true,
      cleanedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('💥 Cleanup error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
