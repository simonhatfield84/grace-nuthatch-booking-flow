
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
  event_data: any;
  processed_at: string | null;
  created_at: string;
  test_mode: boolean;
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
        .select(`
          id,
          stripe_event_id,
          event_type,
          event_data,
          processed_at,
          created_at,
          test_mode
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching webhook events:', error);
        toast.error('Failed to fetch webhook events');
        return;
      }

      setEvents(data || []);

      // Calculate stats based on processed_at and event_data
      const total = data?.length || 0;
      const success = data?.filter(e => e.processed_at !== null && !e.event_data?.error).length || 0;
      const failed = data?.filter(e => e.event_data?.error || (e.processed_at === null && isOlderThan5Minutes(e.created_at))).length || 0;
      const processing = data?.filter(e => e.processed_at === null && !isOlderThan5Minutes(e.created_at)).length || 0;

      setStats({ total, success, failed, processing });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load webhook events');
    } finally {
      setIsLoading(false);
    }
  };

  const isOlderThan5Minutes = (createdAt: string) => {
    const eventTime = new Date(createdAt).getTime();
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return eventTime < fiveMinutesAgo;
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

  const getStatusFromEvent = (event: WebhookEvent) => {
    if (event.event_data?.error) return 'failed';
    if (event.processed_at) return 'success';
    if (isOlderThan5Minutes(event.created_at)) return 'failed';
    return 'processing';
  };

  const getStatusIcon = (event: WebhookEvent) => {
    const status = getStatusFromEvent(event);
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

  const getStatusBadge = (event: WebhookEvent) => {
    const status = getStatusFromEvent(event);
    const variant = status === 'success' ? 'default' : 
                   status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const formatAmount = (eventData: any) => {
    if (eventData?.data?.object?.amount) {
      return `£${(eventData.data.object.amount / 100).toFixed(2)}`;
    }
    return 'N/A';
  };

  const getBookingInfo = (eventData: any) => {
    const metadata = eventData?.data?.object?.metadata;
    if (metadata?.booking_id) {
      return `Booking: ${metadata.booking_id}`;
    }
    return null;
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
                      {getStatusIcon(event)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.event_type}</span>
                          {getStatusBadge(event)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getBookingInfo(event.event_data) && <span>{getBookingInfo(event.event_data)} • </span>}
                          {formatAmount(event.event_data)}
                          <span className="ml-2">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        {event.event_data?.error && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {event.event_data.error}
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
