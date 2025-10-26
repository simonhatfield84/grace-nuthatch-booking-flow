import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface V4WidgetConfig {
  venue_slug: string;
  venue_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  button_radius: string;
  hero_image_url: string;
  about_html: string;
  copy_json: {
    heroHeading: string;
    heroSubheading: string;
    ctaText: string;
    emptyStateHeading: string;
    emptyStateMessage: string;
    depositExplainer: string;
    allergyNote: string;
  };
  flags_json: {
    showHero: boolean;
    showAbout: boolean;
    showDepositExplainer: boolean;
    showAllergyNote: boolean;
  };
}

const DEFAULT_CONFIG: Partial<V4WidgetConfig> = {
  logo_url: '',
  primary_color: '#0ea5a0',
  secondary_color: '#111827',
  accent_color: '#f59e0b',
  font_heading: 'Inter',
  font_body: 'Inter',
  button_radius: 'md',
  hero_image_url: '',
  about_html: '',
  copy_json: {
    heroHeading: "Book Your Experience",
    heroSubheading: "Reserve your table in just a few clicks",
    ctaText: "Book Now",
    emptyStateHeading: "No Availability",
    emptyStateMessage: "Please try another date or contact us directly.",
    depositExplainer: "A small deposit secures your booking and will be deducted from your final bill.",
    allergyNote: "Please inform staff of any dietary requirements upon arrival."
  },
  flags_json: {
    showHero: true,
    showAbout: true,
    showDepositExplainer: true,
    showAllergyNote: true
  }
};

export const useV4WidgetConfig = (venueSlug: string) => {
  return useQuery({
    queryKey: ['v4-widget-config', venueSlug],
    queryFn: async () => {
      console.log(`🎨 Loading V4 widget config for: ${venueSlug}`);
      
      const { data, error } = await supabase
        .from('venue_widget_public_v4')
        .select('*')
        .eq('venue_slug', venueSlug)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching V4 config:', error);
        return { ...DEFAULT_CONFIG, venue_slug: venueSlug, venue_name: venueSlug } as V4WidgetConfig;
      }
      
      if (!data) {
        console.warn('⚠️ No V4 config found, using defaults');
        return { ...DEFAULT_CONFIG, venue_slug: venueSlug, venue_name: venueSlug } as V4WidgetConfig;
      }
      
      console.log('✅ V4 config loaded:', data);
      return data as V4WidgetConfig;
    },
    enabled: !!venueSlug,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });
};
