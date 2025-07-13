import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useServices = () => {
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
      
      if (error) {
        console.error('Error fetching user venue:', error);
        throw error;
      }
      return data?.venue_id;
    },
    enabled: !!user,
  });

  // Fetch services from database with venue isolation
  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['services', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('venue_id', userVenue)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      return data;
    },
    enabled: !!userVenue,
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (newService: any) => {
      if (!userVenue) throw new Error('No venue associated with user');
      
      console.log('Creating service with data:', { ...newService, venue_id: userVenue });
      
      // Ensure all required fields are present with corrected charge_type default
      const serviceData = {
        title: newService.title,
        description: newService.description || '',
        venue_id: userVenue,
        min_guests: newService.min_guests || 1,
        max_guests: newService.max_guests || 8,
        duration_rules: newService.duration_rules || [],
        online_bookable: newService.online_bookable !== false,
        active: newService.active !== false,
        requires_payment: newService.requires_payment || false,
        deposit_per_guest: newService.deposit_per_guest || 0,
        lead_time_hours: newService.lead_time_hours || 2,
        cancellation_window_hours: newService.cancellation_window_hours || 24,
        charge_type: newService.charge_type || 'none',
        charge_amount_per_guest: newService.charge_amount_per_guest || 0,
        minimum_guests_for_charge: newService.minimum_guests_for_charge || null,
        terms_and_conditions: newService.terms_and_conditions || '',
        image_url: newService.image_url || null,
        tag_ids: newService.tag_ids || [],
        is_secret: newService.is_secret || false,
        secret_slug: newService.secret_slug || null,
      };
      
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating service:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ 
        title: "Service created", 
        description: "Your service has been created successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Create service error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create service.", 
        variant: "destructive" 
      });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      console.log('Updating service with data:', updates);
      
      const { data, error } = await supabase
        .from('services')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('venue_id', userVenue) // Ensure user can only update their venue's services
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error updating service:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ 
        title: "Service updated", 
        description: "Your service has been updated successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Update service error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update service.", 
        variant: "destructive" 
      });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('venue_id', userVenue); // Ensure user can only delete their venue's services
      
      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ 
        title: "Service deleted", 
        description: "Your service has been deleted successfully." 
      });
    },
    onError: (error: any) => {
      console.error('Delete service error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete service.", 
        variant: "destructive" 
      });
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
