
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Block {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  table_ids: number[];
  reason: string | null;
  venue_id: string;
  created_at: string;
  updated_at: string;
}

export const useBlocks = (date?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['blocks', date],
    queryFn: async () => {
      let query = supabase
        .from('blocks')
        .select('*')
        .order('start_time');
      
      if (date) {
        query = query.eq('date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as Block[];
    }
  });

  const createBlockMutation = useMutation({
    mutationFn: async (newBlock: Omit<Block, 'id' | 'created_at' | 'updated_at' | 'venue_id'>) => {
      if (!userVenue) {
        throw new Error('No venue associated with user');
      }

      const { data, error } = await supabase
        .from('blocks')
        .insert([{
          ...newBlock,
          venue_id: userVenue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      // Clear availability caches when blocks change
      import("@/services/core/AvailabilityService").then(({ AvailabilityService }) => {
        AvailabilityService.clearCache();
      });
      import("@/features/booking/services/BookingService").then(({ BookingService }) => {
        BookingService.clearCache();
      });
      toast({ 
        title: "Block created", 
        description: "Time slot blocked successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Create block error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create block.", 
        variant: "destructive" 
      });
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      // Clear availability caches when blocks change
      import("@/services/core/AvailabilityService").then(({ AvailabilityService }) => {
        AvailabilityService.clearCache();
      });
      import("@/features/booking/services/BookingService").then(({ BookingService }) => {
        BookingService.clearCache();
      });
      toast({ 
        title: "Block removed", 
        description: "Time slot unblocked successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Delete block error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to remove block.", 
        variant: "destructive" 
      });
    }
  });

  return {
    blocks,
    isLoading,
    createBlock: createBlockMutation.mutateAsync,
    deleteBlock: deleteBlockMutation.mutateAsync
  };
};
