
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const EmailSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    customEmailDomain: '',
    emailFromName: '',
    resendApiKey: ''
  });

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['custom_email_domain', 'email_from_name', 'resend_api_key']);

      if (error) throw error;

      const settingsMap = settings?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, any>) || {};

      setEmailConfig({
        customEmailDomain: settingsMap.custom_email_domain || '',
        emailFromName: settingsMap.email_from_name || '',
        resendApiKey: settingsMap.resend_api_key || ''
      });
    } catch (error: any) {
      console.error('Failed to load email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const settingsToUpsert = [
        {
          setting_key: 'custom_email_domain',
          setting_value: emailConfig.customEmailDomain || null
        },
        {
          setting_key: 'email_from_name',
          setting_value: emailConfig.emailFromName || null
        },
        {
          setting_key: 'resend_api_key',
          setting_value: emailConfig.resendApiKey || null
        }
      ];

      const { error } = await supabase
        .from('venue_settings')
        .upsert(settingsToUpsert, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your email configuration has been updated.",
      });
    } catch (error: any) {
      console.error('Failed to save email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    try {
      if (!user?.email) {
        throw new Error('No user email found');
      }

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: [user.email],
          from: emailConfig.customEmailDomain 
            ? `${emailConfig.emailFromName || 'Test'} <test@${emailConfig.customEmailDomain}>` 
            : `${emailConfig.emailFromName || 'Test'} <test@grace-os.com>`,
          subject: 'Email Configuration Test',
          html: `
            <h1>Email Test Successful!</h1>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p><strong>Configuration:</strong></p>
            <ul>
              <li>From Name: ${emailConfig.emailFromName || 'Default'}</li>
              <li>Domain: ${emailConfig.customEmailDomain || 'grace-os.com (default)'}</li>
            </ul>
            <p>If you received this email, your configuration is working properly!</p>
          `
        }
      });

      if (error) throw error;

      toast({
        title: "Test email sent",
        description: "Check your inbox for the test email.",
      });
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      toast({
        title: "Test failed",
        description: "Failed to send test email. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
        </CardTitle>
        <CardDescription>
          Configure how emails are sent to your guests. You can use your own domain or the default grace-os.com subdomain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="emailFromName">Email From Name</Label>
          <Input
            id="emailFromName"
            type="text"
            value={emailConfig.emailFromName}
            onChange={(e) => setEmailConfig(prev => ({ ...prev, emailFromName: e.target.value }))}
            placeholder="Your Restaurant Name"
          />
          <p className="text-sm text-muted-foreground mt-1">
            This name will appear in the "From" field of guest emails
          </p>
        </div>

        <div>
          <Label htmlFor="customEmailDomain">Custom Email Domain (Optional)</Label>
          <Input
            id="customEmailDomain"
            type="text"
            value={emailConfig.customEmailDomain}
            onChange={(e) => setEmailConfig(prev => ({ ...prev, customEmailDomain: e.target.value }))}
            placeholder="yourdomain.com"
          />
          <p className="text-sm text-muted-foreground mt-1">
            If provided, emails will be sent from noreply@yourdomain.com<br/>
            If empty, emails will be sent from your-venue@grace-os.com
          </p>
        </div>

        <div>
          <Label htmlFor="resendApiKey">Resend API Key</Label>
          <Input
            id="resendApiKey"
            type="password"
            value={emailConfig.resendApiKey}
            onChange={(e) => setEmailConfig(prev => ({ ...prev, resendApiKey: e.target.value }))}
            placeholder="re_..."
          />
          <p className="text-sm text-muted-foreground mt-1">
            Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/api-keys</a>
          </p>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Email Settings'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleTestEmail} 
            disabled={testEmailLoading || !emailConfig.resendApiKey}
          >
            {testEmailLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>From Name:</strong> {emailConfig.emailFromName || 'Not configured'}</p>
            <p><strong>Email Domain:</strong> {emailConfig.customEmailDomain || 'grace-os.com (default)'}</p>
            <p><strong>API Key:</strong> {emailConfig.resendApiKey ? 'Configured' : 'Not configured'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
