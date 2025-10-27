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
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('venue_branding')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Auto-create if missing
      if (!data) {
        const { data: newBranding, error: createError } = await supabase
          .from('venue_branding')
          .insert({
            venue_id: venueId,
            primary_color: '#0ea5a0',
            secondary_color: '#111827',
            accent_color: '#f59e0b',
            font_heading: 'Inter',
            font_body: 'Inter',
            button_shape: 'rounded'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        const endTime = performance.now();
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Branding] Created & fetched in ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        return newBranding as VenueBranding;
      }
      
      const endTime = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Branding] Fetched in ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      return data as VenueBranding;
    },
    enabled: !!venueId,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetches
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });

  const { data: widgetCopy, isLoading: widgetLoading } = useQuery({
    queryKey: ['venue-widget-copy', venueId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('venue_widget_copy')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle();
      
      if (error) throw error;
      return data as VenueWidgetCopy | null;
    },
    enabled: !!venueId
  });

  const { data: media, isLoading: mediaLoading, refetch: refetchMedia } = useQuery({
    queryKey: ['venue-media', venueId],
    queryFn: async () => {
      const startTime = performance.now();
      
      const { data, error } = await (supabase as any)
        .from('venue_media')
        .select('*')
        .eq('venue_id', venueId)
        .order('sort_order');
      
      if (error) throw error;
      
      const endTime = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Media] Fetched ${data?.length || 0} items in ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      return data as VenueMedia[];
    },
    enabled: false, // Start disabled, enable manually when Media tab opened
    staleTime: 5 * 60 * 1000
  });

  const updateBranding = useMutation({
    mutationFn: async (updates: Partial<VenueBranding>) => {
      // Remove non-updatable fields
      const { id, venue_id, created_at, ...updateFields } = updates as any;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Branding] Updating fields:', Object.keys(updateFields));
      }
      
      const { error } = await supabase
        .from('venue_branding')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('venue_id', venueId);
      
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
      const { error } = await (supabase as any)
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
    isLoading: brandingLoading || widgetLoading,
    isMediaLoading: mediaLoading,
    updateBranding: updateBranding.mutate,
    updateWidgetCopy: updateWidgetCopy.mutate,
    isUpdating: updateBranding.isPending || updateWidgetCopy.isPending,
    refetchMedia
  };
};
