
import { supabase } from "@/integrations/supabase/client";
import { Guest, DuplicateGuest } from "@/types/guest";

export const guestService = {
  async fetchGuests() {
    const { data, error } = await supabase
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
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate visit statistics for each guest
    const guestsWithStats = await Promise.all(
      data.map(async (guest) => {
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
    
    return guestsWithStats as Guest[];
  },

  async createGuest(newGuest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('guests')
      .insert([newGuest])
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
