import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  opt_in_marketing: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  import_visit_count?: number | null;
  import_last_visit_date?: string | null;
  tags?: Tag[];
  visit_count?: number;
  last_visit_date?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  is_automatic: boolean;
}

export interface GuestTag {
  id: string;
  guest_id: string;
  tag_id: string;
  assigned_by: string;
  assigned_at: string;
  tags: Tag;
}

export interface DuplicateGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  match_type: string;
}

export const useGuests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests'],
    queryFn: async () => {
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
    }
  });

  const createGuestMutation = useMutation({
    mutationFn: async (newGuest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Guest created", description: "Guest has been added successfully." });
    },
    onError: (error: any) => {
      console.error('Create guest error:', error);
      toast({ title: "Error", description: "Failed to create guest.", variant: "destructive" });
    }
  });

  const updateGuestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Guest> }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Guest updated", description: "Guest information has been updated." });
    },
    onError: (error: any) => {
      console.error('Update guest error:', error);
      toast({ title: "Error", description: "Failed to update guest.", variant: "destructive" });
    }
  });

  const deleteGuestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Guest deleted", description: "Guest has been removed." });
    },
    onError: (error: any) => {
      console.error('Delete guest error:', error);
      toast({ title: "Error", description: "Failed to delete guest.", variant: "destructive" });
    }
  });

  const bulkDeleteGuestsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ 
        title: "Guests deleted", 
        description: `${ids.length} guest${ids.length > 1 ? 's' : ''} have been removed.` 
      });
    },
    onError: (error: any) => {
      console.error('Bulk delete guests error:', error);
      toast({ title: "Error", description: "Failed to delete guests.", variant: "destructive" });
    }
  });

  const findDuplicatesMutation = useMutation({
    mutationFn: async ({ email, phone }: { email?: string; phone?: string }) => {
      const { data, error } = await supabase.rpc('find_duplicate_guests', {
        guest_email: email || null,
        guest_phone: phone || null
      });
      
      if (error) throw error;
      return data as DuplicateGuest[];
    }
  });

  const mergeGuestsMutation = useMutation({
    mutationFn: async ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) => {
      const { data, error } = await supabase.rpc('merge_guests', {
        primary_guest_id: primaryId,
        duplicate_guest_id: duplicateId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Guests merged", description: "Duplicate guests have been successfully merged." });
    },
    onError: (error: any) => {
      console.error('Merge guests error:', error);
      toast({ title: "Error", description: "Failed to merge guests.", variant: "destructive" });
    }
  });

  return {
    guests,
    isLoading,
    createGuest: createGuestMutation.mutateAsync,
    updateGuest: updateGuestMutation.mutateAsync,
    deleteGuest: deleteGuestMutation.mutateAsync,
    bulkDeleteGuests: bulkDeleteGuestsMutation.mutateAsync,
    findDuplicates: findDuplicatesMutation.mutateAsync,
    mergeGuests: mergeGuestsMutation.mutateAsync
  };
};

export const useTags = () => {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Tag[];
    }
  });

  return { tags, isLoading };
};

export const useGuestTags = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assignTagMutation = useMutation({
    mutationFn: async ({ guestId, tagId }: { guestId: string, tagId: string }) => {
      const { data, error } = await supabase
        .from('guest_tags')
        .insert([{
          guest_id: guestId,
          tag_id: tagId,
          assigned_by: 'manual'
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Tag already assigned to this guest');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Tag assigned", description: "Tag has been added to guest." });
    },
    onError: (error: any) => {
      console.error('Assign tag error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to assign tag.", 
        variant: "destructive" 
      });
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: async ({ guestId, tagId }: { guestId: string, tagId: string }) => {
      const { error } = await supabase
        .from('guest_tags')
        .delete()
        .eq('guest_id', guestId)
        .eq('tag_id', tagId)
        .eq('assigned_by', 'manual'); // Only allow removal of manual tags
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Tag removed", description: "Tag has been removed from guest." });
    },
    onError: (error: any) => {
      console.error('Remove tag error:', error);
      toast({ title: "Error", description: "Failed to remove tag.", variant: "destructive" });
    }
  });

  return {
    assignTag: assignTagMutation.mutateAsync,
    removeTag: removeTagMutation.mutateAsync
  };
};
