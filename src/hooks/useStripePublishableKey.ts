
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStripePublishableKey = () => {
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

  // Get venue's Stripe settings to determine test mode
  const { data: stripeSettings } = useQuery({
    queryKey: ['stripe-settings', userVenue],
    queryFn: async () => {
      if (!userVenue) return null;
      
      const { data, error } = await supabase
        .from('venue_stripe_settings')
        .select('test_mode, is_active')
        .eq('venue_id', userVenue)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userVenue,
  });

  // Return the appropriate publishable key
  const getPublishableKey = () => {
    if (!stripeSettings?.is_active) return null;
    
    if (stripeSettings.test_mode) {
      // Use your test publishable key
      return 'pk_test_7vT4o5vhEWnMwZ9cn93x929W003935Vcug';
    } else {
      // Use your live publishable key (replace with actual live key when ready)
      return 'pk_live_gd8JdMEmr2PUXOoRHjpxhJxn00ndF8BhX4';
    }
  };

  return {
    publishableKey: getPublishableKey(),
    isTestMode: stripeSettings?.test_mode ?? true,
    isActive: stripeSettings?.is_active ?? false,
    isLoading: !stripeSettings && !!userVenue,
  };
};
