
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsePublicStripeSettingsProps {
  venueId?: string;
  venueSlug?: string;
}

export const usePublicStripeSettings = ({ venueId, venueSlug }: UsePublicStripeSettingsProps) => {
  // First get venue ID if we only have slug
  const { data: venue } = useQuery({
    queryKey: ['venue-by-slug', venueSlug],
    queryFn: async () => {
      if (!venueSlug) return null;
      
      const { data, error } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', venueSlug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!venueSlug && !venueId,
  });

  const finalVenueId = venueId || venue?.id;

  // Get venue's Stripe settings
  const { data: stripeSettings, isLoading } = useQuery({
    queryKey: ['public-stripe-settings', finalVenueId],
    queryFn: async () => {
      if (!finalVenueId) return null;
      
      const { data, error } = await supabase
        .from('venue_stripe_settings')
        .select('test_mode, is_active, publishable_key_test, publishable_key_live')
        .eq('venue_id', finalVenueId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!finalVenueId,
  });

  // Return the appropriate publishable key
  const getPublishableKey = () => {
    if (!stripeSettings?.is_active) return null;
    
    if (stripeSettings.test_mode) {
      return stripeSettings.publishable_key_test;
    } else {
      return stripeSettings.publishable_key_live;
    }
  };

  return {
    publishableKey: getPublishableKey(),
    isTestMode: stripeSettings?.test_mode ?? true,
    isActive: stripeSettings?.is_active ?? false,
    isLoading: isLoading || (!finalVenueId && !!venueSlug),
  };
};
