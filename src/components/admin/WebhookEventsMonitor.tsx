
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processing_status: string;
  venue_id: string;
  booking_id: number | null;
  payment_intent_id: string | null;
  amount_cents: number | null;
  error_details: any;
  processed_at: string | null;
  created_at: string;
}

export const WebhookEventsMonitor = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    processing: 0
  });

  const fetchWebhookEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching webhook events:', error);
        toast.error('Failed to fetch webhook events');
        return;
      }

      setEvents(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const success = data?.filter(e => e.processing_status === 'success').length || 0;
      const failed = data?.filter(e => e.processing_status === 'failed').length || 0;
      const processing = data?.filter(e => e.processing_status === 'processing').length || 0;

      setStats({ total, success, failed, processing });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load webhook events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookEvents();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('webhook_events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'webhook_events'
      }, () => {
        fetchWebhookEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : 
                   status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const formatAmount = (amountCents: number | null) => {
    if (!amountCents) return 'N/A';
    return `£${(amountCents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Webhook Events</CardTitle>
            <Button 
              onClick={fetchWebhookEvents} 
              disabled={isLoading}
              variant="outline" 
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No webhook events found
                </p>
              ) : (
                events.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(event.processing_status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.event_type}</span>
                          {getStatusBadge(event.processing_status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.booking_id && <span>Booking: {event.booking_id} • </span>}
                          {formatAmount(event.amount_cents)}
                          <span className="ml-2">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        {event.error_details && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {event.error_details.error || JSON.stringify(event.error_details)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.stripe_event_id.slice(-8)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
