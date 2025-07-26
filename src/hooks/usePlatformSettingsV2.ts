
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlatformSettingsState } from "@/types/platformSettings";
import { useToast } from "@/hooks/use-toast";

export const usePlatformSettingsV2 = () => {
  return useQuery({
    queryKey: ['platform-settings-v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      
      // Transform array of settings into a more usable object
      const settingsObject: Partial<PlatformSettingsState> = {};
      data.forEach((setting) => {
        let value = setting.setting_value;
        
        // Parse JSON values based on type - only parse strings
        if (setting.setting_type === 'string') {
          value = typeof value === 'string' ? value : String(value);
        } else if (setting.setting_type === 'boolean') {
          value = typeof value === 'boolean' ? value : (typeof value === 'string' ? JSON.parse(value) : Boolean(value));
        } else if (setting.setting_type === 'number') {
          value = typeof value === 'number' ? value : (typeof value === 'string' ? JSON.parse(value) : Number(value));
        }
        
        (settingsObject as any)[setting.setting_key] = value;
      });
      
      return settingsObject as PlatformSettingsState;
    },
  });
};

export const useUpdatePlatformSettingsV2 = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<PlatformSettingsState>) => {
      const promises = Object.entries(settings).map(([key, value]) => {
        // Determine the setting type
        let settingType = 'string';
        if (typeof value === 'boolean') {
          settingType = 'boolean';
        } else if (typeof value === 'number') {
          settingType = 'number';
        }

        return supabase
          .from('platform_settings')
          .upsert({
            setting_key: key,
            setting_value: JSON.stringify(value),
            setting_type: settingType,
            updated_at: new Date().toISOString(),
          });
      });

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to update settings: ${errors.map(e => e.error?.message).join(', ')}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings-v2'] });
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast({
        title: "Settings updated",
        description: "Platform settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });
};
