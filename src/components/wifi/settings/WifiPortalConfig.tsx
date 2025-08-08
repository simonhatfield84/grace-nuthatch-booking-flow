
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useWifiSettings } from "@/hooks/useWifiSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface WifiPortalConfigProps {
  settings: any;
  venueId?: string;
}

export const WifiPortalConfig = ({ settings, venueId }: WifiPortalConfigProps) => {
  const { updateSettings, isUpdating } = useWifiSettings(venueId);
  const [formData, setFormData] = useState({
    is_enabled: true,
    welcome_message: 'Welcome! Connect to our free WiFi',
    venue_description: '',
    network_name: '',
    session_duration_hours: 24,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        is_enabled: settings.is_enabled,
        welcome_message: settings.welcome_message || 'Welcome! Connect to our free WiFi',
        venue_description: settings.venue_description || '',
        network_name: settings.network_name || '',
        session_duration_hours: settings.session_duration_hours || 24,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Portal configuration saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WiFi Portal Status</CardTitle>
          <CardDescription>
            Enable or disable the WiFi portal for guests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="portal-enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_enabled: checked }))
              }
            />
            <Label htmlFor="portal-enabled">
              {formData.is_enabled ? 'WiFi Portal Enabled' : 'WiFi Portal Disabled'}
            </Label>
          </div>
          {formData.is_enabled && (
            <p className="text-sm text-muted-foreground">
              Guests can access the WiFi portal at: /wifi-portal/the-nuthatch
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portal Messages</CardTitle>
          <CardDescription>
            Customize the messages shown to guests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Input
              id="welcome-message"
              value={formData.welcome_message}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, welcome_message: e.target.value }))
              }
              placeholder="Welcome! Connect to our free WiFi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-description">Venue Description (Optional)</Label>
            <Textarea
              id="venue-description"
              value={formData.venue_description}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, venue_description: e.target.value }))
              }
              placeholder="Tell guests about your venue..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Configuration</CardTitle>
          <CardDescription>
            Configure network-related settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="network-name">WiFi Network Name (Optional)</Label>
            <Input
              id="network-name"
              value={formData.network_name}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, network_name: e.target.value }))
              }
              placeholder="e.g., VenueGuest"
            />
            <p className="text-sm text-muted-foreground">
              Display name for the WiFi network in the portal
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-duration">Session Duration (Hours)</Label>
            <Input
              id="session-duration"
              type="number"
              min="1"
              max="168"
              value={formData.session_duration_hours}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, session_duration_hours: parseInt(e.target.value) || 24 }))
              }
            />
            <p className="text-sm text-muted-foreground">
              How long guest sessions remain active (1-168 hours)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};
