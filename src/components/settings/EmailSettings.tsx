
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const EmailSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [venueInfo, setVenueInfo] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    loadVenueInfo();
  }, []);

  const loadVenueInfo = async () => {
    try {
      // Get current user's venue information
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (profile?.venue_id) {
        const { data: venue } = await supabase
          .from('venues')
          .select('name, slug')
          .eq('id', profile.venue_id)
          .single();

        if (venue) {
          setVenueInfo(venue);
        }
      }
    } catch (error: any) {
      console.error('Failed to load venue info:', error);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    try {
      if (!user?.email || !venueInfo) {
        throw new Error('No user email or venue info found');
      }

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: [user.email],
          from: `${venueInfo.name} <${venueInfo.slug}@grace-os.com>`,
          subject: 'Email Configuration Test',
          html: `
            <h1>Email Test Successful!</h1>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p><strong>Configuration:</strong></p>
            <ul>
              <li>From Name: ${venueInfo.name}</li>
              <li>Email Address: ${venueInfo.slug}@grace-os.com</li>
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
          Your email configuration is automatically managed. All guest emails are sent from your venue's grace-os.com address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {venueInfo && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Email Configuration:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Venue Name:</strong> {venueInfo.name}</p>
              <p><strong>Guest Email Address:</strong> {venueInfo.slug}@grace-os.com</p>
              <p><strong>Platform Email Address:</strong> noreply@grace-os.com</p>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleTestEmail} 
            disabled={testEmailLoading || !venueInfo}
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

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Email System Information</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• All emails are sent from grace-os.com addresses for consistency and deliverability</p>
            <p>• Guest emails appear to come from your venue name</p>
            <p>• Platform emails (like invitations) come from Grace OS</p>
            <p>• This configuration requires no additional setup or domain verification</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
