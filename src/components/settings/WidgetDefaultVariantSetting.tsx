import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function WidgetDefaultVariantSetting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [variant, setVariant] = useState<'standard' | 'serviceFirst'>('standard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        // Get venue ID from profile
        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();
        
        if (profileError || !profile?.venue_id) {
          console.error('Failed to load venue ID:', profileError);
          setIsLoading(false);
          return;
        }
        
        setVenueId(profile.venue_id);
        
        // Fetch widget settings (admin has SELECT permission via new policy)
        const { data: settings, error: settingsError } = await (supabase as any)
          .from('venue_widget_settings')
          .select('widget_default_variant')
          .eq('venue_id', profile.venue_id)
          .maybeSingle();
        
        if (settingsError) {
          console.error('Failed to load widget settings:', settingsError);
          toast({
            title: 'Warning',
            description: 'Could not load widget settings. Using defaults.',
            variant: 'default'
          });
          setIsLoading(false);
          return;
        }
        
        // Auto-create if missing
        if (!settings) {
          console.log('No widget settings found, creating defaults...');
          const { data: newSettings, error: createError } = await (supabase as any)
            .from('venue_widget_settings')
            .insert({
              venue_id: profile.venue_id,
              widget_default_variant: 'standard',
              copy_json: {
                holdBanner: {
                  title: "We're holding your table",
                  subtitle: "Complete your details within {time}, or the hold releases automatically.",
                  urgentWarning: "⏰ Complete your booking soon!",
                  expiredTitle: "Time slot expired",
                  expiredMessage: "Please select a new time"
                }
              },
              flags_json: {
                showHero: true,
                showAbout: true,
                showAllergyNote: true,
                showDepositExplainer: true
              }
            })
            .select('widget_default_variant')
            .single();
          
          if (createError) {
            console.error('Failed to create default settings:', createError);
            toast({
              title: 'Error',
              description: 'Could not initialize widget settings. Please contact support.',
              variant: 'destructive'
            });
          } else {
            setVariant(newSettings.widget_default_variant || 'standard');
          }
        } else {
          setVariant(settings.widget_default_variant || 'standard');
        }
      } catch (error: any) {
        console.error('Unexpected error loading widget settings:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user, toast]);

  const handleSave = async () => {
    if (!venueId) return;
    
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('venue_widget_settings')
        .update({ widget_default_variant: variant })
        .eq('venue_id', venueId);
      
      if (error) throw error;
      
      toast({
        title: 'Settings Saved',
        description: 'Default booking flow updated successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Booking Flow</CardTitle>
        <CardDescription>
          Choose the default start flow for your booking widget when no variant parameter is specified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={variant} onValueChange={(v: any) => setVariant(v)}>
          <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
            <RadioGroupItem value="standard" id="standard" />
            <div className="space-y-1 leading-none flex-1">
              <Label htmlFor="standard" className="font-semibold cursor-pointer">
                Party & Date First (Standard)
              </Label>
              <p className="text-sm text-muted-foreground">
                Guests select party size and date first, then choose from available services.
                Best for venues with clear availability patterns.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Flow: <span className="font-mono">Party & Date → Service → Time → Details → Payment</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
            <RadioGroupItem value="serviceFirst" id="serviceFirst" />
            <div className="space-y-1 leading-none flex-1">
              <Label htmlFor="serviceFirst" className="font-semibold cursor-pointer">
                Service First
              </Label>
              <p className="text-sm text-muted-foreground">
                Guests choose the service/experience first, then select date and party size.
                Ideal for experience-driven venues with multiple offerings.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Flow: <span className="font-mono">Service → Party & Date → Time → Details → Payment</span>
              </p>
            </div>
          </div>
        </RadioGroup>
        
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Default Flow
        </Button>
      </CardContent>
    </Card>
  );
}
