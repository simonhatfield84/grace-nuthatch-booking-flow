
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WifiSettings {
  id: string;
  venue_id: string;
  is_enabled: boolean;
  welcome_message: string;
  venue_description?: string;
  logo_url?: string;
  network_name?: string;
  session_duration_hours: number;
  terms_content?: string;
  terms_version: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_css?: string;
  font_family: string;
  enable_device_fingerprinting: boolean;
  marketing_opt_in_default: boolean;
  data_retention_days: number;
  auto_delete_sessions: boolean;
  created_at: string;
  updated_at: string;
}

export const useWifiSettings = (venueId?: string) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['wifi-settings', venueId],
    queryFn: async () => {
      if (!venueId) return null;

      const { data, error } = await supabase
        .from('wifi_settings')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle();

      if (error) throw error;
      return data as WifiSettings | null;
    },
    enabled: !!venueId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<WifiSettings>) => {
      if (!venueId) throw new Error('Venue ID required');

      const { data, error } = await supabase
        .from('wifi_settings')
        .upsert({
          venue_id: venueId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-settings', venueId] });
    },
  });

  const initializeSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!venueId) throw new Error('Venue ID required');

      const { error } = await supabase.rpc('create_default_wifi_settings', {
        p_venue_id: venueId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-settings', venueId] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    initializeSettings: initializeSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};
