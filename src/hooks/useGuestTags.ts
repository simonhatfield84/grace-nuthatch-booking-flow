
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
