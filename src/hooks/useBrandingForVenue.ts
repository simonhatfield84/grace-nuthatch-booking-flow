import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { loadGoogleFont } from "@/constants/fonts";

export interface VenueBrandingPublic {
  venue_id: string;
  logo_light: string | null;
  logo_dark: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  button_shape: 'rounded' | 'square';
}

export interface VenueMediaPublic {
  venue_id: string;
  type: 'hero' | 'about';
  path: string;
  width: number | null;
  height: number | null;
  variants: Array<{ w: number; h: number; path: string }>;
  sort_order: number;
}

export function useBrandingForVenue(venueSlug: string) {
  const { data: branding, isLoading: brandingLoading } = useQuery({
    queryKey: ['venue-branding-public', venueSlug],
    queryFn: async () => {
      // Use venue-lookup edge function for anonymous access
      const { data: venueData, error: venueError } = await supabase.functions.invoke(
        'venue-lookup',
        { body: { venueSlug } }
      );
      
      if (venueError || !venueData?.ok) throw new Error('Venue not found');

      const { data, error } = await (supabase as any)
        .from('venue_branding_public')
        .select('*')
        .eq('venue_id', venueData.venue.id)
        .single();
      
      if (error) throw error;
      return data as VenueBrandingPublic;
    },
    enabled: !!venueSlug
  });

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['venue-media-public', venueSlug],
    queryFn: async () => {
      // Use venue-lookup edge function for anonymous access
      const { data: venueData, error: venueError } = await supabase.functions.invoke(
        'venue-lookup',
        { body: { venueSlug } }
      );
      
      if (venueError || !venueData?.ok) throw new Error('Venue not found');

      const { data, error} = await (supabase as any)
        .from('venue_media_public')
        .select('*')
        .eq('venue_id', venueData.venue.id);
      
      if (error) throw error;
      return data as VenueMediaPublic[];
    },
    enabled: !!venueSlug
  });

  // Apply branding to CSS variables and load fonts
  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', branding.primary_color);
      root.style.setProperty('--brand-secondary', branding.secondary_color);
      root.style.setProperty('--brand-accent', branding.accent_color);
      root.style.setProperty('--brand-radius', branding.button_shape === 'rounded' ? '999px' : '4px');

      // Load Google Fonts dynamically
      loadGoogleFont(branding.font_heading);
      loadGoogleFont(branding.font_body);

      root.style.setProperty('--font-heading', `'${branding.font_heading}', sans-serif`);
      root.style.setProperty('--font-body', `'${branding.font_body}', sans-serif`);
    }
  }, [branding]);

  const heroImages = media?.filter(m => m.type === 'hero') || [];
  const aboutImages = media?.filter(m => m.type === 'about') || [];

  return {
    branding,
    heroImages,
    aboutImages,
    isLoading: brandingLoading || mediaLoading
  };
}
