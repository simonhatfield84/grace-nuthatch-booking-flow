
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsePublicStripeSettingsProps {
  venueId?: string;
  venueSlug?: string;
}

export const usePublicStripeSettings = ({ venueId, venueSlug }: UsePublicStripeSettingsProps) => {
  console.log('🔍 usePublicStripeSettings called with:', { venueId, venueSlug });
  
  // First get venue ID if we only have slug
  const { data: venue, isLoading: venueLoading, error: venueError } = useQuery({
    queryKey: ['venue-by-slug', venueSlug],
    queryFn: async () => {
      if (!venueSlug) return null;
      
      console.log('🏢 Fetching venue by slug:', venueSlug);
      const { data, error } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', venueSlug)
        .single();
      
      if (error) {
        console.error('❌ Error fetching venue by slug:', error);
        throw error;
      }
      
      console.log('✅ Venue found:', data);
      return data;
    },
    enabled: !!venueSlug && !venueId,
  });

  const finalVenueId = venueId || venue?.id;
  console.log('🎯 Final venue ID:', finalVenueId);

  // Get venue's Stripe settings
  const { data: stripeSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['public-stripe-settings', finalVenueId],
    queryFn: async () => {
      if (!finalVenueId) return null;
      
      console.log('💳 Fetching Stripe settings for venue:', finalVenueId);
      const { data, error } = await supabase
        .from('venue_stripe_settings')
        .select('test_mode, is_active, publishable_key_test, publishable_key_live')
        .eq('venue_id', finalVenueId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching Stripe settings:', error);
        throw error;
      }
      
      console.log('💳 Stripe settings found:', {
        ...data,
        publishable_key_test: data?.publishable_key_test ? '***configured***' : 'null',
        publishable_key_live: data?.publishable_key_live ? '***configured***' : 'null'
      });
      
      return data;
    },
    enabled: !!finalVenueId,
  });

  // Return the appropriate publishable key
  const getPublishableKey = () => {
    if (!stripeSettings?.is_active) {
      console.log('❌ Stripe not active for venue');
      return null;
    }
    
    if (stripeSettings.test_mode) {
      const key = stripeSettings.publishable_key_test;
      console.log('🧪 Using test publishable key:', key ? '***configured***' : 'null');
      return key;
    } else {
      const key = stripeSettings.publishable_key_live;
      console.log('🔴 Using live publishable key:', key ? '***configured***' : 'null');
      return key;
    }
  };

  const isLoading = venueLoading || settingsLoading || (!finalVenueId && !!venueSlug);
  const publishableKey = getPublishableKey();
  const isTestMode = stripeSettings?.test_mode ?? true;
  const isActive = stripeSettings?.is_active ?? false;

  console.log('📊 usePublicStripeSettings result:', {
    publishableKey: publishableKey ? '***configured***' : 'null',
    isTestMode,
    isActive,
    isLoading,
    hasVenueError: !!venueError,
    hasSettingsError: !!settingsError
  });

  if (venueError) {
    console.error('❌ Venue error:', venueError);
  }
  
  if (settingsError) {
    console.error('❌ Settings error:', settingsError);
  }

  return {
    publishableKey,
    isTestMode,
    isActive,
    isLoading,
  };
};
