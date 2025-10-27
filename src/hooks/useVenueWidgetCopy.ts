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

export function useVenueWidgetCopy(venueId: string, isAdmin: boolean = false) {
  const queryClient = useQueryClient();

  const { data: copy, isLoading } = useQuery({
    queryKey: ['venue-widget-copy', venueId],
    queryFn: async (): Promise<VenueWidgetCopy> => {
      // Admins read from main table, public reads from view
      const table = isAdmin ? 'venue_widget_settings' : 'venue_widget_settings_public';
      
      const { data, error } = await (supabase as any)
        .from(table)
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
      if (!isAdmin) {
        throw new Error('Only admins can update widget copy');
      }
      
      const { error } = await (supabase as any)
        .from('venue_widget_settings')
        .update({ copy_json: newCopy })
        .eq('venue_id', venueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-widget-copy', venueId] });
    }
  });

  return {
    copy,
    isLoading,
    updateCopy: isAdmin ? updateCopy : { mutate: () => {}, mutateAsync: async () => {}, isPending: false }
  };
}
