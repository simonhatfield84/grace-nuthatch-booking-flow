import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface V5WidgetConfig {
  venueId: string;
  venueSlug: string;
  branding: any;
  media: any[];
  copy: any;
  flags: any;
  variant: 'standard' | 'serviceFirst';
}

export function useV5WidgetConfig(venueSlug: string, variant: 'standard' | 'serviceFirst' = 'standard') {
  return useQuery({
    queryKey: ['v5-widget-config', venueSlug, variant],
    queryFn: async (): Promise<V5WidgetConfig> => {
      // Get venue ID first
      const { data: venue, error: venueError } = await (supabase as any)
        .from('venues')
        .select('id')
        .eq('slug', venueSlug)
        .eq('approved', true)
        .single();
      
      if (venueError || !venue) {
        throw new Error('Venue not found or not approved');
      }
      
      // Get branding, media, copy in parallel
      const [brandingRes, mediaRes, copyRes] = await Promise.all([
        (supabase as any).from('venue_branding_public')
          .select('*')
          .eq('venue_id', venue.id)
          .maybeSingle(),
        (supabase as any).from('venue_media_public')
          .select('*')
          .eq('venue_id', venue.id)
          .order('sort_order', { ascending: true }),
        (supabase as any).from('venue_widget_copy')
          .select('copy_json, flags_json')
          .eq('venue_id', venue.id)
          .maybeSingle()
      ]);
      
      return {
        venueId: venue.id,
        venueSlug,
        branding: brandingRes.data || {},
        media: mediaRes.data || [],
        copy: copyRes.data?.copy_json || {},
        flags: copyRes.data?.flags_json || {},
        variant
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}
