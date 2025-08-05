
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Service {
  id: string;
  title: string;
  description: string | null;
  venue_id: string;
  min_guests: number;
  max_guests: number;
  duration_rules: any[];
  online_bookable: boolean;
  active: boolean;
  deposit_per_guest: number;
  lead_time_hours: number;
  cancellation_window_hours: number;
  terms_and_conditions: string | null;
  image_url: string | null;
  is_secret: boolean;
  secret_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  title: string;
  description: string;
  min_guests: number;
  max_guests: number;
  lead_time_hours: number;
  cancellation_window_hours: number;
  online_bookable: boolean;
  active: boolean;
  is_secret: boolean;
  secret_slug: string;
  image_url: string;
  duration_rules: any[];
  terms_and_conditions: string;
}

export const useServicesData = () => {
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

  // Fetch services
  const { 
    data: services = [], 
    isLoading: isServicesLoading,
    error: servicesError 
  } = useQuery({
    queryKey: ['services', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('venue_id', userVenue)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!userVenue,
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      if (!userVenue) throw new Error('No venue associated with user');
      
      const payload = {
        ...serviceData,
        venue_id: userVenue,
      };
      
      const { data, error } = await supabase
        .from('services')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
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
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create service.", 
        variant: "destructive" 
      });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: ServiceFormData }) => {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', id)
        .eq('venue_id', userVenue)
        .select()
        .single();
      
      if (error) throw error;
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
        .eq('venue_id', userVenue);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ 
        title: "Service deleted", 
        description: "Your service has been deleted successfully." 
      });
    },
    onError: (error: any) => {
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
    servicesError,
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation,
    userVenue
  };
};
