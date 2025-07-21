
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { useStripeSettings } from "@/hooks/useStripeSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const WebhookConfiguration = () => {
  const { stripeSettings, updateStripeSettings } = useStripeSettings();
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const webhookUrl = `https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/stripe-webhook-secure`;

  useEffect(() => {
    if (stripeSettings?.webhook_endpoint_secret) {
      setWebhookSecret(stripeSettings.webhook_endpoint_secret);
    }
  }, [stripeSettings]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const generateWebhookSecret = async () => {
    try {
      const secret = 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setWebhookSecret(secret);
      toast.success("New webhook secret generated!");
    } catch (error) {
      console.error('Error generating webhook secret:', error);
      toast.error("Failed to generate webhook secret");
    }
  };

  const saveWebhookSecret = async () => {
    if (!webhookSecret.startsWith('whsec_')) {
      toast.error("Invalid webhook secret format. It should start with 'whsec_'");
      return;
    }

    setIsUpdating(true);
    try {
      await updateStripeSettings.mutateAsync({
        webhook_endpoint_secret: webhookSecret
      });
      toast.success("Webhook secret saved successfully!");
    } catch (error) {
      console.error('Error saving webhook secret:', error);
      toast.error("Failed to save webhook secret");
    } finally {
      setIsUpdating(false);
    }
  };

  const testWebhook = async () => {
    try {
      // Simple test to see if webhook endpoint is reachable
      const response = await fetch(webhookUrl, {
        method: 'OPTIONS'
      });
      
      if (response.ok) {
        toast.success("Webhook endpoint is reachable!");
      } else {
        toast.error("Webhook endpoint test failed");
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      toast.error("Could not reach webhook endpoint");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Configure Stripe webhooks to automatically update payment statuses and send confirmation emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Webhook Endpoint URL */}
        <div className="space-y-2">
          <Label>Webhook Endpoint URL</Label>
          <div className="flex gap-2">
            <Input 
              value={webhookUrl} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(webhookUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Add this URL to your Stripe webhook endpoints in the Stripe Dashboard.
          </p>
        </div>

        {/* Required Events */}
        <div className="space-y-2">
          <Label>Required Webhook Events</Label>
          <div className="bg-muted/50 p-3 rounded-md">
            <ul className="text-sm space-y-1 font-mono">
              <li>• payment_intent.succeeded</li>
              <li>• payment_intent.payment_failed</li>
              <li>• invoice.payment_succeeded</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure these events in your Stripe webhook settings.
          </p>
        </div>

        {/* Webhook Secret */}
        <div className="space-y-2">
          <Label>Webhook Signing Secret</Label>
          <div className="flex gap-2">
            <Input 
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateWebhookSecret}
            >
              Generate
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get this from your webhook endpoint in the Stripe Dashboard, or generate a new one for testing.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className={`w-3 h-3 rounded-full ${
              stripeSettings?.webhook_endpoint_secret ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <div>
              <p className="font-medium">
                {stripeSettings?.webhook_endpoint_secret ? 'Webhook Secret Configured' : 'No Webhook Secret'}
              </p>
              <p className="text-sm text-muted-foreground">
                {stripeSettings?.webhook_endpoint_secret 
                  ? 'Webhook secret is configured for secure payment processing'
                  : 'Configure webhook secret to enable automatic payment status updates'
                }
              </p>
            </div>
            {stripeSettings?.webhook_endpoint_secret && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Stripe Dashboard Setup:</strong>
            <ol className="mt-2 space-y-1 text-sm">
              <li>1. Go to Stripe Dashboard → Developers → Webhooks</li>
              <li>2. Click "Add endpoint"</li>
              <li>3. Use the endpoint URL above</li>
              <li>4. Select the required events listed above</li>
              <li>5. Copy the signing secret and paste it below</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={saveWebhookSecret}
            disabled={!webhookSecret || isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Webhook Secret'}
          </Button>
          <Button
            variant="outline"
            onClick={testWebhook}
          >
            Test Endpoint
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
