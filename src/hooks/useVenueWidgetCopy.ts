import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HoldBannerCopy {
  title?: string;
  subtitle?: string;
  urgentWarning?: string;
  expiredTitle?: string;
  expiredMessage?: string;
}

export interface VenueWidgetCopy {
  holdBanner?: HoldBannerCopy;
}

export const DEFAULT_HOLD_BANNER_COPY: HoldBannerCopy = {
  title: "We're holding your table",
  subtitle: "Complete your details within {time}, or the hold releases automatically.",
  urgentWarning: "⏰ Complete your booking soon!",
  expiredTitle: "Time slot expired",
  expiredMessage: "Please select a new time"
};

export function useVenueWidgetCopy(venueId: string) {
  const queryClient = useQueryClient();

  const { data: copy, isLoading } = useQuery({
    queryKey: ['venue-widget-copy', venueId],
    queryFn: async (): Promise<VenueWidgetCopy> => {
      const { data, error } = await (supabase as any)
        .from('venue_widget_settings')
        .select('copy_json')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      if (error) throw error;
      return (data?.copy_json as VenueWidgetCopy) || {};
    },
    enabled: !!venueId
  });

  const updateCopy = useMutation({
    mutationFn: async (newCopy: VenueWidgetCopy) => {
      const { error } = await (supabase as any)
        .from('venue_widget_settings')
        .update({ copy_json: newCopy })
        .eq('venue_id', venueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-widget-copy', venueId] });
      queryClient.invalidateQueries({ queryKey: ['v5-widget-config'] });
    }
  });

  return {
    copy,
    isLoading,
    updateCopy
  };
}
