import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { RefreshCw, RotateCcw, X, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const WebhookHealthMonitor = () => {
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['webhook-metrics'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: events, error } = await supabase
        .from('webhook_events')
        .select('status')
        .gte('processed_at', twentyFourHoursAgo);

      if (error) throw error;

      const processed = events?.filter(e => e.status === 'processed').length || 0;
      const failed = events?.filter(e => e.status === 'failed').length || 0;
      const total = events?.length || 0;

      const { data: retryData } = await supabase
        .from('webhook_retry_queue')
        .select('retry_count')
        .gte('created_at', twentyFourHoursAgo);

      const avgRetries = retryData && retryData.length > 0
        ? (retryData.reduce((sum, r) => sum + r.retry_count, 0) / retryData.length).toFixed(1)
        : '0';

      return {
        total,
        processed,
        failed,
        successRate: total > 0 ? ((processed / total) * 100).toFixed(1) : '100',
        avgRetries
      };
    },
    refetchInterval: 30000
  });

  const { data: retryQueue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['webhook-retry-queue', selectedVenue],
    queryFn: async () => {
      let query = supabase
        .from('webhook_retry_queue')
        .select('*, venues!inner(name)')
        .order('next_attempt_at', { ascending: true });

      if (selectedVenue !== 'all') {
        query = query.eq('venue_id', selectedVenue);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    }
  });

  const { data: venues } = useQuery({
    queryKey: ['venues-for-webhook-health'],
    queryFn: async () => {
      const { data } = await supabase
        .from('venues')
        .select('id, name')
        .order('name');
      return data || [];
    }
  });

  const handleRetryNow = async (eventId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-webhook-retries', {
        body: { event_id: eventId, immediate: true }
      });

      if (error) throw error;

      toast.success('Retry initiated');
      refetchQueue();
    } catch (error) {
      console.error('Retry failed:', error);
      toast.error('Failed to initiate retry');
    }
  };

  const handleDismiss = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('webhook_retry_queue')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event dismissed');
      refetchQueue();
    } catch (error) {
      console.error('Dismiss failed:', error);
      toast.error('Failed to dismiss event');
    }
  };

  const simulateFailedWebhook = async () => {
    try {
      const { data: firstVenue } = await supabase
        .from('venues')
        .select('id')
        .limit(1)
        .single();

      if (!firstVenue) {
        toast.error('No venues found');
        return;
      }

      const { error } = await supabase
        .from('webhook_retry_queue')
        .insert({
          venue_id: firstVenue.id,
          stripe_event_id: `evt_test_${Date.now()}`,
          event_type: 'payment_intent.succeeded',
          payload: {
            id: `pi_test_${Date.now()}`,
            object: 'payment_intent',
            amount: 5000,
            currency: 'gbp',
            status: 'succeeded',
            metadata: {
              booking_id: '999999',
              venue_id: firstVenue.id
            }
          },
          last_error: 'Simulated test failure',
          retry_count: 0,
          next_attempt_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Test webhook failure simulated');
      refetchQueue();
    } catch (error) {
      console.error('Failed to simulate:', error);
      toast.error('Failed to simulate test webhook');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Webhook Health Metrics (Last 24h)
          </CardTitle>
          <CardDescription>
            Success rates and retry statistics for Stripe webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Total Events</span>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900 mt-2">
                  {metrics?.total || 0}
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Processed</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900 mt-2">
                  {metrics?.processed || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {metrics?.successRate}% success rate
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-900">Failed</span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-900 mt-2">
                  {metrics?.failed || 0}
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-900">Avg Retries</span>
                  <RotateCcw className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-900 mt-2">
                  {metrics?.avgRetries || '0'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Retry Queue</CardTitle>
              <CardDescription>
                Events waiting for retry with exponential backoff
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {import.meta.env.DEV && (
                <Button onClick={simulateFailedWebhook} variant="outline" size="sm">
                  Simulate Failed Webhook
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchQueue()}
                disabled={queueLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${queueLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <label className="text-sm font-medium">Filter by Venue:</label>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Venues</SelectItem>
                {venues?.map(venue => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <p className="text-muted-foreground">Loading retry queue...</p>
          ) : retryQueue && retryQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event ID</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Retry Count</TableHead>
                    <TableHead>Next Attempt</TableHead>
                    <TableHead>Last Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retryQueue.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs font-mono">
                        {event.stripe_event_id.substring(0, 20)}...
                      </TableCell>
                      <TableCell>{event.venues.name}</TableCell>
                      <TableCell className="text-xs">{event.event_type}</TableCell>
                      <TableCell>
                        <Badge variant={event.retry_count > 10 ? 'destructive' : 'secondary'}>
                          {event.retry_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(event.next_attempt_at), 'MMM d, HH:mm')}
                        {event.retry_count > 10 && (
                          <Badge variant="outline" className="ml-2 text-xs">Stalled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                        {event.last_error || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryNow(event.id)}
                            title="Retry now"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(event.id)}
                            title="Dismiss"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              ✅ No events in retry queue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
