
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VenueSubscription {
  id: string;
  venue_id: string;
  subscription_plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  subscription_plans?: {
    name: string;
    price_cents: number;
    currency: string;
    billing_interval: string;
  };
  venues?: {
    name: string;
    email: string;
  };
}

export const useVenueSubscriptions = () => {
  return useQuery({
    queryKey: ['venue-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_subscriptions')
        .select(`
          *,
          subscription_plans (name, price_cents, currency, billing_interval),
          venues (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VenueSubscription[];
    },
  });
};

export const usePaymentTransactions = () => {
  return useQuery({
    queryKey: ['payment-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          venues (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};

export const useBillingEvents = () => {
  return useQuery({
    queryKey: ['billing-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_events')
        .select(`
          *,
          venues (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateVenueSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subscription: {
      venue_id: string;
      subscription_plan_id: string;
      stripe_subscription_id?: string;
      stripe_customer_id?: string;
      status?: string;
    }) => {
      const { error } = await supabase
        .from('venue_subscriptions')
        .insert(subscription);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-subscriptions'] });
    },
  });
};
