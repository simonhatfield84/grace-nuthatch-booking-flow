
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export interface ServiceFormData {
  title: string;
  description: string;
  image_url: string;
  min_guests: number;
  max_guests: number;
  lead_time_hours: number;
  cancellation_window_hours: number;
  online_bookable: boolean;
  active: boolean;
  is_secret: boolean;
  secret_slug: string;
  duration_rules: any[];
  terms_and_conditions: string;
  requires_payment: boolean;
  charge_type: 'none' | 'all_reservations' | 'large_groups' | 'venue_default';
  minimum_guests_for_charge: number;
  charge_amount_per_guest: number;
  refund_window_hours: number;
  auto_refund_enabled: boolean;
  refund_policy_text: string;
}

export interface Service extends ServiceFormData {
  id: string;
  venue_id: string;
  created_at: string;
  updated_at: string;
}

interface UseServicesDataProps {
  venueId?: string;
}

export const useServicesData = ({ venueId }: UseServicesDataProps = {}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) {
      console.warn('Venue ID is missing. Services will not be loaded.');
      return;
    }

    const fetchServices = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('venue_id', venueId);

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          // Map database fields to ServiceFormData interface
          const formattedServices = data.map(service => ({
            id: service.id,
            venue_id: service.venue_id,
            created_at: service.created_at,
            updated_at: service.updated_at,
            title: service.title,
            description: service.description || '',
            image_url: service.image_url || '',
            min_guests: service.min_guests || 1,
            max_guests: service.max_guests || 8,
            lead_time_hours: service.lead_time_hours || 2,
            cancellation_window_hours: service.cancellation_window_hours || 24,
            online_bookable: service.online_bookable ?? true,
            active: service.active ?? true,
            is_secret: service.is_secret ?? false,
            secret_slug: service.secret_slug || '',
            duration_rules: service.duration_rules || [],
            terms_and_conditions: service.terms_and_conditions || '',
            requires_payment: service.requires_payment ?? false,
            charge_type: service.charge_type || 'none',
            minimum_guests_for_charge: service.minimum_guests_for_charge || 8,
            charge_amount_per_guest: service.charge_amount_per_guest || 0,
            refund_window_hours: service.refund_window_hours || 24,
            auto_refund_enabled: service.auto_refund_enabled || false,
            refund_policy_text: service.refund_policy_description || ''
          })) as Service[];
          setServices(formattedServices);
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(`Failed to fetch services: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [venueId]);

  const createService = async (newService: ServiceFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ ...newService, venue_id: venueId }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const formattedService = {
          id: data.id,
          venue_id: data.venue_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
          ...newService
        } as Service;
        setServices(prevServices => [...prevServices, formattedService]);
      }
      
      toast.success('Service created successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to create service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (id: string, updates: Partial<ServiceFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setServices(prevServices =>
        prevServices.map(service => (service.id === id ? { ...service, ...updates } : service))
      );
      toast.success('Service updated successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to update service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setServices(prevServices => prevServices.filter(service => service.id !== id));
      toast.success('Service deleted successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to delete service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
  };
};
