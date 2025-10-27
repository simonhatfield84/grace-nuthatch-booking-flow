import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';

export interface VenueBranding {
  id: string;
  venue_id: string;
  logo_light: string | null;
  logo_dark: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  button_radius: string;
  button_shape: 'rounded' | 'square';
}

export interface VenueWidgetCopy {
  id: string;
  venue_id: string;
  copy_json: Record<string, any>;
  flags_json: Record<string, any>;
}

export interface VenueMedia {
  id: string;
  venue_id: string;
  type: 'hero' | 'about';
  path: string;
  width: number | null;
  height: number | null;
  variants: Array<{ w: number; h: number; path: string }>;
  sort_order: number;
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
      return data as any as VenueBranding | null;
    },
    enabled: !!venueId
  });

  const { data: widgetCopy, isLoading: widgetLoading } = useQuery({
    queryKey: ['venue-widget-copy', venueId],
    queryFn: async () => {
      // @ts-ignore - Types will be regenerated after migration
      const { data, error } = await supabase
        .from('venue_widget_copy')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      if (error) throw error;
      return data as any as VenueWidgetCopy | null;
    },
    enabled: !!venueId
  });

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['venue-media', venueId],
    queryFn: async () => {
      // @ts-ignore - Types will be regenerated after migration
      const { data, error } = await supabase
        .from('venue_media')
        .select('*')
        .eq('venue_id', venueId)
        .order('sort_order');
      
      if (error) throw error;
      return data as any as VenueMedia[];
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

  const updateWidgetCopy = useMutation({
    mutationFn: async (updates: Partial<VenueWidgetCopy>) => {
      // @ts-ignore - Types will be regenerated after migration
      const { error } = await supabase
        .from('venue_widget_copy')
        .upsert({
          venue_id: venueId,
          ...updates,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-widget-copy', venueId] });
      toast({
        title: "Widget copy updated",
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
    widgetCopy,
    media: media || [],
    isLoading: brandingLoading || widgetLoading || mediaLoading,
    updateBranding: updateBranding.mutate,
    updateWidgetCopy: updateWidgetCopy.mutate,
    isUpdating: updateBranding.isPending || updateWidgetCopy.isPending
  };
};
