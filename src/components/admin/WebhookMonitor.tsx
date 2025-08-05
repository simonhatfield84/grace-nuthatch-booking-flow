
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Webhook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  test_mode: boolean;
  processed_at: string;
  event_data: any;
}

export const WebhookMonitor = () => {
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const { data: recentEvents, isLoading, refetch } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as WebhookEvent[];
    }
  });

  const { data: failedPayments } = useQuery({
    queryKey: ['failed-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_payments')
        .select(`
          *,
          bookings!inner(
            id,
            booking_reference,
            guest_name,
            booking_date,
            booking_time
          )
        `)
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return data;
    }
  });

  const testWebhookEndpoint = async () => {
    setIsTestingWebhook(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-webhook-endpoint', {
        body: {
          endpoint_url: 'https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/stripe-webhook-secure'
        }
      });

      if (error) throw error;
      
      console.log('Webhook test result:', data);
      refetch();
    } catch (error) {
      console.error('Webhook test failed:', error);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const getEventStatusIcon = (eventType: string) => {
    if (eventType.includes('succeeded')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (eventType.includes('failed')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Monitor
          </CardTitle>
          <CardDescription>
            Monitor Stripe webhook events and identify payment processing issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={() => refetch()} disabled={isLoading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Events
              </Button>
              <Button 
                onClick={testWebhookEndpoint} 
                disabled={isTestingWebhook}
                variant="outline"
                size="sm"
              >
                <Webhook className={`h-4 w-4 mr-2 ${isTestingWebhook ? 'animate-pulse' : ''}`} />
                Test Webhook
              </Button>
            </div>
          </div>

          {failedPayments && failedPayments.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {failedPayments.length} payment(s) are stuck in pending status. 
                This may indicate webhook delivery issues.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            Latest webhook events received from Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentEvents && recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventStatusIcon(event.event_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.event_type}</span>
                        <Badge variant={event.test_mode ? "secondary" : "default"}>
                          {event.test_mode ? 'Test' : 'Live'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Event ID: {event.stripe_event_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.processed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No webhook events found. This may indicate configuration issues.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
