
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformVenues = () => {
  return useQuery({
    queryKey: ['platform-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          profiles:profiles(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateVenueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ venueId, status }: { venueId: string; status: 'active' | 'rejected' }) => {
      // Update venue status
      const { error: venueError } = await supabase
        .from('venues')
        .update({ status })
        .eq('id', venueId);

      if (venueError) throw venueError;

      // If approving, also update all users associated with this venue to active status
      if (status === 'active') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ status: 'active' })
          .eq('venue_id', venueId);

        if (profileError) throw profileError;
      }

      return { venueId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-venues'] });
    },
  });
};
