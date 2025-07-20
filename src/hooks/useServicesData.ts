
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
  requires_payment: boolean;
  deposit_per_guest: number;
  lead_time_hours: number;
  cancellation_window_hours: number;
  charge_type: 'none' | 'venue_default' | 'all_reservations' | 'large_groups';
  charge_amount_per_guest: number;
  minimum_guests_for_charge: number | null;
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
  requires_payment: boolean;
  charge_type: 'none' | 'venue_default' | 'all_reservations' | 'large_groups';
  minimum_guests_for_charge: number;
  charge_amount_per_guest: number;
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
        // Ensure charge_type is set correctly
        charge_type: serviceData.requires_payment ? serviceData.charge_type : 'none',
        // Only set minimum_guests_for_charge if charge_type is large_groups
        minimum_guests_for_charge: serviceData.charge_type === 'large_groups' 
          ? serviceData.minimum_guests_for_charge 
          : null,
        // Only set charge_amount if payment is required
        charge_amount_per_guest: serviceData.requires_payment 
          ? serviceData.charge_amount_per_guest 
          : 0,
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
        // Ensure charge_type is set correctly
        charge_type: updates.requires_payment ? updates.charge_type : 'none',
        // Only set minimum_guests_for_charge if charge_type is large_groups
        minimum_guests_for_charge: updates.charge_type === 'large_groups' 
          ? updates.minimum_guests_for_charge 
          : null,
        // Only set charge_amount if payment is required
        charge_amount_per_guest: updates.requires_payment 
          ? updates.charge_amount_per_guest 
          : 0,
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
