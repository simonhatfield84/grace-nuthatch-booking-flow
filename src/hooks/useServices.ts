
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useServices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services from database
  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (newService: any) => {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...newService,
          duration_rules: newService.durationRules,
          tag_ids: newService.tagIds
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Service created", description: "Your service has been created successfully." });
    },
    onError: (error) => {
      console.error('Create service error:', error);
      toast({ title: "Error", description: "Failed to create service.", variant: "destructive" });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...updates,
          duration_rules: updates.durationRules,
          tag_ids: updates.tagIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Service updated", description: "Your service has been updated successfully." });
    },
    onError: (error) => {
      console.error('Update service error:', error);
      toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Service deleted", description: "Your service has been deleted successfully." });
    },
    onError: (error) => {
      console.error('Delete service error:', error);
      toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
    }
  });

  return {
    services,
    isServicesLoading,
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation
  };
};
