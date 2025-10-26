import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';

export interface VenueBranding {
  id: string;
  venue_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  button_radius: string;
}

export interface VenueWidgetSettings {
  id: string;
  venue_id: string;
  hero_image_url: string | null;
  about_html: string | null;
  copy_json: Record<string, any>;
  flags_json: Record<string, any>;
}

export const useVenueBranding = (venueId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branding, isLoading: brandingLoading } = useQuery({
    queryKey: ['venue-branding', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_branding')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      if (error) throw error;
      return data as VenueBranding | null;
    },
    enabled: !!venueId
  });

  const { data: widgetSettings, isLoading: widgetLoading } = useQuery({
    queryKey: ['venue-widget-settings', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_widget_settings')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      if (error) throw error;
      return data as VenueWidgetSettings | null;
    },
    enabled: !!venueId
  });

  const updateBranding = useMutation({
    mutationFn: async (updates: Partial<VenueBranding>) => {
      const { error } = await supabase
        .from('venue_branding')
        .upsert({
          venue_id: venueId,
          ...updates,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-branding', venueId] });
      queryClient.invalidateQueries({ queryKey: ['v4-widget-config'] });
      toast({
        title: "Branding updated",
        description: "Your changes have been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateWidgetSettings = useMutation({
    mutationFn: async (updates: Partial<VenueWidgetSettings>) => {
      if (updates.about_html) {
        updates.about_html = DOMPurify.sanitize(updates.about_html, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
          ALLOWED_ATTR: ['href', 'rel', 'target'],
          ADD_ATTR: ['rel', 'target']
        });
      }

      const { error } = await supabase
        .from('venue_widget_settings')
        .upsert({
          venue_id: venueId,
          ...updates,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-widget-settings', venueId] });
      queryClient.invalidateQueries({ queryKey: ['v4-widget-config'] });
      toast({
        title: "Widget settings updated",
        description: "Your changes have been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    branding,
    widgetSettings,
    isLoading: brandingLoading || widgetLoading,
    updateBranding: updateBranding.mutate,
    updateWidgetSettings: updateWidgetSettings.mutate,
    isUpdating: updateBranding.isPending || updateWidgetSettings.isPending
  };
};
