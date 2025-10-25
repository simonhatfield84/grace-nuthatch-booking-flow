import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsePublicStripeSettingsProps {
  venueSlug: string;
}

interface StripeSettingsResponse {
  ok: boolean;
  publishableKey?: string;
  testMode?: boolean;
  active?: boolean;
  code?: string;
  message?: string;
}

export const usePublicStripeSettings = ({ venueSlug }: UsePublicStripeSettingsProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-stripe-settings', venueSlug],
    queryFn: async () => {
      if (!venueSlug) return null;

      console.log('🔄 Fetching Stripe settings for:', venueSlug);

      const { data, error } = await supabase.functions.invoke<StripeSettingsResponse>(
        'public-stripe-settings',
        {
          body: { venueSlug }
        }
      );

      if (error) {
        console.error('❌ Function invocation error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from function');
        return null;
      }

      // Handle error responses from the function
      if (!data.ok) {
        console.warn('⚠️ Function returned error:', data.code, data.message);
        return null;
      }

      console.log('✅ Stripe settings loaded successfully');
      return data;
    },
    enabled: !!venueSlug,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  return {
    publishableKey: data?.publishableKey || null,
    isTestMode: data?.testMode ?? true,
    isActive: data?.active ?? false,
    isLoading,
    error: error || (!data?.ok ? data : null)
  };
};
