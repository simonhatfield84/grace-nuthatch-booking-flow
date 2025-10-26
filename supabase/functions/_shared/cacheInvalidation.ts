import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

export interface CacheInvalidationOptions {
  venue_id: string;
  service_id?: string;
  date?: string;
}

export async function invalidateAvailabilityCache(
  supabase: SupabaseClient,
  options: CacheInvalidationOptions
): Promise<{ deleted: number }> {
  try {
    const match: any = { venue_id: options.venue_id };
    if (options.service_id) match.service_id = options.service_id;
    if (options.date) match.date = options.date;
    
    const { error, count } = await supabase
      .from('availability_cache')
      .delete()
      .match(match);
    
    if (error) {
      console.warn('[Cache] Invalidation soft-failed:', error.message);
      return { deleted: 0 };
    }
    
    console.log(`[Cache] Invalidated ${count || 0} cache entries for`, match);
    return { deleted: count || 0 };
  } catch (e) {
    console.warn('[Cache] Invalidation exception:', e);
    return { deleted: 0 };
  }
}

export async function batchInvalidateCache(
  supabase: SupabaseClient,
  slots: Array<{ venue_id: string; service_id?: string; date?: string }>
): Promise<{ total_deleted: number }> {
  let total = 0;
  
  // Deduplicate slots
  const uniqueSlots = new Map();
  for (const slot of slots) {
    const key = `${slot.venue_id}-${slot.service_id || 'null'}-${slot.date || 'null'}`;
    if (!uniqueSlots.has(key)) {
      uniqueSlots.set(key, slot);
    }
  }
  
  for (const slot of uniqueSlots.values()) {
    const result = await invalidateAvailabilityCache(supabase, slot);
    total += result.deleted;
  }
  
  console.log(`[Cache] Batch invalidation complete: ${total} entries deleted from ${uniqueSlots.size} unique slots`);
  return { total_deleted: total };
}
