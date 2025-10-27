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
  defaultVariant: 'standard' | 'serviceFirst';
}

export function useV5WidgetConfig(venueSlug: string, urlVariant?: 'standard' | 'serviceFirst') {
  return useQuery({
    queryKey: ['v5-widget-config', venueSlug, urlVariant],
    queryFn: async (): Promise<V5WidgetConfig> => {
      // Get venue ID using service role edge function
      const { data: venueResponse, error: venueError } = await supabase.functions.invoke(
        'venue-lookup',
        { body: { venueSlug } }
      );

      if (venueError || !venueResponse?.ok) {
        const message = venueResponse?.message || 'Venue not found or not approved';
        console.error('❌ Venue lookup failed:', message);
        throw new Error(message);
      }

      const venue = venueResponse.venue;
      
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
        (supabase as any).from('venue_widget_settings_public')
          .select('copy_json, flags_json, widget_default_variant')
          .eq('venue_id', venue.id)
          .maybeSingle()
      ]);
      
      const defaultVariant = copyRes.data?.widget_default_variant || 'standard';
      const effectiveVariant = urlVariant || defaultVariant;
      
      console.log('🎯 Widget Config:', {
        urlVariant,
        defaultVariant,
        effectiveVariant,
        venueId: venue.id
      });
      
      return {
        venueId: venue.id,
        venueSlug,
        branding: brandingRes.data || {},
        media: mediaRes.data || [],
        copy: copyRes.data?.copy_json || {},
        flags: copyRes.data?.flags_json || {},
        variant: effectiveVariant,
        defaultVariant
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}
