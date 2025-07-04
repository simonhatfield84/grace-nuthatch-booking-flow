
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  const createSectionMutation = useMutation({
    mutationFn: async (newSection: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('sections')
        .insert([{
          ...newSection,
          sort_order: sections.length + 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({ title: "Section created", description: "New section has been created successfully." });
    },
    onError: (error: any) => {
      console.error('Create section error:', error);
      toast({ title: "Error", description: "Failed to create section.", variant: "destructive" });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      const { data, error } = await supabase
        .from('sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({ title: "Section updated", description: "Section has been updated successfully." });
    },
    onError: (error: any) => {
      console.error('Update section error:', error);
      toast({ title: "Error", description: "Failed to update section.", variant: "destructive" });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({ title: "Section deleted", description: "Section has been deleted successfully." });
    },
    onError: (error: any) => {
      console.error('Delete section error:', error);
      toast({ title: "Error", description: "Failed to delete section.", variant: "destructive" });
    }
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (reorderedSections: Array<{ id: number; sort_order: number }>) => {
      for (const section of reorderedSections) {
        const { error } = await supabase
          .from('sections')
          .update({ sort_order: section.sort_order })
          .eq('id', section.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast({ title: "Sections reordered", description: "Section order has been updated." });
    },
    onError: (error: any) => {
      console.error('Reorder sections error:', error);
      toast({ title: "Error", description: "Failed to reorder sections.", variant: "destructive" });
    }
  });

  return {
    sections,
    isLoading,
    createSection: createSectionMutation.mutateAsync,
    updateSection: updateSectionMutation.mutateAsync,
    deleteSection: deleteSectionMutation.mutateAsync,
    reorderSections: reorderSectionsMutation.mutateAsync
  };
};
