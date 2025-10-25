import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StripeWebhooksPanel = () => {
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  const { data: venues } = useQuery({
    queryKey: ['venues-for-webhook-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('venues')
        .select('id, name')
        .order('name');
      return data || [];
    }
  });

  const { data: webhookEvents, isLoading, refetch } = useQuery({
    queryKey: ['webhook-events', selectedVenue],
    queryFn: async () => {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(50);

      if (selectedVenue !== 'all') {
        query = query.eq('venue_id', selectedVenue);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch venue names separately
      if (data && data.length > 0) {
        const venueIds = [...new Set(data.map(e => e.venue_id).filter(Boolean))];
        const { data: venuesData } = await supabase
          .from('venues')
          .select('id, name')
          .in('id', venueIds);
        
        const venueMap = new Map(venuesData?.map(v => [v.id, v.name]) || []);
        
        return data.map(event => ({
          ...event,
          venue_name: event.venue_id ? venueMap.get(event.venue_id) || 'Unknown' : 'N/A'
        }));
      }
      
      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      processed: 'default',
      failed: 'destructive',
      duplicate: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stripe Webhook Events</CardTitle>
            <CardDescription>
              Last 50 webhook events received and processed
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
        {isLoading ? (
          <p className="text-muted-foreground">Loading webhook events...</p>
        ) : webhookEvents && webhookEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Stripe Event ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs">
                      {format(new Date(event.processed_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>{(event as any).venue_name}</TableCell>
                    <TableCell className="text-xs">{event.event_type}</TableCell>
                    <TableCell>{getStatusBadge(event.status || 'processed')}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {event.error_message || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {event.stripe_event_id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No webhook events found</p>
        )}
      </CardContent>
    </Card>
  );
};
