import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Globe, Shield } from "lucide-react";
import { toast } from "sonner";

interface WebhookConfigurationProps {
  environment?: 'test' | 'live';
}

export const WebhookConfiguration = ({ environment = 'test' }: WebhookConfigurationProps) => {
  const getWebhookUrl = (env: 'test' | 'live') => {
    // Use secure webhook endpoint
    const baseUrl = env === 'live' 
      ? 'https://grace-os.co.uk'  
      : 'https://wxyotttvyexxzeaewyga.supabase.co';
    return `${baseUrl}/functions/v1/stripe-webhook-secure`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const openStripeDashboard = (env: 'test' | 'live') => {
    const url = env === 'live' 
      ? 'https://dashboard.stripe.com/webhooks'
      : 'https://dashboard.stripe.com/test/webhooks';
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Webhook Configuration
          <Badge variant={environment === 'live' ? "destructive" : "secondary"}>
            {environment.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure Stripe webhooks to receive real-time payment notifications with enhanced security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Secure Webhook Endpoint:</strong> All webhook signatures are validated using encrypted webhook secrets for maximum security.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Webhook URL</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(getWebhookUrl(environment), 'Webhook URL')}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="font-mono text-xs bg-muted p-3 rounded border">
              {getWebhookUrl(environment)}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Required Events</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Badge variant="outline">payment_intent.succeeded</Badge>
              <Badge variant="outline">payment_intent.payment_failed</Badge>
              <Badge variant="outline">payment_intent.canceled</Badge>
              <Badge variant="outline">invoice.payment_succeeded</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openStripeDashboard(environment)}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Stripe Dashboard
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Copy the webhook URL above</li>
              <li>Go to your Stripe Dashboard → Webhooks</li>
              <li>Click "Add endpoint" and paste the URL</li>
              <li>Select the required events listed above</li>
              <li>Copy the webhook secret and add it to your {environment} environment settings</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
