
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Globe, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface WebhookEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

export const WebhookMonitor = () => {
  const [testingWebhook, setTestingWebhook] = useState(false);

  // For now, use booking_audit as a proxy for webhook events
  // Once payment_analytics table is available in types, we can switch to that
  const { data: webhookEvents, isLoading, refetch } = useQuery({
    queryKey: ["webhook-events"],
    queryFn: async () => {
      // Use booking_audit to simulate webhook events for now
      const { data, error } = await supabase
        .from("booking_audit")
        .select("*")
        .in("change_type", ["payment_completed", "payment_failed", "payment_expired", "payment_initiated"])
        .order("changed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Transform booking_audit data to match WebhookEvent interface
      return (data || []).map(audit => ({
        id: audit.id,
        event_type: audit.change_type,
        event_data: { booking_id: audit.booking_id },
        created_at: audit.changed_at
      })) as WebhookEvent[];
    },
  });

  // Test webhook endpoint - use the correct Supabase URL
  const testWebhookEndpoint = async () => {
    setTestingWebhook(true);
    try {
      // Test the correct Supabase webhook endpoint
      const webhookUrl = 'https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/stripe-webhook-secure';
      
      const response = await fetch(webhookUrl, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type, stripe-signature'
        }
      });

      if (response.ok) {
        toast.success("Webhook endpoint is reachable!");
      } else {
        toast.error(`Webhook endpoint returned ${response.status}`);
      }
    } catch (error: any) {
      console.error('Webhook test error:', error);
      toast.error(`Webhook test failed: ${error.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'payment_completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'payment_failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'payment_expired':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'payment_initiated':
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1" />Initiated</Badge>;
      case 'payment_recovered':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1" />Recovered</Badge>;
      default:
        return <Badge variant="secondary">{eventType}</Badge>;
    }
  };

  // Use the correct Supabase webhook URL
  const webhookUrl = 'https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/stripe-webhook-secure';

  return (
    <div className="space-y-4">
      
      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhook Status
          </CardTitle>
          <CardDescription>
            Monitor webhook delivery and payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Webhook URL:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={testWebhookEndpoint}
                disabled={testingWebhook}
              >
                {testingWebhook ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Test Endpoint
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm font-mono bg-muted p-2 rounded">
              {webhookUrl}
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Configure your Stripe webhook to point to this exact URL. 
              This is the direct Supabase edge function endpoint that handles webhook events securely, 
              regardless of which domain users access your app from (grace-os.co.uk or preview environments).
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Webhook Events</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Last 10 payment-related events processed by webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading events...</div>
          ) : webhookEvents && webhookEvents.length > 0 ? (
            <div className="space-y-3">
              {webhookEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Booking {event.event_data?.booking_id || 'N/A'}</span>
                    {getEventBadge(event.event_type)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent webhook events found
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
