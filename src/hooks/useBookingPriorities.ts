
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBookingPriorities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: priorities = [], isLoading } = useQuery({
    queryKey: ['booking-priorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_priorities')
        .select('*')
        .order('party_size, priority_rank');
      
      if (error) throw error;
      return data;
    }
  });

  const updatePrioritiesMutation = useMutation({
    mutationFn: async (updatedPriorities: Array<{ id: number; priority_rank: number }>) => {
      // Update priorities individually since we don't have an RPC function
      for (const priority of updatedPriorities) {
        const { error: updateError } = await supabase
          .from('booking_priorities')
          .update({ priority_rank: priority.priority_rank })
          .eq('id', priority.id);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-priorities'] });
      toast({ title: "Priorities updated", description: "Booking priorities have been updated successfully." });
    },
    onError: (error: any) => {
      console.error('Update priorities error:', error);
      toast({ title: "Error", description: "Failed to update priorities.", variant: "destructive" });
    }
  });

  const addPriorityMutation = useMutation({
    mutationFn: async (priority: { party_size: number; item_type: 'table' | 'group'; item_id: number }) => {
      // Get the max priority rank for this party size
      const { data: maxRank } = await supabase
        .from('booking_priorities')
        .select('priority_rank')
        .eq('party_size', priority.party_size)
        .order('priority_rank', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('booking_priorities')
        .insert([{
          ...priority,
          priority_rank: (maxRank?.priority_rank || 0) + 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-priorities'] });
    },
    onError: (error: any) => {
      console.error('Add priority error:', error);
    }
  });

  const getPrioritiesForPartySize = (partySize: number) => {
    return priorities.filter(p => p.party_size === partySize).sort((a, b) => a.priority_rank - b.priority_rank);
  };

  return {
    priorities,
    isLoading,
    updatePriorities: updatePrioritiesMutation.mutateAsync,
    addPriority: addPriorityMutation.mutateAsync,
    getPrioritiesForPartySize
  };
};
