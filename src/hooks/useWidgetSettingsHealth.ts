import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWidgetSettingsHealth(venueId: string) {
  return useQuery({
    queryKey: ['widget-settings-health', venueId],
    queryFn: async () => {
      // Check if venue has widget settings
      const { data, error } = await (supabase as any)
        .from('venue_widget_settings_public')
        .select('venue_id, widget_default_variant')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      return {
        exists: !!data,
        hasDefaultVariant: !!data?.widget_default_variant,
        isHealthy: !!data && !!data.widget_default_variant,
        error: error?.message
      };
    },
    enabled: !!venueId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2
  });
}
