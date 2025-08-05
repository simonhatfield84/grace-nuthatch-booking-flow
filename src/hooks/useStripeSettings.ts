
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface StripeSettings {
  id?: string;
  venue_id: string;
  stripe_account_id?: string;
  webhook_endpoint_secret?: string;
  is_active: boolean;
  test_mode: boolean;
}

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
      
      // If no settings exist, return default settings (don't create yet)
      if (!data) {
        console.log('No stripe settings found, returning defaults');
        return {
          venue_id: userVenue,
          is_active: false,
          test_mode: true,
        };
      }
      
      return data;
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

      // Check if stripeSettings has an id (meaning it exists in database)
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
        return data;
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
        return data;
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
