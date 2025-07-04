
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Guest } from "@/types/guest";
import { guestService } from "@/services/guestService";

export const useGuests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests'],
    queryFn: guestService.fetchGuests
  });

  const createGuestMutation = useMutation({
    mutationFn: guestService.createGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: "Guest created", description: "Guest has been added successfully." });
    },
    onError: (error: any) => {
      console.error('Create guest error:', error);
      toast({ title: "Error", description: "Failed to create guest.", variant: "destructive" });
    }
  });

  const createGuestSilentMutation = useMutation({
    mutationFn: guestService.createGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      // No toast notification for silent creation
    },
    onError: (error: any) => {
      console.error('Create guest error:', error);
      // Still throw error so bulk import can handle it
      throw error;
    }
  });

  const updateGuestMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Guest> }) => 
      guestService.updateGuest(id, updates),
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
    mutationFn: guestService.deleteGuest,
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
    mutationFn: guestService.bulkDeleteGuests,
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

  return {
    guests,
    isLoading,
    createGuest: createGuestMutation.mutateAsync,
    createGuestSilent: createGuestSilentMutation.mutateAsync,
    updateGuest: updateGuestMutation.mutateAsync,
    deleteGuest: deleteGuestMutation.mutateAsync,
    bulkDeleteGuests: bulkDeleteGuestsMutation.mutateAsync
  };
};
