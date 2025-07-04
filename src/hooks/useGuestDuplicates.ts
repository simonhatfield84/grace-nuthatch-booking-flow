
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { guestService } from "@/services/guestService";

export const useGuestDuplicates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const findDuplicatesMutation = useMutation({
    mutationFn: ({ email, phone }: { email?: string; phone?: string }) => 
      guestService.findDuplicateGuests(email, phone)
  });

  const mergeGuestsMutation = useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) => 
      guestService.mergeGuests(primaryId, duplicateId),
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
    findDuplicates: findDuplicatesMutation.mutateAsync,
    mergeGuests: mergeGuestsMutation.mutateAsync
  };
};
