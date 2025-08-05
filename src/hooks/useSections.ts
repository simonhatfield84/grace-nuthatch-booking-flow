
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Section } from "@/types/core";

export const useSections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userVenue } = useAuth();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['sections', userVenue],
    queryFn: async () => {
      if (!userVenue || !user) {
        console.log('⏭️ No venue or user, skipping sections fetch');
        return [];
      }
      
      console.log('🔄 Fetching sections for venue:', userVenue);
      
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('venue_id', userVenue)
        .order('sort_order');
      
      if (error) {
        console.error('❌ Sections fetch error:', error);
        throw error;
      }
      
      console.log('✅ Sections fetched:', data?.length || 0);
      return (data || []) as Section[];
    },
    enabled: !!userVenue && !!user,
  });

  const createSectionMutation = useMutation({
    mutationFn: async (newSection: Omit<Section, 'id' | 'created_at' | 'updated_at' | 'venue_id'>) => {
      if (!userVenue) throw new Error('No venue associated with user');
      
      const { data, error } = await supabase
        .from('sections')
        .insert([{ ...newSection, venue_id: userVenue }])
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
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Section> }) => {
      const { data, error } = await supabase
        .from('sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('venue_id', userVenue)
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
        .eq('id', id)
        .eq('venue_id', userVenue);
      
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

  return {
    sections,
    isLoading,
    createSection: createSectionMutation.mutateAsync,
    updateSection: updateSectionMutation.mutateAsync,
    deleteSection: deleteSectionMutation.mutateAsync
  };
};
