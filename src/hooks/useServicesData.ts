import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  refund_window_hours: number;
  auto_refund_enabled: boolean;
}

const defaultFormData: ServiceFormData = {
  title: '',
  description: '',
  min_guests: 1,
  max_guests: 8,
  lead_time_hours: 0,
  cancellation_window_hours: 0,
  online_bookable: true,
  active: true,
  is_secret: false,
  secret_slug: '',
  image_url: '',
  duration_rules: [],
  terms_and_conditions: '',
  requires_payment: false,
  charge_type: 'none',
  minimum_guests_for_charge: 1,
  charge_amount_per_guest: 0,
  refund_window_hours: 24,
  auto_refund_enabled: false,
};

export const useServicesData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Update form data helper
  const updateFormData = (updates: Partial<ServiceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle create service
  const handleCreateService = () => {
    setFormData(defaultFormData);
    setEditingServiceId(null);
    setDialogOpen(true);
  };

  // Handle edit service
  const handleEditService = (service: Service) => {
    setFormData({
      title: service.title,
      description: service.description || '',
      min_guests: service.min_guests,
      max_guests: service.max_guests,
      lead_time_hours: service.lead_time_hours,
      cancellation_window_hours: service.cancellation_window_hours,
      online_bookable: service.online_bookable,
      active: service.active,
      is_secret: service.is_secret,
      secret_slug: service.secret_slug || '',
      image_url: service.image_url || '',
      duration_rules: service.duration_rules || [],
      terms_and_conditions: service.terms_and_conditions || '',
      requires_payment: service.requires_payment,
      charge_type: service.charge_type,
      minimum_guests_for_charge: service.minimum_guests_for_charge || 1,
      charge_amount_per_guest: service.charge_amount_per_guest,
      refund_window_hours: service.refund_window_hours || 24,
      auto_refund_enabled: service.auto_refund_enabled || false,
    });
    setEditingServiceId(service.id);
    setDialogOpen(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setDialogOpen(false);
    setFormData(defaultFormData);
    setEditingServiceId(null);
  };

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      if (!userVenue) throw new Error('No venue associated with user');
      
      const payload = {
        ...serviceData,
        venue_id: userVenue,
        charge_type: serviceData.requires_payment ? serviceData.charge_type : 'none',
        minimum_guests_for_charge: serviceData.charge_type === 'large_groups' 
          ? serviceData.minimum_guests_for_charge 
          : null,
        charge_amount_per_guest: serviceData.requires_payment 
          ? serviceData.charge_amount_per_guest 
          : 0,
        refund_window_hours: serviceData.refund_window_hours,
        auto_refund_enabled: serviceData.auto_refund_enabled,
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
      handleCancel();
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
        charge_type: updates.requires_payment ? updates.charge_type : 'none',
        minimum_guests_for_charge: updates.charge_type === 'large_groups' 
          ? updates.minimum_guests_for_charge 
          : null,
        charge_amount_per_guest: updates.requires_payment 
          ? updates.charge_amount_per_guest 
          : 0,
        refund_window_hours: updates.refund_window_hours,
        auto_refund_enabled: updates.auto_refund_enabled,
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
      handleCancel();
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

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingServiceId) {
        await updateServiceMutation.mutateAsync({ id: editingServiceId, updates: formData });
      } else {
        await createServiceMutation.mutateAsync(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    services,
    isLoading: isServicesLoading,
    servicesError,
    dialogOpen,
    setDialogOpen,
    formData,
    updateFormData,
    isSubmitting,
    isEditing: !!editingServiceId,
    handleCreateService,
    handleEditService,
    handleSubmit,
    handleCancel,
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation,
    userVenue
  };
};
