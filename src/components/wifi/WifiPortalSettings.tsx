
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, Save, Loader2 } from "lucide-react";

interface WifiSettingsData {
  network_name: string;
  welcome_message: string;
  venue_description: string;
  terms_content: string;
  session_duration_hours: number;
  is_enabled: boolean;
}

export const WifiPortalSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['wifi-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wifi_settings')
        .select('*')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
  });

  const [formData, setFormData] = useState<WifiSettingsData>({
    network_name: '',
    welcome_message: 'Welcome to The Nuthatch Guest WiFi',
    venue_description: '',
    terms_content: 'By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. We collect basic device information for network security and analytics.',
    session_duration_hours: 24,
    is_enabled: false
  });

  // Update form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData({
        network_name: settings.network_name || '',
        welcome_message: settings.welcome_message || 'Welcome to The Nuthatch Guest WiFi',
        venue_description: settings.venue_description || '',
        terms_content: settings.terms_content || 'By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. We collect basic device information for network security and analytics.',
        session_duration_hours: settings.session_duration_hours || 24,
        is_enabled: settings.is_enabled || false
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: WifiSettingsData) => {
      // Get current user's venue ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .single();
      
      if (!profile?.venue_id) {
        throw new Error('No venue found for user');
      }

      const { error } = await supabase
        .from('wifi_settings')
        .upsert({
          venue_id: profile.venue_id,
          ...data
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-settings'] });
      toast({
        title: "WiFi portal settings saved",
        description: "Your WiFi portal settings have been updated successfully.",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('Error saving WiFi settings:', error);
      toast({
        title: "Error",
        description: "Failed to save WiFi portal settings. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof WifiSettingsData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WiFi Portal Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          WiFi Portal Configuration
        </CardTitle>
        <CardDescription>
          Configure your venue's WiFi portal settings. Portal is accessible at <strong>/wifiportal/nuthatch</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable WiFi Portal</Label>
            <p className="text-sm text-muted-foreground">
              Turn on/off the WiFi portal system
            </p>
          </div>
          <Switch
            id="enabled"
            checked={formData.is_enabled}
            onCheckedChange={(checked) => handleInputChange('is_enabled', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="network_name">Network Name (SSID)</Label>
          <Input
            id="network_name"
            value={formData.network_name}
            onChange={(e) => handleInputChange('network_name', e.target.value)}
            placeholder="Enter your WiFi network name"
          />
          <p className="text-sm text-muted-foreground">
            The name of your WiFi network that guests will see
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome_message">Welcome Message</Label>
          <Textarea
            id="welcome_message"
            value={formData.welcome_message}
            onChange={(e) => handleInputChange('welcome_message', e.target.value)}
            placeholder="Welcome to The Nuthatch Guest WiFi"
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            This message will be displayed on the portal login page
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue_description">Venue Description</Label>
          <Textarea
            id="venue_description"
            value={formData.venue_description}
            onChange={(e) => handleInputChange('venue_description', e.target.value)}
            placeholder="Describe your venue (optional)"
            rows={2}
          />
          <p className="text-sm text-muted-foreground">
            Optional description that appears on the portal
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session_duration">Session Duration (hours)</Label>
          <Input
            id="session_duration"
            type="number"
            min="1"
            max="168"
            value={formData.session_duration_hours}
            onChange={(e) => handleInputChange('session_duration_hours', parseInt(e.target.value) || 24)}
          />
          <p className="text-sm text-muted-foreground">
            How long guests stay connected before needing to re-authenticate (1-168 hours)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms_content">Terms & Conditions</Label>
          <Textarea
            id="terms_content"
            value={formData.terms_content}
            onChange={(e) => handleInputChange('terms_content', e.target.value)}
            placeholder="Enter terms and conditions for WiFi usage"
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Legal terms that guests must agree to before connecting
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Portal URLs</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">WiFi Portal:</span>{' '}
              <a 
                href="/wifiportal/nuthatch" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                /wifiportal/nuthatch
              </a>
            </div>
            <div>
              <span className="font-medium">Success Page:</span>{' '}
              <a 
                href="/wifiportal/success/nuthatch" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                /wifiportal/success/nuthatch
              </a>
            </div>
            <div>
              <span className="font-medium">Debug Mode:</span>{' '}
              <a 
                href="/wifiportal/nuthatch?debug=true" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                /wifiportal/nuthatch?debug=true
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {settings?.created_at && 
              `Last saved: ${new Date(settings.created_at).toLocaleString()}`
            }
          </p>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
