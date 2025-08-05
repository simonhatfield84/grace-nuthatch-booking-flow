import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service as CoreService } from '@/types/core';
import { toast } from 'sonner';

// Extend Service interface for form data with refund settings
export interface Service extends CoreService {
  refund_window_hours?: number;
  auto_refund_enabled?: boolean;
  tag_ids?: string[];
  is_secret: boolean;
  secret_slug?: string;
  duration_rules?: any[];
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
  charge_type: string;
  minimum_guests_for_charge: number;
  charge_amount_per_guest: number;
  refund_window_hours: number;
  auto_refund_enabled: boolean;
}

export const useServicesData = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('title');

      if (error) throw error;
      
      // Transform the data to match our Service interface
      const transformedServices = (data || []).map(service => ({
        ...service,
        duration_rules: Array.isArray(service.duration_rules) 
          ? service.duration_rules 
          : service.duration_rules && typeof service.duration_rules === 'string'
            ? JSON.parse(service.duration_rules) 
            : [],
        refund_window_hours: service.refund_window_hours || 24,
        auto_refund_enabled: service.auto_refund_enabled || false,
      })) as Service[];
      
      setServices(transformedServices);
    } catch (err) {
      console.error('Error loading services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: ServiceFormData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...serviceData,
          venue_id: (await supabase.auth.getUser()).data.user?.user_metadata?.venue_id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadServices();
      toast.success('Service created successfully');
      return data;
    } catch (err) {
      console.error('Error creating service:', err);
      const message = err instanceof Error ? err.message : 'Failed to create service';
      toast.error(message);
      throw err;
    }
  };

  const updateService = async (id: string, serviceData: ServiceFormData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await loadServices();
      toast.success('Service updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating service:', err);
      const message = err instanceof Error ? err.message : 'Failed to update service';
      toast.error(message);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      
      await loadServices();
      toast.success('Service deleted successfully');
    } catch (err) {
      console.error('Error deleting service:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete service';
      toast.error(message);
      throw err;
    }
  };

  // Get service with enhanced payment info
  const getServiceById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        duration_rules: Array.isArray(data.duration_rules) 
          ? data.duration_rules 
          : data.duration_rules && typeof data.duration_rules === 'string'
            ? JSON.parse(data.duration_rules) 
            : [],
        refund_window_hours: data.refund_window_hours || 24,
        auto_refund_enabled: data.auto_refund_enabled || false,
      } as Service;
    } catch (err) {
      console.error('Error fetching service:', err);
      throw err;
    }
  };

  // Check if service requires payment for given party size
  const checkPaymentRequired = (service: Service, partySize: number): boolean => {
    if (!service.requires_payment) return false;
    
    switch (service.charge_type) {
      case 'all_reservations':
        return true;
      case 'large_groups':
        return partySize >= (service.minimum_guests_for_charge || 8);
      case 'per_person':
      case 'flat_rate':
        return true;
      default:
        return false;
    }
  };

  // Calculate payment amount for booking
  const calculatePaymentAmount = (service: Service, partySize: number): number => {
    if (!checkPaymentRequired(service, partySize)) return 0;
    
    switch (service.charge_type) {
      case 'per_person':
        return (service.charge_amount_per_guest || 0) * partySize;
      case 'flat_rate':
      case 'all_reservations':
        return service.charge_amount_per_guest || 0;
      case 'large_groups':
        return partySize >= (service.minimum_guests_for_charge || 8) 
          ? (service.charge_amount_per_guest || 0) * partySize 
          : 0;
      default:
        return 0;
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return {
    services,
    loading,
    error,
    loadServices,
    createService,
    updateService,
    deleteService,
    getServiceById,
    checkPaymentRequired,
    calculatePaymentAmount,
  };
};
