
import { supabase } from "@/integrations/supabase/client";
import { Guest, DuplicateGuest } from "@/types/guest";

export const guestService = {
  async fetchGuests(options?: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    tags?: string[];
    marketingOptIn?: string;
    visitCount?: string;
  }) {
    let query = supabase
      .from('guests')
      .select(`
        *,
        guest_tags (
          id,
          assigned_by,
          assigned_at,
          tags (
            id,
            name,
            color,
            is_automatic
          )
        )
      `, { count: 'exact' });

    // Apply server-side filtering for performance
    if (options?.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.like.${options.search}%`);
    }

    // Apply pagination
    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }

    query = query.order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Calculate visit statistics for each guest (optimized batch approach)
    const guestsWithStats = await Promise.all(
      (data || []).map(async (guest) => {
        const { data: stats } = await supabase.rpc('calculate_guest_stats', {
          guest_email: guest.email,
          guest_phone: guest.phone
        });
        
        return {
          ...guest,
          tags: guest.guest_tags?.map((gt: any) => gt.tags) || [],
          visit_count: stats?.[0]?.visit_count || 0,
          last_visit_date: stats?.[0]?.last_visit_date || null
        };
      })
    );
    
    return { 
      guests: guestsWithStats as Guest[], 
      totalCount: count || 0 
    };
  },

  async createGuest(newGuest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) {
    // Get the user's venue ID from their profile
    const { data: profile, error: profileError } = await supabase.auth.getUser();
    
    if (profileError || !profile.user) {
      throw new Error('User not authenticated');
    }

    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('venue_id')
      .eq('id', profile.user.id)
      .single();

    if (userProfileError || !userProfile?.venue_id) {
      throw new Error('No venue associated with user');
    }

    const { data, error } = await supabase
      .from('guests')
      .insert([{ ...newGuest, venue_id: userProfile.venue_id }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Assign automatic tags
    await supabase.rpc('assign_automatic_tags', { guest_id_param: data.id });
    
    return data;
  },

  async updateGuest(id: string, updates: Partial<Guest>) {
    const { data, error } = await supabase
      .from('guests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Reassign automatic tags after update
    await supabase.rpc('assign_automatic_tags', { guest_id_param: id });
    
    return data;
  },

  async deleteGuest(id: string) {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async bulkDeleteGuests(ids: string[]) {
    const { error } = await supabase
      .from('guests')
      .delete()
      .in('id', ids);
    
    if (error) throw error;
  },

  async findDuplicateGuests(email?: string, phone?: string) {
    const { data, error } = await supabase.rpc('find_duplicate_guests', {
      guest_email: email || null,
      guest_phone: phone || null
    });
    
    if (error) throw error;
    return data as DuplicateGuest[];
  },

  async mergeGuests(primaryId: string, duplicateId: string) {
    const { data, error } = await supabase.rpc('merge_guests', {
      primary_guest_id: primaryId,
      duplicate_guest_id: duplicateId
    });
    
    if (error) throw error;
    return data;
  }
};
