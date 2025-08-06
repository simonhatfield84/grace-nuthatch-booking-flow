import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export interface ServiceFormData {
  title: string;
  description: string;
  duration_minutes: number;
  price_pence: number;
  deposit_pence: number;
  max_party_size: number;
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
  is_active: boolean;
  requires_deposit: boolean;
  requires_full_payment: boolean;
  allows_past_date_booking: boolean;
  auto_confirm: boolean;
  send_confirmation_email: boolean;
  send_reminder_email: boolean;
  reminder_hours_before: number;
  cancellation_policy: string;
  special_requests_enabled: boolean;
  dietary_requirements_enabled: boolean;
  booking_notes_enabled: boolean;
  terms_and_conditions: string;
  refund_window_hours: number;
  auto_refund_enabled: boolean;
  refund_policy_text: string;
}

interface UseServicesDataProps {
  venueId?: string;
}

export const useServicesData = ({ venueId }: UseServicesDataProps = {}) => {
  const [services, setServices] = useState<ServiceFormData[]>([]);
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
          // Convert price_pence and deposit_pence to numbers if they exist
          const formattedServices = data.map(service => ({
            ...service,
            price_pence: typeof service.price_pence === 'string' ? parseInt(service.price_pence, 10) : service.price_pence,
            deposit_pence: typeof service.deposit_pence === 'string' ? parseInt(service.deposit_pence, 10) : service.deposit_pence,
            refund_window_hours: service.refund_window_hours || 24,
            auto_refund_enabled: service.auto_refund_enabled || false,
            refund_policy_text: service.refund_policy_text || ''
          })) as ServiceFormData[];
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
      const { error } = await supabase
        .from('services')
        .insert([{ ...newService, venue_id: venueId }]);

      if (error) {
        throw new Error(error.message);
      }

      setServices(prevServices => [...prevServices, newService]);
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
        prevServices.map(service => (service.title === id ? { ...service, ...updates } : service))
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
        .eq('title', id);

      if (error) {
        throw new Error(error.message);
      }

      setServices(prevServices => prevServices.filter(service => service.title !== id));
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
