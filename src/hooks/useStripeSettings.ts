
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
  charge_type: 'none' | 'all_reservations' | 'large_groups';
  minimum_guests_for_charge?: number;
  charge_amount_per_guest: number;
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
      
      const { data, error } = await supabase
        .from('venue_stripe_settings')
        .select('*')
        .eq('venue_id', userVenue)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userVenue,
  });

  // Create or update Stripe settings
  const updateStripeSettings = useMutation({
    mutationFn: async (settings: Partial<StripeSettings>) => {
      if (!userVenue) throw new Error('No venue found');

      const settingsData = {
        venue_id: userVenue,
        ...settings,
      };

      if (stripeSettings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('venue_stripe_settings')
          .update(settingsData)
          .eq('id', stripeSettings.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('venue_stripe_settings')
          .insert([settingsData])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
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
