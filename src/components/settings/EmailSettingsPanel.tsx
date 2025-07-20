
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmailService } from "@/hooks/useEmailService";
import { Mail, Send, Settings } from "lucide-react";

export function EmailSettingsPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendBookingConfirmation } = useEmailService();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [settings, setSettings] = useState({
    from_name: '',
    from_email: '',
    email_signature: '',
    venue_name: ''
  });

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get user's venue
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.venue_id) return;

      // Get venue name
      const { data: venue } = await supabase
        .from('venues')
        .select('name')
        .eq('id', profile.venue_id)
        .single();

      // Get email settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', profile.venue_id)
        .in('setting_key', ['from_name', 'from_email', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      setSettings({
        from_name: emailSettings.from_name || 'Your Venue',
        from_email: emailSettings.from_email || '',
        email_signature: emailSettings.email_signature || 'Best regards,\nYour Venue Team',
        venue_name: venue?.name || 'Your Venue'
      });

    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setIsLoading(true);

      // Get user's venue
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.venue_id) return;

      // Save each setting
      const settingsToSave = [
        { key: 'from_name', value: settings.from_name },
        { key: 'from_email', value: settings.from_email },
        { key: 'email_signature', value: settings.email_signature }
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('venue_settings')
          .upsert({
            venue_id: profile.venue_id,
            setting_key: setting.key,
            setting_value: JSON.stringify(setting.value)
          }, {
            onConflict: 'venue_id,setting_key'
          });
      }

      toast({
        title: "Settings Saved",
        description: "Email settings have been updated successfully"
      });
      
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!settings.from_email) {
      toast({
        title: "Email Required",
        description: "Please set your from email address first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTesting(true);

      await sendBookingConfirmation(
        settings.from_email,
        {
          guest_name: "Test Guest",
          venue_name: settings.venue_name,
          booking_date: "Today",
          booking_time: "19:00",
          party_size: "2",
          booking_reference: "TEST-123456"
        },
        "test-venue"
      );

      toast({
        title: "Test Email Sent",
        description: `Test booking confirmation sent to ${settings.from_email}`
      });
      
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Test Email Failed",
        description: "Failed to send test email. Please check your settings and try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Settings</CardTitle>
        </div>
        <CardDescription>
          Configure email settings for booking confirmations and communications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              value={settings.from_name}
              onChange={(e) => setSettings({...settings, from_name: e.target.value})}
              placeholder="Your Venue Name"
            />
          </div>
          <div>
            <Label htmlFor="from_email">From Email</Label>
            <Input
              id="from_email"
              type="email"
              value={settings.from_email}
              onChange={(e) => setSettings({...settings, from_email: e.target.value})}
              placeholder="bookings@yourvenue.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email_signature">Email Signature</Label>
          <Textarea
            id="email_signature"
            value={settings.email_signature}
            onChange={(e) => setSettings({...settings, email_signature: e.target.value})}
            placeholder="Best regards,&#10;Your Venue Team"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={saveEmailSettings}
            disabled={isLoading}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={sendTestEmail}
            disabled={isTesting || !settings.from_email}
          >
            <Send className="h-4 w-4 mr-2" />
            {isTesting ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded-md">
          <strong>Note:</strong> Email functionality requires proper configuration. 
          If emails are not being sent, please contact support for assistance with email setup.
        </div>
      </CardContent>
    </Card>
  );
}
