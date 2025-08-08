
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWifiSettings } from "@/hooks/useWifiSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface WifiAdvancedSettingsProps {
  settings: any;
  venueId?: string;
}

export const WifiAdvancedSettings = ({ settings, venueId }: WifiAdvancedSettingsProps) => {
  const { updateSettings, isUpdating } = useWifiSettings(venueId);
  const [formData, setFormData] = useState({
    enable_device_fingerprinting: true,
    marketing_opt_in_default: false,
    data_retention_days: 365,
    auto_delete_sessions: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        enable_device_fingerprinting: settings.enable_device_fingerprinting ?? true,
        marketing_opt_in_default: settings.marketing_opt_in_default ?? false,
        data_retention_days: settings.data_retention_days || 365,
        auto_delete_sessions: settings.auto_delete_sessions ?? true,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Advanced settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Tracking</CardTitle>
          <CardDescription>
            Configure how devices are tracked and identified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="device-fingerprinting">Device Fingerprinting</Label>
              <p className="text-sm text-muted-foreground">
                Create unique identifiers for devices to track returning visitors
              </p>
            </div>
            <Switch
              id="device-fingerprinting"
              checked={formData.enable_device_fingerprinting}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enable_device_fingerprinting: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest Data Settings</CardTitle>
          <CardDescription>
            Configure default settings for guest data collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="marketing-optin">Marketing Opt-in Default</Label>
              <p className="text-sm text-muted-foreground">
                Default state of marketing consent checkbox for guests
              </p>
            </div>
            <Switch
              id="marketing-optin"
              checked={formData.marketing_opt_in_default}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, marketing_opt_in_default: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-retention">Data Retention Period (Days)</Label>
            <Input
              id="data-retention"
              type="number"
              min="30"
              max="2555"
              value={formData.data_retention_days}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) || 365 }))
              }
            />
            <p className="text-sm text-muted-foreground">
              How long to keep guest and analytics data (30-2555 days, default: 365)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Configure how WiFi sessions are managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-delete">Auto-delete Expired Sessions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically clean up expired WiFi sessions to improve performance
              </p>
            </div>
            <Switch
              id="auto-delete"
              checked={formData.auto_delete_sessions}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, auto_delete_sessions: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-900">Data Privacy Notice</CardTitle>
          </div>
          <CardDescription className="text-orange-800">
            Important information about data collection and privacy compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-orange-800 space-y-2">
          <p>
            <strong>Data Collection:</strong> The WiFi portal collects device information, connection timestamps, and any guest details provided during signup.
          </p>
          <p>
            <strong>GDPR Compliance:</strong> Ensure your terms and conditions include proper data processing notices and that you have legal basis for data collection.
          </p>
          <p>
            <strong>Data Retention:</strong> Consider local privacy laws when setting data retention periods. Some jurisdictions require shorter retention periods.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Advanced Settings'}
        </Button>
      </div>
    </div>
  );
};
