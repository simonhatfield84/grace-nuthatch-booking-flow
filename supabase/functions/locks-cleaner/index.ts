import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { ok, err, jsonResponse } from "../_shared/apiResponse.ts";
import { batchInvalidateCache } from "../_shared/cacheInvalidation.ts";

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
      return jsonResponse(
        err('db_error', error.message),
        500
      );
    }

    const cleanedCount = expiredLocks?.length || 0;
    console.log(`✅ Cleaned ${cleanedCount} expired locks`);

    // Invalidate availability cache for affected slots
    if (expiredLocks && expiredLocks.length > 0) {
      const uniqueSlots = expiredLocks.map(lock => ({
        venue_id: lock.venue_id,
        service_id: lock.service_id,
        date: lock.booking_date
      }));

      const { total_deleted } = await batchInvalidateCache(supabase, uniqueSlots);
      console.log(`🔄 Invalidated ${total_deleted} cache entries`);
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

    return jsonResponse(ok({ cleanedCount }), 200);
  } catch (error: any) {
    console.error('💥 Cleanup error:', error);
    return jsonResponse(
      err('server_error', error.message),
      500
    );
  }
});
