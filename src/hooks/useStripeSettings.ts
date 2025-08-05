
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface StripeSettings {
  id?: string;
  venue_id: string;
  is_active: boolean;
  test_mode: boolean;
  environment: 'test' | 'live';
  publishable_key_test?: string;
  publishable_key_live?: string;
  webhook_secret_test?: string;
  webhook_secret_live?: string;
  secret_key_test_encrypted?: string;
  secret_key_live_encrypted?: string;
  encryption_key_id?: string;
  last_key_update_at?: string;
  key_validation_status?: {
    test: { valid: boolean; last_checked?: string | null };
    live: { valid: boolean; last_checked?: string | null };
  };
  configuration_status: {
    test: {
      keys_configured: boolean;
      webhook_configured: boolean;
    };
    live: {
      keys_configured: boolean;
      webhook_configured: boolean;
    };
  };
}

// Type-safe mapping function to convert database response to StripeSettings
const mapDatabaseRowToStripeSettings = (data: any): StripeSettings => {
  // Safely parse configuration_status from Json to the expected structure
  let configurationStatus;
  try {
    if (typeof data.configuration_status === 'string') {
      configurationStatus = JSON.parse(data.configuration_status);
    } else if (typeof data.configuration_status === 'object' && data.configuration_status !== null) {
      configurationStatus = data.configuration_status;
    } else {
      throw new Error('Invalid configuration_status format');
    }
  } catch (error) {
    console.warn('Failed to parse configuration_status, using defaults:', error);
    configurationStatus = {
      test: { keys_configured: false, webhook_configured: false },
      live: { keys_configured: false, webhook_configured: false }
    };
  }

  // Safely parse key_validation_status
  let keyValidationStatus;
  try {
    if (typeof data.key_validation_status === 'string') {
      keyValidationStatus = JSON.parse(data.key_validation_status);
    } else if (typeof data.key_validation_status === 'object' && data.key_validation_status !== null) {
      keyValidationStatus = data.key_validation_status;
    } else {
      keyValidationStatus = {
        test: { valid: false, last_checked: null },
        live: { valid: false, last_checked: null }
      };
    }
  } catch (error) {
    console.warn('Failed to parse key_validation_status, using defaults:', error);
    keyValidationStatus = {
      test: { valid: false, last_checked: null },
      live: { valid: false, last_checked: null }
    };
  }

  // Ensure the structure matches our interface
  if (!configurationStatus.test || !configurationStatus.live) {
    configurationStatus = {
      test: { keys_configured: false, webhook_configured: false },
      live: { keys_configured: false, webhook_configured: false }
    };
  }

  return {
    id: data.id,
    venue_id: data.venue_id,
    is_active: Boolean(data.is_active),
    test_mode: Boolean(data.test_mode),
    environment: data.environment || 'test',
    publishable_key_test: data.publishable_key_test || undefined,
    publishable_key_live: data.publishable_key_live || undefined,
    webhook_secret_test: data.webhook_secret_test || undefined,
    webhook_secret_live: data.webhook_secret_live || undefined,
    secret_key_test_encrypted: data.secret_key_test_encrypted || undefined,
    secret_key_live_encrypted: data.secret_key_live_encrypted || undefined,
    encryption_key_id: data.encryption_key_id || undefined,
    last_key_update_at: data.last_key_update_at || undefined,
    key_validation_status: keyValidationStatus,
    configuration_status: configurationStatus,
  };
};

export const useStripeSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  // Fetch Stripe settings
  const { data: stripeSettings, isLoading } = useQuery({
    queryKey: ['stripe-settings', userVenue],
    queryFn: async () => {
      if (!userVenue) return null;
      
      console.log('Fetching stripe settings for venue:', userVenue);
      
      const { data, error } = await supabase
        .from('venue_stripe_settings')
        .select('*')
        .eq('venue_id', userVenue)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching stripe settings:', error);
        throw error;
      }
      
      console.log('Fetched stripe settings:', data);
      
      // If no settings exist, return default settings
      if (!data) {
        console.log('No stripe settings found, returning defaults');
        return {
          venue_id: userVenue,
          is_active: false,
          test_mode: true,
          environment: 'test' as const,
          key_validation_status: {
            test: { valid: false, last_checked: null },
            live: { valid: false, last_checked: null }
          },
          configuration_status: {
            test: { keys_configured: false, webhook_configured: false },
            live: { keys_configured: false, webhook_configured: false }
          }
        };
      }
      
      // Use the type-safe mapping function instead of direct casting
      return mapDatabaseRowToStripeSettings(data);
    },
    enabled: !!userVenue,
  });

  // Create or update Stripe settings
  const updateStripeSettings = useMutation({
    mutationFn: async (settings: Partial<StripeSettings>) => {
      if (!userVenue) throw new Error('No venue found');

      console.log('Updating stripe settings with:', settings);

      const settingsData = {
        venue_id: userVenue,
        ...settings,
      };

      // Check if settings exist
      if (stripeSettings && 'id' in stripeSettings && stripeSettings.id) {
        // Update existing settings
        console.log('Updating existing stripe settings with ID:', stripeSettings.id);
        const { data, error } = await supabase
          .from('venue_stripe_settings')
          .update(settingsData)
          .eq('id', stripeSettings.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating stripe settings:', error);
          throw error;
        }
        console.log('Updated stripe settings:', data);
        return mapDatabaseRowToStripeSettings(data);
      } else {
        // Create new settings
        console.log('Creating new stripe settings');
        const { data, error } = await supabase
          .from('venue_stripe_settings')
          .insert([settingsData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating stripe settings:', error);
          throw error;
        }
        console.log('Created stripe settings:', data);
        return mapDatabaseRowToStripeSettings(data);
      }
    },
    onSuccess: (data) => {
      console.log('Stripe settings update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['stripe-settings'] });
      toast({
        title: "Stripe settings updated",
        description: "Your payment settings have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Stripe settings error:', error);
      toast({
        title: "Error",
        description: "Failed to update Stripe settings.",
        variant: "destructive",
      });
    }
  });

  return {
    stripeSettings,
    isLoading,
    updateStripeSettings,
  };
};
